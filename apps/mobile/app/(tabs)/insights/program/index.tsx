// app/(tabs)/insights/program/index.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { COLOR_STRIP_MAP, WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { useWorkoutPrograms } from "@/src/features/program-workout/hooks/use-workout-programs";

function ProgramRow(props: {
  title: string;
  subtitle?: string;
  rightValue?: string;
  color?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 overflow-hidden"
    >
      <View className="flex-row">
        {/* Color strip */}
        {props.color ? (
          <View className={["w-1.5", props.color].join(" ")} />
        ) : null}

        {/* Content */}
        <View className="flex-1 p-4">
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
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Strict selectors. If your WorkoutProgram type differs, TS will force you to fix it here.
 */
const getProgramId = (p: WorkoutProgram) => p.id;
const getProgramName = (p: WorkoutProgram) => p.name;

// Optional: wire these to your stats repositories later (adherence, sessions, volume, etc.)
function getProgramSubtitle(_p: WorkoutProgram): string | undefined {
  return undefined;
}

function getProgramRightValue(_p: WorkoutProgram): string | undefined {
  return undefined;
}

export default function InsightsProgramIndexScreen() {
  const { programs, isLoading, error } = useWorkoutPrograms();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return programs;

    return programs.filter((p) =>
      getProgramName(p).toLowerCase().includes(query)
    );
  }, [programs, q]);

  function openProgram(programId: string) {
    router.push({
      pathname: "/(tabs)/insights/program/[programId]",
      params: { programId },
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      <View>
        <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Program
        </Text>
        <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Select a program to view stats
        </Text>
      </View>

      <View className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search programs"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          className="text-sm text-neutral-900 dark:text-neutral-100"
        />
      </View>

      {isLoading ? (
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          Loading…
        </Text>
      ) : error ? (
        <Text className="text-xs text-red-600">{error.message}</Text>
      ) : filtered.length === 0 ? (
        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            No programs
          </Text>
          <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Create a program first, then come back.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {filtered.map((p) => {
            const id = getProgramId(p);
            const title = getProgramName(p);

            return (
              <ProgramRow
                key={id}
                title={title}
                subtitle={getProgramSubtitle(p)}
                rightValue={getProgramRightValue(p)}
                color={COLOR_STRIP_MAP[p.color]}
                onPress={() => openProgram(id)}
              />
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
