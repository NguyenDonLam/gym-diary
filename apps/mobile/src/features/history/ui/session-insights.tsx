import type { SessionWorkout } from "@/src/features/session-workout/domain/types";

export type SessionMetrics = {
  setCount: number;
  volume: number; // tonnage / load*reps sum (your chosen definition)
};

export type SessionInsights = {
  startLabel: string; // "07:45"
  durationLabel: string; // "45m" / "1h 05m" / "—"
  isCompleted: boolean;

  // absolute (still useful for tooltips / fallback)
  setCount: number;
  volumeLabel: string;

  // comparisons (the "progress" part)
  setDeltaPctLabel: string; // "▲12%" / "▼8%" / "—"
  volumeDeltaPctLabel: string; // "▲5%" / "▼3%" / "—"
};

export type SessionExtractors<
  TSession = SessionWorkout,
  TExercise = any,
  TSet = any,
> = {
  getStartedAt: (s: TSession) => Date;
  getEndedAt: (s: TSession) => Date | null | undefined;

  // return all exercises for the session
  getExercises: (s: TSession) => TExercise[];

  // return all sets for an exercise
  getSets: (ex: TExercise) => TSet[];

  // load + reps used to compute "volume"
  getLoad: (set: TSet) => number | null | undefined;
  getReps: (set: TSet) => number | null | undefined;

  // optional: exclude warmups etc
  isCountableSet?: (set: TSet) => boolean;
};

const minutesBetween = (start: Date | null, end: Date | null) => {
  if (!start || !end) return 0;
  const ms = Math.max(0, end.getTime() - start.getTime());
  return Math.round(ms / 60000);
};

const formatDurationTight = (mins: number) => {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

const formatTime = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const shortNumber = (n: number) => {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
};

const pctDeltaLabel = (curr: number, base: number) => {
  if (!isFinite(curr) || !isFinite(base)) return "—";
  if (base <= 0) {
    if (curr <= 0) return "—";
    return "▲"; // baseline 0 -> any progress
  }

  const pct = ((curr - base) / base) * 100;
  const abs = Math.round(Math.abs(pct));
  if (abs === 0) return "0%";
  return pct > 0 ? `▲${abs}%` : `▼${abs}%`;
};


export function computeSessionMetrics<TSession, TExercise, TSet>(
  session: TSession,
  ex: SessionExtractors<TSession, TExercise, TSet>
): SessionMetrics {
  const exercises = ex.getExercises(session) ?? [];

  let setCount = 0;
  let volume = 0;

  for (const e of exercises) {
    const sets = ex.getSets(e) ?? [];
    for (const s of sets) {
      if (ex.isCountableSet && !ex.isCountableSet(s)) continue;

      setCount += 1;

      const load = ex.getLoad(s);
      const reps = ex.getReps(s);

      const L = typeof load === "number" ? load : 0;
      const R = typeof reps === "number" ? reps : 0;

      if (!isFinite(L) || !isFinite(R) || L <= 0 || R <= 0) continue;
      volume += L * R;
    }
  }

  return { setCount, volume };
}

/**
 * baseline = the session you want to compare against (e.g. last session of same program)
 */
export function getSessionInsightsWithBaseline<TSession, TExercise, TSet>(
  session: TSession,
  baseline: TSession | null | undefined,
  ex: SessionExtractors<TSession, TExercise, TSet>
): SessionInsights {
  const startedAt = ex.getStartedAt(session);
  const endedAt = ex.getEndedAt(session) ?? null;

  const isCompleted = !!endedAt;

  const startLabel = formatTime(startedAt);
  const durationLabel = isCompleted
    ? formatDurationTight(minutesBetween(startedAt, endedAt))
    : "—";

  const curr = computeSessionMetrics(session, ex);
  const base = baseline ? computeSessionMetrics(baseline, ex) : null;

  const setDeltaPctLabel = base
    ? pctDeltaLabel(curr.setCount, base.setCount)
    : "—";
  const volumeDeltaPctLabel = base
    ? pctDeltaLabel(curr.volume, base.volume)
    : "—";

  return {
    startLabel,
    durationLabel,
    isCompleted,
    setCount: curr.setCount,
    volumeLabel: shortNumber(curr.volume),
    setDeltaPctLabel,
    volumeDeltaPctLabel,
  };
}
