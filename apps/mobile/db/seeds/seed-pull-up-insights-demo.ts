import {
  exercises,
  sessionExercises,
  sessionSets,
  workoutSessions,
} from "../schema";
import { exercisePeriodStatRepository } from "../../src/features/exercise-period-stats/data/repository";
import { exerciseStatRepository } from "../../src/features/exercise-stats/data/repository";

const PULL_UP_EXERCISE_ID = "45f61193-3907-46ba-8254-576e6325b54e";
const SEED_PREFIX = "seed-pull-up-insights";

type PullUpSeedSession = {
  daysAgo: number;
  loadKg: number;
  reps: [number, number, number];
  strengthScore: number;
};

const PULL_UP_SESSIONS: PullUpSeedSession[] = [
  { daysAgo: 84, loadKg: 80, reps: [5, 4, 4], strengthScore: 61.2 },
  { daysAgo: 70, loadKg: 80, reps: [6, 5, 4], strengthScore: 63.8 },
  { daysAgo: 56, loadKg: 81, reps: [6, 5, 5], strengthScore: 66.1 },
  { daysAgo: 42, loadKg: 82, reps: [7, 6, 5], strengthScore: 69.4 },
  { daysAgo: 28, loadKg: 82, reps: [8, 6, 6], strengthScore: 72.6 },
  { daysAgo: 14, loadKg: 83, reps: [8, 7, 6], strengthScore: 75.0 },
  { daysAgo: 7, loadKg: 84, reps: [9, 7, 6], strengthScore: 78.3 },
  { daysAgo: 2, loadKg: 84, reps: [10, 8, 7], strengthScore: 82.1 },
];

const DEMO_ANCHOR_DATE = new Date(2026, 6, 9, 9, 0);

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function getSeedDate(daysAgo: number) {
  const date = startOfLocalDay(DEMO_ANCHOR_DATE);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function getEstimatedMax(loadKg: number, reps: number) {
  return Number((loadKg * (1 + reps / 30)).toFixed(2));
}

async function upsertWorkoutSession(db: any, session: PullUpSeedSession, index: number) {
  const startedAt = getSeedDate(session.daysAgo);
  const endedAt = addMinutes(startedAt, 38);
  const nowIso = new Date().toISOString();
  const startedAtIso = startedAt.toISOString();
  const endedAtIso = endedAt.toISOString();
  const sessionId = `${SEED_PREFIX}-session-${index + 1}`;
  const sessionExerciseId = `${SEED_PREFIX}-exercise-${index + 1}`;
  const totalReps = session.reps.reduce((sum, reps) => sum + reps, 0);
  const bestE1rm = Math.max(
    ...session.reps.map((reps) => getEstimatedMax(session.loadKg, reps)),
  );

  await db
    .insert(workoutSessions)
    .values({
      id: sessionId,
      name: "Pull Up Demo",
      color: "purple",
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      status: "completed",
      sourceProgramId: null,
      note: "Seeded demo data for exercise insights.",
      strengthScore: session.strengthScore,
      strengthScoreVersion: 1,
      createdAt: startedAtIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: workoutSessions.id,
      set: {
        name: "Pull Up Demo",
        color: "purple",
        startedAt: startedAtIso,
        endedAt: endedAtIso,
        status: "completed",
        sourceProgramId: null,
        note: "Seeded demo data for exercise insights.",
        strengthScore: session.strengthScore,
        strengthScoreVersion: 1,
        updatedAt: nowIso,
      },
    });

  await db
    .insert(sessionExercises)
    .values({
      id: sessionExerciseId,
      workoutSessionId: sessionId,
      exerciseId: PULL_UP_EXERCISE_ID,
      exerciseProgramId: null,
      quantityUnit: "reps",
      exerciseName: "Pull Up",
      orderIndex: 0,
      note: `Demo session total: ${totalReps} reps`,
      strengthScore: session.strengthScore,
      strengthScoreVersion: 1,
      createdAt: startedAtIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: sessionExercises.id,
      set: {
        workoutSessionId: sessionId,
        exerciseId: PULL_UP_EXERCISE_ID,
        exerciseProgramId: null,
        quantityUnit: "reps",
        exerciseName: "Pull Up",
        orderIndex: 0,
        note: `Demo session total: ${totalReps} reps`,
        strengthScore: session.strengthScore,
        strengthScoreVersion: 1,
        updatedAt: nowIso,
      },
    });

  for (const [setIndex, reps] of session.reps.entries()) {
    const setId = `${SEED_PREFIX}-set-${index + 1}-${setIndex + 1}`;
    const e1rm = getEstimatedMax(session.loadKg, reps);

    await db
      .insert(sessionSets)
      .values({
        id: setId,
        sessionExerciseId,
        setProgramId: null,
        orderIndex: setIndex,
        targetQuantity: reps,
        restSeconds: 150,
        quantity: reps,
        loadUnit: "kg",
        loadValue: String(session.loadKg),
        rpe: setIndex === 0 ? 9 : 8,
        isCompleted: true,
        isWarmup: false,
        note: setIndex === 0 ? `Best e1RM ${bestE1rm} kg` : null,
        e1rm,
        e1rmVersion: 1,
        createdAt: startedAtIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: sessionSets.id,
        set: {
          sessionExerciseId,
          setProgramId: null,
          orderIndex: setIndex,
          targetQuantity: reps,
          restSeconds: 150,
          quantity: reps,
          loadUnit: "kg",
          loadValue: String(session.loadKg),
          rpe: setIndex === 0 ? 9 : 8,
          isCompleted: true,
          isWarmup: false,
          note: setIndex === 0 ? `Best e1RM ${bestE1rm} kg` : null,
          e1rm,
          e1rmVersion: 1,
          updatedAt: nowIso,
        },
      });
  }

  return sessionId;
}

export async function seedPullUpInsightsDemo(db: any) {
  const nowIso = new Date().toISOString();

  await db
    .insert(exercises)
    .values({
      id: PULL_UP_EXERCISE_ID,
      name: "Pull Up",
      quantityUnit: "reps",
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: exercises.id,
      set: {
        name: "Pull Up",
        quantityUnit: "reps",
        updatedAt: nowIso,
      },
    });

  const sessionIds: string[] = [];
  for (const [index, session] of PULL_UP_SESSIONS.entries()) {
    sessionIds.push(await upsertWorkoutSession(db, session, index));
  }

  await exerciseStatRepository.computeLifetimeStat();

  for (const sessionId of sessionIds) {
    await exercisePeriodStatRepository.upsertPeriodStat(sessionId, "week");
    await exercisePeriodStatRepository.upsertPeriodStat(sessionId, "month");
    await exercisePeriodStatRepository.upsertPeriodStat(sessionId, "year");
  }
}
