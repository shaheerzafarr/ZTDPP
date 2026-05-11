"""
plot_results.py — Training Curve Visualization
================================================
Reads checkpoints/history.json and generates publication-quality
loss and accuracy curves. Marks the Phase 1 → Phase 2 transition
and the 80% accuracy target line.
"""

import os
import json
import matplotlib.pyplot as plt

# Resolve paths relative to project root
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HISTORY_FILE  = os.path.join(_PROJECT_ROOT, "checkpoints", "history.json")
OUTPUT_FILE   = os.path.join(_PROJECT_ROOT, "checkpoints", "training_curves.png")


def plot_training_curves(history_path=HISTORY_FILE, save_path=OUTPUT_FILE):
    """Load history.json and generate loss + accuracy subplots."""

    with open(history_path, "r") as f:
        h = json.load(f)

    epochs  = [e["epoch"]   for e in h]
    tr_loss = [e["tr_loss"] for e in h]
    va_loss = [e["va_loss"] for e in h]
    tr_acc  = [e["tr_acc"]  for e in h]
    va_acc  = [e["va_acc"]  for e in h]

    # Find the phase transition point
    phase1_epochs = [e["epoch"] for e in h if e["phase"] == 1]
    transition    = max(phase1_epochs) if phase1_epochs else 5

    # ---- Plotting ----
    plt.style.use("seaborn-v0_8-darkgrid")
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Loss curve
    ax1.plot(epochs, tr_loss, "o-", label="Train loss",
             color="#2196F3", markersize=4)
    ax1.plot(epochs, va_loss, "s-", label="Val loss",
             color="#FF5722", markersize=4)
    ax1.axvline(x=transition + 0.5, color="gray", linestyle="--",
                alpha=0.7, label="Fine-tune starts")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss (BCE)")
    ax1.set_title("Loss Curve", fontsize=14, fontweight="bold")
    ax1.legend(loc="upper right")
    ax1.grid(True, alpha=0.3)

    # Accuracy curve
    ax2.plot(epochs, tr_acc, "o-", label="Train acc",
             color="#2196F3", markersize=4)
    ax2.plot(epochs, va_acc, "s-", label="Val acc",
             color="#FF5722", markersize=4)
    ax2.axhline(y=0.80, color="green", linestyle="--",
                alpha=0.7, label="80% target")
    ax2.axvline(x=transition + 0.5, color="gray", linestyle="--",
                alpha=0.7, label="Fine-tune starts")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy")
    ax2.set_title("Accuracy Curve", fontsize=14, fontweight="bold")
    ax2.legend(loc="lower right")
    ax2.set_ylim(0.4, 1.02)
    ax2.grid(True, alpha=0.3)

    # Annotate best val accuracy
    best_idx = va_acc.index(max(va_acc))
    ax2.annotate(f"Best: {va_acc[best_idx]:.2%}",
                 xy=(epochs[best_idx], va_acc[best_idx]),
                 xytext=(epochs[best_idx] + 0.5,
                         va_acc[best_idx] - 0.05),
                 arrowprops=dict(arrowstyle="->", color="black"),
                 fontsize=10, fontweight="bold", color="#4CAF50")

    plt.suptitle("CIFAKE — EfficientNet-B4 Training Progress",
                 fontsize=16, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.show()
    print(f"Plot saved to: {save_path}")


if __name__ == "__main__":
    plot_training_curves()
