// packages/metrics/src/strength-score/strategies/exercise-session-aggregate-strength-score-strategy.ts

import type { MaybeScore, StrengthScoreContext } from "..";
import { IExerciseScoreStrategy } from "../exercise-session-score-strategy";

/**
 * Aggregates per-set strength scores (e.g., per-set e1RM) into a single
 * exercise-session strength score.
 *
 * This implementation uses the arithmetic mean across all "done" sets
 * with finite numeric scores.
 *
 * Design goals:
 * - Use all completed sets (not just best/median).
 * - Be robust to missing/invalid set scores (null / NaN / Infinity).
 * - Keep the strategy generic over the session and set types.
 */
export class ExerciseMeanScoreStrategy<
  TExSession,
  TSet,
> implements IExerciseScoreStrategy<TExSession, TSet> {
  /**
   * @param getSetScore Extracts the per-set score to aggregate (e.g., set e1RM).
   * @param isSetDone   Determines whether a set should be included (e.g., completed/not warmup).
   */
  constructor(
    private readonly getSetScore: (set: TSet) => MaybeScore,
    private readonly isSetDone: (set: TSet) => boolean
  ) {}

  /**
   * Computes the exercise-session score as the mean of all included set scores.
   *
   * Inclusion rules:
   * - set must be "done" according to isSetDone
   * - set score must be non-null and finite (excludes NaN/Infinity)
   *
   * Returns:
   * - null if no valid set scores exist
   * - otherwise mean(setScores)
   */
  scoreExerciseSession(
    _exSession: TExSession,
    sets: readonly TSet[],
    ctx: StrengthScoreContext
  ): MaybeScore {
    // Collect valid scores from sets we consider completed/eligible.
    const xs: number[] = [];

    for (const s of sets) {
      if (!this.isSetDone(s)) continue;

      const v = this.getSetScore(s);
      if (v == null) continue;
      if (!Number.isFinite(v)) continue;

      xs.push(v);
    }

    // No usable sets => no score.
    if (xs.length === 0) return null;

    // Mean aggregation:
    // - rewards consistency across sets
    // - penalizes big drop-offs (lower later sets reduce average)
    let sum = 0;
    for (let i = 0; i < xs.length; i++) sum += xs[i]!;
    return sum / xs.length;
  }

  /**
   * Normalizes a raw (unscaled) exercise-session score against a baseline.
   *
   * Output is a dimensionless ratio:
   *   normalized = raw / baseline
   *
   * Interpretation:
   * - 1.00  => equal to baseline
   * - 1.05  => 5% above baseline
   * - 0.95  => 5% below baseline
   *
   * Returns null if raw or baseline is missing or invalid (<= 0 or not finite).
   */
  normalize(raw: number, ctx: StrengthScoreContext): MaybeScore {
    if (!Number.isFinite(raw) || raw <= 0) return null;

    const baseline = ctx.baselineExerciseStrengthScore;
    if (baseline == null) return null;

    const b = Number(baseline);
    if (!Number.isFinite(b) || b <= 0) return null;

    return raw / b;
  }
}
