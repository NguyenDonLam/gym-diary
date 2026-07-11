# /packages

Shared TypeScript packages used by Gym Diary apps.

## Runtime

- Node.js 22.13.0 from the repo `.nvmrc`.
- npm for installs and lockfile consistency.

## Packages

### `@gym-diary/exercise`

Shared exercise definitions and types.

Key files:

- `exercise-library.ts` - exercise library data
- `type.ts` - exercise-related types
- `index.ts` - public exports

### `@gym-diary/strength-score`

Shared strength scoring logic used by insights and session analytics.

Key areas:

- `strategies/` - set, exercise, workout, and normalized scoring strategies
- `aggregators/` - aggregation helpers for score summaries
- `index.ts` - public exports

## Usage

Apps import packages through their package names:

```ts
import { DEFAULT_EXERCISES } from "@gym-diary/exercise";
import { ScoreAggregateV1 } from "@gym-diary/strength-score";
```

Keep shared packages platform-neutral:

- No React Native or DOM dependencies.
- No app-specific storage, routing, or UI.
- Prefer typed pure functions and data that can be reused by both mobile and server code.

## Testing

Package tests should stay fast, deterministic, and focused on pure logic.
