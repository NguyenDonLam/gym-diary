import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Check, Plus, Search, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Exercise } from "@gym-diary/exercise/type";
import { exerciseRepository } from "@/src/features/exercise/data/exercise-repository";
import { exerciseFactory } from "@/src/features/exercise/domain/factory";
import { exerciseStatRepository } from "@/src/features/exercise-stats/data/repository";
import type { QuantityUnit } from "@/db/enums";

type ExerciseUsageSummary = {
  exerciseId: string;
  sessionCount: number;
  lastPerformedAt: Date | null;
};

type ExerciseLibraryPickerMode = "browse" | "single-select" | "multi-select";

type ExerciseLibraryPickerProps = {
  title?: string;
  subtitle?: string;
  mode?: ExerciseLibraryPickerMode;
  initialSelectedIds?: string[];
  confirmLabel?: string;
  allowCreate?: boolean;
  showUsageSummary?: boolean;
  showBrowseAll?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  onPressExercise?: (exercise: Exercise) => void;
  onConfirmSelection?: (selected: Exercise[]) => void;
  onCancel?: () => void;
};

type ExerciseLibraryListItem =
  | {
      type: "section";
      id: string;
      title: string;
      subtitle?: string;
    }
  | {
      type: "exercise";
      id: string;
      exercise: Exercise;
    }
  | {
      type: "message";
      id: string;
      title: string;
      subtitle?: string;
      tone?: "default" | "error";
    }
  | {
      type: "loading";
      id: string;
    }
  | {
      type: "browse-toggle";
      id: string;
    };

const EMPTY_SELECTED_IDS: string[] = [];

function getExerciseId(e: Exercise) {
  return e.id;
}

function getExerciseName(e: Exercise) {
  return e.name ?? "";
}

function getQuantityUnitLabel(unit: QuantityUnit) {
  return unit === "time" ? "Time" : "Reps";
}

function formatExerciseNameInput(value: string) {
  return value
    .replace(/[-\u2010\u2011\u2012\u2013\u2014\u2015]/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word[0]!.toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
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

function getExerciseSubtitle(
  usage?: ExerciseUsageSummary,
  showUsageSummary?: boolean,
): string | undefined {
  if (!showUsageSummary) return undefined;
  if (!usage || usage.sessionCount <= 0) return undefined;

  const last = usage.lastPerformedAt
    ? new Date(usage.lastPerformedAt).toLocaleDateString()
    : null;

  if (last) {
    return `${usage.sessionCount} session${usage.sessionCount === 1 ? "" : "s"} • last ${last}`;
  }

  return `${usage.sessionCount} session${usage.sessionCount === 1 ? "" : "s"}`;
}

function sameIds(a: Set<string>, b: string[]) {
  if (a.size !== b.length) return false;
  for (const id of b) {
    if (!a.has(id)) return false;
  }
  return true;
}

const ExerciseRow = React.memo(function ExerciseRow(props: {
  exercise: Exercise;
  subtitle?: string;
  selected?: boolean;
  selectable?: boolean;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const name = getExerciseName(props.exercise).trim();
  const initial = name ? name[0]!.toUpperCase() : "?";

  return (
    <Pressable
      onPress={props.onPress}
      className={`rounded-2xl border p-4 ${
        props.selected
          ? "border-neutral-900 bg-neutral-900 dark:border-[#BD93F9] dark:bg-[#BD93F9]"
          : "border-neutral-200 bg-white dark:border-[#44475A] dark:bg-[#343746]"
      }`}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row flex-1 items-center">
          <View
            className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
              props.selected
                ? "bg-white/15"
                : "bg-neutral-100 dark:bg-[#21222C]"
            }`}
          >
            {props.selectable && props.selected ? (
              <Check size={16} color={isDark ? "#282A36" : "#FFFFFF"} />
            ) : (
              <Text
                className={`text-xs font-semibold ${
                  props.selected
                    ? "text-white dark:text-[#282A36]"
                    : "text-neutral-800 dark:text-[#F8F8F2]"
                }`}
              >
                {initial}
              </Text>
            )}
          </View>

          <View className="flex-1">
            <Text
              className={`text-sm font-semibold ${
                props.selected
                  ? "text-white dark:text-[#282A36]"
                  : "text-neutral-900 dark:text-[#F8F8F2]"
              }`}
              numberOfLines={1}
            >
              {name}
            </Text>

            {props.subtitle ? (
              <Text
                className={`mt-1 text-xs ${
                  props.selected
                    ? "text-white/80 dark:text-[#282A36]"
                    : "text-neutral-500 dark:text-[#6272A4]"
                }`}
                numberOfLines={1}
              >
                {props.subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="items-end">
          <View
            className={`rounded-full px-2 py-0.5 ${
              props.selected
                ? "bg-white/15 dark:bg-[#282A36]/10"
                : "bg-neutral-100 dark:bg-[#21222C]"
            }`}
          >
            <Text
              className={`text-[10px] font-semibold ${
                props.selected
                  ? "text-white dark:text-[#282A36]"
                  : "text-neutral-500 dark:text-[#6272A4]"
              }`}
            >
              {getQuantityUnitLabel(props.exercise.quantityUnit ?? "reps")}
            </Text>
          </View>

          <Text
            className={`mt-1 text-base ${
              props.selected
                ? "text-white dark:text-[#282A36]"
                : "text-neutral-400 dark:text-[#6272A4]"
            }`}
          >
            ›
          </Text>
        </View>
      </View>
    </Pressable>
  );
}, (prev, next) => {
  return (
    getExerciseId(prev.exercise) === getExerciseId(next.exercise) &&
    prev.subtitle === next.subtitle &&
    prev.selected === next.selected &&
    prev.selectable === next.selectable
  );
});

export default function ExerciseLibraryPicker({
  title = "Exercise library",
  subtitle,
  mode = "browse",
  initialSelectedIds,
  confirmLabel = "Add exercises",
  allowCreate = false,
  showUsageSummary = false,
  showBrowseAll = true,
  emptyTitle = "No exercises",
  emptySubtitle = "Create your first exercise to get started.",
  onPressExercise,
  onConfirmSelection,
  onCancel,
}: ExerciseLibraryPickerProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const stableInitialSelectedIds = initialSelectedIds ?? EMPTY_SELECTED_IDS;

  const [options, setOptions] = useState<Exercise[]>([]);
  const [usageSummaries, setUsageSummaries] = useState<ExerciseUsageSummary[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(stableInitialSelectedIds),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseQuantityUnit, setNewExerciseQuantityUnit] =
    useState<QuantityUnit>("reps");
  const mountedRef = useRef(false);
  const loadRequestIdRef = useRef(0);

  const selectable = mode === "single-select" || mode === "multi-select";

  const initialSelectedIdsKey = useMemo(
    () => stableInitialSelectedIds.slice().sort().join("|"),
    [stableInitialSelectedIds],
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      if (sameIds(prev, stableInitialSelectedIds)) return prev;
      return new Set(stableInitialSelectedIds);
    });
  }, [initialSelectedIdsKey, stableInitialSelectedIds]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      loadRequestIdRef.current += 1;
    };
  }, []);

  const load = useCallback(
    async () => {
      const requestId = loadRequestIdRef.current + 1;
      loadRequestIdRef.current = requestId;
      setLoading(true);
      setError(null);

      try {
        const [exercises, usageRows] = await Promise.all([
          exerciseRepository.getAll(),
          showUsageSummary
            ? exerciseStatRepository.listUsageSummaries()
            : Promise.resolve([]),
        ]);

        if (!mountedRef.current || requestId !== loadRequestIdRef.current) {
          return;
        }

        setOptions(exercises ?? []);
        setUsageSummaries((usageRows ?? []) as ExerciseUsageSummary[]);
      } catch (e) {
        if (!mountedRef.current || requestId !== loadRequestIdRef.current) {
          return;
        }

        setOptions([]);
        setUsageSummaries([]);
        setError(String(e));
      } finally {
        if (mountedRef.current && requestId === loadRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [showUsageSummary],
  );

  useEffect(() => {
    void load();

    return () => {
      loadRequestIdRef.current += 1;
    };
  }, [load]);

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
    if (showUsageSummary && relevant.length > 0) return relevant.slice(0, 10);
    return allSorted.slice(0, 10);
  }, [showUsageSummary, relevant, allSorted]);

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

        if (showUsageSummary) {
          return compareByUsage(a.exercise, b.exercise, byExerciseId);
        }

        return compareByName(a.exercise, b.exercise);
      })
      .map((item) => item.exercise);
  }, [options, query, showUsageSummary, byExerciseId]);

  const toggleSelect = useCallback((exercise: Exercise) => {
    const id = getExerciseId(exercise);

    if (mode === "browse") {
      onPressExercise?.(exercise);
      return;
    }

    if (mode === "single-select") {
      setSelectedIds((prev) => {
        if (prev.size === 1 && prev.has(id)) return prev;
        return new Set([id]);
      });
      onPressExercise?.(exercise);
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [mode, onPressExercise]);

  const handleConfirm = useCallback(() => {
    if (!onConfirmSelection) return;

    const selected = options.filter((exercise) =>
      selectedIds.has(getExerciseId(exercise)),
    );

    onConfirmSelection(selected);
  }, [onConfirmSelection, options, selectedIds]);

  async function handleSubmitCreateExercise() {
    const baseName = formatExerciseNameInput(newExerciseName);
    if (!baseName) return;

    try {
      const exercise = exerciseFactory.create({
        name: baseName,
        quantityUnit: newExerciseQuantityUnit,
      });
      const saved = await exerciseRepository.save(exercise);

      await load();
      if (!mountedRef.current) return;

      if (mode === "multi-select") {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.add(saved.id);
          return next;
        });
      } else if (mode === "single-select") {
        setSelectedIds(new Set([saved.id]));
      }

      setCreateOpen(false);
      setNewExerciseName("");
      setNewExerciseQuantityUnit("reps");
      setQ("");

      if (mode !== "multi-select") {
        onPressExercise?.(saved);
      }
    } catch (e) {
      console.error("Failed to create exercise", e);
    }
  }

  const listItems = useMemo<ExerciseLibraryListItem[]>(() => {
    const items: ExerciseLibraryListItem[] = [];

    if (error) {
      items.push({
        type: "message",
        id: "error",
        title: "Failed to load exercises",
        subtitle: error,
        tone: "error",
      });
    }

    if (loading) {
      items.push({ type: "loading", id: "loading" });
      return items;
    }

    if (query) {
      if (searchResults.length === 0) {
        items.push({
          type: "message",
          id: "no-search-results",
          title: "No matching exercises",
          subtitle: "Try another keyword.",
        });
        return items;
      }

      items.push({
        type: "section",
        id: "search-results-heading",
        title: "Search results",
        subtitle: showUsageSummary
          ? "Prefix matches rank first, then recent and frequent matches"
          : "Matching exercises from the library",
      });

      for (const exercise of searchResults) {
        items.push({
          type: "exercise",
          id: `search-${getExerciseId(exercise)}`,
          exercise,
        });
      }

      return items;
    }

    items.push({
      type: "section",
      id: "featured-heading",
      title:
        showUsageSummary && relevant.length > 0 ? "Relevant to you" : "Exercises",
      subtitle:
        showUsageSummary && relevant.length > 0
          ? "Based on exercises you perform most recently and most often"
          : "Start from a smaller list instead of the full registry",
    });

    if (featured.length === 0) {
      items.push({
        type: "message",
        id: "empty-featured",
        title: emptyTitle,
        subtitle: emptySubtitle,
      });
    } else {
      for (const exercise of featured) {
        items.push({
          type: "exercise",
          id: `featured-${getExerciseId(exercise)}`,
          exercise,
        });
      }
    }

    if (showBrowseAll && browseAllRows.length > 0) {
      items.push({ type: "browse-toggle", id: "browse-toggle" });
    }

    if (showAll && browseAllRows.length > 0) {
      items.push({
        type: "section",
        id: "all-heading",
        title: "All exercises",
        subtitle: "Full list in alphabetical order",
      });

      for (const exercise of browseAllRows) {
        items.push({
          type: "exercise",
          id: `all-${getExerciseId(exercise)}`,
          exercise,
        });
      }
    }

    return items;
  }, [
    browseAllRows,
    emptySubtitle,
    emptyTitle,
    error,
    featured,
    loading,
    query,
    relevant.length,
    searchResults,
    showAll,
    showBrowseAll,
    showUsageSummary,
  ]);

  const keyExtractor = useCallback((item: ExerciseLibraryListItem) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ExerciseLibraryListItem }) => {
      if (item.type === "loading") {
        return (
          <Text className="text-xs text-neutral-500 dark:text-[#6272A4]">
            Loading...
          </Text>
        );
      }

      if (item.type === "message") {
        const isError = item.tone === "error";

        return (
          <View
            className={`rounded-2xl border p-4 ${
              isError
                ? "border-rose-200 bg-rose-50 dark:border-[#FF5555] dark:bg-[#3A3D4F]"
                : "border-neutral-200 bg-white dark:border-[#44475A] dark:bg-[#343746]"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isError
                  ? "text-rose-700 dark:text-[#FF5555]"
                  : "text-neutral-900 dark:text-[#F8F8F2]"
              }`}
            >
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text
                className={`mt-1 text-xs ${
                  isError
                    ? "text-rose-600 dark:text-[#F8F8F2]"
                    : "text-neutral-500 dark:text-[#6272A4]"
                }`}
              >
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        );
      }

      if (item.type === "section") {
        return (
          <View>
            <Text className="text-sm font-semibold text-neutral-900 dark:text-[#F8F8F2]">
              {item.title}
            </Text>
            {item.subtitle ? (
              <Text className="mt-1 text-xs text-neutral-500 dark:text-[#6272A4]">
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        );
      }

      if (item.type === "browse-toggle") {
        return (
          <Pressable
            onPress={() => setShowAll((v) => !v)}
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-[#44475A] dark:bg-[#343746]"
          >
            <Text className="text-sm font-medium text-neutral-900 dark:text-[#F8F8F2]">
              {showAll ? "Hide all exercises" : "Browse all exercises"}
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-[#6272A4]">
              {showAll
                ? "Collapse the full list"
                : "Show the complete registry in A-Z order"}
            </Text>
          </Pressable>
        );
      }

      const usage = getUsage(byExerciseId, item.exercise);
      const id = getExerciseId(item.exercise);

      return (
        <ExerciseRow
          exercise={item.exercise}
          subtitle={getExerciseSubtitle(usage, showUsageSummary)}
          selected={selectedIds.has(id)}
          selectable={selectable}
          onPress={() => toggleSelect(item.exercise)}
        />
      );
    },
    [
      byExerciseId,
      selectable,
      selectedIds,
      showAll,
      showUsageSummary,
      toggleSelect,
    ],
  );

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-semibold text-neutral-900 dark:text-[#F8F8F2]">
              {title}
            </Text>

            {subtitle ? (
              <Text className="mt-1 text-xs text-neutral-500 dark:text-[#6272A4]">
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View className="flex-row items-center gap-2">
            {onCancel ? (
              <Pressable
                onPress={onCancel}
                className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#343746]"
              >
                <X size={16} color={isDark ? "#F8F8F2" : "#111827"} />
              </Pressable>
            ) : null}

            {mode === "multi-select" && onConfirmSelection ? (
              <Pressable
                onPress={handleConfirm}
                className="rounded-full bg-neutral-900 px-4 py-2 dark:bg-[#BD93F9]"
              >
                <Text className="text-sm font-medium text-white dark:text-[#282A36]">
                  {confirmLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-[#44475A] dark:bg-[#343746]">
            <View className="flex-row items-center">
              <Search
                size={16}
                color={isDark ? "#6272A4" : "#9CA3AF"}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Search exercises"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 text-sm text-neutral-900 dark:text-[#F8F8F2]"
              />
            </View>
          </View>

          {allowCreate ? (
            <Pressable
              onPress={() => {
                setNewExerciseName(formatExerciseNameInput(q));
                setNewExerciseQuantityUnit("reps");
                setCreateOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Create new exercise"
              className="h-[50px] flex-row items-center justify-center gap-1.5 rounded-2xl bg-neutral-900 px-4 dark:bg-[#BD93F9]"
            >
              <Plus size={17} color={isDark ? "#282A36" : "#FFFFFF"} />
              <Text className="text-[13px] font-semibold text-white dark:text-[#282A36]">
                New exercise
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        className="flex-1"
        data={listItems}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View className="h-3" />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={14}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={32}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 24,
          paddingTop: 12,
        }}
      />

      {createOpen && (
        <View
          className="absolute inset-0 bg-[#21222C]/70"
          style={{ zIndex: 60 }}
        >
          <View className="absolute inset-x-8 top-32 rounded-2xl bg-white px-4 py-3 dark:bg-[#343746]">
            <Text className="mb-2 text-[13px] font-semibold text-neutral-900 dark:text-[#F8F8F2]">
              Create exercise
            </Text>

            <TextInput
              className="mb-3 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-900 dark:border-[#44475A] dark:bg-[#21222C] dark:text-[#F8F8F2]"
              placeholder="Exercise name"
              placeholderTextColor="#9CA3AF"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              autoCapitalize="words"
            />

            <View className="mb-3 flex-row rounded-xl bg-neutral-100 p-1 dark:bg-[#21222C]">
              {(["reps", "time"] as const).map((unit) => {
                const selected = newExerciseQuantityUnit === unit;

                return (
                  <Pressable
                    key={unit}
                    onPress={() => setNewExerciseQuantityUnit(unit)}
                    className={`h-9 flex-1 items-center justify-center rounded-lg ${
                      selected
                        ? "bg-white dark:bg-[#BD93F9]"
                        : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        selected
                          ? "text-neutral-900 dark:text-[#282A36]"
                          : "text-neutral-500 dark:text-[#6272A4]"
                      }`}
                    >
                      {getQuantityUnitLabel(unit)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row items-center justify-end gap-2">
              <Pressable
                onPress={() => {
                  setCreateOpen(false);
                  setNewExerciseName("");
                  setNewExerciseQuantityUnit("reps");
                }}
                className="h-7 items-center justify-center rounded-full bg-neutral-100 px-3 dark:bg-[#44475A]"
              >
                <Text className="text-[12px] text-neutral-600 dark:text-[#6272A4]">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitCreateExercise}
                className="h-7 items-center justify-center rounded-full bg-neutral-900 px-3 dark:bg-[#BD93F9]"
              >
                <Text className="text-[12px] font-medium text-white dark:text-[#282A36]">
                  Create
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
