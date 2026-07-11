import { eq, inArray } from "drizzle-orm";

import {
  exercisePrograms,
  sessionExercises,
  sessionSets,
  setPrograms,
  workoutPrograms,
  workoutSessions,
} from "../schema";
import { programPeriodStatRepository } from "../../src/features/program-period-stats/data/repository";
import { programStatRepository } from "../../src/features/program-stats/data/repository";

const ANTERIOR_PROGRAM_NAME = "Anterior";
const SEED_PREFIX = "seed-anterior-program-demo";
const DEMO_PROGRAM_ID = `${SEED_PREFIX}-program`;
const DEMO_ANCHOR_DATE = new Date(2026, 6, 9, 18, 0);

type ProgramExerciseSeed = {
  id: string;
  exerciseId: string;
  quantityUnit: "reps" | "time";
  exerciseName: string | null;
  orderIndex: number;
};

type ProgramSetSeed = {
  id: string | null;
  exerciseProgramId: string;
  orderIndex: number;
  targetQuantity: number | null;
  restSeconds: number;
  loadUnit: "kg" | "lb" | "band" | "custom";
  loadValue: string | null;
  targetRpe: number | null;
};

type AnteriorSeedSession = {
  daysAgo: number;
  loadBumpKg: number;
  repBump: number;
  strengthScore: number;
};

const DEMO_EXERCISES: ProgramExerciseSeed[] = [
  {
    id: `${SEED_PREFIX}-exercise-bench`,
    exerciseId: "ff111111-2222-4333-8444-555566667006",
    quantityUnit: "reps",
    exerciseName: "Barbell Bench Press",
    orderIndex: 0,
  },
  {
    id: `${SEED_PREFIX}-exercise-shoulder-press`,
    exerciseId: "1a2b3c4d-5e6f-4789-9a0b-1c2d3e4f0007",
    quantityUnit: "reps",
    exerciseName: "Dumbbell Shoulder Press",
    orderIndex: 1,
  },
  {
    id: `${SEED_PREFIX}-exercise-leg-press`,
    exerciseId: "7ccc0a37-be27-4925-bc5b-79324946085b",
    quantityUnit: "reps",
    exerciseName: "Machine Leg Press",
    orderIndex: 2,
  },
];

const DEMO_SETS: ProgramSetSeed[] = [
  {
    id: `${SEED_PREFIX}-set-bench-1`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-bench`,
    orderIndex: 0,
    targetQuantity: 8,
    restSeconds: 150,
    loadUnit: "kg",
    loadValue: "70",
    targetRpe: 8,
  },
  {
    id: `${SEED_PREFIX}-set-bench-2`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-bench`,
    orderIndex: 1,
    targetQuantity: 8,
    restSeconds: 150,
    loadUnit: "kg",
    loadValue: "70",
    targetRpe: 8,
  },
  {
    id: `${SEED_PREFIX}-set-shoulder-1`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-shoulder-press`,
    orderIndex: 0,
    targetQuantity: 10,
    restSeconds: 120,
    loadUnit: "kg",
    loadValue: "22",
    targetRpe: 8,
  },
  {
    id: `${SEED_PREFIX}-set-shoulder-2`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-shoulder-press`,
    orderIndex: 1,
    targetQuantity: 10,
    restSeconds: 120,
    loadUnit: "kg",
    loadValue: "22",
    targetRpe: 8,
  },
  {
    id: `${SEED_PREFIX}-set-leg-1`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-leg-press`,
    orderIndex: 0,
    targetQuantity: 12,
    restSeconds: 150,
    loadUnit: "kg",
    loadValue: "160",
    targetRpe: 8,
  },
  {
    id: `${SEED_PREFIX}-set-leg-2`,
    exerciseProgramId: `${SEED_PREFIX}-exercise-leg-press`,
    orderIndex: 1,
    targetQuantity: 12,
    restSeconds: 150,
    loadUnit: "kg",
    loadValue: "160",
    targetRpe: 8,
  },
];

const ANTERIOR_SESSIONS: AnteriorSeedSession[] = [
  { daysAgo: 91, loadBumpKg: 0, repBump: 0, strengthScore: 120 },
  { daysAgo: 77, loadBumpKg: 1.25, repBump: 0, strengthScore: 123 },
  { daysAgo: 63, loadBumpKg: 2.5, repBump: 1, strengthScore: 128 },
  { daysAgo: 49, loadBumpKg: 3.75, repBump: 1, strengthScore: 132 },
  { daysAgo: 35, loadBumpKg: 5, repBump: 1, strengthScore: 137 },
  { daysAgo: 21, loadBumpKg: 6.25, repBump: 2, strengthScore: 141 },
  { daysAgo: 7, loadBumpKg: 7.5, repBump: 2, strengthScore: 146 },
];

function getSeedDate(daysAgo: number) {
  const date = new Date(DEMO_ANCHOR_DATE);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function parsePositiveNumber(value: string | null | undefined) {
  const parsed = Number.parseFloat((value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getSessionLoadValue(set: ProgramSetSeed, loadBumpKg: number) {
  const baseLoad = parsePositiveNumber(set.loadValue);
  if (baseLoad == null || (set.loadUnit !== "kg" && set.loadUnit !== "lb")) {
    return set.loadValue;
  }

  const nextLoad = set.loadUnit === "kg" ? baseLoad + loadBumpKg : baseLoad;
  return nextLoad.toFixed(2).replace(/\.?0+$/, "");
}

function getSessionQuantity(set: ProgramSetSeed, repBump: number) {
  const target = set.targetQuantity ?? 8;
  return Math.max(1, target + repBump);
}

function getEstimatedMax(loadValue: string | null, reps: number) {
  const load = parsePositiveNumber(loadValue);
  if (load == null) return null;
  return Number((load * (1 + reps / 30)).toFixed(2));
}

async function findOrCreateAnteriorProgram(db: any) {
  const existing = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(eq(workoutPrograms.name, ANTERIOR_PROGRAM_NAME))
    .limit(1);

  if (existing[0]?.id) return existing[0].id as string;

  const nowIso = new Date().toISOString();

  await db
    .insert(workoutPrograms)
    .values({
      id: DEMO_PROGRAM_ID,
      name: ANTERIOR_PROGRAM_NAME,
      folderId: null,
      color: "red",
      description: "Seeded demo program for program insights.",
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: workoutPrograms.id,
      set: {
        name: ANTERIOR_PROGRAM_NAME,
        color: "red",
        description: "Seeded demo program for program insights.",
        updatedAt: nowIso,
      },
    });

  for (const exercise of DEMO_EXERCISES) {
    await db
      .insert(exercisePrograms)
      .values({
        id: exercise.id,
        workoutProgramId: DEMO_PROGRAM_ID,
        quantityUnit: exercise.quantityUnit,
        exerciseId: exercise.exerciseId,
        orderIndex: exercise.orderIndex,
        note: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: exercisePrograms.id,
        set: {
          workoutProgramId: DEMO_PROGRAM_ID,
          quantityUnit: exercise.quantityUnit,
          exerciseId: exercise.exerciseId,
          orderIndex: exercise.orderIndex,
          note: null,
          updatedAt: nowIso,
        },
      });
  }

  for (const set of DEMO_SETS) {
    await db
      .insert(setPrograms)
      .values({
        id: set.id,
        exerciseProgramId: set.exerciseProgramId,
        orderIndex: set.orderIndex,
        targetQuantity: set.targetQuantity,
        restSeconds: set.restSeconds,
        loadUnit: set.loadUnit,
        loadValue: set.loadValue,
        targetRpe: set.targetRpe,
        note: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: setPrograms.id,
        set: {
          exerciseProgramId: set.exerciseProgramId,
          orderIndex: set.orderIndex,
          targetQuantity: set.targetQuantity,
          restSeconds: set.restSeconds,
          loadUnit: set.loadUnit,
          loadValue: set.loadValue,
          targetRpe: set.targetRpe,
          note: null,
          updatedAt: nowIso,
        },
      });
  }

  return DEMO_PROGRAM_ID;
}

async function getProgramWorkoutShape(db: any, programId: string) {
  const exerciseRowsRaw = (await db
    .select({
      id: exercisePrograms.id,
      exerciseId: exercisePrograms.exerciseId,
      quantityUnit: exercisePrograms.quantityUnit,
      orderIndex: exercisePrograms.orderIndex,
    })
    .from(exercisePrograms)
    .where(eq(exercisePrograms.workoutProgramId, programId))) as Omit<
    ProgramExerciseSeed,
    "exerciseName"
  >[];

  const exerciseRows: ProgramExerciseSeed[] = exerciseRowsRaw.map((row) => ({
    ...row,
    exerciseName: null,
  }));

  const orderedExercises = exerciseRows
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (orderedExercises.length === 0) {
    return {
      exercises: DEMO_EXERCISES,
      sets: DEMO_SETS,
    };
  }

  const exerciseIds = orderedExercises.map((exercise) => exercise.id);
  const setRows = exerciseIds.length
    ? ((await db
        .select({
          id: setPrograms.id,
          exerciseProgramId: setPrograms.exerciseProgramId,
          orderIndex: setPrograms.orderIndex,
          targetQuantity: setPrograms.targetQuantity,
          restSeconds: setPrograms.restSeconds,
          loadUnit: setPrograms.loadUnit,
          loadValue: setPrograms.loadValue,
          targetRpe: setPrograms.targetRpe,
        })
        .from(setPrograms)
        .where(inArray(setPrograms.exerciseProgramId, exerciseIds))) as ProgramSetSeed[])
    : [];

  return {
    exercises: orderedExercises,
    sets: setRows,
  };
}

async function upsertAnteriorSession(
  db: any,
  programId: string,
  exercises: ProgramExerciseSeed[],
  sets: ProgramSetSeed[],
  session: AnteriorSeedSession,
  index: number,
) {
  const startedAt = getSeedDate(session.daysAgo);
  const endedAt = addMinutes(startedAt, 58);
  const nowIso = new Date().toISOString();
  const startedAtIso = startedAt.toISOString();
  const endedAtIso = endedAt.toISOString();
  const sessionId = `${SEED_PREFIX}-session-${index + 1}`;

  await db
    .insert(workoutSessions)
    .values({
      id: sessionId,
      name: ANTERIOR_PROGRAM_NAME,
      color: "red",
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      status: "completed",
      sourceProgramId: programId,
      note: "Seeded demo data for program insights.",
      strengthScore: session.strengthScore,
      strengthScoreVersion: 1,
      createdAt: startedAtIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: workoutSessions.id,
      set: {
        name: ANTERIOR_PROGRAM_NAME,
        color: "red",
        startedAt: startedAtIso,
        endedAt: endedAtIso,
        status: "completed",
        sourceProgramId: programId,
        note: "Seeded demo data for program insights.",
        strengthScore: session.strengthScore,
        strengthScoreVersion: 1,
        updatedAt: nowIso,
      },
    });

  for (const exercise of exercises.slice(0, 5)) {
    const sessionExerciseId = `${SEED_PREFIX}-session-${index + 1}-exercise-${exercise.id}`;

    await db
      .insert(sessionExercises)
      .values({
        id: sessionExerciseId,
        workoutSessionId: sessionId,
        exerciseId: exercise.exerciseId,
        exerciseProgramId: exercise.id,
        quantityUnit: exercise.quantityUnit,
        exerciseName: exercise.exerciseName,
        orderIndex: exercise.orderIndex,
        note: null,
        strengthScore: session.strengthScore,
        strengthScoreVersion: 1,
        createdAt: startedAtIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: sessionExercises.id,
        set: {
          workoutSessionId: sessionId,
          exerciseId: exercise.exerciseId,
          exerciseProgramId: exercise.id,
          quantityUnit: exercise.quantityUnit,
          exerciseName: exercise.exerciseName,
          orderIndex: exercise.orderIndex,
          note: null,
          strengthScore: session.strengthScore,
          strengthScoreVersion: 1,
          updatedAt: nowIso,
        },
      });

    const exerciseSets = sets
      .filter((set) => set.exerciseProgramId === exercise.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const sourceSets =
      exerciseSets.length > 0
        ? exerciseSets.slice(0, 3)
        : DEMO_SETS.slice(0, 2).map((set, fallbackIndex) => ({
            ...set,
            id: null,
            exerciseProgramId: exercise.id,
            orderIndex: fallbackIndex,
          }));

    for (const set of sourceSets) {
      const setId = `${SEED_PREFIX}-session-${index + 1}-set-${exercise.id}-${set.orderIndex}`;
      const quantity = getSessionQuantity(set, session.repBump);
      const loadValue = getSessionLoadValue(set, session.loadBumpKg);
      const e1rm =
        set.loadUnit === "kg" || set.loadUnit === "lb"
          ? getEstimatedMax(loadValue, quantity)
          : null;

      await db
        .insert(sessionSets)
        .values({
          id: setId,
          sessionExerciseId,
          setProgramId: set.id,
          orderIndex: set.orderIndex,
          targetQuantity: set.targetQuantity,
          restSeconds: set.restSeconds,
          quantity,
          loadUnit: set.loadUnit,
          loadValue,
          rpe: set.targetRpe ?? 8,
          isCompleted: true,
          isWarmup: false,
          note: null,
          e1rm,
          e1rmVersion: 1,
          createdAt: startedAtIso,
          updatedAt: nowIso,
        })
        .onConflictDoUpdate({
          target: sessionSets.id,
          set: {
            sessionExerciseId,
            setProgramId: set.id,
            orderIndex: set.orderIndex,
            targetQuantity: set.targetQuantity,
            restSeconds: set.restSeconds,
            quantity,
            loadUnit: set.loadUnit,
            loadValue,
            rpe: set.targetRpe ?? 8,
            isCompleted: true,
            isWarmup: false,
            note: null,
            e1rm,
            e1rmVersion: 1,
            updatedAt: nowIso,
          },
        });
    }
  }

  return sessionId;
}

export async function seedAnteriorProgramDemo(db: any) {
  const programId = await findOrCreateAnteriorProgram(db);
  const { exercises, sets } = await getProgramWorkoutShape(db, programId);

  const sessionIds: string[] = [];
  for (const [index, session] of ANTERIOR_SESSIONS.entries()) {
    sessionIds.push(
      await upsertAnteriorSession(
        db,
        programId,
        exercises,
        sets,
        session,
        index,
      ),
    );
  }

  await programStatRepository.computeLifetimeStat();

  for (const sessionId of sessionIds) {
    await programPeriodStatRepository.upsertPeriodStat(sessionId, "week");
    await programPeriodStatRepository.upsertPeriodStat(sessionId, "month");
    await programPeriodStatRepository.upsertPeriodStat(sessionId, "year");
  }
}
