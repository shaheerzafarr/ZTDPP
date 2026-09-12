"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/molecules/PageHeader/PageHeader";
import CustomButton from "@/components/atoms/CustomButton/CustomButton";
import CodeBlock from "@/components/molecules/CodeBlock/CodeBlock";
import { ToneBadge } from "@/components/molecules/ToneBadge/ToneBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_ORIGIN } from "@/config";
import { API_SCOPES, PROVENANCE_ACTIONS } from "@/resources/constants/ztdpp";
import shared from "@/styles/shared.module.css";
import classes from "./page.module.css";

const BASE = `${API_ORIGIN}/api/v1`;

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "authentication", label: "Authentication" },
  { id: "register", label: "Register content" },
  { id: "edit", label: "Register an edit" },
  { id: "lookup", label: "Lookup & history" },
  { id: "verify", label: "Verify" },
  { id: "trust-score", label: "Trust score explained" },
  { id: "ledger", label: "Ledger & proofs" },
  { id: "errors", label: "Error format" },
];

/* ------------------------------------------------------------------ snippets */

const CURL_REGISTER_CAMERA = `curl -X POST ${BASE}/provenance/register \\
  -H "x-api-key: $ZTDPP_API_KEY" \\
  -F "file=@photo.jpg" \\
  -F "sourceType=camera" \\
  -F "title=Sunset over the harbour" \\
  -F "externalId=photo-8812" \\
  -F 'capture={"deviceMake":"Apple","deviceModel":"iPhone 15 Pro","software":"CameraApp 3.2.0","capturedAt":"2026-09-09T10:00:00.000Z"}'`;

const NODE_REGISTER_CAMERA = `import { readFile } from "node:fs/promises";

const form = new FormData();
form.append("file", new Blob([await readFile("photo.jpg")], { type: "image/jpeg" }), "photo.jpg");
form.append("sourceType", "camera");
form.append("title", "Sunset over the harbour");
form.append("externalId", "photo-8812");
form.append(
  "capture",
  JSON.stringify({
    deviceMake: "Apple",
    deviceModel: "iPhone 15 Pro",
    software: "CameraApp 3.2.0",
    capturedAt: new Date().toISOString(),
  }),
);

const res = await fetch("${BASE}/provenance/register", {
  method: "POST",
  headers: { "x-api-key": process.env.ZTDPP_API_KEY },
  body: form, // fetch sets the multipart boundary for you
});

if (!res.ok) throw new Error(JSON.stringify(await res.json()));
const { data } = await res.json();
// data.alreadyRegistered      -> true when these exact bytes were registered before
// data.manifest.manifestId    -> store this next to your own record
// data.manifest.ledger.status -> "pending" until the next block is sealed`;

const PYTHON_REGISTER_AI = `import json, os, requests

API_KEY = os.environ["ZTDPP_API_KEY"]

with open("render.png", "rb") as fh:
    resp = requests.post(
        "${BASE}/provenance/register",
        headers={"x-api-key": API_KEY},
        files={"file": ("render.png", fh, "image/png")},
        data={
            "sourceType": "ai_generated",
            "title": "Concept art #12",
            "softwareAgent": "studio-pipeline 2.1",
            # nested objects travel as JSON strings inside the multipart body
            "aiGeneration": json.dumps({
                "provider": "OpenAI",
                "model": "gpt-image-1",        # required for ai_generated
                "modelVersion": "2026-05",
                "promptHash": "<sha256 of the prompt, never the prompt itself>",
            }),
        },
        timeout=60,
    )

resp.raise_for_status()
data = resp.json()["data"]
print(data["manifest"]["manifestId"], data["manifest"]["originType"])`;

const CURL_REGISTER_HASH_ONLY = `# Hash-only: the file never leaves your infrastructure.
# Compute SHA-256 yourself (and optionally a 64-bit pHash as 16 hex chars).
sha=$(sha256sum render.png | cut -d' ' -f1)

curl -X POST ${BASE}/provenance/register \\
  -H "x-api-key: $ZTDPP_API_KEY" \\
  -F "sourceType=digital_creation" \\
  -F "contentHash=$sha" \\
  -F "mimeType=image/png" \\
  -F "externalId=render-8812" \\
  -F "softwareAgent=Blender 4.2"`;

const REGISTER_RESPONSE = `{
  "data": {
    "alreadyRegistered": false,
    "manifest": {
      "manifestId": "urn:ztdpp:manifest:…",
      "assetId": "urn:ztdpp:asset:…",
      "version": 1,
      "parentManifestId": null,
      "contentHash": "3f1a…e9c2",            // SHA-256 of the bytes
      "phash": "d4c3b2a1f0e9d8c7",             // 64-bit perceptual hash
      "originType": "camera",
      "originLabel": "Camera captured",
      "declaredSourceType": "camera",
      "actions": [{ "action": "c2pa.created", "softwareAgent": "CameraApp 3.2.0", "when": "…" }],
      "claimGenerator": { "name": "Acme Media", "platform": "Mobile capture app", "keyPrefix": "ztd_live_ab12" },
      "manifestHash": "9b0c…41aa",            // hash of the canonical manifest body
      "signature": { "alg": "Ed25519", "keyId": "ztdpp-signer-2026", "value": "…", "signedAt": "…" },
      "ledger": { "seq": 1842, "entryHash": "…", "status": "pending", "blockIndex": null, "blockHash": null },
      "registeredAt": "2026-09-09T10:00:04.311Z"
    },
    "asset": {
      "assetId": "urn:ztdpp:asset:…",
      "externalId": "photo-8812",
      "rootOriginType": "camera",
      "currentOriginType": "camera",
      "versionCount": 1,
      "latestContentHash": "3f1a…e9c2"
    }
  }
}`;

const CURL_EDIT = `curl -X POST ${BASE}/provenance/edit \\
  -H "x-api-key: $ZTDPP_API_KEY" \\
  -F "file=@photo-cropped.jpg" \\
  -F "parentManifestId=urn:ztdpp:manifest:…" \\
  -F "softwareAgent=Photoshop 26.0" \\
  -F 'actions=[
        {"action":"c2pa.cropped","softwareAgent":"Photoshop 26.0","parameters":{"width":1024,"height":768}},
        {"action":"c2pa.color_adjustments","description":"Exposure +0.4, warm white balance"}
      ]'`;

const ACTIONS_JSON = `[
  { "action": "c2pa.cropped",   "softwareAgent": "Photoshop 26.0", "when": "2026-09-09T10:05:00.000Z", "parameters": { "width": 1024, "height": 768 } },
  { "action": "c2pa.ai_edited", "softwareAgent": "Generative Fill", "description": "Removed a lamp post" }
]`;

const CURL_LOOKUP = `# By content hash (the most common integration: "have we seen these bytes?")
curl "${BASE}/provenance/lookup?contentHash=<sha256>" -H "x-api-key: $ZTDPP_API_KEY"

# By your own id, a manifest id or an asset id
curl "${BASE}/provenance/lookup?externalId=photo-8812" -H "x-api-key: $ZTDPP_API_KEY"

# A single manifest with its live ledger status
curl "${BASE}/provenance/manifest/<manifestId>" -H "x-api-key: $ZTDPP_API_KEY"

# Full lineage of an asset (accepts an asset id or any manifest id in the chain)
curl "${BASE}/provenance/history/<assetOrManifestId>" -H "x-api-key: $ZTDPP_API_KEY"`;

const HISTORY_RESPONSE = `{
  "data": {
    "asset": { "assetId": "urn:ztdpp:asset:…", "versionCount": 3, "currentOriginType": "edited", "…": "…" },
    "timeline": [
      { "manifestId": "…v1", "version": 1, "originType": "camera", "actions": [{ "action": "c2pa.created" }], "ledger": { "status": "sealed", "blockIndex": 41 } },
      { "manifestId": "…v2", "version": 2, "parentManifestId": "…v1", "originType": "edited", "actions": [{ "action": "c2pa.cropped" }], "ledger": { "status": "sealed", "blockIndex": 43 } },
      { "manifestId": "…v3", "version": 3, "parentManifestId": "…v2", "originType": "edited", "actions": [{ "action": "c2pa.color_adjustments" }], "ledger": { "status": "pending" } }
    ]
  }
}`;

const CURL_VERIFY = `curl -X POST ${BASE}/verify \\
  -H "x-api-key: $ZTDPP_API_KEY" \\
  -F "file=@suspect.jpg"

# Fetch the same report later
curl ${BASE}/verify/<verificationId> -H "x-api-key: $ZTDPP_API_KEY"`;

const NODE_VERIFY = `const form = new FormData();
form.append("file", fileBlob, "suspect.jpg");

const res = await fetch("${BASE}/verify", {
  method: "POST",
  headers: { "x-api-key": process.env.ZTDPP_API_KEY },
  body: form,
});
const { data: report } = await res.json();

if (report.verdict === "untrusted" || report.signals.some((s) => s.severity === "critical")) {
  // quarantine / flag for review
}`;

const VERIFY_RESPONSE = `{
  "data": {
    "verificationId": "ver_…",
    "trustScore": 87,                       // 0-100, weighted combination below
    "verdict": "trusted",                   // trusted | likely_authentic | suspicious | untrusted
    "verdictLabel": "Trusted",
    "classification": "camera_captured",    // what the content IS (camera_captured, ai_generated, edited, …)
    "classificationBasis": "declared",      // "declared" when a manifest matched, else "inferred"

    "scores": {
      "metadata": { "score": 92, "weight": 60, "effectiveWeight": 60, "max": 100 },
      "ai":       { "score": 79, "weight": 40, "effectiveWeight": 40, "max": 100 }
    },
    "metadataBreakdown": [                  // the 5 components that make up scores.metadata
      { "key": "provenance_match", "label": "Provenance match", "score": 40, "max": 40, "detail": "Byte-identical SHA-256 match…" },
      { "key": "signature",        "label": "Manifest signature", "score": 15, "max": 15 },
      { "key": "ledger",           "label": "Ledger anchoring",   "score": 15, "max": 15 },
      { "key": "origin",           "label": "Origin trust",       "score": 12, "max": 15 },
      { "key": "integrity",        "label": "Metadata integrity", "score": 10, "max": 15 }
    ],

    "signals": [                            // human-readable evidence, ordered by severity
      { "code": "provenance_verified", "severity": "positive", "message": "Exact match with manifest v1 registered by Acme Media…" },
      { "code": "ai_low_confidence",   "severity": "info",     "message": "AI model confidence is low (55%)." }
    ],

    "ai": { "status": "ok", "label": "real", "fakeProbability": 0.21, "realProbability": 0.79, "confidence": 0.55, "modelVersion": "…", "latencyMs": 412 },

    "input": { "contentHash": "3f1a…", "phash": "d4c3…", "mimeType": "image/jpeg", "fileSize": 812331, "fileName": "suspect.jpg", "width": 4032, "height": 3024 },

    "provenance": {
      "match": "exact",                     // exact | near | none
      "phashDistance": 0,                   // Hamming distance when match = near
      "manifest": { "manifestId": "…", "version": 1, "originType": "camera", "…": "…" }
    },

    "checks": {
      "signature": { "valid": true, "hashMatches": true },
      "ledger": { "found": true, "seq": 1842, "status": "sealed", "blockIndex": 41, "entryHashValid": true,
                  "chainLinkValid": true, "merkleProofValid": true, "blockHashValid": true, "blockSignatureValid": true, "ok": true }
    },

    "embeddedMetadata": { "exif": { "present": true, "make": "Apple", "hasGps": true }, "xmp": {}, "c2pa": { "containerPresent": false }, "aiHints": { "detected": false } },
    "processingMs": 923
  }
}`;

const CURL_LEDGER = `# Chain height, pending / sealed counters, signer key id
curl ${BASE}/ledger/stats

# Blocks and entries (paginated)
curl "${BASE}/ledger/blocks?page=1&limit=20"
curl "${BASE}/ledger/blocks/41"                       # by index or hash → block + checks + entries
curl "${BASE}/ledger/entries?contentHash=<sha256>"    # find the entry for some bytes

# Inclusion proof for a manifest
curl ${BASE}/ledger/proof/<manifestId>

# Re-validate a range of the chain on the server
curl "${BASE}/ledger/verify?fromIndex=0&maxBlocks=200"

# Public key used to sign blocks (PEM)
curl ${BASE}/ledger/public-key`;

const PROOF_RESPONSE = `{
  "data": {
    "entry": {
      "seq": 1842, "entryHash": "…", "status": "sealed", "blockIndex": 41, "blockHash": "…", "leafIndex": 3,
      "proof": [ { "hash": "…", "position": "left" }, { "hash": "…", "position": "right" } ],
      "sealedAt": "…"
    },
    "block": { "index": 41, "prevHash": "…", "merkleRoot": "…", "timestamp": "…", "entryCount": 8, "nonce": 5127, "difficulty": 3, "hash": "000a…", "signature": "…", "signerKeyId": "…" },
    "verification": { "ok": true, "checks": { "entryHashValid": true, "chainLinkValid": true, "merkleProofValid": true, "blockHashValid": true, "blockSignatureValid": true, "difficultyMet": true } },
    "signerPublicKeyPem": "-----BEGIN PUBLIC KEY-----…"
  }
}`;

const MERKLE_PSEUDO = `# 1. Re-compute the entry hash from the manifest fields you hold
entryHash = sha256( seq | manifestId | manifestHash | contentHash | prevEntryHash | timestampISO )
assert entryHash == entry.entryHash

# 2. Walk the inclusion proof up to the Merkle root (hashes are hex, concatenated as raw bytes)
node = entry.entryHash
for step in entry.proof:
    node = step.position == "left" ? sha256(bytes(step.hash) + bytes(node))
                                   : sha256(bytes(node) + bytes(step.hash))
assert node == block.merkleRoot

# 3. Re-compute the block hash and check the proof-of-work prefix
blockHash = sha256( index | prevHash | merkleRoot | timestampISO | entryCount | nonce )
assert blockHash == block.hash and blockHash.startswith("0" * block.difficulty)

# 4. Verify the Ed25519 block signature with the published public key
assert ed25519.verify(block.signature, blockHash, signerPublicKeyPem)`;

const MERKLE_NODE = `import { createHash, createPublicKey, verify } from "node:crypto";

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");
const hashPair = (l, r) => sha256(Buffer.concat([Buffer.from(l, "hex"), Buffer.from(r, "hex")]));

export function verifyProof({ entry, block, signerPublicKeyPem }) {
  let node = entry.entryHash;
  for (const step of entry.proof)
    node = step.position === "left" ? hashPair(step.hash, node) : hashPair(node, step.hash);
  const merkleOk = node === block.merkleRoot;

  const blockHash = sha256(
    Buffer.from([block.index, block.prevHash, block.merkleRoot, block.timestamp, block.entryCount, block.nonce].join("|")),
  );
  const hashOk = blockHash === block.hash && blockHash.startsWith("0".repeat(block.difficulty));

  const sigOk = verify(null, Buffer.from(blockHash, "utf8"), createPublicKey(signerPublicKeyPem), Buffer.from(block.signature, "base64"));
  return { merkleOk, hashOk, sigOk, ok: merkleOk && hashOk && sigOk };
}`;

const ERROR_EXAMPLE = `{
  "status": "fail",
  "message": {
    "error": [
      "aiGeneration.model should not be empty",
      "capture.capturedAt must be a valid ISO 8601 date string"
    ]
  },
  "statusCode": 400
}`;

const ERROR_HANDLING_NODE = `const res = await fetch(url, init);
const body = await res.json();

if (!res.ok) {
  const messages = body?.message?.error ?? ["Unknown error"];
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? res.headers.get("X-RateLimit-Reset") ?? 1);
    // back off, then retry
  }
  throw new Error(\`ZTDPP \${res.status}: \${messages.join(", ")}\`);
}
return body.data;`;

/* ------------------------------------------------------------------ page */

export default function DocsPage() {
  const router = useRouter();
  return (
    <div className={shared.stack}>
      <PageHeader
        title="Integration docs"
        subtitle="Register content from your platform, keep an auditable edit history and verify any image against it."
        actions={
          <CustomButton variant="outline" onClick={() => router.push("/api-keys")} leftIcon={<KeyRound size={16} />}>
            Manage API keys
          </CustomButton>
        }
      />

      <div className={classes.layout}>
        <nav className={classes.toc} aria-label="On this page">
          <span className={classes.tocTitle}>On this page</span>
          <ul className={classes.tocList}>
            {TOC.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={classes.tocLink}>
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
          <div className={classes.tocMeta}>
            <span className={classes.tocMetaLabel}>Base URL</span>
            <code className={classes.tocMetaCode}>{BASE}</code>
          </div>
        </nav>

        <article className={classes.content}>
          {/* ---------------------------------------------------- overview */}
          <Section id="overview" title="Overview">
            <p>
              ZTDPP (Zero Trust Digital Provenance Platform) gives every image your platform produces a{" "}
              <strong>signed provenance manifest</strong> and anchors a fingerprint of that manifest in an append-only,
              publicly verifiable <strong>ZTD ledger</strong>. Anyone holding a copy of the bytes can later ask the
              platform whether they are what they claim to be.
            </p>
            <ol className={classes.flow}>
              <li>
                <strong>Register</strong> — upload the image (or just its SHA-256) with the declared source: camera
                capture, AI generation or digital creation. ZTDPP computes SHA-256, perceptual hashes and extracts
                EXIF/XMP/C2PA hints.
              </li>
              <li>
                <strong>Signed manifest</strong> — the platform issues a C2PA-aligned manifest and signs its canonical
                hash with an Ed25519 key. Edits are registered as new versions linked to their parent, forming a lineage.
              </li>
              <li>
                <strong>Ledger anchoring</strong> — each manifest becomes a hash-chained ledger entry; entries are sealed
                into Merkle-rooted, proof-of-work, signed blocks. Inclusion proofs are public.
              </li>
              <li>
                <strong>Verify</strong> — submit any image and receive a trust report: 60% provenance & metadata, 40% AI
                deepfake consistency, plus a verdict, a classification and explainable signals.
              </li>
            </ol>
            <p className={classes.note}>
              Original files are processed in memory and are never stored. Only hashes, extracted metadata and the manifest
              are kept.
            </p>
          </Section>

          {/* ---------------------------------------------------- authentication */}
          <Section id="authentication" title="Authentication">
            <p>
              All <code>/provenance/*</code> and <code>/verify</code> endpoints are authenticated with an API key sent in
              the <code>x-api-key</code> header. Create keys from the{" "}
              <Link href="/api-keys" className={shared.linkButton}>
                API keys
              </Link>{" "}
              page; the secret is shown once.
            </p>
            <CodeBlock language="bash" title="header" code={`x-api-key: ztd_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`} />
            <h3>Key format</h3>
            <p>
              Keys look like <code>ztd_&lt;env&gt;_&lt;50 characters&gt;</code>. The first characters (the prefix) are
              shown in the dashboard so you can match a key to a log line without revealing the secret. Keys are stored
              hashed; a lost key must be rotated.
            </p>
            <h3>Scopes</h3>
            <p>Each key carries one or more scopes. A request to an endpoint the key is not scoped for returns 403.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scope</TableHead>
                  <TableHead>Grants</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {API_SCOPES.map((s) => (
                  <TableRow key={s.value}>
                    <TableCell>
                      <code>{s.value}</code>
                    </TableCell>
                    <TableCell>{s.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <h3>Rate limiting</h3>
            <p>
              Every key has a per-minute budget (default 120, configurable per key). Each response carries the current
              window state; exceeding it returns <code>429</code> with a <code>Retry-After</code> header.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Header</TableHead>
                  <TableHead>Meaning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <code>X-RateLimit-Limit</code>
                  </TableCell>
                  <TableCell>Requests allowed per minute for this key.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <code>X-RateLimit-Remaining</code>
                  </TableCell>
                  <TableCell>Requests left in the current window.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <code>X-RateLimit-Reset</code>
                  </TableCell>
                  <TableCell>Seconds until the window resets.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Section>

          {/* ---------------------------------------------------- register */}
          <Section id="register" title="Register content" endpoint={{ method: "POST", path: "/provenance/register" }} scope="provenance:write">
            <p>
              Send the image as <code>multipart/form-data</code> together with a <code>sourceType</code>. Nested objects
              (<code>capture</code>, <code>aiGeneration</code>, <code>actions</code>, <code>metadata</code>) are passed as{" "}
              <strong>JSON strings</strong> inside the form. Images up to 20 MB (JPEG, PNG, WebP, HEIC, TIFF, AVIF, GIF,
              BMP) are accepted.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <FieldRow name="file" type="binary" note="The image. Omit for hash-only registration." />
                <FieldRow name="sourceType" type="camera | ai_generated | digital_creation" note="Required. Use POST /provenance/edit for edited versions." />
                <FieldRow name="title" type="string ≤ 200" note="Optional display title." />
                <FieldRow name="externalId" type="string ≤ 200" note="Your own id; queryable via lookup." />
                <FieldRow name="softwareAgent" type="string ≤ 120" note="Tool that produced the file." />
                <FieldRow name="capture" type="JSON" note="{ deviceMake, deviceModel, software, capturedAt (ISO-8601), attestation } — for camera." />
                <FieldRow name="aiGeneration" type="JSON" note="{ provider, model (required), modelVersion, promptHash (sha256), seed, generatedAt } — for ai_generated." />
                <FieldRow name="contentHash" type="sha256 hex" note="Required when no file is sent (hash-only)." />
                <FieldRow name="phash" type="16 hex chars" note="Optional 64-bit perceptual hash for hash-only registrations; enables near-match detection." />
                <FieldRow name="mimeType" type="string" note="Required for hash-only registration." />
                <FieldRow name="metadata" type="JSON ≤ 4 KB" note="Free-form object stored with the manifest." />
              </TableBody>
            </Table>

            <h3>Camera capture (curl)</h3>
            <CodeBlock language="bash" title="curl" code={CURL_REGISTER_CAMERA} />

            <h3>Camera capture (Node 18+)</h3>
            <CodeBlock language="javascript" title="register.mjs" code={NODE_REGISTER_CAMERA} maxHeight={480} />

            <h3>AI generated (Python)</h3>
            <p>
              For <code>ai_generated</code>, <code>aiGeneration.model</code> is mandatory. Never send the raw prompt —
              send its SHA-256 as <code>promptHash</code> if you want to be able to prove authorship later.
            </p>
            <CodeBlock language="python" title="register_ai.py" code={PYTHON_REGISTER_AI} maxHeight={480} />

            <h3>Hash-only registration</h3>
            <p>
              When the bytes must not leave your infrastructure, register the hash alone. The manifest is flagged{" "}
              <code>hashOnly: true</code>: no embedded-metadata snapshot exists, so near-match verifications cannot
              compare EXIF against registration, and no perceptual hash is stored unless you send <code>phash</code>.
            </p>
            <CodeBlock language="bash" title="curl" code={CURL_REGISTER_HASH_ONLY} />

            <h3>Response</h3>
            <p>
              Registering the same bytes twice under your account is idempotent and returns the existing manifest with{" "}
              <code>alreadyRegistered: true</code>. If another platform already registered those bytes you receive a 400.
              The ledger entry is written synchronously (<code>status: pending</code>) and sealed into a block on the next
              interval.
            </p>
            <CodeBlock language="jsonc" title="201 Created" code={REGISTER_RESPONSE} maxHeight={520} />
          </Section>

          {/* ---------------------------------------------------- edit */}
          <Section id="edit" title="Register an edit" endpoint={{ method: "POST", path: "/provenance/edit" }} scope="provenance:write">
            <p>
              Edits create a <strong>new version</strong> of an existing asset. Link it to its parent with{" "}
              <code>parentManifestId</code> (or <code>parentContentHash</code>) and declare what changed in{" "}
              <code>actions</code>. The origin type is derived automatically: an edited camera photo becomes{" "}
              <code>edited</code>, an edited AI image becomes <code>ai_generated_edited</code>, and an AI-assisted edit of
              anything is recorded as such.
            </p>
            <CodeBlock language="bash" title="curl" code={CURL_EDIT} />
            <h3>Actions</h3>
            <p>
              <code>actions</code> is a JSON array (max 50). Each item has an <code>action</code> from the vocabulary below
              and optional <code>softwareAgent</code>, <code>when</code> (ISO-8601), <code>parameters</code> (object) and{" "}
              <code>description</code>.
            </p>
            <CodeBlock language="json" title="actions" code={ACTIONS_JSON} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Meaning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROVENANCE_ACTIONS.map((a) => (
                  <TableRow key={a.value}>
                    <TableCell>
                      <code>{a.value}</code>
                    </TableCell>
                    <TableCell>{a.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          {/* ---------------------------------------------------- lookup */}
          <Section id="lookup" title="Lookup & history" scope="provenance:read">
            <p>
              Read endpoints let you resolve bytes, ids or your own external ids to a manifest and walk an asset's full
              lineage. They only return manifests registered by your own platform.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Returns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <EndpointRow method="GET" path="/provenance/lookup?contentHash=|manifestId=|assetId=|externalId=" note="The matching manifest (exactly one query parameter)." />
                <EndpointRow method="GET" path="/provenance/manifest/:manifestId" note="A single manifest with its live ledger status." />
                <EndpointRow method="GET" path="/provenance/history/:assetOrManifestId" note="{ asset, timeline[] } — all versions ascending." />
              </TableBody>
            </Table>
            <CodeBlock language="bash" title="curl" code={CURL_LOOKUP} />
            <CodeBlock language="jsonc" title="history response" code={HISTORY_RESPONSE} maxHeight={360} />
          </Section>

          {/* ---------------------------------------------------- verify */}
          <Section id="verify" title="Verify" endpoint={{ method: "POST", path: "/verify" }} scope="verify">
            <p>
              Upload any image. ZTDPP fingerprints it, looks for an exact (SHA-256) or near (perceptual hash) match among
              registered manifests, re-validates the manifest signature and its ledger proof, runs the deepfake model and
              combines everything into a single trust score. Reports are stored and retrievable with{" "}
              <code>GET /verify/:verificationId</code>.
            </p>
            <CodeBlock language="bash" title="curl" code={CURL_VERIFY} />
            <CodeBlock language="javascript" title="verify.mjs" code={NODE_VERIFY} />
            <h3>Annotated response</h3>
            <CodeBlock language="jsonc" title="200 OK" code={VERIFY_RESPONSE} maxHeight={640} />
            <h3>Reading the report</h3>
            <ul className={classes.bullets}>
              <li>
                <code>verdict</code> is the headline for people; <code>trustScore</code> is the number for thresholds and
                dashboards.
              </li>
              <li>
                <code>classification</code> answers "what is this image?" independently of trust: an openly declared AI
                image can be both <em>ai_generated</em> and <em>trusted</em>.
              </li>
              <li>
                <code>signals</code> explain the score. Treat any <code>critical</code> signal as a hard flag regardless
                of the score.
              </li>
              <li>
                <code>provenance.match = near</code> means the bytes differ from a registered manifest but the picture
                looks the same: re-encoding, resizing or tampering after registration.
              </li>
              <li>
                <code>checks.signature</code> and <code>checks.ledger</code> are re-computed at verification time, not
                read from the database.
              </li>
            </ul>
          </Section>

          {/* ---------------------------------------------------- trust score */}
          <Section id="trust-score" title="Trust score explained">
            <p>
              <code>trust = 60% × metadataScore + 40% × aiScore</code>, rounded and clamped to 0–100. Both components
              are 0–100 and the weights are visible in every report as <code>scores.*.weight</code>.
            </p>
            <h3>Provenance & metadata (60%)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Component</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>How it is earned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Provenance match</TableCell>
                  <TableCell>40</TableCell>
                  <TableCell>
                    40 for a byte-identical SHA-256 match; 12–24 for a near match, scaling down with the perceptual-hash
                    distance; 0 when nothing is registered.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Manifest signature</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>
                    The manifest hash is recomputed and the Ed25519 signature re-verified. An invalid signature caps the
                    whole metadata score at 25.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Ledger anchoring</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>
                    Entry hash, chain link, Merkle proof, block hash and block signature are re-checked. 15 when sealed
                    in a block, 9 while the entry is chained but the block is pending, 0 with no entry; a failed proof
                    caps the metadata score at 30.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Origin trust</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>
                    With a manifest: 15 for a declared camera capture, 12 for digital creation, edited or transparently
                    declared AI, 10 for AI-then-edited. Without a manifest it is inferred from embedded metadata (camera
                    EXIF 9, partial EXIF 6, foreign C2PA container 8, AI generator tags 4).
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Metadata integrity</TableCell>
                  <TableCell>15</TableCell>
                  <TableCell>
                    15 for an exact match (bytes unchanged). For a near match the current EXIF is compared with the
                    snapshot taken at registration (10 consistent, 4 stripped, 3 conflicting). Without a manifest,
                    complete camera EXIF earns 9, partial 6, none 3; camera EXIF combined with AI generator tags drops to 2.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3>AI consistency (40%)</h3>
            <p>
              The AI component measures <strong>consistency between the declared origin and the deepfake model</strong>,
              not raw "realness". With <code>p = P(fake)</code>:
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Declared origin</TableHead>
                  <TableHead>aiScore</TableHead>
                  <TableHead>Rationale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>No manifest, camera, edited</TableCell>
                  <TableCell>
                    <code>(1 − p) × 100</code>
                  </TableCell>
                  <TableCell>
                    Content claiming to be a capture must look real. p ≥ 0.7 on a declared capture raises a{" "}
                    <em>declared_origin_conflict</em> critical signal.
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>ai_generated, ai_generated_edited</TableCell>
                  <TableCell>
                    <code>60 + 40 × p</code>
                  </TableCell>
                  <TableCell>Transparent AI content is not punished for being AI; the model agreeing is a positive.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>digital_creation</TableCell>
                  <TableCell>
                    <code>50 + 50 × (1 − p)</code>
                  </TableCell>
                  <TableCell>Renders and illustrations legitimately sit between photographic and synthetic.</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <h3>Verdict bands</h3>
            <div className={classes.bands}>
              <div className={classes.band} data-tone="success">
                <ToneBadge tone="success" dot>
                  trusted
                </ToneBadge>
                <span>score ≥ 80</span>
              </div>
              <div className={classes.band} data-tone="info">
                <ToneBadge tone="info" dot>
                  likely_authentic
                </ToneBadge>
                <span>60 – 79</span>
              </div>
              <div className={classes.band} data-tone="warning">
                <ToneBadge tone="warning" dot>
                  suspicious
                </ToneBadge>
                <span>40 – 59</span>
              </div>
              <div className={classes.band} data-tone="danger">
                <ToneBadge tone="danger" dot>
                  untrusted
                </ToneBadge>
                <span>&lt; 40</span>
              </div>
            </div>
            <p>
              Hard rule: a failed signature or ledger proof can never yield <code>trusted</code>; the verdict is downgraded
              to <code>suspicious</code> even if the number qualifies.
            </p>

            <h3>When the AI model is unavailable</h3>
            <p>
              If the deepfake model is disabled, times out or its circuit breaker is open, <code>ai.status</code> is not{" "}
              <code>ok</code>, <code>scores.ai.score</code> is <code>null</code> and the AI weight is redistributed to
              metadata (<code>scores.metadata.effectiveWeight = 100</code>). An <em>ai_analysis_unavailable</em> info signal
              is added so consumers can decide whether to re-verify later.
            </p>
          </Section>

          {/* ---------------------------------------------------- ledger */}
          <Section id="ledger" title="Ledger & proofs">
            <p>
              The ZTD ledger is public and needs no authentication. Each manifest becomes an entry hashed together with
              the previous entry (a hash chain); entries are batched into blocks with a Merkle root, a proof-of-work
              nonce and an Ed25519 signature from the platform signer. Anyone can independently re-verify an inclusion
              proof with nothing but the response below and the public key.
            </p>
            <CodeBlock language="bash" title="public endpoints" code={CURL_LEDGER} />
            <h3>Proof response</h3>
            <CodeBlock language="jsonc" title={`GET ${BASE}/ledger/proof/:manifestId`} code={PROOF_RESPONSE} maxHeight={360} />
            <h3>Verifying a proof client-side</h3>
            <p>
              Hashes are lowercase hex. Pairs are hashed as the concatenation of the <strong>raw bytes</strong> of the two
              hex strings (not the ASCII). When a level has an odd number of nodes the last node is paired with itself.
              Field lists are joined with <code>|</code> and timestamps are ISO-8601 strings.
            </p>
            <CodeBlock language="text" title="pseudo code" code={MERKLE_PSEUDO} />
            <CodeBlock language="javascript" title="verifyProof.mjs" code={MERKLE_NODE} maxHeight={460} />
          </Section>

          {/* ---------------------------------------------------- errors */}
          <Section id="errors" title="Error format">
            <p>
              Every non-2xx response uses one envelope. <code>message.error</code> is always an array so validation
              failures can list every problem at once.
            </p>
            <CodeBlock language="json" title="error envelope" code={ERROR_EXAMPLE} />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <StatusRow code={400} note="Validation failed; sourceType=edited sent to /register; content hash already registered by another platform; parent manifest missing for an edit; file is not an image." />
                <StatusRow code={401} note="Missing, malformed, revoked or expired API key." />
                <StatusRow code={403} note="Key lacks the required scope, or the manifest / asset belongs to a different platform." />
                <StatusRow code={404} note="Manifest, asset, verification or ledger entry not found." />
                <StatusRow code={413} note="File larger than 20 MB." />
                <StatusRow code={429} note="Per-key rate limit exceeded. Honour Retry-After / X-RateLimit-Reset." />
                <StatusRow code={500} note="Unexpected failure. Safe to retry with the same idempotent registration." />
              </TableBody>
            </Table>
            <CodeBlock language="javascript" title="handling errors" code={ERROR_HANDLING_NODE} />
          </Section>
        </article>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ pieces */

function Section({ id, title, endpoint, scope, children }) {
  return (
    <section id={id} className={classes.section}>
      <div className={classes.sectionHead}>
        <h2 className={classes.sectionTitle}>
          <a href={`#${id}`} className={classes.anchor}>
            {title}
          </a>
        </h2>
        {(endpoint || scope) && (
          <div className={classes.sectionMeta}>
            {endpoint && (
              <span className={classes.endpoint}>
                <span className={classes.method}>{endpoint.method}</span>
                <code>{endpoint.path}</code>
              </span>
            )}
            {scope && (
              <ToneBadge tone="neutral">
                scope: {scope}
              </ToneBadge>
            )}
          </div>
        )}
      </div>
      <div className={classes.sectionBody}>{children}</div>
    </section>
  );
}

function FieldRow({ name, type, note }) {
  return (
    <TableRow>
      <TableCell>
        <code>{name}</code>
      </TableCell>
      <TableCell>
        <span className={classes.typeCell}>{type}</span>
      </TableCell>
      <TableCell>{note}</TableCell>
    </TableRow>
  );
}

function EndpointRow({ method, path, note }) {
  return (
    <TableRow>
      <TableCell>
        <span className={classes.endpoint}>
          <span className={classes.method}>{method}</span>
          <code>{path}</code>
        </span>
      </TableCell>
      <TableCell>{note}</TableCell>
    </TableRow>
  );
}

function StatusRow({ code, note }) {
  const tone = code >= 500 ? "danger" : code === 429 ? "warning" : code >= 400 ? "neutral" : "success";
  return (
    <TableRow>
      <TableCell>
        <ToneBadge tone={tone}>{code}</ToneBadge>
      </TableCell>
      <TableCell>{note}</TableCell>
    </TableRow>
  );
}
