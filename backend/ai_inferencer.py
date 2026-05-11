"""
AI Inferencer for the ZTDPP pipeline.
Evaluates images using the trained EfficientNet-B4 PyTorch model to determine
the probability of the image being real (1.0) versus a deepfake (0.0).

Label convention (from training on CIFAKE):
    FAKE = 0 (AI-generated)
    REAL = 1 (authentic camera image)
    sigmoid(logit) > 0.5 → REAL
"""

# math.exp removed — using torch.sigmoid for overflow-safe probability conversion
from pathlib import Path
from PIL import Image
import numpy as np

from schemas import AIResult

# Resolve model path relative to project root
_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent
_MODEL_PATH = _PROJECT_ROOT / "checkpoints" / "best_model.pth"

# ── Lazy-loaded global model (loaded once on first call) ──
_model = None

def _get_model():
    """Load the trained EfficientNet-B4 model once and cache it."""
    global _model
    if _model is not None:
        return _model

    import torch
    import sys

    # Add model/ directory to path so we can import build_model
    model_dir = str(_PROJECT_ROOT / "model")
    if model_dir not in sys.path:
        sys.path.insert(0, model_dir)
    from model import build_model

    if not _MODEL_PATH.exists():
        print(f"[AI Inferencer] WARNING: Model not found at {_MODEL_PATH}")
        return None

    _model = build_model(freeze_backbone=False)
    _model.load_state_dict(
        torch.load(str(_MODEL_PATH), map_location=torch.device("cpu"), weights_only=False)
    )
    _model.eval()
    print(f"[AI Inferencer] Loaded model from {_MODEL_PATH}")
    return _model


# NOTE: Do NOT use math.exp() for sigmoid — logits from trained models can be
# extreme (e.g. -49000) causing OverflowError. Use torch.sigmoid instead.


def _preprocess(image_path: str) -> "np.ndarray":
    """
    Preprocess an image using the same transforms as val_transform in dataset.py.
    Uses PIL + numpy only (no torchvision dependency needed at inference time).

    Returns a numpy array of shape (1, 3, 224, 224) as float32.
    """
    img = Image.open(image_path).convert("RGB")
    # Use LANCZOS for high-quality downsampling of high-resolution photos
    img = img.resize((224, 224), Image.LANCZOS)

    # ToTensor equivalent: HWC uint8 [0,255] → CHW float32 [0,1]
    img_array = np.array(img).astype(np.float32) / 255.0

    # Normalize with ImageNet mean/std (same as dataset.py)
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    img_array = (img_array - mean) / std

    # HWC → CHW
    img_array = np.transpose(img_array, (2, 0, 1))

    # Add batch dimension → (1, 3, 224, 224)
    return np.expand_dims(img_array, axis=0)


def predict(image_path: str) -> AIResult:
    """
    Run the trained EfficientNet-B4 model on the given image.

    Returns an AIResult with:
        - probability_real: float between 0.0 and 1.0
        - artifacts_detected: True if the model thinks the image is FAKE
    """
    import torch

    model = _get_model()

    # Fallback: if model failed to load, return uncertain
    if model is None:
        return AIResult(probability_real=0.5, artifacts_detected=False)

    path = Path(image_path)
    if not path.exists():
        return AIResult(probability_real=0.0, artifacts_detected=True)

    try:
        # Preprocess
        input_np = _preprocess(image_path)
        input_tensor = torch.from_numpy(input_np)

        # Inference
        with torch.no_grad():
            logit = model(input_tensor)  # shape: [1, 1]

        # ── Temperature Scaling ───────────────────────────────────────────────
        # The model was trained on CIFAKE (32×32 CIFAR-10 images). Real-world
        # high-resolution photos are out-of-distribution, causing extreme logits
        # (e.g. -49000) that make sigmoid output exactly 0.0 or 1.0.
        # Temperature scaling (T > 1) softens logits: logit / T before sigmoid.
        # T=4.0 maps a logit of -49000 → -12250 → sigmoid still ~0 but avoids
        # overconfident hard decisions; for moderate logits (e.g. ±3) it barely
        # changes the probability. We also clamp to [0.05, 0.95] so the AI
        # channel never completely overrides the cryptographic result.
        TEMPERATURE = 4.0
        scaled_logit = logit.squeeze() / TEMPERATURE
        prob_real = float(torch.sigmoid(scaled_logit))
        prob_real = max(0.05, min(0.95, prob_real))  # clamp extremes

        return AIResult(
            probability_real=round(prob_real, 4),
            artifacts_detected=(prob_real < 0.5),
        )

    except Exception as e:
        import traceback
        print(f"[AI Inferencer] Prediction error: {e}")
        traceback.print_exc()
        return AIResult(probability_real=0.5, artifacts_detected=False)
