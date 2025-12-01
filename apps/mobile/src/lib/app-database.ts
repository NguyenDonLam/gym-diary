// src/lib/db/AppDatabase.ts
import * as SQLite from "expo-sqlite";
export class AppDatabase {
  private static instance: AppDatabase | null = null;
  private readonly db: SQLite.SQLiteDatabase;

  private constructor() {
    // open DB file
    this.db = SQLite.openDatabaseSync("gymdiary.db");

    // enforce foreign key constraints
    this.db.execSync("PRAGMA foreign_keys = ON;");
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
}
