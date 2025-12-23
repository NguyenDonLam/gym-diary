// packages/metrics/src/strength-score/aggregate/strength-score-aggregate.ts

import type {
  ExerciseMeanScoreStrategy,
  MaybeScore,
  SetE1rmScoreStrategy,
  StrengthScoreContext,
  WorkoutNormalizedScoreStrategy,
} from "../strategies";
import type { ISetScoreStrategy } from "../strategies/set-session-score-strategy";
import type { IExerciseScoreStrategy } from "../strategies/exercise-session-score-strategy";
import type { IWorkoutScoreStrategy } from "../strategies/workout-session-score-strategy";
import { IStrengthScoreAggregate, StrengthScoreUpdate } from ".";

/**
 * ScoreAggregateV1
 *
 * Incremental aggregator that:
 * - Stores the current session's exercise-sessions and sets (in maps).
 * - Maintains indexes so it can quickly find all sets for an exercise-session.
 * - Computes and caches:
 *   - each set score
 *   - each exercise-session score (based on its sets)
 *   - the overall workout score (based on all exercises + sets)
 *
 * "Upsert" means: insert if missing, replace if present.
 *
 * Generics:
 * - TSetSession: your "set" shape for a session (e.g. reps/load/rpe/isCompleted/etc.)
 * - TExerciseSession: your "exercise entry" inside a session (e.g. exerciseId, order, name snapshot, etc.)
 * - TSession: the workout session object itself
 */
export class ScoreAggregateV1<
  TSetSession,
  TExerciseSession,
  TSession,
> implements IStrengthScoreAggregate<TSetSession, TExerciseSession, TSession> {
  static readonly VERSION = 1 as const;
  readonly version = ScoreAggregateV1.VERSION;
  readonly key = "strengthScore" as const;

  private readonly session: TSession;

  private readonly setStrategy: ISetScoreStrategy<TSetSession>;
  private readonly exerciseStrategy: IExerciseScoreStrategy<
    TExerciseSession,
    TSetSession
  >;
  private readonly workoutStrategy: IWorkoutScoreStrategy<
    TSession,
    TExerciseSession,
    TSetSession
  >;

  private readonly getSetId: (set: TSetSession) => string;
  private readonly getSetExerciseSessionId: (set: TSetSession) => string;
  private readonly getExerciseSessionId: (ex: TExerciseSession) => string;

  // --------------------
  // Stored state (the "database" inside this aggregate)
  // --------------------

  private readonly exerciseSessionsById = new Map<string, TExerciseSession>();
  private readonly setsById = new Map<string, TSetSession>();
  private readonly setIdsByExerciseSessionId = new Map<string, Set<string>>();

  // --------------------
  // Cached scores (computed values)
  // --------------------
  private readonly lookupSetScore = new Map<string, MaybeScore>();
  private readonly lookupExerciseScore = new Map<string, MaybeScore>();
  private workoutScore: MaybeScore = null;

  // --------------------
  // Context tracking
  // --------------------

  /**
   * lastCtx:
   * Last context seen in any upsertSet call.
   * Useful because some strategies need extra info (units, bodyweight, etc.).
   * Also used as fallback when we need a ctx but none is directly provided.
   */
  private lastCtx: StrengthScoreContext | null = null;
  private readonly ctxBySetId = new Map<string, StrengthScoreContext>();

  constructor(args: {
    session: TSession;

    // Concrete strategies the caller chooses (scoring only).
    setStrategy: SetE1rmScoreStrategy<TSetSession>;
    exerciseStrategy: ExerciseMeanScoreStrategy<TExerciseSession, TSetSession>;
    workoutStrategy: WorkoutNormalizedScoreStrategy<
      TSession,
      TExerciseSession,
      TSetSession
    >;

    // Data extractors (NOT strategies).
    getExerciseSessions: (session: TSession) => readonly TExerciseSession[];
    getSets: (session: TSession) => readonly TSetSession[];

    // ID extractors.
    getSetId: (set: TSetSession) => string;
    getSetExerciseSessionId: (set: TSetSession) => string;
    getExerciseSessionId: (ex: TExerciseSession) => string;
  }) {
    this.session = args.session;

    this.setStrategy = args.setStrategy;
    this.exerciseStrategy = args.exerciseStrategy;
    this.workoutStrategy = args.workoutStrategy;

    this.getSetId = args.getSetId;
    this.getSetExerciseSessionId = args.getSetExerciseSessionId;
    this.getExerciseSessionId = args.getExerciseSessionId;

    const exerciseSessions = args.getExerciseSessions(this.session) ?? [];
    const sets = args.getSets(this.session) ?? [];

    for (const ex of exerciseSessions) {
      const exId = this.getExerciseSessionId(ex);
      this.exerciseSessionsById.set(exId, ex);
      if (!this.setIdsByExerciseSessionId.has(exId)) {
        this.setIdsByExerciseSessionId.set(exId, new Set<string>());
      }
    }

    for (const s of sets) {
      const setId = this.getSetId(s);
      this.setsById.set(setId, s);

      const exId = this.getSetExerciseSessionId(s);
      let bucket = this.setIdsByExerciseSessionId.get(exId);
      if (!bucket) {
        bucket = new Set<string>();
        this.setIdsByExerciseSessionId.set(exId, bucket);
      }
      bucket.add(setId);
    }
  }

  upsertExerciseSession(ex: TExerciseSession): void {
    const exId = this.getExerciseSessionId(ex);
    this.exerciseSessionsById.set(exId, ex);

    // recompute this exercise score if it already has sets
    this.recomputeExerciseScore(exId);

    // recompute workout score (uses cached exercise scores implicitly via strategy inputs)
    this.recomputeWorkoutScore(this.lastCtx ?? {});
  }

  upsertSet(set: TSetSession, ctx: StrengthScoreContext): StrengthScoreUpdate {
    const setId = this.getSetId(set);
    const exId = this.getSetExerciseSessionId(set);

    // store
    this.setsById.set(setId, set);
    this.ctxBySetId.set(setId, ctx);
    this.lastCtx = ctx;

    // index set -> exercise session
    let bucket = this.setIdsByExerciseSessionId.get(exId);
    if (!bucket) {
      bucket = new Set<string>();
      this.setIdsByExerciseSessionId.set(exId, bucket);
    }
    bucket.add(setId);

    // score set
    const setScore = this.setStrategy.scoreSet(set, ctx);
    this.lookupSetScore.set(setId, setScore);

    // score exercise session
    const exerciseScore = this.recomputeExerciseScore(exId);
    // score workout session
    const workoutScore = this.recomputeWorkoutScore(ctx);
    this.workoutScore = workoutScore;

    return {
      setId,
      setScore,
      exerciseSessionId: exId,
      exerciseScore,
      workoutScore,
    };
  }

  removeSet(
    setId: string,
    ctxForSet: (set: TSetSession) => StrengthScoreContext
  ): StrengthScoreUpdate | null {
    const set = this.setsById.get(setId);
    if (!set) return null;

    const exId = this.getSetExerciseSessionId(set);

    // ctx to use for downstream recompute
    const ctx =
      this.ctxBySetId.get(setId) ??
      ((): StrengthScoreContext => {
        const c = ctxForSet(set);
        return c ?? {};
      })();

    // remove stored state
    this.setsById.delete(setId);
    this.lookupSetScore.delete(setId);
    this.ctxBySetId.delete(setId);

    const bucket = this.setIdsByExerciseSessionId.get(exId);
    if (bucket) {
      bucket.delete(setId);
      if (bucket.size === 0) this.setIdsByExerciseSessionId.delete(exId);
    }

    // recompute exercise + workout
    const exerciseScore = this.recomputeExerciseScore(exId);
    const workoutScore = this.recomputeWorkoutScore(this.lastCtx ?? ctx);

    return {
      setId,
      setScore: null,
      exerciseSessionId: exId,
      exerciseScore,
      workoutScore,
    };
  }

  getSetScore(setId: string): MaybeScore | undefined {
    return this.lookupSetScore.get(setId);
  }

  getExerciseScore(exerciseSessionId: string): MaybeScore | undefined {
    return this.lookupExerciseScore.get(exerciseSessionId);
  }

  getWorkoutScore(): MaybeScore {
    return this.workoutScore;
  }

  private recomputeExerciseScore(exerciseSessionId: string): MaybeScore {
    const ex = this.exerciseSessionsById.get(exerciseSessionId);
    if (!ex) {
      this.lookupExerciseScore.set(exerciseSessionId, null);
      return null;
    }

    const exSets = this.getSetsForExerciseSession(exerciseSessionId);

    // choose a ctx: prefer any set ctx from this exercise session, else lastCtx, else {}
    const ctx = this.pickCtxForExerciseSession(exerciseSessionId);

    const score = this.exerciseStrategy.scoreExerciseSession(ex, exSets, ctx);
    
    this.lookupExerciseScore.set(exerciseSessionId, score);
    return score;
  }

  private recomputeWorkoutScore(ctx: StrengthScoreContext): MaybeScore {
    const exSessions = Array.from(this.exerciseSessionsById.values());
    const sets = Array.from(this.setsById.values());

    const score = this.workoutStrategy.scoreWorkoutSession(
      this.session,
      exSessions,
      sets,
      ctx
    );

    this.workoutScore = score;
    return score;
  }

  private getSetsForExerciseSession(exerciseSessionId: string): TSetSession[] {
    const bucket = this.setIdsByExerciseSessionId.get(exerciseSessionId);
    if (!bucket || bucket.size === 0) return [];

    const out: TSetSession[] = [];
    for (const id of bucket) {
      const s = this.setsById.get(id);
      if (s) out.push(s);
    }
    return out;
  }

  private pickCtxForExerciseSession(
    exerciseSessionId: string
  ): StrengthScoreContext {
    const bucket = this.setIdsByExerciseSessionId.get(exerciseSessionId);
    if (bucket) {
      for (const id of bucket) {
        const c = this.ctxBySetId.get(id);
        if (c) return c;
      }
    }
    return this.lastCtx ?? {};
  }
}
