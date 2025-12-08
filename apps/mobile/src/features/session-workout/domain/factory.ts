// src/features/session-workout/domain/session-workout-factory.ts

import { SessionWorkout } from "./types";
import { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { generateId } from "@/src/lib/id";

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

    return {
      id: generateId(),

      startedAt: now,
      endedAt: null,

      sourceTemplateId: template.id,
      sourceTemplate: template,

      note: null,

      createdAt: now,
      updatedAt: now,

      exercises: [], // you will populate these later when sets are logged
    };
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
