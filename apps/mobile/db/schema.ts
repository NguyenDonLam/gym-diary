// src/lib/db/schema.ts
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

/**
 * workout_templates
 */
export const workoutTemplates = sqliteTable("workout_templates", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  collectionId: text("folder_id").references(() => templateCollections.id, {
    onDelete: "set null",
  }),
  color: text("color").notNull().default("neutral"),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * template_exercises
 */
export const templateExercises = sqliteTable("template_exercises", {
  id: text("id").primaryKey(), // UUID
  workoutTemplateId: text("workout_template_id")
    .notNull()
    .references(() => workoutTemplates.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

/**
 * template_sets
 */
export const templateSets = sqliteTable("template_sets", {
  id: text("id").primaryKey(), // UUID
  templateExerciseId: text("template_exercise_id")
    .notNull()
    .references(() => templateExercises.id),
  orderIndex: integer("order_index").notNull(),
  targetReps: integer("target_reps"),
  loadUnit: text("load_unit", {
    enum: ["kg", "lb", "band", "bodyweight", "none"],
  }).notNull(),
  loadValue: text("load_value"),
  targetRpe: real("target_rpe"),
  notes: text("notes"),
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
  sourceTemplateId: text("source_template_id").references(
    () => workoutTemplates.id
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
    .references(() => workoutSessions.id),

  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),

  templateExerciseId: text("template_exercise_id").references(
    () => templateExercises.id
  ),

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
    .references(() => sessionExercises.id),
  templateSetId: text("template_set_id").references(() => templateSets.id),
  orderIndex: integer("order_index").notNull(),
  reps: integer("reps"),
  loadUnit: text("load_unit", {
    enum: ["kg", "lb", "band", "bodyweight", "none"],
  }).notNull(),
  loadValue: text("load_value"),
  rpe: real("rpe"),
  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull().default(false),
  note: text("note"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// collections/folders for workout templates
export const templateCollections = sqliteTable("template_folders", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(), // user label
  sortIndex: integer("sort_index").notNull().default(0),

  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});