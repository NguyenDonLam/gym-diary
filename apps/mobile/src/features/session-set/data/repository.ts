// src/features/session-set/data/session-set-repository.ts

import type { SessionSet } from "../domain/types";

import { eq } from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { sessionSets } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionSetRow } from "./types";
import { SessionSetFactory } from "../domain/factory";

export class SessionSetRepository extends BaseRepository<SessionSet> {
  async get(id: string): Promise<SessionSet | null> {
    const rows: SessionSetRow[] = await db
      .select()
      .from(sessionSets)
      .where(eq(sessionSets.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // no relations loaded here
    return SessionSetFactory.domainFromDb(row);
  }

  async getAll(): Promise<SessionSet[]> {
    const rows: SessionSetRow[] = await db.select().from(sessionSets);
    return rows.map((row) => SessionSetFactory.domainFromDb(row));
  }

  protected async insert(
    entity: SessionSet & { id?: string | null }
  ): Promise<SessionSet> {
    const id = entity.id ?? generateId();
    const withId: SessionSet = { ...(entity as SessionSet), id };

    const row: SessionSetRow = SessionSetFactory.dbFromDomain(withId) as SessionSetRow;

    await db.insert(sessionSets).values(row);

    return withId;
  }

  protected async update(
    entity: SessionSet & { id?: string | null }
  ): Promise<SessionSet> {
    if (!entity.id) {
      throw new Error("Cannot update SessionSet without id");
    }

    const row: SessionSetRow = SessionSetFactory.dbFromDomain(entity);

    await db.update(sessionSets).set(row).where(eq(sessionSets.id, entity.id));

    return entity as SessionSet;
  }

  async delete(id: string): Promise<void> {
    await db.delete(sessionSets).where(eq(sessionSets.id, id));
  }
}

export const sessionSetRepository = new SessionSetRepository();
