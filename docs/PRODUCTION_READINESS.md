# Production hardening and release checklist

Updated 17 September 2026. These changes preserve the current project scope. The AI detection service, model integration and trust scoring algorithm are outside this work.

## Implemented

| Area | Behavior in the revised implementation |
| --- | --- |
| Account recovery | HMAC-hashed, purpose-specific codes; ten-minute expiry; five attempts; atomic consumption; separate random reset token. |
| Sessions | HTTP-only cookies, short access tokens, rotated refresh tokens, persisted session revocation and invalidation after password changes. Browser persistence excludes tokens and recovery codes. |
| Requests | Origin checks for cookie writes, shared MongoDB request quotas, API-key allowance caps, bounded image memory/concurrency, MIME and decoded-image validation. |
| Registration | MongoDB transactions cover asset, manifest and ledger writes. Concurrent registrations serialize against a database lock. Claims are unique per owner and content hash. |
| Lineage | Editing a stale or revoked parent is rejected. Separate accounts can declare claims about the same bytes. Ambiguous verification needs a manifest reference. |
| Similarity | Candidate probes cover the configured Hamming-distance threshold. Over-budget searches fail explicitly. Alpha-channel bytes are excluded from grayscale hashing. |
| Integrity | Historical signing keys, key revocation configuration, versioned block hashes, signed checkpoints, stricter entry/block consistency checks. |
| Revocation | Owners can revoke a claim with a reason. A signed revocation event is appended to the ledger; the original signed claim remains. |
| Reports | New reports retain the disclosed manifest and policy snapshots. Current revocation status is separate from historical scores. JSON download and UTC date filters are available. |
| Privacy | Cross-account reports receive a limited claim projection. Private metadata, publisher email and API-key details are excluded. |
| Authorization | Controller-level administrator restrictions are enforced; legacy S3 upload tools require an administrator. |
| Administration | Write attempts and outcomes are recorded in security_audit without bodies or credentials. Database audit failure prevents a new write from starting. |
| Operations | Explicit production configuration, liveness/readiness endpoints, non-root containers, HTTPS proxy configuration, migration command, automated checks, patched production dependencies. |

## Before deploying

1. **Rotate exposed credentials.** The original backend environment example contained credentials, and Backend/env/.env.development was tracked by Git. Treat committed database, SMTP, JWT, encryption, API-key pepper and private signing credentials as exposed. Changing the example or adding ignore rules does not remove Git history.
   - Revoke database/SMTP credentials with their providers.
   - Rotate JWT secrets; users must sign in again.
   - Rotating the API-key pepper invalidates existing API keys; issue replacements.
   - Preserve public verification keys for historical signatures. If a signing key was exposed, record the compromise and decide which historical claims require re-registration. A signature made by a compromised key cannot establish trustworthy authorship.
   - The development environment file has been removed from the Git index and remains intact locally. That removal is staged; no commit or history rewrite was made. Coordinate any history cleanup with collaborators.
2. **Use an authenticated MongoDB replica set or managed cluster.** Standalone MongoDB cannot run the new transactions. Restrict database access to the backend and operations identities; require TLS for remote connections.
3. **Rehearse the migration on a restored database.** Stop all old application writers first. The migration adds per-owner content and asset/version uniqueness before removing global content-hash uniqueness. It invalidates legacy OTPs and creates model indexes. Resolve constraint failures before starting the release.
4. **Supply production secrets and a domain.** Keep env/.env.production out of images and Git. Configure HTTPS browser origins, SMTP, a persistent Ed25519 signer, API_KEY_PEPPER and JWT_SECRET. Set SEED_ADMIN_EMAIL and a unique 16?64 character SEED_ADMIN_PASSWORD only when creating the first administrator.
5. **Verify the deployed system.** Exercise registration, login, email verification, recovery, expired-session refresh, logout, API-key scope/rate limits, duplicate registration, revocation, and report export against staging before enabling customer traffic.

## Deployment layout

Keep these repositories as siblings:

```text
parent/
  ZTDPP/                # dashboard
  ZTDPP-Backend/
    Backend/            # API
    docker-compose.yml
    Caddyfile
```

The production Compose stack routes one HTTPS origin through Caddy. Backend and frontend ports are private to the container network. MongoDB is supplied separately. The development Compose file exposes an unauthenticated database only on loopback; it is not a production database configuration.

From ZTDPP-Backend, with DOMAIN configured and Backend/env/.env.production supplied:

```text
docker compose build
docker compose run --rm backend node dist/scripts/migrate-production.js
docker compose up -d
```

Use a maintenance window for the migration. Do not run the new and old writers together. The migration has not been applied to your development or production database.

- GET /api/v1/live checks that the process responds.
- GET /api/v1/ready requires a writable transaction-capable database and initialized signer; failure returns HTTP 503.
- GET /api/v1/ledger/checkpoint returns a signed head reference.
- Production auto-index creation is disabled; run the migration before starting a new database deployment.
- Configure the reverse proxy before setting TRUST_PROXY. The included single-proxy layout uses one trusted hop and exposes no direct backend port.

## Backup, recovery and monitoring

- Set recovery point and recovery time objectives before launch. Use encrypted database snapshots or a managed backup service, with access controlled separately from application credentials.
- Preserve database records and the signing-key history together. Store private keys in a secret manager and back them up under separate access control.
- Regularly restore into an isolated replica set and run the ledger audit, then compare the head against checkpoints saved outside the platform. A database-only hash chain cannot prove that an attacker did not truncate the database and its local checkpoints.
- Alert on readiness failures, elevated 5xx rates, upload saturation, repeated authentication failures, audit-storage failures, and unsealed ledger entries older than the configured block interval.
- Export request/audit logs to restricted external storage. Define retention rules for verification metadata, user data, request quotas, usage statistics and audit events.
- A rollback after new claims or version-2 blocks have been written requires compatible code or a coordinated data restore; the original writer is not compatible with the revised uniqueness and block format.

## Validation status

- Backend type check and 49 unit tests pass.
- All 10 isolated MongoDB integration tests pass, covering transaction rollback, concurrent registration/sealing, per-owner claim privacy, signed revocation, shared quota enforcement, API-key allowance races, one-time OTP consumption, refresh-token reuse rejection, and full-application HTTP authentication checks.
- Frontend production build and lint pass.
- Both production dependency audits report zero vulnerabilities at the time checked.
- Browser visual verification is blocked by the in-app browser connection failure. No production deployment, credential rotation, or live database migration has been performed.

## Verification commands

Backend (from ZTDPP-Backend/Backend):

```text
npm run typecheck
npm test -- --runInBand
npm run test:integration
npm run build
npm audit --omit=dev
```

The integration runner downloads an official MongoDB test binary on first use, starts an isolated replica set, uses a randomly named test database and removes test data afterward. CI supplies its own isolated replica set through TEST_MONGODB_URI.

Frontend (from ZTDPP):

```text
npm run lint
npm run build
npm audit --omit=dev
```


Backend strict ESLint still reports formatting and unsafe dynamic-type findings in the existing codebase, including the excluded AI files. Its current command also applies fixes automatically; use a read-only lint invocation for review. Backend CI currently enforces compilation, tests and production dependency auditing, while frontend CI also enforces lint. This is recorded as remaining maintenance work, not a passing backend lint check.

## Scope and remaining product decisions

- Origin is a publisher declaration. Signing a declaration does not prove capture hardware, copyright ownership, or that the declared origin is true.
- This is a custom provenance manifest and platform-operated ledger. Full C2PA content-credential interoperability, verified hardware attestation, public consensus and independent timestamp witnesses are separate integrations.
- AI deployment, AI output normalization, calibration, model evaluation and trust-weight behavior remain unchanged as requested.
- Existing report records without snapshots use a clearly identified legacy live-manifest fallback. Historical perceptual hashes produced by the previous alpha-channel implementation cannot be silently rewritten inside signed claims.
- Staging load tests, disaster-recovery rehearsal, visual browser QA, external security review, and live SMTP/DNS/TLS checks remain release activities. Passing unit tests or a build does not establish production readiness by itself.
- For higher-assurance multi-customer use, prioritize administrator MFA/SSO, organization membership and role management, external immutable audit storage, independently witnessed checkpoints, and a published data-retention policy.

## Dependency references

The dependency changes address the maintainers' published fixes in [Multer](https://expressjs.com/en/blog/2026-08-31-security-releases/), [Sharp](https://github.com/lovell/sharp/blob/main/docs/src/content/docs/changelog/v0.35.0.md), [Nodemailer](https://github.com/nodemailer/nodemailer/releases), and [PostCSS](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp). Next.js and NestJS retain their existing major versions. Production dependency audit results are a point-in-time check, not a guarantee against future advisories.
