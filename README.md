# Gym Diary (Monorepo)
(WORK IN PROGRESS) A mobile app to track, graph and visualize gym progress

Workout tracking platform with:
- Mobile app (React Native)
- Web app (optional)
- API server
- Shared types/schemas

## Repo layout
```
repo/
  apps/
    api/          # NestJS backend
    mobile/       # React Native (Expo)
    web/          # React web (optional)
  packages/
    shared/       # API contract: schemas + inferred types + utils
    config/       # lint/ts/prettier configs
  infra/          # docker/terraform (optional)
  scripts/
  docs/
```
## Prerequisites

- Node.js (LTS)
- One package manager (npm)
- For mobile:
  - Expo Go installed on your phone

## Install

From repo root:

pnpm:
pnpm install

npm:
npm install

## Run: API (NestJS)
```
cd apps/api
npm run start:dev

Build:
npm run build
npm run start:prod
```
## Run: Mobile (React Native)
```
cd apps/mobile
npx expo start

Android:
npx react-native run-android

iOS (macOS only):
npx react-native run-ios
```
## Local API access from mobile devices

A phone cannot reach http://localhost:<port> on your computer.

Use one of these:
- Android emulator: http://10.0.2.2:<port>
- iOS simulator: http://localhost:<port>
- Physical phone on Wi-Fi: http://<your-computer-LAN-IP>:<port> (backend must bind 0.0.0.0)
- Android physical device over USB: adb reverse tcp:<port> tcp:<port>

Keep base URLs in app config (example: apps/mobile/src/shared/config/env.ts).

## Shared contract (packages/shared)

- schemas/ — Zod schemas (runtime validation)
- types/ — types inferred from schemas (compile-time)
- utils/ — pure helpers
- constants/ — shared constants/enums

Rule: share API contract types/schemas only. Do not share ORM entities.

## Environment variables

Create .env files per app as needed:
- apps/api/.env
- apps/mobile/.env (if your setup supports it)
- apps/web/.env

Always commit .env.example, never commit real secrets.

## Git

See .gitignore at repo root.
