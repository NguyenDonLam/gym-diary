// app/(tabs)/insights/exercise/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Exercise } from "@packages/exercise/type";

import { exerciseRepository } from "@/src/features/exercise/data/exercise-repository";
import { exerciseStatRepository } from "@/src/features/exercise-stats/data/repository";

type ExerciseUsageSummary = {
  exerciseId: string;
  sessionCount: number;
  lastPerformedAt: Date | null;
};

function ExerciseRow(props: {
  title: string;
  subtitle?: string;
  rightValue?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
            numberOfLines={1}
          >
            {props.title}
          </Text>

          {props.subtitle ? (
            <Text
              className="mt-1 text-xs text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {props.subtitle}
            </Text>
          ) : null}
        </View>

        <View className="items-end">
          {props.rightValue ? (
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {props.rightValue}
            </Text>
          ) : null}
          <Text className="text-neutral-400 dark:text-neutral-600">›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const getExerciseId = (e: Exercise) => e.id;
const getExerciseName = (e: Exercise) => e.name;

function getExerciseRightValue(_e: Exercise): string | undefined {
  return undefined;
}

function getExerciseSubtitle(usage?: ExerciseUsageSummary): string | undefined {
  if (!usage || usage.sessionCount <= 0) return undefined;

  const last = usage.lastPerformedAt
    ? usage.lastPerformedAt.toLocaleDateString()
    : null;

  if (last) {
    return `${usage.sessionCount} session${usage.sessionCount === 1 ? "" : "s"} • last ${last}`;
  }

  return `${usage.sessionCount} session${usage.sessionCount === 1 ? "" : "s"}`;
}

function compareByName(a: Exercise, b: Exercise) {
  return getExerciseName(a).localeCompare(getExerciseName(b));
}

function getUsage(
  byExerciseId: Record<string, ExerciseUsageSummary | undefined>,
  exercise: Exercise,
): ExerciseUsageSummary | undefined {
  return byExerciseId[getExerciseId(exercise)];
}

function compareByUsage(
  a: Exercise,
  b: Exercise,
  byExerciseId: Record<string, ExerciseUsageSummary | undefined>,
) {
  const ua = getUsage(byExerciseId, a);
  const ub = getUsage(byExerciseId, b);

  const aHasUsage = (ua?.sessionCount ?? 0) > 0;
  const bHasUsage = (ub?.sessionCount ?? 0) > 0;

  if (aHasUsage !== bHasUsage) return aHasUsage ? -1 : 1;

  const aLast = ua?.lastPerformedAt?.getTime() ?? 0;
  const bLast = ub?.lastPerformedAt?.getTime() ?? 0;
  if (aLast !== bLast) return bLast - aLast;

  const aCount = ua?.sessionCount ?? 0;
  const bCount = ub?.sessionCount ?? 0;
  if (aCount !== bCount) return bCount - aCount;

  return compareByName(a, b);
}

export default function InsightsExerciseIndexScreen() {
  const [options, setOptions] = useState<Exercise[]>([]);
  const [usageSummaries, setUsageSummaries] = useState<ExerciseUsageSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [exercises, usageRows] = await Promise.all([
          exerciseRepository.getAll(),
          exerciseStatRepository.listUsageSummaries(),
        ]);

        if (cancelled) return;

        setOptions(exercises ?? []);
        setUsageSummaries(usageRows ?? []);
      } catch (e) {
        if (cancelled) return;

        setOptions([]);
        setUsageSummaries([]);
        setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const byExerciseId = useMemo<
    Record<string, ExerciseUsageSummary | undefined>
  >(() => {
    const out: Record<string, ExerciseUsageSummary | undefined> = {};

    for (const row of usageSummaries) {
      out[row.exerciseId] = row;
    }

    return out;
  }, [usageSummaries]);

  const query = q.trim().toLowerCase();

  const allSorted = useMemo(() => {
    return options.slice().sort(compareByName);
  }, [options]);

  const relevant = useMemo(() => {
    return options
      .filter((e) => (getUsage(byExerciseId, e)?.sessionCount ?? 0) > 0)
      .slice()
      .sort((a, b) => compareByUsage(a, b, byExerciseId));
  }, [options, byExerciseId]);

  const featured = useMemo(() => {
    if (relevant.length > 0) return relevant.slice(0, 10);
    return allSorted.slice(0, 10);
  }, [relevant, allSorted]);

  const browseAllRows = useMemo(() => {
    const featuredIds = new Set(featured.map((e) => getExerciseId(e)));
    return allSorted.filter((e) => !featuredIds.has(getExerciseId(e)));
  }, [allSorted, featured]);

  const searchResults = useMemo(() => {
    if (!query) return [];

    return options
      .map((exercise) => {
        const name = getExerciseName(exercise).toLowerCase();
        const index = name.indexOf(query);

        if (index === -1) return null;

        return {
          exercise,
          matchBucket: index === 0 ? 0 : 1,
        };
      })
      .filter(
        (
          item,
        ): item is {
          exercise: Exercise;
          matchBucket: 0 | 1;
        } => item != null,
      )
      .sort((a, b) => {
        if (a.matchBucket !== b.matchBucket) {
          return a.matchBucket - b.matchBucket;
        }

        return compareByUsage(a.exercise, b.exercise, byExerciseId);
      })
      .map((item) => item.exercise);
  }, [options, query, byExerciseId]);

  function openExercise(exerciseId: string) {
    router.push({
      pathname: "/(tabs)/insights/exercise/[exerciseId]",
      params: { exerciseId },
    });
  }

  function renderRows(rows: Exercise[]) {
    return (
      <View className="gap-3">
        {rows.map((e) => {
          const id = getExerciseId(e);
          const title = getExerciseName(e);
          const usage = getUsage(byExerciseId, e);

          return (
            <ExerciseRow
              key={id}
              title={title}
              subtitle={getExerciseSubtitle(usage)}
              rightValue={getExerciseRightValue(e)}
              onPress={() => openExercise(id)}
            />
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      <View>
        <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Exercise
        </Text>
        <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Search is ranked by relevance, recency, and usage
        </Text>
      </View>

      <View className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search exercises"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          className="text-sm text-neutral-900 dark:text-neutral-100"
        />
      </View>

      {error ? (
        <View className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
          <Text className="text-sm font-medium text-rose-700 dark:text-rose-300">
            Failed to load exercises
          </Text>
          <Text className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          Loading…
        </Text>
      ) : query ? (
        searchResults.length === 0 ? (
          <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              No matching exercises
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Try another keyword.
            </Text>
          </View>
        ) : (
          <>
            <View>
              <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Search results
              </Text>
              <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Prefix matches rank first, then recent and frequent matches
              </Text>
            </View>

            {renderRows(searchResults)}
          </>
        )
      ) : (
        <>
          <View>
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {relevant.length > 0 ? "Relevant to you" : "Suggested"}
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {relevant.length > 0
                ? "Based on exercises you perform most recently and most often"
                : "Start with a smaller list instead of the full registry"}
            </Text>
          </View>

          {featured.length === 0 ? (
            <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No exercises
              </Text>
              <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Log a session first, then come back.
              </Text>
            </View>
          ) : (
            renderRows(featured)
          )}

          {browseAllRows.length > 0 ? (
            <Pressable
              onPress={() => setShowAll((v) => !v)}
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {showAll ? "Hide all exercises" : "Browse all exercises"}
              </Text>
              <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {showAll
                  ? "Collapse the full list"
                  : "Show the complete registry in A–Z order"}
              </Text>
            </Pressable>
          ) : null}

          {showAll && browseAllRows.length > 0 ? (
            <>
              <View>
                <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  All exercises
                </Text>
                <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Full list in alphabetical order
                </Text>
              </View>

              {renderRows(browseAllRows)}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
