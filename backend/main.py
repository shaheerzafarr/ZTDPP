"""
Main FastAPI orchestrator for the ZTDPP pipeline.
Handles API routing, file uploads, database initialization, and parallel execution
of the AI and Cryptographic checks.
"""

import os
import uuid
import asyncio
import tempfile
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import aiofiles

from schemas import VerifyResponse, CryptoResult, AIResult, DeviceRegistration
from registry import init_db, register_device
from crypto_verifier import verify as crypto_verify
from ai_inferencer import predict as ai_predict
from aggregator import compute_trust

_PROJECT_ROOT = Path(__file__).resolve().parent

app = FastAPI(title="ZTDPP Backend API", version="1.0.0")

# CORS Middleware for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize the SQLite database registry on startup."""
    init_db()

@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}

@app.post("/register-device")
async def api_register_device(payload: DeviceRegistration):
    """Registers a new capture device into the SQLite registry."""
    register_device(payload.device_id, payload.public_key_pem)
    return {"registered": payload.device_id}

@app.post("/verify", response_model=VerifyResponse)
async def verify_image(file: UploadFile = File(...)):
    """
    Main verification pipeline endpoint.
    Uploads the image, runs crypto verification and AI inference concurrently,
    computes the final trust score, and returns the verdict.
    """
    # 1a. Validate File Type
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG and PNG are supported.")
    
    # 1a. Validate File Size (under 10MB)
    MAX_SIZE = 10 * 1024 * 1024
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    tmp_dir = Path(tempfile.gettempdir())
    
    # 1b. Save to temporary file using aiofiles
    temp_filename = f"ztdpp_{uuid.uuid4().hex}{Path(file.filename).suffix}"
    temp_path = tmp_dir / temp_filename
    
    try:
        async with aiofiles.open(temp_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
                await buffer.write(chunk)

        # 1c. Run crypto_verify and ai_predict concurrently
        loop = asyncio.get_running_loop()
        
        # We must use run_in_executor here because both `crypto_verify` and `ai_predict` 
        # are synchronous, CPU-bound/I-O blocking functions. If we called them directly 
        # within this async route, they would block the main asyncio event loop, preventing 
        # FastAPI from handling any other incoming concurrent requests.
        crypto_task = loop.run_in_executor(None, crypto_verify, str(temp_path))
        ai_task = loop.run_in_executor(None, ai_predict, str(temp_path))
        
        crypto_res, ai_res = await asyncio.gather(crypto_task, ai_task)
        
        # 1d. Compute final trust score
        trust_score, verdict, message = compute_trust(crypto_res, ai_res, alpha=0.6)
        
        # 1f. Return VerifyResponse
        return VerifyResponse(
            filename=file.filename,
            trust_score=trust_score,
            verdict=verdict,
            crypto=crypto_res,
            ai=ai_res,
            message=message
        )
        
    finally:
        # 1e. Clean up the temporary file
        if temp_path.exists():
            temp_path.unlink()

@app.post("/sign")
async def sign_image(
    file: UploadFile = File(...),
    device_id: str = Form("CAM-001")
):
    """
    Simulates a Camera HSM. Signs the image and returns the signed file.
    """
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG and PNG are supported.")
        
    tmp_dir = Path(tempfile.gettempdir())
    ext = Path(file.filename).suffix
    temp_in = tmp_dir / f"in_{uuid.uuid4().hex}{ext}"
    temp_out = tmp_dir / f"signed_{uuid.uuid4().hex}{ext}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_in, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                await buffer.write(chunk)
                
        # Run signer script as a subprocess to keep it isolated
        import subprocess
        signer_script = _PROJECT_ROOT.parent / "signer" / "signer.py"
        keys_dir = _PROJECT_ROOT.parent / "signer" / "keys"
        venv_python = _PROJECT_ROOT.parent / "venv" / "Scripts" / "python.exe"
        
        cmd = [
            str(venv_python), str(signer_script),
            str(temp_in),
            "--device-id", device_id,
            "--keys-dir", str(keys_dir),
            "--output-dir", str(tmp_dir)
        ]
        
        process = subprocess.run(cmd, capture_output=True, text=True)
        if process.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Signing failed: {process.stderr}")
            
        # The signer script adds '_signed' to the filename
        expected_out = tmp_dir / f"{temp_in.stem}_signed{ext}"
        if not expected_out.exists():
            raise HTTPException(status_code=500, detail="Signed output not found.")
            
        # We rename it to the temp_out path to return it
        expected_out.rename(temp_out)
        
        return FileResponse(
            path=temp_out,
            filename=f"signed_{file.filename}",
            media_type=file.content_type
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_in.exists(): temp_in.unlink()
        # Note: We don't unlink temp_out immediately because FileResponse needs to read it.
        # FastAPI handles FileResponse cleanup or we rely on OS temp folder cleanup.
