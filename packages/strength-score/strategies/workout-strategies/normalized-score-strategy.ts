// packages/metrics/src/strength-score/strategies/workout-session-normalized-strength-score-strategy.ts

import type { MaybeScore, StrengthScoreContext } from "..";
import type { IWorkoutScoreStrategy } from "../workout-session-score-strategy";

/**
 * Normalized workout-session score (ratio).
 *
 * For each exercise-session i:
 *   raw_i      = getExerciseScore(exSession_i, exSets_i, exCtx_i)
 *   baseline_i = exCtx_i.baselineExerciseStrengthScore
 *   ratio_i    = raw_i / baseline_i
 *
 * Aggregation (weighted geometric mean):
 *   out = exp( sum(w_i * ln(ratio_i)) / sum(w_i) )
 *
 * Output:
 * - ratio where 1.0 ~= baseline session
 */
export class WorkoutNormalizedScoreStrategy<
  TSession,
  TExSession,
  TSet,
> implements IWorkoutScoreStrategy<TSession, TExSession, TSet> {
  constructor(
    private readonly getSetsForExSession: (
      exSession: TExSession,
      sets: readonly TSet[]
    ) => readonly TSet[],
    /**
     * Return a context for this specific exercise-session.
     * Must set baselineExerciseStrengthScore for that exercise-session.
     */
    private readonly getCtxForExSession: (
      exSession: TExSession,
      ctx: StrengthScoreContext
    ) => StrengthScoreContext,
    /**
     * Raw exercise score for this exercise-session.
     * (e.g. mean of per-set e1RMs; can ignore ctx if not needed)
     */
    private readonly getExerciseScore: (
      exSession: TExSession,
      exSets: readonly TSet[],
      ctx: StrengthScoreContext
    ) => MaybeScore,
    private readonly getWeight?: (
      exSession: TExSession,
      exSets: readonly TSet[],
      ctx: StrengthScoreContext
    ) => number,
    private readonly clampRatio?: { lo: number; hi: number }
  ) {}

  scoreWorkoutSession(
    _session: TSession,
    exSessions: readonly TExSession[],
    sets: readonly TSet[],
    ctx: StrengthScoreContext
  ): MaybeScore {
    let wSum = 0;
    let logSum = 0;

    for (const exSession of exSessions) {
      const exSets = this.getSetsForExSession(exSession, sets);
      const exCtx = this.getCtxForExSession(exSession, ctx);

      const raw0 = this.getExerciseScore(exSession, exSets, exCtx);
      if (raw0 == null) continue;

      const base0 = exCtx.baselineExerciseStrengthScore;
      if (base0 == null) continue;

      const raw = Number(raw0);
      const base = Number(base0);
      if (!Number.isFinite(raw) || raw <= 0) continue;
      if (!Number.isFinite(base) || base <= 0) continue;

      let ratio = raw / base;
      if (!Number.isFinite(ratio) || ratio <= 0) continue;

      if (this.clampRatio) {
        const lo = Number(this.clampRatio.lo);
        const hi = Number(this.clampRatio.hi);
        if (Number.isFinite(lo) && Number.isFinite(hi) && lo > 0 && hi >= lo) {
          if (ratio < lo) ratio = lo;
          else if (ratio > hi) ratio = hi;
        }
      }

      const w0 = this.getWeight ? this.getWeight(exSession, exSets, exCtx) : 1;
      const w = Number(w0);
      if (!Number.isFinite(w) || w <= 0) continue;

      wSum += w;
      logSum += w * Math.log(ratio);
    }

    if (wSum <= 0) return null;

    const out = Math.exp(logSum / wSum);
    if (!Number.isFinite(out) || out <= 0) return null;
    return out;
  }

  /**
   * Optional second-layer normalization using ctx.baselineWorkoutStrengthScore:
   * final = rawSessionRatio / baselineWorkoutStrengthScore
   */
  normalize(raw: number, ctx: StrengthScoreContext): MaybeScore {
    if (!Number.isFinite(raw) || raw <= 0) return null;

    const baseline = ctx.baselineWorkoutStrengthScore;
    if (baseline == null) return null;

    const b = Number(baseline);
    if (!Number.isFinite(b) || b <= 0) return null;

    return raw / b;
  }
}
