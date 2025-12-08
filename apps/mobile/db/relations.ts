// src/lib/db/relations.ts

import { relations } from "drizzle-orm";
import {
  exercises,
  workoutPrograms,
  exercisePrograms,
  setPrograms,
  workoutSessions,
  sessionExercises,
  sessionSets,
  programFolders,
} from "@/db/schema";

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
