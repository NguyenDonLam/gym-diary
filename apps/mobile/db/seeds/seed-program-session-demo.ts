import { eq, inArray } from "drizzle-orm";

import type { LoadUnit, ProgramColor, QuantityUnit } from "../enums";
import {
  exercisePrograms,
  exercises as exerciseTable,
  sessionExercises,
  sessionSets,
  setPrograms,
  workoutPrograms,
  workoutSessions,
} from "../schema";
import { exercisePeriodStatRepository } from "../../src/features/exercise-period-stats/data/repository";
import { exerciseStatRepository } from "../../src/features/exercise-stats/data/repository";
import { programPeriodStatRepository } from "../../src/features/program-period-stats/data/repository";
import { programStatRepository } from "../../src/features/program-stats/data/repository";

const SEED_PREFIX = "seed-program-session-demo";
const PERIOD_TYPES_TO_REFRESH = ["week", "month", "year"] as const;

type ProgramSetSeed = {
  id: string | null;
  exerciseProgramId: string;
  orderIndex: number;
  targetQuantity: number | null;
  restSeconds: number;
  loadUnit: LoadUnit;
  loadValue: string | null;
  targetRpe: number | null;
};

type ProgramExerciseSeed = {
  id: string;
  exerciseId: string;
  quantityUnit: QuantityUnit;
  exerciseName: string | null;
  orderIndex: number;
};

type DemoSetSpec = {
  targetQuantity: number;
  restSeconds: number;
  loadUnit: LoadUnit;
  loadValue: string | null;
  targetRpe: number;
};

type DemoExerciseSpec = {
  slug: string;
  exerciseId: string;
  exerciseName: string;
  quantityUnit?: QuantityUnit;
  sets: DemoSetSpec[];
};

type DemoProgramSpec = {
  slug: string;
  name: string;
  color: ProgramColor;
  description: string;
  baseStrengthScore: number;
  weeklyLoadIncreaseKg: number;
  exercises: DemoExerciseSpec[];
};

const DEMO_PROGRAMS: DemoProgramSpec[] = [
  {
    slug: "anterior",
    name: "Anterior",
    color: "orange",
    description: "Demo anterior chain day.",
    baseStrengthScore: 128,
    weeklyLoadIncreaseKg: 1.25,
    exercises: [
      {
        slug: "bench",
        exerciseId: "ff111111-2222-4333-8444-555566667006",
        exerciseName: "Barbell Bench Press",
        sets: [
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "72.5", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "72.5", targetRpe: 8 },
          { targetQuantity: 7, restSeconds: 150, loadUnit: "kg", loadValue: "75", targetRpe: 8.5 },
        ],
      },
      {
        slug: "shoulder-press",
        exerciseId: "01111111-2222-4333-8444-555566667008",
        exerciseName: "Barbell Overhead Press",
        sets: [
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "42.5", targetRpe: 8 },
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "42.5", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 120, loadUnit: "kg", loadValue: "37.5", targetRpe: 8 },
        ],
      },
      {
        slug: "leg-press",
        exerciseId: "7ccc0a37-be27-4925-bc5b-79324946085b",
        exerciseName: "Machine Leg Press",
        sets: [
          { targetQuantity: 12, restSeconds: 150, loadUnit: "kg", loadValue: "165", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 150, loadUnit: "kg", loadValue: "165", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 150, loadUnit: "kg", loadValue: "175", targetRpe: 8.5 },
        ],
      },
      {
        slug: "dip",
        exerciseId: "9d823524-e840-40a3-bb95-9805c22702f4",
        exerciseName: "Dip",
        sets: [
          { targetQuantity: 9, restSeconds: 120, loadUnit: "kg", loadValue: "82", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 120, loadUnit: "kg", loadValue: "82", targetRpe: 8 },
          { targetQuantity: 7, restSeconds: 120, loadUnit: "kg", loadValue: "82", targetRpe: 8.5 },
        ],
      },
    ],
  },
  {
    slug: "posterior",
    name: "Posterior",
    color: "green",
    description: "Demo posterior chain day.",
    baseStrengthScore: 132,
    weeklyLoadIncreaseKg: 2.5,
    exercises: [
      {
        slug: "deadlift",
        exerciseId: "cc111111-2222-4333-8444-555566667003",
        exerciseName: "Barbell Deadlift",
        sets: [
          { targetQuantity: 5, restSeconds: 180, loadUnit: "kg", loadValue: "130", targetRpe: 8 },
          { targetQuantity: 5, restSeconds: 180, loadUnit: "kg", loadValue: "130", targetRpe: 8 },
          { targetQuantity: 4, restSeconds: 180, loadUnit: "kg", loadValue: "137.5", targetRpe: 8.5 },
        ],
      },
      {
        slug: "pull-up",
        exerciseId: "45f61193-3907-46ba-8254-576e6325b54e",
        exerciseName: "Pull Up",
        sets: [
          { targetQuantity: 7, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8 },
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8 },
          { targetQuantity: 5, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8.5 },
        ],
      },
      {
        slug: "row",
        exerciseId: "03111111-2222-4333-8444-55556666700a",
        exerciseName: "Barbell Bent Over Row",
        sets: [
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "72.5", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "72.5", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "65", targetRpe: 8 },
        ],
      },
      {
        slug: "rear-delt",
        exerciseId: "4d5e6f70-8192-4a39-8c3d-4e5f6a7b000a",
        exerciseName: "Dumbbell Rear Delt Raise",
        sets: [
          { targetQuantity: 14, restSeconds: 90, loadUnit: "kg", loadValue: "10", targetRpe: 8 },
          { targetQuantity: 14, restSeconds: 90, loadUnit: "kg", loadValue: "10", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "12", targetRpe: 8.5 },
        ],
      },
    ],
  },
  {
    slug: "push",
    name: "Push",
    color: "red",
    description: "Demo push day for PPL.",
    baseStrengthScore: 124,
    weeklyLoadIncreaseKg: 1.25,
    exercises: [
      {
        slug: "incline-bench",
        exerciseId: "5f2a1b3e-7d6a-4f21-9f3c-8c2e9d1a0002",
        exerciseName: "Dumbbell Incline Bench Press",
        sets: [
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "28", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "28", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 120, loadUnit: "kg", loadValue: "30", targetRpe: 8.5 },
        ],
      },
      {
        slug: "overhead-press",
        exerciseId: "01111111-2222-4333-8444-555566667008",
        exerciseName: "Barbell Overhead Press",
        sets: [
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "40", targetRpe: 8 },
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "40", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 120, loadUnit: "kg", loadValue: "35", targetRpe: 8 },
        ],
      },
      {
        slug: "lateral-raise",
        exerciseId: "2b3c4d5e-6f70-4819-8a1b-2c3d4e5f0008",
        exerciseName: "Dumbbell Lateral Raise",
        sets: [
          { targetQuantity: 15, restSeconds: 75, loadUnit: "kg", loadValue: "9", targetRpe: 8 },
          { targetQuantity: 15, restSeconds: 75, loadUnit: "kg", loadValue: "9", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 75, loadUnit: "kg", loadValue: "10", targetRpe: 8.5 },
        ],
      },
      {
        slug: "skull-crusher",
        exerciseId: "8192a3b4-c5d6-4e79-8a7b-8c9d0e1f000e",
        exerciseName: "Dumbbell Skull Crusher",
        sets: [
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "14", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "14", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 90, loadUnit: "kg", loadValue: "16", targetRpe: 8.5 },
        ],
      },
    ],
  },
  {
    slug: "pull",
    name: "Pull",
    color: "blue",
    description: "Demo pull day for PPL.",
    baseStrengthScore: 126,
    weeklyLoadIncreaseKg: 1.75,
    exercises: [
      {
        slug: "pull-up",
        exerciseId: "45f61193-3907-46ba-8254-576e6325b54e",
        exerciseName: "Pull Up",
        sets: [
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8 },
          { targetQuantity: 7, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8 },
          { targetQuantity: 6, restSeconds: 150, loadUnit: "kg", loadValue: "84", targetRpe: 8.5 },
        ],
      },
      {
        slug: "lat-pulldown",
        exerciseId: "eaad35b3-5424-4e48-aa65-79d0590e8f42",
        exerciseName: "Cable Lat Pulldown",
        sets: [
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "66", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "66", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 120, loadUnit: "kg", loadValue: "70", targetRpe: 8.5 },
        ],
      },
      {
        slug: "seated-row",
        exerciseId: "d308d2e9-efbc-4e2c-8d75-458efe974ca1",
        exerciseName: "Cable Seated Row",
        sets: [
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "62", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 120, loadUnit: "kg", loadValue: "62", targetRpe: 8 },
          { targetQuantity: 9, restSeconds: 120, loadUnit: "kg", loadValue: "66", targetRpe: 8.5 },
        ],
      },
      {
        slug: "hammer-curl",
        exerciseId: "6f708192-a3b4-4c59-8e5f-6a7b8c9d000c",
        exerciseName: "Dumbbell Hammer Curl",
        sets: [
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "18", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "18", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 90, loadUnit: "kg", loadValue: "20", targetRpe: 8.5 },
        ],
      },
    ],
  },
  {
    slug: "legs",
    name: "Legs",
    color: "purple",
    description: "Demo legs day for PPL.",
    baseStrengthScore: 130,
    weeklyLoadIncreaseKg: 2.5,
    exercises: [
      {
        slug: "back-squat",
        exerciseId: "aa111111-2222-4333-8444-555566667001",
        exerciseName: "Barbell Back Squat",
        sets: [
          { targetQuantity: 6, restSeconds: 180, loadUnit: "kg", loadValue: "105", targetRpe: 8 },
          { targetQuantity: 6, restSeconds: 180, loadUnit: "kg", loadValue: "105", targetRpe: 8 },
          { targetQuantity: 5, restSeconds: 180, loadUnit: "kg", loadValue: "112.5", targetRpe: 8.5 },
        ],
      },
      {
        slug: "rdl",
        exerciseId: "dd111111-2222-4333-8444-555566667004",
        exerciseName: "Barbell Romanian Deadlift",
        sets: [
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "92.5", targetRpe: 8 },
          { targetQuantity: 8, restSeconds: 150, loadUnit: "kg", loadValue: "92.5", targetRpe: 8 },
          { targetQuantity: 7, restSeconds: 150, loadUnit: "kg", loadValue: "97.5", targetRpe: 8.5 },
        ],
      },
      {
        slug: "leg-extension",
        exerciseId: "9f4efaf3-6768-4565-a6e2-36f2fd085ee1",
        exerciseName: "Machine Leg Extension",
        sets: [
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "58", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "58", targetRpe: 8 },
          { targetQuantity: 10, restSeconds: 90, loadUnit: "kg", loadValue: "62", targetRpe: 8.5 },
        ],
      },
      {
        slug: "calf-raise",
        exerciseId: "111b9f3d-14c1-4d2c-811b-86b4b9b1426c",
        exerciseName: "Machine Standing Calf Raise",
        sets: [
          { targetQuantity: 14, restSeconds: 90, loadUnit: "kg", loadValue: "80", targetRpe: 8 },
          { targetQuantity: 14, restSeconds: 90, loadUnit: "kg", loadValue: "80", targetRpe: 8 },
          { targetQuantity: 12, restSeconds: 90, loadUnit: "kg", loadValue: "85", targetRpe: 8.5 },
        ],
      },
    ],
  },
];

function getProgramId(program: DemoProgramSpec) {
  return `${SEED_PREFIX}-program-${program.slug}`;
}

function getProgramExerciseId(program: DemoProgramSpec, exercise: DemoExerciseSpec) {
  return `${SEED_PREFIX}-${program.slug}-exercise-${exercise.slug}`;
}

function getProgramSetId(
  program: DemoProgramSpec,
  exercise: DemoExerciseSpec,
  setIndex: number,
) {
  return `${SEED_PREFIX}-${program.slug}-set-${exercise.slug}-${setIndex + 1}`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getMostRecentMonday(date: Date) {
  const monday = startOfLocalDay(date);
  const diffToMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - diffToMonday);
  return monday;
}

function getLastCompletedTrainingWeekStart(today = new Date()) {
  const monday = getMostRecentMonday(today);
  const localWeekdayIndex = (startOfLocalDay(today).getDay() + 6) % 7;

  if (localWeekdayIndex < 5) {
    monday.setDate(monday.getDate() - 7);
  }

  return monday;
}

function getSessionStartDate(weekIndex: number, dayIndex: number) {
  const latestWeekStart = getLastCompletedTrainingWeekStart();
  const firstWeekStart = new Date(latestWeekStart);
  firstWeekStart.setDate(latestWeekStart.getDate() - 28);

  const date = new Date(firstWeekStart);
  date.setDate(firstWeekStart.getDate() + weekIndex * 7 + dayIndex);
  date.setHours(dayIndex % 2 === 0 ? 17 : 18, dayIndex % 2 === 0 ? 30 : 15, 0, 0);
  return date;
}

function parsePositiveNumber(value: string | null | undefined) {
  const parsed = Number.parseFloat((value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatLoadValue(value: number) {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function getSessionLoadValue(
  set: ProgramSetSeed,
  weeklyLoadIncreaseKg: number,
  weekIndex: number,
  exerciseIndex: number,
) {
  const baseLoad = parsePositiveNumber(set.loadValue);
  if (baseLoad == null || (set.loadUnit !== "kg" && set.loadUnit !== "lb")) {
    return set.loadValue;
  }

  const kgIncrease = weekIndex * weeklyLoadIncreaseKg + exerciseIndex * 0.25;
  const nextLoad =
    set.loadUnit === "kg" ? baseLoad + kgIncrease : baseLoad + kgIncrease * 2.20462262;

  return formatLoadValue(nextLoad);
}

function getSessionQuantity(set: ProgramSetSeed, weekIndex: number, setIndex: number) {
  const target = set.targetQuantity ?? 8;
  const weekRepBump = weekIndex >= 4 ? 2 : weekIndex >= 2 ? 1 : 0;
  const setFatigueDrop = setIndex >= 2 ? 1 : 0;
  return Math.max(1, target + weekRepBump - setFatigueDrop);
}

function getEstimatedMax(loadValue: string | null, reps: number) {
  const load = parsePositiveNumber(loadValue);
  if (load == null) return null;
  return Number((load * (1 + reps / 30)).toFixed(2));
}

function getSessionStrengthScore(program: DemoProgramSpec, weekIndex: number, dayIndex: number) {
  return Number(
    (program.baseStrengthScore + weekIndex * 2.8 + dayIndex * 0.35).toFixed(2),
  );
}

async function findOrCreateProgram(db: any, program: DemoProgramSpec) {
  const existing = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(eq(workoutPrograms.name, program.name))
    .limit(1);

  if (existing[0]?.id) return existing[0].id as string;

  const nowIso = new Date().toISOString();
  const programId = getProgramId(program);

  await db
    .insert(workoutPrograms)
    .values({
      id: programId,
      name: program.name,
      folderId: null,
      color: program.color,
      description: program.description,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: workoutPrograms.id,
      set: {
        name: program.name,
        color: program.color,
        description: program.description,
        updatedAt: nowIso,
      },
    });

  return programId;
}

async function getProgramWorkoutShape(db: any, programId: string) {
  const exerciseRows = (await db
    .select({
      id: exercisePrograms.id,
      exerciseId: exercisePrograms.exerciseId,
      quantityUnit: exercisePrograms.quantityUnit,
      exerciseName: exerciseTable.name,
      orderIndex: exercisePrograms.orderIndex,
    })
    .from(exercisePrograms)
    .leftJoin(exerciseTable, eq(exercisePrograms.exerciseId, exerciseTable.id))
    .where(eq(exercisePrograms.workoutProgramId, programId))) as ProgramExerciseSeed[];

  const orderedExercises = exerciseRows
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (orderedExercises.length === 0) {
    return { exercises: [], sets: [] as ProgramSetSeed[] };
  }

  const exerciseProgramIds = orderedExercises.map((exercise) => exercise.id);
  const setRows = exerciseProgramIds.length
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
        .where(inArray(setPrograms.exerciseProgramId, exerciseProgramIds))) as ProgramSetSeed[])
    : [];

  return { exercises: orderedExercises, sets: setRows };
}

async function seedProgramShape(db: any, programId: string, program: DemoProgramSpec) {
  const nowIso = new Date().toISOString();
  const exerciseRows: ProgramExerciseSeed[] = [];
  const setRows: ProgramSetSeed[] = [];

  for (const [exerciseIndex, exercise] of program.exercises.entries()) {
    const exerciseProgramId = getProgramExerciseId(program, exercise);
    const quantityUnit = exercise.quantityUnit ?? "reps";

    exerciseRows.push({
      id: exerciseProgramId,
      exerciseId: exercise.exerciseId,
      quantityUnit,
      exerciseName: exercise.exerciseName,
      orderIndex: exerciseIndex,
    });

    await db
      .insert(exercisePrograms)
      .values({
        id: exerciseProgramId,
        workoutProgramId: programId,
        quantityUnit,
        exerciseId: exercise.exerciseId,
        orderIndex: exerciseIndex,
        note: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .onConflictDoUpdate({
        target: exercisePrograms.id,
        set: {
          workoutProgramId: programId,
          quantityUnit,
          exerciseId: exercise.exerciseId,
          orderIndex: exerciseIndex,
          note: null,
          updatedAt: nowIso,
        },
      });

    for (const [setIndex, set] of exercise.sets.entries()) {
      const setId = getProgramSetId(program, exercise, setIndex);

      setRows.push({
        id: setId,
        exerciseProgramId,
        orderIndex: setIndex,
        targetQuantity: set.targetQuantity,
        restSeconds: set.restSeconds,
        loadUnit: set.loadUnit,
        loadValue: set.loadValue,
        targetRpe: set.targetRpe,
      });

      await db
        .insert(setPrograms)
        .values({
          id: setId,
          exerciseProgramId,
          orderIndex: setIndex,
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
            exerciseProgramId,
            orderIndex: setIndex,
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
  }

  return { exercises: exerciseRows, sets: setRows };
}

async function ensureProgramWithShape(db: any, program: DemoProgramSpec) {
  const programId = await findOrCreateProgram(db, program);
  const existingShape = await getProgramWorkoutShape(db, programId);

  if (existingShape.exercises.length > 0 && existingShape.sets.length > 0) {
    return { programId, ...existingShape };
  }

  return {
    programId,
    ...(await seedProgramShape(db, programId, program)),
  };
}

function buildFallbackSets(exerciseProgramId: string): ProgramSetSeed[] {
  return [0, 1, 2].map((index) => ({
    id: null,
    exerciseProgramId,
    orderIndex: index,
    targetQuantity: index === 2 ? 8 : 10,
    restSeconds: 120,
    loadUnit: "kg",
    loadValue: "40",
    targetRpe: index === 2 ? 8.5 : 8,
  }));
}

async function upsertSessionForProgram(
  db: any,
  program: DemoProgramSpec,
  programId: string,
  exercises: ProgramExerciseSeed[],
  sets: ProgramSetSeed[],
  weekIndex: number,
  dayIndex: number,
) {
  const startedAt = getSessionStartDate(weekIndex, dayIndex);
  const selectedExercises = exercises.slice(0, 5);
  const durationMinutes = 48 + selectedExercises.length * 6 + weekIndex;
  const endedAt = addMinutes(startedAt, durationMinutes);
  const nowIso = new Date().toISOString();
  const startedAtIso = startedAt.toISOString();
  const endedAtIso = endedAt.toISOString();
  const sessionId = `${SEED_PREFIX}-session-${weekIndex + 1}-${program.slug}`;
  const sessionStrengthScore = getSessionStrengthScore(program, weekIndex, dayIndex);

  await db
    .insert(workoutSessions)
    .values({
      id: sessionId,
      name: program.name,
      color: program.color,
      startedAt: startedAtIso,
      endedAt: endedAtIso,
      status: "completed",
      sourceProgramId: programId,
      note: "Seeded five-week rotating program session.",
      strengthScore: sessionStrengthScore,
      strengthScoreVersion: 1,
      createdAt: startedAtIso,
      updatedAt: nowIso,
    })
    .onConflictDoUpdate({
      target: workoutSessions.id,
      set: {
        name: program.name,
        color: program.color,
        startedAt: startedAtIso,
        endedAt: endedAtIso,
        status: "completed",
        sourceProgramId: programId,
        note: "Seeded five-week rotating program session.",
        strengthScore: sessionStrengthScore,
        strengthScoreVersion: 1,
        updatedAt: nowIso,
      },
    });

  for (const [exerciseIndex, exercise] of selectedExercises.entries()) {
    const sessionExerciseId = `${sessionId}-exercise-${exercise.id}`;
    const exerciseStrengthScore = Number(
      (sessionStrengthScore - exerciseIndex * 1.15).toFixed(2),
    );

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
        strengthScore: exerciseStrengthScore,
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
          strengthScore: exerciseStrengthScore,
          strengthScoreVersion: 1,
          updatedAt: nowIso,
        },
      });

    const sourceSets = sets
      .filter((set) => set.exerciseProgramId === exercise.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const sessionSourceSets =
      sourceSets.length > 0 ? sourceSets.slice(0, 3) : buildFallbackSets(exercise.id);

    for (const [setIndex, set] of sessionSourceSets.entries()) {
      const setId = `${sessionId}-set-${exercise.id}-${set.orderIndex}`;
      const quantity = getSessionQuantity(set, weekIndex, setIndex);
      const loadValue = getSessionLoadValue(
        set,
        program.weeklyLoadIncreaseKg,
        weekIndex,
        exerciseIndex,
      );
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
          rpe: set.targetRpe,
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
            rpe: set.targetRpe,
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

export async function seedProgramSessionDemo(db: any) {
  const seededSessionIds: string[] = [];

  for (let weekIndex = 0; weekIndex < 5; weekIndex += 1) {
    for (const [dayIndex, program] of DEMO_PROGRAMS.entries()) {
      const { programId, exercises, sets } = await ensureProgramWithShape(db, program);

      seededSessionIds.push(
        await upsertSessionForProgram(
          db,
          program,
          programId,
          exercises,
          sets,
          weekIndex,
          dayIndex,
        ),
      );
    }
  }

  await programStatRepository.computeLifetimeStat();
  await exerciseStatRepository.computeLifetimeStat();

  for (const sessionId of seededSessionIds) {
    for (const periodType of PERIOD_TYPES_TO_REFRESH) {
      await programPeriodStatRepository.upsertPeriodStat(sessionId, periodType);
      await exercisePeriodStatRepository.upsertPeriodStat(sessionId, periodType);
    }
  }
}
