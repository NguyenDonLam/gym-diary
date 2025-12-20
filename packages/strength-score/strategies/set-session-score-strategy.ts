import { MaybeScore, StrengthScoreContext } from ".";

/**
 * Score a single set.
 */
export interface ISetScoreStrategy<TSet> {
  scoreSet(set: TSet, ctx: StrengthScoreContext): MaybeScore;
  normalize?(raw: number, ctx: StrengthScoreContext): MaybeScore;
}
