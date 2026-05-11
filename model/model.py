"""
model.py — EfficientNet-B4 Binary Classifier
=============================================
Uses a pretrained EfficientNet-B4 backbone (ImageNet weights) with
a custom binary classification head for FAKE vs REAL detection.

Architecture:
    - Backbone: EfficientNet-B4 (pretrained on ImageNet1K)
    - Classifier: Dropout(0.4) → Linear(in_features, 1)
    - Output: single raw logit (use BCEWithLogitsLoss for training,
      apply sigmoid for inference probabilities)

Freezing strategy:
    - Phase 1: freeze_backbone=True  → only classifier head trains
    - Phase 2: unfreeze features.7, features.8, and classifier
      for fine-tuning with a lower learning rate
"""

import torch
import torch.nn as nn
from torchvision.models import efficientnet_b4, EfficientNet_B4_Weights


def build_model(freeze_backbone=True):
    """
    Build an EfficientNet-B4 model with a custom binary head.

    Parameters
    ----------
    freeze_backbone : bool
        If True, all backbone parameters are frozen. Only the
        new classifier head will have requires_grad=True.

    Returns
    -------
    model : nn.Module
        Ready-to-train model.
    """
    # Load pretrained weights
    model = efficientnet_b4(weights=EfficientNet_B4_Weights.IMAGENET1K_V1)

    # Optionally freeze the entire backbone
    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False

    # Replace the classifier head for binary classification
    # Original: Sequential(Dropout(p=0.4), Linear(1792, 1000))
    in_features = model.classifier[1].in_features  # 1792 for B4
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4, inplace=True),
        nn.Linear(in_features, 1),
    )

    return model


if __name__ == "__main__":
    model = build_model(freeze_backbone=True)

    # Forward pass with dummy data
    dummy = torch.randn(2, 3, 224, 224)
    out   = model(dummy)
    print(f"Output shape : {out.shape}")       # torch.Size([2, 1])
    print(f"Sample logits: {out.detach()}")

    # Count trainable vs total parameters
    total_params     = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters()
                           if p.requires_grad)
    print(f"\nTotal params    : {total_params:,}")
    print(f"Trainable params: {trainable_params:,}")
    print(f"Frozen params   : {total_params - trainable_params:,}")
