// packages/metrics/src/strength-score/strategy.ts

export type Score = number;
export type MaybeScore = Score | null;

export type StrengthScoreContext = {
  baselineSetE1rm?: number | null;
  baselineExerciseStrengthScore?: number | null;
  baselineWorkoutStrengthScore?: number | null;
  sampleCount?: number; // K amount of values used to build the baseline
};

export { IExerciseScoreStrategy } from "./exercise-session-score-strategy";
export { ISetScoreStrategy } from "./set-session-score-strategy";
export { IWorkoutScoreStrategy } from "./workout-session-score-strategy";

export { ExerciseMeanScoreStrategy } from "./exercise-strategies/mean-strategy";
export { SetE1rmScoreStrategy } from "./set-strategies/e1rm-strategy";
export { WorkoutNormalizedScoreStrategy } from "./workout-strategies/normalized-score-strategy";

export { IStrengthScoreAggregate } from "../aggregators";
export { ScoreAggregateV1 } from "../aggregators/v1";
