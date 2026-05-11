"""
Pydantic schemas for the ZTDPP FastAPI application.
Defines the structure for cryptographic results, AI inference results, and the final response.
"""

from pydantic import BaseModel
from typing import Optional

class CryptoResult(BaseModel):
    """Result of the cryptographic EXIF signature verification."""
    valid: bool
    hash_match: bool
    sig_valid: bool
    device_id: Optional[str]

class AIResult(BaseModel):
    """Result of the EfficientNet-B4 AI deepfake detection."""
    probability_real: float
    artifacts_detected: bool

class VerifyResponse(BaseModel):
    """The final structured JSON response returned to the frontend."""
    filename: str
    trust_score: float
    verdict: str
    crypto: CryptoResult
    ai: AIResult
    message: str

class DeviceRegistration(BaseModel):
    """Request payload for device registration."""
    device_id: str
    public_key_pem: str
