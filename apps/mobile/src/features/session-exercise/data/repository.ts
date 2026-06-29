// src/features/session-exercise/data/session-exercise-repository.ts

import type { SessionExercise } from "../domain/types";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  type InferInsertModel,
  type InferSelectModel,
} from "drizzle-orm";
import { BaseRepository } from "@/src/lib/base-repository";
import { sessionExercises, sessionSets, workoutSessions } from "@/db/schema";
import { db } from "@/db";
import { generateId } from "@/src/lib/id";
import { SessionExerciseFactory } from "../domain/factory";
import type { LoadUnit, QuantityUnit } from "@/db/enums";

type SessionExerciseRow = InferSelectModel<typeof sessionExercises>;
type NewSessionExerciseRow = InferInsertModel<typeof sessionExercises>;
type ProgressSetRow = {
  id: string;
  loadUnit: LoadUnit;
  loadValue: string | null;
  quantity: number | null;
  e1rm: number | null;
  isCompleted: boolean;
  isWarmup: boolean;
};

type ProgressSession = {
  sessionExerciseId: string;
  exerciseId: string;
  startedAt: Date;
  quantityUnit: QuantityUnit;
  strengthScore: number | null;
  sets: ProgressSetRow[];
};

export type SessionExerciseProgressHistoryPoint = {
  id: string;
  label: string;
  bestScore: number;
  volumeScore: number;
  bestLabel: string;
};

const LB_TO_KG = 0.45359237;

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseNumericLoad(raw: string | null | undefined): number | null {
  if (raw == null) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function loadKg(set: ProgressSetRow): number | null {
  const load = parseNumericLoad(set.loadValue);
  if (load == null || load <= 0) return null;

  if (set.loadUnit === "kg") return load;
  if (set.loadUnit === "lb") return load * LB_TO_KG;
  return null;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 100) return String(Math.round(value));
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  if (minutes <= 0) return `${remaining}s`;
  if (remaining === 0) return `${minutes}m`;
  return `${minutes}m ${remaining}s`;
}

function formatQuantity(
  quantity: number | null | undefined,
  unit: QuantityUnit,
): string {
  if (!isFiniteNumber(quantity) || quantity <= 0) return "?";
  if (unit === "time") return formatDuration(quantity);
  return String(Math.round(quantity));
}

function formatBestSetLabel(
  set: ProgressSetRow | null,
  quantityUnit: QuantityUnit,
): string | null {
  if (!set) return null;

  const quantity = formatQuantity(set.quantity, quantityUnit);
  const load = (set.loadValue ?? "").trim();

  if (load !== "") return `${load}x${quantity}`;
  return quantity;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function toProgressPoint(
  session: ProgressSession,
): SessionExerciseProgressHistoryPoint | null {
  const completedSets = session.sets.filter(
    (set) =>
      set.isCompleted &&
      !set.isWarmup &&
      isFiniteNumber(set.quantity) &&
      set.quantity > 0,
  );

  let volumeScore = 0;
  let quantityTotal = 0;
  let bestByE1rm: ProgressSetRow | null = null;
  let bestByLoad: ProgressSetRow | null = null;
  let bestLoadKg: number | null = null;

  for (const set of completedSets) {
    quantityTotal += set.quantity ?? 0;

    const kg = loadKg(set);
    if (kg != null) {
      volumeScore += kg * (set.quantity ?? 0);

      if (bestLoadKg == null || kg > bestLoadKg) {
        bestLoadKg = kg;
        bestByLoad = set;
      }
    }

    const currentBestE1rm = bestByE1rm?.e1rm;

    if (
      isFiniteNumber(set.e1rm) &&
      (!isFiniteNumber(currentBestE1rm) || set.e1rm > currentBestE1rm)
    ) {
      bestByE1rm = set;
    }
  }

  const bestScore = isFiniteNumber(bestByE1rm?.e1rm)
    ? bestByE1rm.e1rm
    : isFiniteNumber(session.strengthScore)
      ? session.strengthScore
      : bestLoadKg;

  if (!isFiniteNumber(bestScore)) return null;

  const bestLabel =
    formatBestSetLabel(bestByE1rm ?? bestByLoad, session.quantityUnit) ??
    `score ${formatCompact(bestScore)}`;

  return {
    id: session.sessionExerciseId,
    label: formatDateLabel(session.startedAt),
    bestScore,
    volumeScore: volumeScore > 0 ? volumeScore : quantityTotal,
    bestLabel,
  };
}

export class SessionExerciseRepository extends BaseRepository<SessionExercise> {
  async get(id: string): Promise<SessionExercise | null> {
    const rows: SessionExerciseRow[] = await db
      .select()
      .from(sessionExercises)
      .where(eq(sessionExercises.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // no relations here, so just row -> domain
    return SessionExerciseFactory.domainFromDb(row);
  }

  async getAll(): Promise<SessionExercise[]> {
    const rows: SessionExerciseRow[] = await db.select().from(sessionExercises);
    return rows.map((row) => SessionExerciseFactory.domainFromDb(row));
  }

  async getProgressHistoryByExerciseIds(
    exerciseIds: string[],
    limitPerExercise = 8,
  ): Promise<Record<string, SessionExerciseProgressHistoryPoint[]>> {
    const uniqueExerciseIds = Array.from(
      new Set(exerciseIds.filter((id): id is string => id.trim() !== "")),
    );

    if (uniqueExerciseIds.length === 0) return {};

    const rows = await db
      .select({
        sessionExerciseId: sessionExercises.id,
        exerciseId: sessionExercises.exerciseId,
        startedAt: workoutSessions.startedAt,
        quantityUnit: sessionExercises.quantityUnit,
        strengthScore: sessionExercises.strengthScore,
        setId: sessionSets.id,
        loadUnit: sessionSets.loadUnit,
        loadValue: sessionSets.loadValue,
        quantity: sessionSets.quantity,
        e1rm: sessionSets.e1rm,
        isCompleted: sessionSets.isCompleted,
        isWarmup: sessionSets.isWarmup,
      })
      .from(sessionExercises)
      .innerJoin(
        workoutSessions,
        eq(workoutSessions.id, sessionExercises.workoutSessionId),
      )
      .leftJoin(sessionSets, eq(sessionSets.sessionExerciseId, sessionExercises.id))
      .where(
        and(
          eq(workoutSessions.status, "completed"),
          isNotNull(sessionExercises.exerciseId),
          inArray(sessionExercises.exerciseId, uniqueExerciseIds),
        ),
      )
      .orderBy(
        desc(workoutSessions.startedAt),
        desc(sessionExercises.updatedAt),
        asc(sessionSets.orderIndex),
      );

    const sessionsById = new Map<string, ProgressSession>();

    for (const row of rows) {
      if (!row.exerciseId) continue;

      const startedAt = new Date(row.startedAt);
      if (Number.isNaN(startedAt.getTime())) continue;

      let session = sessionsById.get(row.sessionExerciseId);

      if (!session) {
        session = {
          sessionExerciseId: row.sessionExerciseId,
          exerciseId: row.exerciseId,
          startedAt,
          quantityUnit: row.quantityUnit,
          strengthScore: row.strengthScore,
          sets: [],
        };
        sessionsById.set(row.sessionExerciseId, session);
      }

      if (row.setId) {
        session.sets.push({
          id: row.setId,
          loadUnit: row.loadUnit ?? "kg",
          loadValue: row.loadValue,
          quantity: row.quantity,
          e1rm: row.e1rm,
          isCompleted: row.isCompleted ?? false,
          isWarmup: row.isWarmup ?? false,
        });
      }
    }

    const sessionsByExerciseId = new Map<string, ProgressSession[]>();

    for (const session of sessionsById.values()) {
      const bucket = sessionsByExerciseId.get(session.exerciseId) ?? [];
      bucket.push(session);
      sessionsByExerciseId.set(session.exerciseId, bucket);
    }

    const out: Record<string, SessionExerciseProgressHistoryPoint[]> = {};

    for (const [exerciseId, sessions] of sessionsByExerciseId) {
      out[exerciseId] = sessions
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, limitPerExercise)
        .reverse()
        .flatMap((session) => {
          const point = toProgressPoint(session);
          return point ? [point] : [];
        });
    }

    return out;
  }

  protected async insert(
    entity: SessionExercise & { id?: string | null }
  ): Promise<SessionExercise> {
    const id = entity.id ?? generateId();
    const withId: SessionExercise = { ...(entity as SessionExercise), id };

    const row: NewSessionExerciseRow = SessionExerciseFactory.dbFromDomain(
      withId
    ) as NewSessionExerciseRow;

    await db.insert(sessionExercises).values(row);

    return withId;
  }

  protected async update(
    entity: SessionExercise & { id?: string | null }
  ): Promise<SessionExercise> {
    if (!entity.id) {
      throw new Error("Cannot update SessionExercise without id");
    }

    const row: NewSessionExerciseRow = SessionExerciseFactory.dbFromDomain(
      entity as SessionExercise
    ) as NewSessionExerciseRow;

    await db
      .update(sessionExercises)
      .set(row)
      .where(eq(sessionExercises.id, entity.id));

    return entity as SessionExercise;
  }

  async delete(id: string): Promise<void> {
    await db.delete(sessionExercises).where(eq(sessionExercises.id, id));
  }
}

export const sessionExerciseRepository = new SessionExerciseRepository();
