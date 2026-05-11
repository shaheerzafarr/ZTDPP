"""
ZTDPP Image Signing Utility
Embeds a C2PA-aligned ECDSA provenance manifest into image EXIF metadata.
Simulates a hardware security module injecting cryptographic proof of origin.
"""

import argparse
import base64
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import piexif
from PIL import Image, UnidentifiedImageError
from PIL.PngImagePlugin import PngInfo
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

SUPPORTED_EXTENSIONS: frozenset[str] = frozenset({'.jpg', '.jpeg', '.png'})
EXIF_USER_COMMENT_PREFIX: bytes = b'ASCII\x00\x00\x00'
PNG_MANIFEST_KEY: str = 'ZTDPP_Manifest'


# ── Private helpers ────────────────────────────────────────────────────────────

def _load_private_key(keys_dir: Path):
    """Load and return the ECDSA private key from keys_dir/private_key.pem."""
    key_path = keys_dir / 'private_key.pem'

    if not key_path.exists():
        print('[ERROR] Private key not found. Run keygen.py first.')
        sys.exit(1)

    try:
        pem_bytes  = key_path.read_bytes()
        passphrase = os.environ.get('ZTDPP_KEY_PASSPHRASE')
        password   = passphrase.encode('utf-8') if passphrase else None
        return serialization.load_pem_private_key(pem_bytes, password=password)
    except (ValueError, TypeError) as exc:
        print(
            f'[ERROR] Failed to decrypt private key — wrong passphrase or corrupted key.\n'
            f'        Detail: {exc}'
        )
        sys.exit(1)
    except Exception as exc:
        print(f'[ERROR] Could not load private key: {exc}')
        sys.exit(1)


def _compute_public_key_fingerprint(public_key) -> str:
    """Return the SHA-256 hexdigest of the public key DER bytes."""
    pub_der = public_key.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return hashlib.sha256(pub_der).hexdigest()


def _build_manifest(
    device_id:     str,
    sha256_hash:   str,
    signature_b64: str,
    public_key_fp: str,
    width:         int,
    height:        int,
) -> str:
    """Assemble and return the compact C2PA-aligned JSON manifest string."""
    timestamp = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    manifest  = {
        'ztdpp_version': '1.0',
        'device_id':     device_id,
        'timestamp':     timestamp,
        'sha256_hash':   sha256_hash,
        'signature':     signature_b64,
        'public_key_fp': public_key_fp,
        'image_width':   width,
        'image_height':  height,
    }
    # separators=(',', ':') produces compact JSON with no extraneous whitespace,
    # which round-trips cleanly through EXIF UserComment without corruption.
    return json.dumps(manifest, separators=(',', ':'))


def _read_or_empty_exif(image_path: Path) -> dict:
    """Load existing EXIF from file, or return an empty EXIF skeleton."""
    try:
        return piexif.load(str(image_path))
    except Exception:
        return {'0th': {}, 'Exif': {}, 'GPS': {}, '1st': {}}


def _inject_manifest_into_exif(image_path: Path, manifest_json: str) -> bytes:
    """Return piexif-serialised EXIF bytes with the manifest in UserComment."""
    exif_dict = _read_or_empty_exif(image_path)
    exif_dict.setdefault('Exif', {})

    # EXIF UserComment convention: 8-byte character-code prefix + payload
    exif_dict['Exif'][piexif.ExifIFD.UserComment] = (
        EXIF_USER_COMMENT_PREFIX + manifest_json.encode('ascii')
    )
    return piexif.dump(exif_dict)


def _save_signed_jpeg(image_path: Path, output_path: Path, exif_bytes: bytes) -> None:
    """
    Copy the original JPEG bytes verbatim and splice in the new EXIF block.

    We intentionally avoid re-encoding via Pillow (image.save quality=95) because
    JPEG is lossy: any re-compression — even at the same quality — alters pixel
    values, invalidating the signature that was computed over the original
    decoded pixels.  piexif.insert() replaces only the APP1/EXIF segment,
    leaving the JPEG image data stream (SOF, SOS, scan data) byte-for-byte
    identical to the source, so the verifier obtains the same decoded pixel
    matrix that was signed.
    """
    shutil.copy2(str(image_path), str(output_path))
    piexif.insert(exif_bytes, str(output_path))


def _save_signed_png(image: Image.Image, output_path: Path, manifest_json: str) -> None:
    """
    Save a lossless PNG with the manifest embedded as a tEXt chunk.

    piexif does not support PNG EXIF (it only handles JPEG/TIFF), so we use
    Pillow's PngInfo to embed the manifest as a named tEXt metadata chunk.
    The verifier and backend crypto_verifier read it back via image.text[key].
    PNG is lossless, so pixel values are preserved byte-for-byte.
    """
    pnginfo = PngInfo()
    pnginfo.add_text(PNG_MANIFEST_KEY, manifest_json)
    image.save(str(output_path), format='PNG', pnginfo=pnginfo)


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            'ZTDPP Signer — Embed a C2PA-aligned ECDSA provenance manifest\n'
            'into an image file\'s EXIF UserComment field.'
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            'Examples:\n'
            '  python signer.py photo.jpg\n'
            '  python signer.py photo.png --device-id CAM-002 --output-dir ./signed\n'
            '\n'
            'Environment variables:\n'
            '  ZTDPP_KEY_PASSPHRASE  Passphrase for the encrypted private key PEM.\n'
        ),
    )
    parser.add_argument(
        'image_path',
        help='Path to the input image file (.jpg, .jpeg, or .png)',
    )
    parser.add_argument(
        '--device-id',
        default='CAM-001',
        help='Device identifier to embed in the provenance manifest (default: CAM-001)',
    )
    parser.add_argument(
        '--keys-dir',
        default='./keys',
        help='Directory containing the ECDSA key pair (default: ./keys)',
    )
    parser.add_argument(
        '--output-dir',
        default=None,
        help='Destination directory for the signed image (default: same directory as input)',
    )
    args = parser.parse_args()

    try:
        # ── Step 1: Load and validate image ───────────────────────────────────
        input_path = Path(args.image_path)

        if not input_path.exists():
            print(f'[ERROR] File not found: {input_path}')
            sys.exit(1)

        ext = input_path.suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            print(
                f'[ERROR] Unsupported file type "{ext}".\n'
                f'        Supported formats: .jpg, .jpeg, .png'
            )
            sys.exit(1)

        try:
            image = Image.open(input_path)
        except FileNotFoundError:
            print(f'[ERROR] File not found: {input_path}')
            sys.exit(1)
        except UnidentifiedImageError:
            print(f'[ERROR] Cannot identify image file (corrupted or unsupported): {input_path}')
            sys.exit(1)

        # Convert to RGB unconditionally — strips alpha, ensures consistent
        # pixel layout so tobytes() is deterministic regardless of source mode.
        image = image.convert('RGB')
        width, height = image.size

        # ── Step 2: Extract raw pixel bytes and compute integrity hash ─────────
        pixel_bytes = image.tobytes()
        sha256_hash = hashlib.sha256(pixel_bytes).hexdigest()

        # ── Step 3: Load private key ───────────────────────────────────────────
        keys_dir    = Path(args.keys_dir)
        private_key = _load_private_key(keys_dir)

        # ── Step 4: Sign raw pixel bytes ───────────────────────────────────────
        # Sign pixel_bytes directly; the cryptography library applies SHA-256
        # internally as the digest algorithm for ECDSA.
        signature_der = private_key.sign(pixel_bytes, ec.ECDSA(hashes.SHA256()))
        signature_b64 = base64.b64encode(signature_der).decode('ascii')

        # ── Step 5: Compute public key fingerprint ─────────────────────────────
        public_key    = private_key.public_key()
        public_key_fp = _compute_public_key_fingerprint(public_key)

        # ── Step 6: Assemble C2PA-aligned JSON manifest ────────────────────────
        manifest_json = _build_manifest(
            device_id     = args.device_id,
            sha256_hash   = sha256_hash,
            signature_b64 = signature_b64,
            public_key_fp = public_key_fp,
            width         = width,
            height        = height,
        )

        # ── Step 7: Inject manifest into EXIF UserComment ─────────────────────
        exif_bytes = _inject_manifest_into_exif(input_path, manifest_json)

        # ── Step 8: Save signed image ──────────────────────────────────────────
        if args.output_dir:
            output_dir = Path(args.output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
        else:
            output_dir = input_path.parent

        output_filename = f'{input_path.stem}_signed{ext}'
        output_path     = output_dir / output_filename

        if ext in {'.jpg', '.jpeg'}:
            _save_signed_jpeg(input_path, output_path, exif_bytes)
        else:
            _save_signed_png(image, output_path, manifest_json)

        # ── Success summary ────────────────────────────────────────────────────
        hash_preview = f'{sha256_hash[:16]}...{sha256_hash[-8:]}'
        sig_preview  = f'{signature_b64[:20]}...'

        print('[ZTDPP] Signing complete')
        print(f'  Device ID  : {args.device_id}')
        print(f'  Hash       : {hash_preview}')
        print(f'  Sig (b64)  : {sig_preview}')
        print(f'  Output     : {output_path.resolve()}')

        sys.exit(0)

    except SystemExit:
        raise
    except Exception as exc:
        print(f'[ERROR] Signing failed unexpectedly: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
