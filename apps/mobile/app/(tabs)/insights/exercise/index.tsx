// app/(tabs)/insights/exercise/index.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Exercise } from "@packages/exercise/type";
import { useExercises } from "@/src/features/exercise/hooks/use-exercises";

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

/**
 * IMPORTANT:
 * These selectors must match your Exercise type exactly.
 * If Exercise doesn’t have `id` or `name`, TypeScript will fail here (by design),
 * forcing you to map to the correct fields without guessing.
 */
const getExerciseId = (e: Exercise) => e.id;
const getExerciseName = (e: Exercise) => e.name;

// Optional: plug in your stats preview here (e.g. sets/volume in current lens).
// Keep it pure; return undefined if you don’t have it yet.
function getExerciseRightValue(_e: Exercise): string | undefined {
  return undefined;
}

function getExerciseSubtitle(_e: Exercise): string | undefined {
  return undefined;
}

export default function InsightsExerciseIndexScreen() {
  const { options, loading } = useExercises();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return options;

    return options.filter((e) =>
      getExerciseName(e).toLowerCase().includes(query)
    );
  }, [options, q]);

  function openExercise(exerciseId: string) {
    router.push({
      pathname: "/(tabs)/insights/exercise/[exerciseId]",
      params: { exerciseId },
    });
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
          Select an exercise to view stats
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

      {loading ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          Loading…
        </Text>
      ) : filtered.length === 0 ? (
        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            No exercises
          </Text>
          <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Log a session first, then come back.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {filtered.map((e) => {
            const id = getExerciseId(e);
            const title = getExerciseName(e);

            return (
              <ExerciseRow
                key={id}
                title={title}
                subtitle={getExerciseSubtitle(e)}
                rightValue={getExerciseRightValue(e)}
                onPress={() => openExercise(id)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
