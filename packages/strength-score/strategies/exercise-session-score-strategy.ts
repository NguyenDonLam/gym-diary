import { MaybeScore, StrengthScoreContext } from ".";

/**
 * Score a single "exercise session" (one exercise performed inside a workout session).
 * Caller provides the sets that belong to this exercise session.
 */
export interface IExerciseScoreStrategy<TExSession, TSet> {
  scoreExerciseSession(
    exSession: TExSession,
    sets: readonly TSet[],
    ctx: StrengthScoreContext
  ): MaybeScore;
  normalize?(raw: number, ctx: StrengthScoreContext): MaybeScore;
}
