import { index, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  exercisePeriodStats,
  exercisePrograms,
  exercises,
  exerciseStats,
  programFolders,
  programPeriodStats,
  programStats,
  sessionExercises,
  sessionSets,
  setPrograms,
  workoutPrograms,
  workoutSessions,
} from "./tables";
import { relations } from "drizzle-orm";

export const exerciseStatsRelations = relations(exerciseStats, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exerciseStats.exerciseId],
    references: [exercises.id],
  }),
}));

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
    stats: one(programStats),
    periodStats: many(programPeriodStats),
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

export const programPeriodStatsIndexes = {
  uniq: uniqueIndex("program_period_stats_uniq").on(
    programPeriodStats.programId,
    programPeriodStats.periodType,
    programPeriodStats.periodStart
  ),
  range: index("program_period_stats_range_idx").on(
    programPeriodStats.programId,
    programPeriodStats.periodType,
    programPeriodStats.periodStart
  ),
};

export const programStatsRelations = relations(programStats, ({ one }) => ({
  program: one(workoutPrograms, {
    fields: [programStats.programId],
    references: [workoutPrograms.id],
  }),
}));


export const programStatsIndexes = {
  // Fast joins / lookups by program
  program: index("program_stats_program_idx").on(programStats.programId),

  // Useful if you sort or filter by recency
  updatedAt: index("program_stats_updated_at_idx").on(programStats.updatedAt),
};

export const programPeriodStatsRelations = relations(
  programPeriodStats,
  ({ one }) => ({
    program: one(workoutPrograms, {
      fields: [programPeriodStats.programId],
      references: [workoutPrograms.id],
    }),
  })
);
