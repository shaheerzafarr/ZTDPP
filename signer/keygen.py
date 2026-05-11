"""
ZTDPP Key Generation Utility
Generates an ECDSA P-256 (SECP256R1) key pair for the ZTDPP signing pipeline.
Simulates a one-time hardware security module provisioning step.
"""

import argparse
import hashlib
import os
import sys
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


def _format_fingerprint(hex_digest: str) -> str:
    """Format a SHA-256 hex digest as colon-separated octets (certificate style)."""
    return ':'.join(hex_digest[i:i + 2] for i in range(0, len(hex_digest), 2))


def _compute_public_key_fingerprint(public_key) -> tuple[str, str]:
    """Return (raw_hex_digest, formatted_colon_separated) fingerprint of public key DER."""
    pub_der = public_key.public_bytes(
        serialization.Encoding.DER,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    hex_digest = hashlib.sha256(pub_der).hexdigest()
    return hex_digest, _format_fingerprint(hex_digest)


def main() -> None:
    parser = argparse.ArgumentParser(
        description='ZTDPP Key Generator — Generate an ECDSA P-256 key pair for image signing.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            'Environment variables:\n'
            '  ZTDPP_KEY_PASSPHRASE  Passphrase used to encrypt the private key PEM.\n'
            '                        If unset, the key is stored unencrypted (not recommended).\n'
        ),
    )
    parser.add_argument(
        '--keys-dir',
        default='./keys',
        help='Directory to write key files into (default: ./keys)',
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Overwrite existing key files without prompting',
    )
    args = parser.parse_args()

    keys_dir = Path(args.keys_dir)
    private_key_path = keys_dir / 'private_key.pem'
    public_key_path  = keys_dir / 'public_key.pem'

    # Guard: refuse to overwrite without --force
    if not args.force and (private_key_path.exists() or public_key_path.exists()):
        print('[ERROR] Key files already exist in the target directory.')
        print(f'        {private_key_path}')
        print(f'        {public_key_path}')
        print('        Use --force to overwrite.')
        sys.exit(1)

    try:
        keys_dir.mkdir(parents=True, exist_ok=True)

        # Generate ECDSA P-256 key pair
        private_key = ec.generate_private_key(ec.SECP256R1())
        public_key  = private_key.public_key()

        # Determine private key encryption
        passphrase = os.environ.get('ZTDPP_KEY_PASSPHRASE')
        if passphrase:
            encryption: serialization.KeySerializationEncryption = (
                serialization.BestAvailableEncryption(passphrase.encode('utf-8'))
            )
        else:
            print(
                '[WARNING] ZTDPP_KEY_PASSPHRASE environment variable is not set.\n'
                '          Private key will be stored WITHOUT encryption.\n'
                '          Set ZTDPP_KEY_PASSPHRASE before running in production.'
            )
            encryption = serialization.NoEncryption()

        # Serialize private key (PKCS8 PEM)
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption,
        )

        # Serialize public key (SubjectPublicKeyInfo PEM)
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Write to disk
        private_key_path.write_bytes(private_pem)
        public_key_path.write_bytes(public_pem)

        # Compute and display fingerprint
        fp_hex, fp_formatted = _compute_public_key_fingerprint(public_key)

        print()
        print('[ZTDPP] Key generation complete')
        print(f'  Algorithm    : ECDSA P-256 (SECP256R1)')
        print(f'  Private key  : {private_key_path.resolve()}')
        print(f'  Public key   : {public_key_path.resolve()}')
        print(f'  Fingerprint  : {fp_formatted}')
        print()
        print('[ACTION REQUIRED] Register this public key in the ZTDPP device registry.')
        print('  Use the /register-device API endpoint on the running backend:')
        print()
        print('  POST http://localhost:8000/register-device')
        print('  Content-Type: application/json')
        print('  Body:')
        print('  {')
        print('    "device_id": "CAM-001",')
        print(f'    "public_key_pem": "<paste contents of {public_key_path.name}>"')
        print('  }')
        print()
        print(f'  SHA-256 fingerprint to confirm registration: {fp_formatted}')

        sys.exit(0)

    except Exception as exc:
        print(f'[ERROR] Key generation failed: {exc}')
        sys.exit(1)


if __name__ == '__main__':
    main()
