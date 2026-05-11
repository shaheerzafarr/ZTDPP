# ZTDPP — Zero Trust Digital Provenance Platform

A network-layer protocol that enforces media authenticity by combining **cryptographic provenance** with **AI-based deepfake detection** into a unified trust metric.

```
Trust(M) = α · Verify(σ,M) + (1−α) · fθ(M)
```

## Team

| Member | Role | Component |
|--------|------|-----------|
| Muhammad Shaheer Zafar (22K-5138) | AI/ML Lead | `model/`, `checkpoints/` |
| Syed Hasham Uddin (22K-6013) | Frontend & Signer Lead | `signer/`, `frontend/` |
| Sohaib Sherwani (21K-4790) | Backend & Protocol Lead | `backend/` |

## Project Structure

```
ZTDPP/
├── signer/                 Cryptographic signing utility
│   ├── keygen.py             ECDSA P-256 key pair generation
│   ├── signer.py             Sign images with C2PA-aligned manifest
│   ├── verifier.py           Standalone signature verification
│   ├── keys/                 Generated key pair (private key gitignored)
│   └── requirements.txt
│
├── backend/                FastAPI orchestrator (simulated network proxy)
│   ├── main.py               API routes and parallel dispatch
│   ├── crypto_verifier.py    Verify(σ,M) — hash + ECDSA check
│   ├── ai_inferencer.py      fθ(M) — EfficientNet-B4 inference
│   ├── aggregator.py         Trust score computation
│   ├── schemas.py            Pydantic request/response models
│   ├── registry.py           SQLite device registry helpers
│   ├── registry/             Schema and database
│   └── requirements.txt
│
├── model/                  CNN training pipeline
│   ├── dataset.py            Data loading and augmentation
│   ├── model.py              EfficientNet-B4 architecture
│   ├── train.py              Two-phase training script
│   ├── test.py               Test set evaluation
│   └── plot_results.py       Training curve visualization
│
├── checkpoints/            Trained model artifacts
│   ├── best_model.pth        Trained weights (90.54% val acc)
│   ├── history.json          Training metrics
│   └── training_curves.png   Loss/accuracy plots
│
├── frontend/               React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx             Main application
│   │   ├── api/api.js          Backend API client
│   │   └── components/         UI components
│   └── package.json
│
├── docs/                   Project documentation
│   ├── ZTDPP_Proposal.pdf    FYP proposal document
│   ├── ZTDPP_SRS_v1.0.docx  Software Requirements Specification
│   ├── ARCHITECTURE.md       Backend architecture design
│   └── postman_tests/        API testing screenshots
│
├── app.py                  Streamlit demo (standalone)
├── .gitignore
└── README.md
```

## Quick Start

### 1. Backend
```bash
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Sign & Verify
```bash
cd signer
python keygen.py              # Generate ECDSA key pair (once)
python signer.py photo.jpg    # Sign an image
```
Upload the signed image at **http://localhost:5173** to verify.

## Key Results

| Metric | Value |
|--------|-------|
| Model | EfficientNet-B4 (transfer learning) |
| Dataset | CIFAKE (100K train, 20K test) |
| Validation Accuracy | **90.54%** |
| Training Phases | Phase 1: Head only (5 epochs) → Phase 2: Fine-tune blocks 7-8 (10 epochs) |

## License

FAST National University — Final Year Project (Spring 2026)
