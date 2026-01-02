import type {
  MaybeScore,
  StrengthScoreContext,
} from "../strategies";

export type StrengthScoreUpdate = {
  setId: string;
  setScore: MaybeScore;
  exerciseSessionId: string;
  exerciseScore: MaybeScore;
  workoutScore: MaybeScore;
};

/**
 * Minimum surface area needed to:
 * - upsert sets/exercise-sessions
 * - read set/exercise/workout scores
 *
 * No completion config, no extra generic params for strategies, no recompute/remove-exsession.
 */
export interface IStrengthScoreAggregate<
  TSetSession,
  TExerciseSession,
  TSession,
> {
  readonly key: "strengthScore";
  readonly version: number;

  upsertExerciseSession(ex: TExerciseSession): void;

  upsertSet(set: TSetSession, ctx: StrengthScoreContext): StrengthScoreUpdate;

  removeSet(
    setId: string,
    ctxForSet: (set: TSetSession) => StrengthScoreContext
  ): StrengthScoreUpdate | null;

  getSetScore(setId: string): MaybeScore | undefined;
  getExerciseScore(exerciseSessionId: string): MaybeScore | undefined;
  getWorkoutScore(): MaybeScore;
}
