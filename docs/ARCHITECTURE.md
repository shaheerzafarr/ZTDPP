# ZTDPP Architecture Design

## Overview
The Zero-Trust Digital Provenance Protocol (ZTDPP) backend is a FastAPI-based orchestrator responsible for evaluating the authenticity and provenance of images. It receives images, validates cryptographic EXIF signatures against a registered public key, runs AI-based deepfake detection, and aggregates the results into a single trust score.

## Components
1. **API Server (FastAPI)**: Handles incoming HTTP requests and responses, providing routing and concurrency.
2. **Crypto Verifier**: Validates digital signatures embedded in the image's EXIF metadata.
3. **AI Inferencer**: Runs an EfficientNet-B4 ONNX model to generate a binary classification probability of the image being a real photograph versus a deepfake.
4. **Aggregator**: Computes a final `Trust(M)` score by combining the deterministic cryptographic verification (60% weight) and the probabilistic AI inference (40% weight).
5. **Registry (SQLite)**: A local database storing trusted devices and their corresponding ECDSA P-256 public keys.

## API Endpoints
- `GET /health`
  - Returns basic health status `{"status": "ok"}`.
- `POST /register-device`
  - Registers a new capture device by storing its `device_id` and `public_key_pem`.
- `POST /verify`
  - The main endpoint. Accepts an image upload, coordinates the parallel execution of the Crypto Verifier and AI Inferencer, and returns a computed JSON verdict.

## Request Lifecycle
1. **Frontend Request**: The React frontend (Hasham's implementation) uploads a signed image via `POST /verify`.
2. **Middleware & Validation**: The FastAPI server applies CORS middleware, checks the file size (<10MB), and validates the format (JPEG/PNG only). Valid images are temporarily saved to `/tmp/ztdpp_{uuid}.jpg`.
3. **Parallel Execution**: 
   - **Crypto Verifier**: Reads the `UserComment` EXIF field, extracts the JSON manifest, re-hashes the pixel bytes, retrieves the public key for the `device_id` from the SQLite registry, and verifies the signature.
   - **AI Inferencer**: Preprocesses the image (Resize, Normalize) and runs the EfficientNet-B4 ONNX model to yield a `probability_real`.
4. **Aggregation**: The Trust Aggregator receives both results and computes:
   `Trust(M) = 0.6 × Verify(σ,M) + 0.4 × fθ(M)`
5. **Verdict Generation**: A final JSON response is built containing the score and verdict (`VERIFIED`, `UNVERIFIED`, or `BLOCKED`), and the temporary image file is deleted.

## Middleware Stack
- **CORS Middleware**: Configured to allow cross-origin requests from the React frontend running on `http://localhost:5173`.
- **File Validation**: Manual checks on endpoint execution ensuring content-types and file size constraints are met before continuing.
- **Logging/Error Handling**: Standard FastAPI exception handlers and request logging (handled by Uvicorn).

## SQLite Registry Rationale
We chose SQLite for the device registry because ZTDPP requires a lightweight, locally verifiable ledger for phase 1 and 2 of this project. It offers zero-configuration, simple file-based storage, and is perfectly suited for managing a relatively small list of authorized public keys during the prototype and testing phases without the overhead of a full relational database server like PostgreSQL.
