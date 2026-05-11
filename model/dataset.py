"""
dataset.py — CIFAKE Dataset Pipeline
=====================================
Downloads are handled externally (Kaggle CLI). This module defines
image transforms, loads the CIFAKE folder structure as PyTorch
datasets, splits the training set into train/val, and returns
three DataLoaders used by every downstream training script.

Label Convention (set by ImageFolder alphabetical ordering):
    FAKE = 0   (AI-generated images)
    REAL = 1   (authentic camera images)
This means a model output >0.5 (after sigmoid) predicts REAL,
and <=0.5 predicts FAKE.  The loss function (BCEWithLogitsLoss)
expects these integer labels cast to float.
"""

import os
import torch
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

# --------------- paths & hyperparameters ---------------
# Resolve paths relative to the project root (one level up from model/)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TRAIN_DIR = os.path.join(_PROJECT_ROOT, "data", "train")
TEST_DIR  = os.path.join(_PROJECT_ROOT, "data", "test")

BATCH     = 32        # batch size for all loaders
VAL_SPLIT = 0.15      # 15% of training set held out for validation
SEED      = 42        # reproducible train/val split
IMG_SIZE  = 224       # EfficientNet-B4 expects 224×224 (or 380, but 224 is fine)

# --------------- transforms ---------------
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2,
                           saturation=0.2, hue=0.05),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

val_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# --------------- loader factory ---------------
def get_loaders(batch_size=BATCH, num_workers=2):
    """
    Returns
    -------
    train_loader : DataLoader  (augmented training split)
    val_loader   : DataLoader  (clean validation split, no augmentation)
    test_loader  : DataLoader  (clean held-out test set)
    """
    # Load full training folder with augmentation transforms
    full_train = datasets.ImageFolder(TRAIN_DIR, transform=train_transform)
    test_ds    = datasets.ImageFolder(TEST_DIR,  transform=val_transform)

    # Deterministic train/val split
    val_size   = int(len(full_train) * VAL_SPLIT)
    train_size = len(full_train) - val_size
    generator  = torch.Generator().manual_seed(SEED)
    train_ds, val_ds = random_split(full_train,
                                    [train_size, val_size],
                                    generator=generator)

    # Override the validation subset's underlying dataset so it uses
    # val_transform (no augmentation) instead of train_transform.
    val_ds.dataset = datasets.ImageFolder(TRAIN_DIR, transform=val_transform)

    # Build DataLoaders
    train_loader = DataLoader(train_ds, batch_size=batch_size,
                              shuffle=True,  num_workers=num_workers,
                              pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=batch_size,
                              shuffle=False, num_workers=num_workers,
                              pin_memory=True)
    test_loader  = DataLoader(test_ds,  batch_size=batch_size,
                              shuffle=False, num_workers=num_workers,
                              pin_memory=True)

    return train_loader, val_loader, test_loader


# --------------- quick sanity check ---------------
if __name__ == "__main__":
    from collections import Counter

    print("Loading datasets...")
    tr, va, te = get_loaders()

    # Batch shape check
    imgs, labels = next(iter(tr))
    print(f"Batch shape : {imgs.shape}")          # torch.Size([32, 3, 224, 224])
    print(f"Label sample: {labels[:8]}")

    # Class names (FAKE=0, REAL=1)
    print(f"Classes     : {tr.dataset.dataset.classes}")

    # Dataset sizes
    print(f"\nTrain size  : {len(tr.dataset)}")
    print(f"Val size    : {len(va.dataset)}")
    print(f"Test size   : {len(te.dataset)}")

    # Class balance verification
    full_ds = datasets.ImageFolder(TRAIN_DIR)
    balance = Counter(full_ds.targets)
    print(f"\nClass balance (full train): {dict(balance)}")
    print("  0 = FAKE (AI-generated)")
    print("  1 = REAL (authentic)")
