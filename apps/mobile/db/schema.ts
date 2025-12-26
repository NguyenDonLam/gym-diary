//apps/mobile/db/schema.ts
import { relations } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { LOAD_UNITS, PROGRAM_COLORS, QUANTITY_UNITS } from "./enums";
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
  }).notNull().default("reps"),

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

  sampleCount: integer("sample_count").notNull().default(0),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const exerciseStatsRelations = relations(exerciseStats, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseStats.exerciseId],
    references: [exercises.id],
  }),
}));

// Store stats for each week, month, year for ease of graphing
export const exercisePeriodStats = sqliteTable("exercise_period_stats", {
  id: text("id").primaryKey(), // UUID

  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),

  periodType: text("period_type", {
    enum: ["week", "month", "year"],
  }).notNull(),
  periodStart: integer("period_start", { mode: "timestamp_ms" }).notNull(),

  sessionCount: integer("session_count").notNull().default(0),

  bestStrengthScore: real("best_strength_score"),
  medianStrengthScore: real("median_strength_score"),

  bestSetE1rm: real("best_set_e1rm"),
  medianSetE1rm: real("median_set_e1rm"),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// indexes / uniqueness (separate exports)
export const exercisePeriodStatsIndexes = {
  // ensure one row per (exercise, periodType, periodStart)
  uniq: uniqueIndex("exercise_period_stats_uniq").on(
    exercisePeriodStats.exerciseId,
    exercisePeriodStats.periodType,
    exercisePeriodStats.periodStart
  ),

  // fast range scans for charts
  exPeriod: index("exercise_period_stats_ex_period_idx").on(
    exercisePeriodStats.exerciseId,
    exercisePeriodStats.periodType,
    exercisePeriodStats.periodStart
  ),
};

export const exercisePeriodStatsRelations = relations(
  exercisePeriodStats,
  ({ one }) => ({
    exercise: one(exercises, {
      fields: [exercisePeriodStats.exerciseId],
      references: [exercises.id],
    }),
  })
);

/**
 * exercises
 */
export const exercisesRelations = relations(exercises, ({ many, one }) => ({
  programExercises: many(exercisePrograms),
  sessionExercises: many(sessionExercises),
  stats: one(exerciseStats),
  periodStats: many(exercisePeriodStats),
}));

/**
 * program_folders
 */
export const programFoldersRelations = relations(
  programFolders,
  ({ many }) => ({
    programs: many(workoutPrograms),
  })
);

/**
 * program_workouts (workoutPrograms)
 */
export const workoutProgramsRelations = relations(
  workoutPrograms,
  ({ one, many }) => ({
    folder: one(programFolders, {
      fields: [workoutPrograms.folderId],
      references: [programFolders.id],
    }),
    exercises: many(exercisePrograms),
    sessions: many(workoutSessions),
  })
);

/**
 * program_exercise (exercisePrograms)
 */
export const exerciseProgramsRelations = relations(
  exercisePrograms,
  ({ one, many }) => ({
    program: one(workoutPrograms, {
      fields: [exercisePrograms.workoutProgramId],
      references: [workoutPrograms.id],
    }),
    exercise: one(exercises, {
      fields: [exercisePrograms.exerciseId],
      references: [exercises.id],
    }),
    sets: many(setPrograms),
    sessionExercises: many(sessionExercises),
  })
);

/**
 * program_sets (setPrograms)
 */
export const setProgramsRelations = relations(setPrograms, ({ one, many }) => ({
  exerciseProgram: one(exercisePrograms, {
    fields: [setPrograms.exerciseProgramId],
    references: [exercisePrograms.id],
  }),
  sessionSets: many(sessionSets),
}));

/**
 * workout_sessions
 */
export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    sourceProgram: one(workoutPrograms, {
      fields: [workoutSessions.sourceProgramId],
      references: [workoutPrograms.id],
    }),
    sessionExercises: many(sessionExercises),
  })
);

/**
 * session_exercises
 */
export const sessionExercisesRelations = relations(
  sessionExercises,
  ({ one, many }) => ({
    workoutSession: one(workoutSessions, {
      fields: [sessionExercises.workoutSessionId],
      references: [workoutSessions.id],
    }),
    exercise: one(exercises, {
      fields: [sessionExercises.exerciseId],
      references: [exercises.id],
    }),
    exerciseProgram: one(exercisePrograms, {
      fields: [sessionExercises.exerciseProgramId],
      references: [exercisePrograms.id],
    }),
    sessionSets: many(sessionSets),
  })
);

/**
 * session_sets
 */
export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  sessionExercise: one(sessionExercises, {
    fields: [sessionSets.sessionExerciseId],
    references: [sessionExercises.id],
  }),
  setProgram: one(setPrograms, {
    fields: [sessionSets.setProgramId],
    references: [setPrograms.id],
  }),
}));
