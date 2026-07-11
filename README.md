# Gym Diary

Work in progress mobile app for tracking workouts, reviewing history, and visualising progress over time.

<p align="center">
  <img src="./docs/0.26.1/app-icon.jpg" alt="Gym Diary app icon" width="140" />
</p>

## Screenshots

These are the current 0.26.1 preview screenshots from `docs/0.26.1`.

### Workout Flow

<p align="center">
  <img src="./docs/0.26.1/history-dark.png" alt="History screen showing completed sessions" width="220" />
  <img src="./docs/0.26.1/programs-dark.png" alt="Programs screen" width="220" />
  <img src="./docs/0.26.1/program-editor-dark.png" alt="Program editor screen" width="220" />
  <img src="./docs/0.26.1/exercise-picker-dark.png" alt="Exercise picker screen" width="220" />
</p>

### Session Tracking

<p align="center">
  <img src="./docs/0.26.1/session-anterior-dark.png" alt="Anterior session in progress" width="220" />
  <img src="./docs/0.26.1/session-posterior-dark-expanded.png" alt="Posterior session in dark mode" width="220" />
  <img src="./docs/0.26.1/session-posterior-light-expanded.png" alt="Posterior session in light mode" width="220" />
  <img src="./docs/0.26.1/session-posterior-dark-completed.png" alt="Completed posterior session" width="220" />
</p>

### Live Activity

<p align="center">
  <img src="./docs/0.26.1/live-activity-lock-screen.png" alt="iOS lock screen Live Activity" width="220" />
  <img src="./docs/0.26.1/live-activity-dynamic-island.png" alt="Dynamic Island workout timer" width="220" />
</p>

### Exercise Insights

<p align="center">
  <img src="./docs/0.26.1/exercise-stats-dark-summary.png" alt="Exercise stats summary in dark mode" width="220" />
  <img src="./docs/0.26.1/exercise-stats-dark-week.png" alt="Exercise weekly stats in dark mode" width="220" />
  <img src="./docs/0.26.1/exercise-stats-dark-month.png" alt="Exercise monthly stats in dark mode" width="220" />
  <img src="./docs/0.26.1/exercise-stats-light-summary.png" alt="Exercise stats summary in light mode" width="220" />
  <img src="./docs/0.26.1/exercise-stats-light-week.png" alt="Exercise weekly stats in light mode" width="220" />
  <img src="./docs/0.26.1/exercise-stats-light-month.png" alt="Exercise monthly stats in light mode" width="220" />
</p>

### Program Insights

<p align="center">
  <img src="./docs/0.26.1/program-stats-dark-summary.png" alt="Program stats summary in dark mode" width="220" />
  <img src="./docs/0.26.1/program-stats-dark-week.png" alt="Program weekly stats in dark mode" width="220" />
  <img src="./docs/0.26.1/program-stats-dark-month.png" alt="Program monthly stats in dark mode" width="220" />
  <img src="./docs/0.26.1/program-stats-light-summary.png" alt="Program stats summary in light mode" width="220" />
  <img src="./docs/0.26.1/program-stats-light-week.png" alt="Program weekly stats in light mode" width="220" />
  <img src="./docs/0.26.1/program-stats-light-month.png" alt="Program monthly stats in light mode" width="220" />
</p>

### Settings

<p align="center">
  <img src="./docs/0.26.1/settings-light.png" alt="Settings screen in light mode" width="220" />
  <img src="./docs/0.26.1/settings-dark.png" alt="Settings screen in dark mode" width="220" />
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
    0.26.1/       # Current release screenshots
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
