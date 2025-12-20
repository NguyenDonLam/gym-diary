import { MaybeScore, StrengthScoreContext } from ".";
/**
 * Score a workout session.
 * Caller provides all exercise sessions + all sets (or you can ignore one of them in the strategy).
 */
export interface IWorkoutScoreStrategy<TSession, TExSession, TSet> {
  scoreWorkoutSession(
    session: TSession,
    exSessions: readonly TExSession[],
    sets: readonly TSet[],
    ctx: StrengthScoreContext
  ): MaybeScore;
  normalize?(raw: number, ctx: StrengthScoreContext): MaybeScore;
}
