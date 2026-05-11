"""
SQLite registry functions for the ZTDPP pipeline.
Handles database initialization, device registration, and public key retrieval.
"""

import sqlite3
import os
from pathlib import Path

# Paths relative to this file
BASE_DIR = Path(__file__).resolve().parent
REGISTRY_DIR = BASE_DIR / "registry"
DB_PATH = REGISTRY_DIR / "registry.db"
SCHEMA_PATH = REGISTRY_DIR / "schema.sql"

def get_connection() -> sqlite3.Connection:
    """Helper function to get a SQLite connection."""
    # Ensure the directory exists
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)

def init_db() -> None:
    """Initializes the SQLite database from schema.sql if it doesn't exist."""
    # Only initialize if the database is new or schema.sql has changes
    if not SCHEMA_PATH.exists():
        raise FileNotFoundError(f"Schema file not found at {SCHEMA_PATH}")

    with get_connection() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema_script = f.read()
            conn.executescript(schema_script)
        conn.commit()

def get_public_key(device_id: str) -> str | None:
    """
    Looks up a device's public key from the SQLite registry.
    Returns the PEM encoded public key string, or None if not found.
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT public_key FROM devices WHERE device_id = ? AND trusted = 1", (device_id,))
        row = cursor.fetchone()
        if row:
            return row[0]
        return None

def register_device(device_id: str, public_key_pem: str) -> None:
    """Registers a new device with its public key in the registry."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO devices (device_id, public_key, trusted) VALUES (?, ?, 1)",
            (device_id, public_key_pem)
        )
        conn.commit()
