"""
Cryptographic verifier for the ZTDPP pipeline.
Performs sequential checks: EXIF parsing, SHA-256 matching, public key lookup,
and ECDSA P-256 signature verification.
"""

import json
import hashlib
import piexif
import base64
from pathlib import Path
from PIL import Image
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature

from schemas import CryptoResult
from registry import get_public_key

def verify(image_path: str) -> CryptoResult:
    """
    Verifies the cryptographic signature embedded in an image.
    Uses pathlib.Path internally while maintaining a str parameter for the public API.
    """
    path = Path(image_path)
    if not path.exists():
        return CryptoResult(valid=False, hash_match=False, sig_valid=False, device_id=None)

    # 1. Parse the provenance manifest
    #    JPEG: manifest lives in EXIF UserComment (piexif)
    #    PNG:  manifest lives in a tEXt chunk keyed "ZTDPP_Manifest" (Pillow PngInfo)
    PNG_MANIFEST_KEY = "ZTDPP_Manifest"
    EXIF_ASCII_PREFIX = b"ASCII\x00\x00\x00"

    manifest: dict | None = None

    if path.suffix.lower() in {".jpg", ".jpeg"}:
        try:
            exif_dict = piexif.load(str(path))
            if exif_dict and "Exif" in exif_dict and piexif.ExifIFD.UserComment in exif_dict["Exif"]:
                raw = exif_dict["Exif"][piexif.ExifIFD.UserComment]
                if raw.startswith(EXIF_ASCII_PREFIX):
                    raw = raw[len(EXIF_ASCII_PREFIX):]
                manifest = json.loads(raw.decode("utf-8", errors="ignore"))
        except Exception:
            pass

    else:  # PNG
        try:
            with Image.open(path) as img:
                text_chunks = getattr(img, "text", {})
                manifest_str = text_chunks.get(PNG_MANIFEST_KEY)
                if manifest_str:
                    manifest = json.loads(manifest_str)
        except Exception:
            pass

    if manifest is None:
        return CryptoResult(valid=False, hash_match=False, sig_valid=False, device_id=None)

    device_id = manifest.get("device_id")
    stored_hash = manifest.get("sha256_hash")
    signature_b64 = manifest.get("signature")

    if not device_id or not stored_hash or not signature_b64:
        return CryptoResult(valid=False, hash_match=False, sig_valid=False, device_id=device_id)

    # 2. Re-hash pixel bytes with SHA-256 and compare
    # Must mirror signer.py: convert to RGB before tobytes() so the pixel
    # layout is identical regardless of the original image mode (RGBA, L, etc.)
    try:
        with Image.open(path) as img:
            pixel_bytes = img.convert("RGB").tobytes()
        computed_hash = hashlib.sha256(pixel_bytes).hexdigest()
        
        if computed_hash != stored_hash:
            return CryptoResult(valid=False, hash_match=False, sig_valid=False, device_id=device_id)
    except Exception:
        return CryptoResult(valid=False, hash_match=False, sig_valid=False, device_id=device_id)

    # 3. Look up device public key from SQLite
    public_key_pem = get_public_key(device_id)
    if not public_key_pem:
        # Key not found or untrusted
        return CryptoResult(valid=False, hash_match=True, sig_valid=False, device_id=device_id)

    # 4. Verify ECDSA P-256 signature
    try:
        public_key = load_pem_public_key(public_key_pem.encode("utf-8"))
        signature_bytes = base64.b64decode(signature_b64)
        
        # Verify the signature against the computed hash.
        # Assuming the signature was generated over the raw pixel bytes or the hash itself.
        # Typically ECDSA signs the raw data and hashes it internally, or signs the hash. 
        # Here we sign the raw pixel bytes directly.
        public_key.verify(
            signature_bytes,
            pixel_bytes,
            ec.ECDSA(hashes.SHA256())
        )
        # If verify() doesn't raise an exception, the signature is valid.
        return CryptoResult(valid=True, hash_match=True, sig_valid=True, device_id=device_id)

    except InvalidSignature:
        return CryptoResult(valid=False, hash_match=True, sig_valid=False, device_id=device_id)
    except Exception:
        return CryptoResult(valid=False, hash_match=True, sig_valid=False, device_id=device_id)
