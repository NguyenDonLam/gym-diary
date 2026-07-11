# Gym Diary API (`apps/api`)

NestJS backend for Gym Diary. This app owns server-side API work while the mobile client remains offline-first.

## Runtime

- Node.js 22.13.0. The repo includes `.nvmrc`; run `nvm use` from the repo root if you use nvm.
- npm. Use npm for this repo so the checked-in lockfiles stay consistent.

## Install

From the repo root:

```bash
nvm use
npm --prefix apps/api install
```

## Run

Development watch mode:

```bash
npm --prefix apps/api run start:dev
```

Production build:

```bash
npm --prefix apps/api run build
npm --prefix apps/api run start:prod
```

## Tests

```bash
npm --prefix apps/api run test
npm --prefix apps/api run test:e2e
npm --prefix apps/api run test:cov
```

## Notes

- Keep API environment variables in `apps/api/.env`.
- Do not commit real secrets; add safe examples to `apps/api/.env.example` when needed.
- Mobile devices cannot reach the API through `localhost`; use the LAN IP guidance in the root README when testing on a physical phone.
