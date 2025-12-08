//apps/mobile/db/schema.ts
import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
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
  color: text("color").notNull().default("neutral"),
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
  targetReps: integer("target_reps"),
  loadUnit: text("load_unit", {
    enum: ["kg", "lb", "band", "time", "custom"],
  })
    .notNull()
    .default("custom"),
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
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  sourceProgramId: text("source_program_id").references(
    () => workoutPrograms.id,
    { onDelete: "set null" }
  ),
  note: text("note"),
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
      // delete session -> delete its session_exercises
      onDelete: "cascade",
    }),

  // link to library exercise, but nullable so old sessions survive library deletes
  exerciseId: text("exercise_id").references(() => exercises.id, {
    // delete exercise from library -> set this FK to null, keep row
    onDelete: "set null",
  }),
  exerciseProgramId: text("exercise_program_id").references(
    () => exercisePrograms.id,
    { onDelete: "set null" }
  ),

  // snapshot name used for display so sessions still show correctly
  exerciseName: text("exercise_name"),

  orderIndex: integer("order_index").notNull(),
  note: text("note"),
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
      // delete session_exercise -> delete its sets
      onDelete: "cascade",
    }),
  setProgramId: text("set_program_id").references(() => setPrograms.id, {
    onDelete: "set null",
  }),
  orderIndex: integer("order_index").notNull(),
  reps: integer("reps"),
  loadUnit: text("load_unit", {
    enum: ["kg", "lb", "band", "time", "custom"],
  })
    .notNull()
    .default("custom"),
  loadValue: text("load_value"),
  rpe: real("rpe"),
  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});


/**
 * exercises
 */
export const exercisesRelations = relations(exercises, ({ many }) => ({
  programExercises: many(exercisePrograms),
  sessionExercises: many(sessionExercises),
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
