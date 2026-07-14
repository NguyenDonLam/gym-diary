# Gym Diary

Work in progress mobile app for tracking workouts, reviewing history, and visualising progress over time.

<p align="center">
  <img src="./docs/0.26.1/app-icon.jpg" alt="Gym Diary app icon" width="140" />
</p>

## Screenshots

These screenshots show the 0.26.1 demo on iPhone and iPad.

### iPhone

#### History and Programs

<p align="center">
  <img src="./docs/0.26.1/IMG_0170.png" alt="Gym Diary history calendar on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0171.png" alt="Gym Diary programs list on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0172.png" alt="Gym Diary program editor on iPhone" width="220" />
</p>

#### Session Tracking

<p align="center">
  <img src="./docs/0.26.1/IMG_0177.png" alt="Gym Diary workout session on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0178.png" alt="Gym Diary workout session with progress history and rest timer on iPhone" width="220" />
</p>

#### Insights

<p align="center">
  <img src="./docs/0.26.1/IMG_0173.png" alt="Gym Diary monthly exercise strength trend on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0174.png" alt="Gym Diary exercise statistics summary on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0175.png" alt="Gym Diary weekly program statistics on iPhone" width="220" />
  <img src="./docs/0.26.1/IMG_0176.png" alt="Gym Diary weekly program progression trend on iPhone" width="220" />
</p>

### iPad

#### History and Program Editing

<p align="center">
  <img src="./docs/0.26.1/IMG_1975.png" alt="Gym Diary history calendar on iPad" width="420" />
  <img src="./docs/0.26.1/IMG_1979.png" alt="Gym Diary program editor on iPad" width="420" />
</p>

#### Session Tracking

<p align="center">
  <img src="./docs/0.26.1/IMG_1981.png" alt="Gym Diary workout session with progress history and rest timer on iPad" width="420" />
  <img src="./docs/0.26.1/IMG_1984.png" alt="Gym Diary completed workout sets on iPad" width="420" />
</p>

#### Insights

<p align="center">
  <img src="./docs/0.26.1/IMG_1976.png" alt="Gym Diary program progression insights on iPad" width="420" />
  <img src="./docs/0.26.1/IMG_1978.png" alt="Gym Diary exercise strength insights on iPad" width="420" />
</p>

## Repo Layout

```text
repo/
  apps/
    api/          # NestJS backend
    mobile/       # React Native / Expo mobile app
  packages/
    exercise/       # Shared exercise library and types
    strength-score/ # Shared score strategies and aggregators
  docs/
    0.26.1/       # Current iPhone and iPad demo screenshots
```

## Prerequisites

- Node.js 22.13.0. The repo includes `.nvmrc`; run `nvm use` from the repo root if you use nvm.
- npm. Use npm for this repo so the checked-in lockfiles stay consistent.
- For mobile development: Expo tooling through `npx expo`, plus Expo Go, a development build, an Android emulator, or an iOS simulator.
- For iOS native builds: macOS with Xcode.

## Install

From the repo root:

```bash
nvm use
npm install
npm --prefix apps/mobile install
npm --prefix apps/api install
```

## Run

API:

```bash
npm run dev:api
```

Mobile:

```bash
npm run dev:mobile
```

Use the Expo CLI output to open the app on iOS simulator, Android emulator, Expo Go, or a development build.

## Local API Access From Mobile Devices

A phone cannot reach `http://localhost:<port>` on your computer.

Use one of these:

- Android emulator: `http://10.0.2.2:<port>`
- iOS simulator: `http://localhost:<port>`
- Physical phone on Wi-Fi: `http://<your-computer-LAN-IP>:<port>` with the backend bound to `0.0.0.0`
- Android physical device over USB: `adb reverse tcp:<port> tcp:<port>`

Keep base URLs in app config, for example `apps/mobile/src/shared/config/env.ts`.

## Shared Packages

- `@gym-diary/exercise` provides shared exercise definitions and types.
- `@gym-diary/strength-score` provides score strategies and aggregators used by insights.

## Environment Variables

Create `.env` files per app as needed:

- `apps/api/.env`
- `apps/mobile/.env`

Always commit `.env.example` files, never real secrets.
