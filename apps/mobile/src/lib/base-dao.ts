// src/lib/db/BaseDao.ts
import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Generic base DAO for a single table.
 *
 * Row = shape of the DB row (not your domain model).
 */
export abstract class BaseDao<Row> {
  protected readonly db: SQLiteDatabase;
  protected readonly tableName: string;

  constructor(db: SQLiteDatabase, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  protected async run(
    sql: string,
    ...params: any[]
  ): Promise<{ lastInsertRowId?: number; changes?: number }> {
    return this.db.runAsync(sql, ...params);
  }

  protected async getAll<T = Row>(sql: string, ...params: any[]): Promise<T[]> {
    return this.db.getAllAsync<T>(sql, ...params);
  }

  protected async getOne<T = Row>(
    sql: string,
    ...params: any[]
  ): Promise<T | null> {
    const row = await this.db.getFirstAsync<T>(sql, ...params);
    return row ?? null;
  }

  async findById(id: string | number): Promise<Row | null> {
    return this.getOne<Row>(
      `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`,
      id
    );
  }

  async findAll(): Promise<Row[]> {
    return this.getAll<Row>(`SELECT * FROM ${this.tableName}`);
  }

  /**
   * Wrap a set of operations in an async transaction.
   *
   * Usage:
   *   await this.withTransaction(async () => {
   *     await this.run(...);
   *     await this.run(...);
   *   });
   */
  protected withTransaction(task: () => Promise<void>): Promise<void> {
    return this.db.withTransactionAsync(task);
  }
}
