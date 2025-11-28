# /packages

This directory contains shared code used by multiple apps in this monorepo (`apps/api`, `apps/mobile`, `apps/web`).

## Packages

### `packages/shared`
Single source of truth for the API contract and shared utilities.
- `schemas/` — Zod schemas for request/response validation
- `types/` — TypeScript types inferred from schemas + shared enums
- `utils/` — pure helpers (no platform-specific code)
- `constants/` — shared constants (limits, feature flags, etc.)

Rules:
- No ORM entities, no database models.
- No React components that depend on DOM or React Native APIs.
- Prefer Zod schemas + inferred types over hand-written DTO types.

### `packages/config`
Shared tooling configuration.
- ESLint config
- Prettier config
- TS configs/base configs
- Optional shared scripts

## Usage

Import shared code from apps via workspace aliases, e.g.
- `@shared/schemas`
- `@shared/types`
- `@shared/utils`

## Testing

Each package should have its own tests for pure logic and schema validation.
Keep tests fast and deterministic.
