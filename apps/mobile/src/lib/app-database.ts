// src/lib/db/AppDatabase.ts
import * as SQLite from "expo-sqlite";
import { APP_SCHEMA_VERSION, migrations } from "./migrations"; // array: [migrate0To1, migrate1To2, ...]

export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private readonly db: SQLite.SQLiteDatabase;

  private constructor() {
    // open DB file
    this.db = SQLite.openDatabaseSync("gymdiary.db");

    // enforce foreign key constraints
    this.db.execSync("PRAGMA foreign_keys = ON;");

    // run schema upgrades
    this.runMigrations();
  }

  static getInstance(): AppDatabase {
    if (!this.instance) {
      this.instance = new AppDatabase();
    }
    return this.instance;
  }

  get connection(): SQLite.SQLiteDatabase {
    return this.db;
  }

  private runMigrations(): void {
    // wrap in a transaction so schema updates are atomic
    this.db.withTransactionSync(() => {
      // ensure meta table exists
      this.db.execSync(`
        CREATE TABLE IF NOT EXISTS meta (
          key   TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // read current version from DB
      const row = this.db.getFirstSync<{ value: string }>(
        `SELECT value FROM meta WHERE key = 'schema_version'`
      );

      let currentVersion = 0;

      if (!row) {
        // first install: initialize to version 0
        this.db.runSync(
          `INSERT INTO meta (key, value) VALUES ('schema_version', ?)`,
          ["0"]
        );
      } else {
        currentVersion = parseInt(row.value, 10) || 0;
      }

      // apply missing migrations 0→1, 1→2, 2→3, etc.
      for (let from = currentVersion; from < APP_SCHEMA_VERSION; from++) {
        const migrateFn = migrations[from];
        if (!migrateFn) {
          throw new Error(`Missing migration for v${from} → v${from + 1}`);
        }

        // run migration logic
        migrateFn(this.db);

        // bump version in DB
        this.db.runSync(
          `UPDATE meta SET value = ? WHERE key = 'schema_version'`,
          [String(from + 1)]
        );
      }
    });
  }
}
