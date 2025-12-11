// src/features/session-workout/domain/session-workout-factory.ts

import { SessionWorkout } from "./types";
import { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { generateId } from "@/src/lib/id";
import { SessionExercise } from "../../session-exercise/domain/types";
import { SessionSet } from "../../session-set/domain/types";

/**
 * Domain-level construction rules for SessionWorkout.
 * Repository must never perform this logic.
 */
export class SessionWorkoutFactory {
  /**
   * Create a new session originating from a TemplateWorkout.
   * Does NOT create SessionExercise or SessionSet — that is a separate step.
   */
  static fromTemplate(template: WorkoutProgram): SessionWorkout {
    const now = new Date();
    const sessionId = generateId();

    const templateExercises = template.exercises ?? [];

    const sessionExercises: SessionExercise[] = templateExercises
      .slice()
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map((tplEx, exIndex) => {
        const sessionExerciseId = generateId();

        const templateSets = tplEx.sets ?? [];

        const sets: SessionSet[] = templateSets
          .slice()
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
          .map((tplSet, setIndex) => ({
            id: generateId(),

            sessionExerciseId,
            templateSetId: tplSet.id,
            templateSet: tplSet,

            orderIndex: tplSet.orderIndex ?? setIndex,
            isCompleted: false,

            targetQuantity: null,
            loadUnit: tplSet.loadUnit,
            loadValue: null,
            rpe: null,

            isWarmup: false,

            note: tplSet.note ?? null,

            createdAt: now,
            updatedAt: now,
          }));

        const sessionExercise: SessionExercise = {
          id: sessionExerciseId,

          workoutSessionId: sessionId,

          exerciseId: tplEx.exerciseId ?? null,
          exerciseProgramId: tplEx.id,
          exerciseProgram: tplEx,

          // if you have a denormalised name on the template, snapshot it here
          exerciseName: tplEx.exercise?.name ?? "Unnamed Exercise",

          orderIndex: tplEx.orderIndex ?? exIndex,

          note: tplEx.note ?? null,

          createdAt: now,
          updatedAt: now,

          sets,
        };

        return sessionExercise;
      });

    const session: SessionWorkout = {
      id: sessionId,
      name: template.name,

      startedAt: now,
      endedAt: null,

      sourceTemplateId: template.id,
      sourceTemplate: template,
      status: "in_progress",

      note: null,

      createdAt: now,
      updatedAt: now,

      exercises: sessionExercises,
    };

    return session;
  }

  /**
   * Generic creator if you ever need to build a session without a template.
   */
  static create(base: Omit<SessionWorkout, "id">): SessionWorkout {
    return {
      ...base,
      id: generateId(),
    };
  }
}
