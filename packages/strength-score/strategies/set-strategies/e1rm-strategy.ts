// packages/metrics/src/strength-score/strategies/set-e1rm-strength-score-strategy.ts

import type { MaybeScore, StrengthScoreContext } from "..";
import type { ISetScoreStrategy } from "../set-session-score-strategy";

/**
 * Absolute e1RM (piecewise by reps, no extra args).
 * - Low reps: Brzycki
 * - Mid reps: Epley
 * - High reps: Wathan (more stable for higher reps than linear)
 */
export class SetE1rmScoreStrategy<
  TSet,
> implements ISetScoreStrategy<TSet> {
  constructor(
    private readonly getLoad: (set: TSet) => number | null | undefined,
    private readonly getReps: (set: TSet) => number | null | undefined,
    private readonly getRir?: (set: TSet) => number | null | undefined
  ) {}

  scoreSet(set: TSet, _ctx: StrengthScoreContext): MaybeScore {
    const loadRaw = this.getLoad(set);
    const repsRaw = this.getReps(set);
    if (loadRaw == null || repsRaw == null) return null;

    const load = Number(loadRaw);
    const repsPerformed = Number(repsRaw);
    if (!Number.isFinite(load) || !Number.isFinite(repsPerformed)) return null;
    if (load <= 0 || repsPerformed <= 0) return null;

    let reps = repsPerformed;

    if (this.getRir) {
      const rirRaw = this.getRir(set);
      if (rirRaw != null) {
        const rir = Number(rirRaw);
        if (!Number.isFinite(rir) || rir < 0) return null;
        reps = repsPerformed + rir;
      }
    }

    let e1rm: number;

    if (reps <= 5) {
      // Brzycki: e1RM = load * 36 / (37 - reps)
      const denom = 37 - reps;
      if (denom <= 0) return null;
      e1rm = (load * 36) / denom;
    } else if (reps <= 10) {
      // Epley: e1RM = load * (1 + reps/30)
      e1rm = load * (1 + reps / 30);
    } else {
      // Wathan: 1RM = (100 * load) / (48.8 + 53.8 * e^(-0.075 * reps))
      const denom = 48.8 + 53.8 * Math.exp(-0.075 * reps);
      if (!Number.isFinite(denom) || denom <= 0) return null;
      e1rm = (100 * load) / denom;
    }

    if (!Number.isFinite(e1rm) || e1rm <= 0) return null;
    return e1rm;
  }

  /**
   * Normalize a raw e1RM against ctx.baselineSetE1rm.
   * - Returns ratio (raw / baseline).
   * - If baseline missing/invalid -> null.
   */
  normalize(raw: number, ctx: StrengthScoreContext): MaybeScore {
    if (!Number.isFinite(raw) || raw <= 0) return null;

    const baseline = ctx.baselineSetE1rm;
    if (baseline == null) return null;

    const b = Number(baseline);
    if (!Number.isFinite(b) || b <= 0) return null;

    return raw / b;
  }
}
