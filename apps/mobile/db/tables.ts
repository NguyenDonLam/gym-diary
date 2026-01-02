import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
import { LOAD_UNITS, PERIOD_TYPES, PROGRAM_COLORS, QUANTITY_UNITS } from "./enums";
/**
 * meta
 */
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * exercises
 */
export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  quantityUnit: text("quantity_unit", {
    enum: QUANTITY_UNITS,
  })
    .notNull()
    .default("reps"),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// collections/folders for workout programs
export const programFolders = sqliteTable("program_folders", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(), // user label
  sortIndex: integer("sort_index").notNull().default(0),

  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const workoutPrograms = sqliteTable("program_workouts", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  folderId: text("folder_id").references(() => programFolders.id, {
    onDelete: "set null",
  }),
  color: text("color", { enum: PROGRAM_COLORS }).notNull().default("neutral"),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const exercisePrograms = sqliteTable("program_exercises", {
  id: text("id").primaryKey(),
  workoutProgramId: text("workout_program_id")
    .notNull()
    .references(() => workoutPrograms.id, {
      onDelete: "cascade",
    }),
  quantityUnit: text("quantity_unit", {
    enum: QUANTITY_UNITS,
  })
    .notNull()
    .default("reps"),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const setPrograms = sqliteTable("program_sets", {
  id: text("id").primaryKey(), // UUID
  exerciseProgramId: text("program_exercise_id")
    .notNull()
    .references(() => exercisePrograms.id, {
      onDelete: "cascade",
    }),
  orderIndex: integer("order_index").notNull(),
  targetQuantity: integer("target_quantity"),
  loadUnit: text("load_unit", { enum: LOAD_UNITS })
    .notNull()
    .notNull()
    .default("kg"),
  loadValue: text("load_value"),
  targetRpe: real("target_rpe"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * workout_sessions
 */
export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(), // UUID
  name: text("name"),
  color: text("color", { enum: PROGRAM_COLORS }).notNull().default("neutral"),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  status: text("status", {
    enum: ["in_progress", "completed", "discarded"],
  })
    .notNull()
    .default("in_progress"),

  sourceProgramId: text("source_program_id").references(
    () => workoutPrograms.id,
    { onDelete: "set null" }
  ),
  note: text("note"),

  strengthScore: real("strength_score"),
  strengthScoreVersion: integer("strength_score_version").notNull().default(1),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * session_exercises
 */
export const sessionExercises = sqliteTable("session_exercises", {
  id: text("id").primaryKey(),
  workoutSessionId: text("workout_session_id")
    .notNull()
    .references(() => workoutSessions.id, {
      onDelete: "cascade",
    }),

  exerciseId: text("exercise_id").references(() => exercises.id, {
    onDelete: "set null",
  }),
  exerciseProgramId: text("exercise_program_id").references(
    () => exercisePrograms.id,
    { onDelete: "set null" }
  ),
  quantityUnit: text("quantity_unit", {
    enum: QUANTITY_UNITS,
  })
    .notNull()
    .default("reps"),

  exerciseName: text("exercise_name"),

  orderIndex: integer("order_index").notNull(),
  note: text("note"),

  strengthScore: real("strength_score"),
  strengthScoreVersion: integer("strength_score_version").notNull().default(1),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * session_sets
 */
export const sessionSets = sqliteTable("session_sets", {
  id: text("id").primaryKey(), // UUID
  sessionExerciseId: text("session_exercise_id")
    .notNull()
    .references(() => sessionExercises.id, {
      onDelete: "cascade",
    }),
  setProgramId: text("set_program_id").references(() => setPrograms.id, {
    onDelete: "set null",
  }),
  orderIndex: integer("order_index").notNull(),

  targetQuantity: integer("target_quantity"),
  quantity: integer("quantity"),
  loadUnit: text("load_unit", { enum: LOAD_UNITS })
    .notNull()
    .notNull()
    .default("kg"),
  loadValue: text("load_value"),
  rpe: real("rpe"),

  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),

  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull().default(false),
  note: text("note"),

  e1rm: real("e1rm"),
  e1rmVersion: integer("e1rm_version").notNull().default(1),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// Cache for current exercise data (to be updated consistently)
export const exerciseStats = sqliteTable("exercise_stats", {
  exerciseId: text("exercise_id")
    .primaryKey()
    .references(() => exercises.id, { onDelete: "cascade" }),

  baselineExerciseStrengthScore: real("baseline_exercise_strength_score"),
  baselineSetE1rm: real("baseline_set_e1rm"),

  bestSetE1rm: real("best_set_e1rm"),
  bestExerciseStrengthScore: real("best_exercise_strength_score"),
  totalSetCount: integer("total_set_count").notNull().default(0),
  totalVolumeKg: real("total_volume_kg").notNull().default(0),

  sampleCount: integer("sample_count").notNull().default(0),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});


// Store stats for each week, month, year for ease of graphing
export const exercisePeriodStats = sqliteTable("exercise_period_stats", {
  id: text("id").primaryKey(), // UUID

  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),

  periodType: text("period_type", {
    enum: PERIOD_TYPES,
  }).notNull(),
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),

  sessionCount: integer("session_count").notNull().default(0),

  bestStrengthScore: real("best_strength_score"),
  medianStrengthScore: real("median_strength_score"),

  bestSetE1rm: real("best_set_e1rm"),
  medianSetE1rm: real("median_set_e1rm"),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// All-time / lifetime cache per program
export const programStats = sqliteTable("program_stats", {
  programId: text("program_id")
    .primaryKey()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),

  totalSessionCount: integer("total_session_count").notNull().default(0),
  totalSetCount: integer("total_set_count").notNull().default(0),
  totalRepCount: integer("total_rep_count").notNull().default(0),
  totalVolumeKg: real("total_volume_kg").notNull().default(0),
  totalDurationSec: integer("total_duration_sec").notNull().default(0),
  medianProgression: real("median_progression"),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});


// Period snapshots per program (for charts)
export const programPeriodStats = sqliteTable("program_period_stats", {
  id: text("id").primaryKey(),

  programId: text("program_id")
    .notNull()
    .references(() => workoutPrograms.id, { onDelete: "cascade" }),

  periodType: text("period_type", { enum: PERIOD_TYPES }).notNull(),
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),

  // raw rollups (keep)
  sessionCount: integer("session_count").notNull().default(0),
  volumeKg: real("volume_kg").notNull().default(0),
  durationSec: integer("duration_sec").notNull().default(0),
  averageProgression: real("average_progression").notNull().default(0),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});
