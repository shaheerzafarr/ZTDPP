# ZTDPP ? Frontend Dashboard

Next.js 15 dashboard for the Zero Trust Digital Provenance Platform.

## Development

```text
npm ci
npm run dev
```

Runs on http://localhost:8080. Set NEXT_PUBLIC_API_BASE_URL in .env.local to the NestJS API, including its trailing slash.

## Checks

```text
npm run lint
npm run build
npm audit --omit=dev
```

## Production

Read the [production readiness and release checklist](docs/PRODUCTION_READINESS.md) before deployment. The backend repository contains the HTTPS Compose stack and database migration command.

For a code-based explanation of every major workflow, persistence boundary,
metadata field, API route, ledger operation, and trust-score response, read the
[system architecture and end-to-end flows](docs/SYSTEM_ARCHITECTURE_AND_FLOWS.md).

AI integration and trust scoring remain unchanged during this hardening work.
