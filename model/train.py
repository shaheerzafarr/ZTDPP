"""
train.py — Two-Phase Training Pipeline
=======================================
Phase 1: Train only the classifier head (backbone frozen)
Phase 2: Unfreeze last 2 EfficientNet blocks + classifier, fine-tune

Features:
    - AdamW optimiser with weight decay
    - CosineAnnealingLR scheduler
    - Best-model checkpointing (by validation accuracy)
    - Training history saved as JSON for plotting
    - Early stopping patience (optional, configurable)
    - Works on both CUDA (Colab GPU) and CPU (local dev)
"""

import os
import sys
import json
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm

# Ensure the model/ directory is on the Python path so imports work
# regardless of where the script is invoked from.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dataset import get_loaders
from model   import build_model

# --------------- configuration ---------------
DEVICE      = "cuda" if torch.cuda.is_available() else "cpu"
EPOCHS_1    = 5       # Phase 1: frozen backbone
EPOCHS_2    = 10      # Phase 2: fine-tuning
LR_HEAD     = 1e-4    # learning rate for classifier head
LR_FINETUNE = 1e-5    # learning rate for fine-tuning
PATIENCE    = 5       # early stopping patience (epochs without improvement)

# Checkpoint directory (relative to project root)
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_DIR      = os.path.join(_PROJECT_ROOT, "checkpoints")
os.makedirs(SAVE_DIR, exist_ok=True)


# --------------- training loop ---------------
def train_epoch(model, loader, criterion, optimizer, device=DEVICE):
    """Run one training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for imgs, labels in tqdm(loader, desc="  train", leave=False):
        imgs   = imgs.to(device)
        labels = labels.float().unsqueeze(1).to(device)

        optimizer.zero_grad()
        logits = model(imgs)
        loss   = criterion(logits, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item() * imgs.size(0)
        preds       = (torch.sigmoid(logits) > 0.5).float()
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

    return total_loss / total, correct / total


@torch.no_grad()
def eval_epoch(model, loader, criterion, device=DEVICE):
    """Run one evaluation epoch. Returns (avg_loss, accuracy)."""
    model.eval()
    total_loss, correct, total = 0.0, 0, 0

    for imgs, labels in tqdm(loader, desc="  val  ", leave=False):
        imgs   = imgs.to(device)
        labels = labels.float().unsqueeze(1).to(device)

        logits = model(imgs)
        loss   = criterion(logits, labels)

        total_loss += loss.item() * imgs.size(0)
        preds       = (torch.sigmoid(logits) > 0.5).float()
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

    return total_loss / total, correct / total


# --------------- main training routine ---------------
def run_training():
    """Execute the full two-phase training pipeline."""
    print(f"Device: {DEVICE}")
    print(f"Checkpoint dir: {SAVE_DIR}\n")

    # Data
    train_loader, val_loader, _ = get_loaders()
    print(f"Train batches : {len(train_loader)}")
    print(f"Val batches   : {len(val_loader)}")

    # Model
    model     = build_model(freeze_backbone=True).to(DEVICE)
    criterion = nn.BCEWithLogitsLoss()
    history   = []
    best_acc  = 0.0
    patience_counter = 0

    # ==================== Phase 1 ====================
    print(f"\n{'='*60}")
    print(f"  Phase 1: Training classifier head ({EPOCHS_1} epochs)")
    print(f"  Learning rate: {LR_HEAD}")
    print(f"{'='*60}")

    optimizer = AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR_HEAD, weight_decay=1e-2
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS_1)

    for epoch in range(1, EPOCHS_1 + 1):
        tr_loss, tr_acc = train_epoch(model, train_loader,
                                      criterion, optimizer)
        va_loss, va_acc = eval_epoch(model, val_loader, criterion)
        scheduler.step()

        history.append({
            "epoch":   epoch,
            "phase":   1,
            "tr_loss": round(tr_loss, 4),
            "tr_acc":  round(tr_acc, 4),
            "va_loss": round(va_loss, 4),
            "va_acc":  round(va_acc, 4),
        })

        print(f"Epoch {epoch:02d} | "
              f"train_loss={tr_loss:.4f}  train_acc={tr_acc:.4f} | "
              f"val_loss={va_loss:.4f}  val_acc={va_acc:.4f}")

        if va_acc > best_acc:
            best_acc = va_acc
            patience_counter = 0
            torch.save(model.state_dict(),
                       os.path.join(SAVE_DIR, "best_model.pth"))
            print(f"  ✓ Saved best model (val_acc={va_acc:.4f})")
        else:
            patience_counter += 1

    # ==================== Phase 2 ====================
    print(f"\n{'='*60}")
    print(f"  Phase 2: Fine-tuning last 2 blocks ({EPOCHS_2} epochs)")
    print(f"  Learning rate: {LR_FINETUNE}")
    print(f"{'='*60}")

    # Unfreeze the last two feature blocks + classifier
    for name, param in model.named_parameters():
        if "features.7" in name or "features.8" in name \
                or "classifier" in name:
            param.requires_grad = True

    trainable = sum(p.numel() for p in model.parameters()
                    if p.requires_grad)
    print(f"  Trainable params after unfreeze: {trainable:,}")

    optimizer = AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=LR_FINETUNE, weight_decay=1e-2
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=EPOCHS_2)
    patience_counter = 0  # reset patience for phase 2

    for epoch in range(1, EPOCHS_2 + 1):
        tr_loss, tr_acc = train_epoch(model, train_loader,
                                      criterion, optimizer)
        va_loss, va_acc = eval_epoch(model, val_loader, criterion)
        scheduler.step()

        global_epoch = EPOCHS_1 + epoch
        history.append({
            "epoch":   global_epoch,
            "phase":   2,
            "tr_loss": round(tr_loss, 4),
            "tr_acc":  round(tr_acc, 4),
            "va_loss": round(va_loss, 4),
            "va_acc":  round(va_acc, 4),
        })

        print(f"Epoch {global_epoch:02d} | "
              f"train_loss={tr_loss:.4f}  train_acc={tr_acc:.4f} | "
              f"val_loss={va_loss:.4f}  val_acc={va_acc:.4f}")

        if va_acc > best_acc:
            best_acc = va_acc
            patience_counter = 0
            torch.save(model.state_dict(),
                       os.path.join(SAVE_DIR, "best_model.pth"))
            print(f"  ✓ Saved best model (val_acc={va_acc:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(f"  ⚠ Early stopping triggered (no improvement "
                      f"for {PATIENCE} epochs)")
                break

    # Save training history
    history_path = os.path.join(SAVE_DIR, "history.json")
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)

    print(f"\n{'='*60}")
    print(f"  Training complete!")
    print(f"  Best val_acc  : {best_acc:.4f}")
    print(f"  Checkpoint    : {SAVE_DIR}/best_model.pth")
    print(f"  History       : {history_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    run_training()
