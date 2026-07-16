---
project: AncestorTree
path: docs/02-design/ADR/ADR-004-standalone-output-conditional.md
type: architecture-decision-record
version: 1.0.0
updated: 2026-02-26
owner: architect
status: approved
---

# ADR-004: Standalone Output Conditional

## Status

Approved (CTO review v3, 2026-02-26)

## Context

Desktop app (Electron) cần Next.js `output: 'standalone'` để bundle server + dependencies vào `.next/standalone/`. Nhưng nếu hardcode trong `next.config.ts`, có thể ảnh hưởng Vercel production deploy.

## Decision

Dùng env-conditional:

```typescript
// frontend/next.config.ts
const nextConfig: NextConfig = {
  output: process.env.ELECTRON_BUILD ? 'standalone' : undefined,
};
```

Desktop build script set `ELECTRON_BUILD=true`:

```json
// desktop/package.json
"build:next": "ELECTRON_BUILD=true pnpm --dir ../frontend build"
```

## Rationale

- Web deploy (Vercel) không bị ảnh hưởng — `output: undefined` = default behavior
- Desktop build get standalone output — copy `.next/standalone/` vào Electron
- Một config file, hai mode — no duplication

## Verification

After merging `next.config.ts` change:
1. Run `pnpm build` (no ELECTRON_BUILD) → verify Vercel-compatible output
2. Run `ELECTRON_BUILD=true pnpm build` → verify `.next/standalone/` exists
3. Trigger Vercel deploy → confirm production still works (Phase 1 gate criteria)

## Consequences

- CI/CD phải KHÔNG set ELECTRON_BUILD
- Desktop CI (GitHub Actions) phải set ELECTRON_BUILD=true
- Vercel ignores unknown env vars → safe
