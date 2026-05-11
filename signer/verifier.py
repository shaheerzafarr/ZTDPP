"""
ZTDPP Standalone Verification Utility
Verifies the cryptographic provenance manifest embedded in a signed image.
Use this to test signer output before integrating with the FastAPI backend.
"""

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

import piexif
from PIL import Image, UnidentifiedImageError
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec

EXIF_USER_COMMENT_PREFIX: bytes = b'ASCII\x00\x00\x00'
PNG_MANIFEST_KEY: str = 'ZTDPP_Manifest'
SEPARATOR = '=' * 62


# ── Private helpers ────────────────────────────────────────────────────────────

def _load_public_key(keys_dir: Path):
    """Load and return the ECDSA public key from keys_dir/public_key.pem."""
    key_path = keys_dir / 'public_key.pem'

    if not key_path.exists():
        print(f'[ERROR] Public key not found at {key_path}. Run keygen.py first.')
        sys.exit(1)

    try:
        pem_bytes = key_path.read_bytes()
        return serialization.load_pem_public_key(pem_bytes)
    except Exception as exc:
        print(f'[ERROR] Failed to load public key: {exc}')
        sys.exit(1)


def _extract_manifest(image_path: Path, image: Image.Image) -> dict:
    """
    Extract and parse the ZTDPP manifest from the image.

    JPEG: reads piexif EXIF UserComment field.
    PNG:  reads the ZTDPP_Manifest tEXt chunk embedded by signer.py via PngInfo.
    Exits with code 1 on any failure.
    """
    ext = image_path.suffix.lower()

    if ext in {'.jpg', '.jpeg'}:
        try:
            exif_dict = piexif.load(str(image_path))
        except Exception as exc:
            print(f'[ERROR] Failed to read EXIF data from JPEG: {exc}')
            sys.exit(1)

        exif_ifd     = exif_dict.get('Exif', {})
        user_comment = exif_ifd.get(piexif.ExifIFD.UserComment)

        if user_comment is None:
            print('[ERROR] No EXIF UserComment -image is unsigned or EXIF was stripped.')
            sys.exit(1)

        if user_comment.startswith(EXIF_USER_COMMENT_PREFIX):
            user_comment = user_comment[len(EXIF_USER_COMMENT_PREFIX):]

        try:
            return json.loads(user_comment.decode('ascii', errors='ignore'))
        except json.JSONDecodeError as exc:
            print(f'[ERROR] EXIF UserComment present but not valid JSON: {exc}')
            sys.exit(1)

    else:  # PNG -manifest is stored as a tEXt chunk via Pillow PngInfo
        # image.text is a dict of tEXt/iTXt chunk key→value pairs
        text_chunks = getattr(image, 'text', {})
        manifest_str = text_chunks.get(PNG_MANIFEST_KEY)

        if manifest_str is None:
            print(
                f'[ERROR] PNG has no "{PNG_MANIFEST_KEY}" text chunk -'
                'image is unsigned or was not signed by ZTDPP signer.py.'
            )
            sys.exit(1)

        try:
            return json.loads(manifest_str)
        except json.JSONDecodeError as exc:
            print(f'[ERROR] PNG manifest text chunk present but not valid JSON: {exc}')
            sys.exit(1)


def _pass(label: str) -> None:
    print(f'  {label:<20}: [PASS] PASS')


def _fail(label: str, detail: str = '') -> None:
    suffix = f' -{detail}' if detail else ''
    print(f'  {label:<20}: [FAIL] FAIL{suffix}')


def _truncate(value: str, head: int = 16, tail: int = 8) -> str:
    """Shorten a long hex/base64 string for display."""
    if isinstance(value, str) and len(value) > head + tail + 3:
        return f'{value[:head]}...{value[-tail:]}'
    return str(value)


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            'ZTDPP Verifier -Verify the ECDSA provenance manifest\n'
            'embedded in a ZTDPP-signed image file.'
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            'Examples:\n'
            '  python verifier.py photo_signed.jpg\n'
            '  python verifier.py photo_signed.png --keys-dir /path/to/keys\n'
        ),
    )
    parser.add_argument(
        'image_path',
        help='Path to the signed image file to verify (.jpg, .jpeg, or .png)',
    )
    parser.add_argument(
        '--keys-dir',
        default='./keys',
        help='Directory containing the ECDSA public key (default: ./keys)',
    )
    args = parser.parse_args()

    try:
        image_path = Path(args.image_path)

        if not image_path.exists():
            print(f'[ERROR] File not found: {image_path}')
            sys.exit(1)

        # ── Step 1: Open image and extract raw pixel bytes ────────────────────
        try:
            image_raw = Image.open(image_path)
        except FileNotFoundError:
            print(f'[ERROR] File not found: {image_path}')
            sys.exit(1)
        except UnidentifiedImageError:
            print(f'[ERROR] Cannot identify image file (corrupted or unsupported): {image_path}')
            sys.exit(1)

        # Read manifest BEFORE converting -convert() creates a new object and
        # drops format-specific metadata (PNG tEXt chunks, EXIF, etc.)
        manifest = _extract_manifest(image_path, image_raw)

        # Must mirror signer.py exactly: convert to RGB before calling tobytes()
        image       = image_raw.convert('RGB')
        pixel_bytes = image.tobytes()

        # ── Step 2: SHA-256 of pixel bytes ────────────────────────────────────
        computed_hash = hashlib.sha256(pixel_bytes).hexdigest()

        # ── Print report header ────────────────────────────────────────────────
        print()
        print(SEPARATOR)
        print('  ZTDPP Verification Report')
        print(f'  File: {image_path.resolve()}')
        print(SEPARATOR)

        # ── Step 4: Hash integrity check ───────────────────────────────────────
        stored_hash = manifest.get('sha256_hash', '')
        hash_match  = computed_hash == stored_hash

        print()
        print('  -- Hash Integrity Check --')
        print(f'  Computed  : {computed_hash}')
        print(f'  Stored    : {stored_hash}')
        if hash_match:
            _pass('Pixel integrity')
        else:
            _fail('Pixel integrity', 'pixel data has been altered since signing')

        # ── Step 5: Load public key ────────────────────────────────────────────
        keys_dir   = Path(args.keys_dir)
        public_key = _load_public_key(keys_dir)

        # ── Step 6: Decode base64 signature from manifest ──────────────────────
        print()
        print('  -- Signature Verification --')
        try:
            signature_bytes = base64.b64decode(manifest['signature'])
        except KeyError:
            print('[ERROR] Manifest is missing the "signature" field.')
            sys.exit(1)
        except Exception as exc:
            print(f'[ERROR] Failed to decode signature from manifest: {exc}')
            sys.exit(1)

        # ── Step 7: Verify ECDSA signature over raw pixel bytes ────────────────
        # The signer called private_key.sign(pixel_bytes, ECDSA(SHA256())).
        # Verification must use the identical pixel_bytes (RGB tobytes()) and
        # the same algorithm so the library can apply SHA-256 internally.
        sig_valid = False
        try:
            public_key.verify(signature_bytes, pixel_bytes, ec.ECDSA(hashes.SHA256()))
            sig_valid = True
            _pass('ECDSA signature')
        except InvalidSignature:
            _fail('ECDSA signature', 'pixel content has been modified or wrong key used')
        except Exception as exc:
            _fail('ECDSA signature', f'verification error: {exc}')

        # ── Step 8: Manifest summary table ────────────────────────────────────
        print()
        print('  -- Manifest Fields --')
        field_map = [
            ('ztdpp_version', 'Protocol Ver.'),
            ('device_id',     'Device ID'),
            ('timestamp',     'Signed At (UTC)'),
            ('sha256_hash',   'Pixel Hash'),
            ('signature',     'Signature (b64)'),
            ('public_key_fp', 'Key Fingerprint'),
            ('image_width',   'Image Width'),
            ('image_height',  'Image Height'),
        ]
        for key, label in field_map:
            value = manifest.get(key, '<missing>')
            if key in ('sha256_hash', 'public_key_fp', 'signature'):
                value = _truncate(str(value))
            print(f'  {label:<18}: {value}')

        # ── Overall verdict ────────────────────────────────────────────────────
        overall = hash_match and sig_valid
        print()
        print(SEPARATOR)
        if overall:
            print('  VERDICT : [PASS] AUTHENTIC -Cryptographic provenance verified')
        else:
            reasons = []
            if not hash_match:
                reasons.append('pixel integrity failed')
            if not sig_valid:
                reasons.append('signature invalid')
            print(f'  VERDICT : [FAIL] INVALID   -{"; ".join(reasons)}')
        print(SEPARATOR)
        print()

        sys.exit(0 if overall else 1)

    except SystemExit:
        raise
    except Exception as exc:
        print(f'[ERROR] Verification failed unexpectedly: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
