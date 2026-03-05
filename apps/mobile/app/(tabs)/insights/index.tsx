// app/(tabs)/insights/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";

import type { Exercise } from "@packages/exercise/type";
import type { ExercisePeriodStat } from "@/src/features/exercise-period-stats/domain/types";

import { exerciseRepository } from "@/src/features/exercise/data/exercise-repository";
import { exerciseStatRepository } from "@/src/features/exercise-stats/data/repository";
import { exercisePeriodStatRepository } from "@/src/features/exercise-period-stats/data/repository";

type TimeLens = "4W" | "12W" | "ALL";

type ExerciseUsageSummary = {
  exerciseId: string;
  sessionCount: number;
  lastPerformedAt: Date | null;
};

type PreviewRow = {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
};

type WeekBucket = {
  key: string;
  start: Date;
  entries: number;
};

const LENS_LABEL: Record<TimeLens, string> = {
  "4W": "Last 4 weeks",
  "12W": "Last 12 weeks",
  ALL: "All time",
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function formatCount(n: number) {
  return n.toLocaleString();
}

function formatDate(d: Date) {
  return d.toLocaleDateString();
}

function buildExerciseNameMap(exercises: Exercise[]) {
  const out: Record<string, string> = {};
  for (const e of exercises) out[e.id] = e.name;
  return out;
}

function buildWeekBuckets(rows: ExercisePeriodStat[]): WeekBucket[] {
  const byStart = new Map<number, { start: Date; entries: number }>();

  for (const row of rows) {
    if (row.periodType !== "week") continue;

    const ts = row.periodStart.getTime();
    const existing = byStart.get(ts);

    if (existing) {
      existing.entries += row.sessionCount;
    } else {
      byStart.set(ts, {
        start: row.periodStart,
        entries: row.sessionCount,
      });
    }
  }

  return Array.from(byStart.entries())
    .map(([ts, value]) => ({
      key: String(ts),
      start: value.start,
      entries: value.entries,
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function buildAllTimePreview(
  usageSummaries: ExerciseUsageSummary[],
  exerciseNameById: Record<string, string>,
): PreviewRow[] {
  return usageSummaries
    .slice()
    .sort((a, b) => {
      const aLast = a.lastPerformedAt?.getTime() ?? 0;
      const bLast = b.lastPerformedAt?.getTime() ?? 0;

      if (aLast !== bLast) return bLast - aLast;
      if (a.sessionCount !== b.sessionCount)
        return b.sessionCount - a.sessionCount;

      const aName = exerciseNameById[a.exerciseId] ?? a.exerciseId;
      const bName = exerciseNameById[b.exerciseId] ?? b.exerciseId;
      return aName.localeCompare(bName);
    })
    .slice(0, 3)
    .map((row) => ({
      id: row.exerciseId,
      title: exerciseNameById[row.exerciseId] ?? row.exerciseId,
      value: `${row.sessionCount} times`,
      subtitle: row.lastPerformedAt
        ? `Last done ${formatDate(row.lastPerformedAt)}`
        : undefined,
    }));
}

function buildWindowPreview(
  rows: ExercisePeriodStat[],
  exerciseNameById: Record<string, string>,
): PreviewRow[] {
  const byExerciseId = new Map<
    string,
    {
      exerciseId: string;
      count: number;
      lastPeriodStart: Date;
    }
  >();

  for (const row of rows) {
    const existing = byExerciseId.get(row.exerciseId);

    if (existing) {
      existing.count += row.sessionCount;
      if (row.periodStart.getTime() > existing.lastPeriodStart.getTime()) {
        existing.lastPeriodStart = row.periodStart;
      }
    } else {
      byExerciseId.set(row.exerciseId, {
        exerciseId: row.exerciseId,
        count: row.sessionCount,
        lastPeriodStart: row.periodStart,
      });
    }
  }

  return Array.from(byExerciseId.values())
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;

      const aLast = a.lastPeriodStart.getTime();
      const bLast = b.lastPeriodStart.getTime();
      if (aLast !== bLast) return bLast - aLast;

      const aName = exerciseNameById[a.exerciseId] ?? a.exerciseId;
      const bName = exerciseNameById[b.exerciseId] ?? b.exerciseId;
      return aName.localeCompare(bName);
    })
    .slice(0, 3)
    .map((row) => ({
      id: row.exerciseId,
      title: exerciseNameById[row.exerciseId] ?? row.exerciseId,
      value: `${row.count} times`,
      subtitle: `Seen in ${LENS_LABEL["4W"]}`,
    }));
}

function StatTile(props: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </Text>
      <Text className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {props.value}
      </Text>
    </View>
  );
}

function LensToggle(props: {
  value: TimeLens;
  onChange: (v: TimeLens) => void;
}) {
  const items: TimeLens[] = ["4W", "12W", "ALL"];

  return (
    <View className="flex-row rounded-2xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
      {items.map((it) => {
        const active = it === props.value;

        return (
          <Pressable
            key={it}
            onPress={() => props.onChange(it)}
            className={[
              "px-3 py-2 rounded-xl",
              active ? "bg-neutral-900 dark:bg-neutral-100" : "bg-transparent",
            ].join(" ")}
          >
            <Text
              className={[
                "text-xs font-medium",
                active
                  ? "text-white dark:text-neutral-900"
                  : "text-neutral-700 dark:text-neutral-300",
              ].join(" ")}
            >
              {it}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WeeklyActivityCard(props: { buckets: WeekBucket[] }) {
  const max = Math.max(1, ...props.buckets.map((b) => b.entries));

  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Weekly activity
      </Text>
      <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Each square is one week. Darker means more exercise entries.
      </Text>

      {props.buckets.length === 0 ? (
        <Text className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          No weekly data yet.
        </Text>
      ) : (
        <>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {props.buckets.map((b) => {
              const t = clamp01(b.entries / max);
              const opacityClass =
                t === 0
                  ? "opacity-15"
                  : t < 0.34
                    ? "opacity-35"
                    : t < 0.67
                      ? "opacity-60"
                      : "opacity-100";

              return (
                <View
                  key={b.key}
                  className={[
                    "h-3 w-3 rounded-sm bg-neutral-900 dark:bg-neutral-100",
                    opacityClass,
                  ].join(" ")}
                  accessibilityLabel={`${b.entries} exercise entries`}
                />
              );
            })}
          </View>

          <Text className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            Darkest week: {formatCount(max)} exercise entries
          </Text>
        </>
      )}
    </View>
  );
}

function ExerciseCard(props: { rows: PreviewRow[] }) {
  return (
    <Link href="/(tabs)/insights/exercise" asChild>
      <Pressable className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <View className="flex-row items-start justify-between">
          <View className="pr-4">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Exercise
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Most active exercises in this view
            </Text>
          </View>
          <Text className="text-neutral-400 dark:text-neutral-600">›</Text>
        </View>
      </Pressable>
    </Link>
  );
}

function ProgramCard() {
  return (
    <Link href="/(tabs)/insights/program" asChild>
      <Pressable className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <View className="flex-row items-start justify-between">
          <View className="pr-4">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Program
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              View program stats
            </Text>
          </View>
          <Text className="text-neutral-400 dark:text-neutral-600">›</Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function InsightsIndexScreen() {
  const [lens, setLens] = useState<TimeLens>("4W");

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [usageSummaries, setUsageSummaries] = useState<ExerciseUsageSummary[]>(
    [],
  );
  const [periodRows, setPeriodRows] = useState<ExercisePeriodStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [allExercises, usageRows, allPeriodRows] = await Promise.all([
          exerciseRepository.getAll(),
          exerciseStatRepository.listUsageSummaries(),
          exercisePeriodStatRepository.getAll(),
        ]);

        if (cancelled) return;

        setExercises(allExercises ?? []);
        setUsageSummaries(usageRows ?? []);
        setPeriodRows(allPeriodRows ?? []);
      } catch (e) {
        if (cancelled) return;

        setExercises([]);
        setUsageSummaries([]);
        setPeriodRows([]);
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    const exerciseNameById = buildExerciseNameMap(exercises);
    const allWeekBuckets = buildWeekBuckets(periodRows);

    if (lens === "ALL") {
      return {
        exercisesUsed: usageSummaries.length,
        exerciseEntries: usageSummaries.reduce(
          (sum, row) => sum + row.sessionCount,
          0,
        ),
        activity: allWeekBuckets.slice(-12),
        preview: buildAllTimePreview(usageSummaries, exerciseNameById),
      };
    }

    const weekCount = lens === "4W" ? 4 : 12;
    const selectedWeeks = allWeekBuckets.slice(-weekCount);
    const selectedStarts = new Set(selectedWeeks.map((w) => w.start.getTime()));

    const selectedRows = periodRows.filter(
      (row) =>
        row.periodType === "week" &&
        selectedStarts.has(row.periodStart.getTime()),
    );

    return {
      exercisesUsed: new Set(selectedRows.map((row) => row.exerciseId)).size,
      exerciseEntries: selectedRows.reduce(
        (sum, row) => sum + row.sessionCount,
        0,
      ),
      activity: selectedWeeks,
      preview: buildWindowPreview(selectedRows, exerciseNameById).map(
        (row) => ({
          ...row,
          subtitle:
            lens === "4W" ? "In the last 4 weeks" : "In the last 12 weeks",
        }),
      ),
    };
  }, [lens, exercises, usageSummaries, periodRows]);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Insights
          </Text>
          <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {LENS_LABEL[lens]}
          </Text>

          {loading ? (
            <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Loading…
            </Text>
          ) : null}

          {error ? (
            <Text className="mt-2 text-xs text-red-600">{error}</Text>
          ) : null}
        </View>

        <LensToggle value={lens} onChange={setLens} />
      </View>

      <View className="flex-row gap-3">
        <StatTile
          label="Exercises used"
          value={formatCount(view.exercisesUsed)}
        />
        <StatTile
          label="Exercise entries"
          value={formatCount(view.exerciseEntries)}
        />
      </View>

      <WeeklyActivityCard buckets={view.activity} />

      <ExerciseCard rows={view.preview} />
      <ProgramCard />
    </ScrollView>
  );
}
