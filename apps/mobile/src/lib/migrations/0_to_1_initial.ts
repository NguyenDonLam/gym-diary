// src/lib/db/migrations/0_to_1_initial.ts
import type * as SQLite from "expo-sqlite";

/**
 * v0 → v1 initial schema
 */
export function migrate0To1(db: SQLite.SQLiteDatabase): void {
  // Meta table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Canonical exercises dictionary
  db.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id            TEXT PRIMARY KEY, -- UUID
      name          TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );
  `);

  // template_workout
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id          TEXT PRIMARY KEY, -- UUID
      name        TEXT NOT NULL,
      description TEXT,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );
  `);

  // template_exercise
  db.execSync(`
    CREATE TABLE IF NOT EXISTS template_exercises (
      id                   TEXT PRIMARY KEY, -- UUID
      workout_template_id  TEXT NOT NULL,
      exercise_id          TEXT NOT NULL,
      order_index          INTEGER NOT NULL,
      notes                TEXT,
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL,
      FOREIGN KEY (workout_template_id) REFERENCES workout_templates (id),
      FOREIGN KEY (exercise_id)        REFERENCES exercises (id)
    );
  `);

  // template_set
  db.execSync(`
  CREATE TABLE IF NOT EXISTS template_sets (
    id                   TEXT PRIMARY KEY, -- UUID
    template_exercise_id TEXT NOT NULL,
    order_index          INTEGER NOT NULL,
    target_reps          INTEGER,
    load_unit            TEXT NOT NULL,    -- "kg", "lb", "band", "bodyweight", "none"
    load_value           TEXT,             -- number-as-text or label ("green", "pin 7")
    target_rpe           REAL,
    notes                TEXT,
    created_at           TEXT NOT NULL,
    updated_at           TEXT NOT NULL,
    FOREIGN KEY (template_exercise_id) REFERENCES template_exercises (id)
  );
`);

  // workout_session
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id                 TEXT PRIMARY KEY, -- UUID
      started_at         TEXT NOT NULL,
      ended_at           TEXT,
      source_template_id TEXT,
      note               TEXT,
      created_at         TEXT NOT NULL,
      updated_at         TEXT NOT NULL,
      FOREIGN KEY (source_template_id) REFERENCES workout_templates (id)
    );
  `);

  // session_exercise
  db.execSync(`
    CREATE TABLE IF NOT EXISTS session_exercises (
      id                   TEXT PRIMARY KEY, -- UUID
      workout_session_id   TEXT NOT NULL,
      template_exercise_id TEXT,
      order_index          INTEGER NOT NULL,
      note                 TEXT,
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL,
      FOREIGN KEY (workout_session_id)   REFERENCES workout_sessions (id),
      FOREIGN KEY (template_exercise_id) REFERENCES template_exercises (id)
    );
  `);

  // session_set
  db.execSync(`
    CREATE TABLE IF NOT EXISTS session_sets (
      id                  TEXT PRIMARY KEY, -- UUID
      session_exercise_id TEXT NOT NULL,
      template_set_id     TEXT,
      order_index         INTEGER NOT NULL,
      reps                INTEGER,
      load_unit           TEXT NOT NULL,    -- same enum as template_sets
      load_value          TEXT,             -- actual logged load
      rpe                 REAL,
      is_warmup           INTEGER NOT NULL DEFAULT 0,
      note                TEXT,
      created_at          TEXT NOT NULL,
      updated_at          TEXT NOT NULL,
      FOREIGN KEY (session_exercise_id) REFERENCES session_exercises (id),
      FOREIGN KEY (template_set_id)     REFERENCES template_sets (id)
    );
  `);

  // schema_version = 1
  db.runSync(
    `INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)`,
    ["1"]
  );
}
