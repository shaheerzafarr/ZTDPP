"""
Trust Aggregator for the ZTDPP pipeline.
Combines deterministic cryptographic verification and probabilistic AI inference
to yield a final trust score and classification verdict.
"""

from schemas import CryptoResult, AIResult

def compute_trust(crypto: CryptoResult, ai: AIResult, alpha: float = 0.6) -> tuple[float, str, str]:
    """
    Computes the overall trust score and verdict for a given image.
    Formula: Trust(M) = alpha * Verify(σ,M) + (1 - alpha) * fθ(M)
    
    Args:
        crypto: The cryptographic verification result.
        ai: The AI deepfake inference result.
        alpha: Weight for cryptographic deterministic result (default 0.6).
        
    Returns:
        A tuple of (trust_score, verdict, message).
    """
    # Edge case: No-signature images are mathematically capped at a maximum 
    # of 0 + 0.4 * ai_score = 0.4 max. This ensures images without valid 
    # cryptographic provenance can never reach VERIFIED status, which is intentional.
    
    crypto_score = 1.0 if crypto.valid else 0.0
    ai_score = ai.probability_real
    
    trust_score = (alpha * crypto_score) + ((1.0 - alpha) * ai_score)
    
    if trust_score > 0.8:
        verdict = "VERIFIED"
        message = "Image cryptographic signature is valid and AI confirms high likelihood of authenticity."
    elif trust_score >= 0.4:
        verdict = "UNVERIFIED"
        message = "Image lacks valid cryptographic provenance or AI detected potential anomalies."
    else:
        verdict = "BLOCKED"
        message = "Image failed both cryptographic checks and AI deepfake detection."
        
    return trust_score, verdict, message
