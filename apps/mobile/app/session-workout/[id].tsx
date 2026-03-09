// apps/mobile/app/session-workout/[id].tsx

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import {
  SessionExerciseCard,
  SessionExerciseView,
} from "@/src/features/session-exercise/components/form";
import { sessionExerciseRepository } from "@/src/features/session-exercise/data/repository";
import { SessionStatus } from "@/src/features/session-workout/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import { sessionSetRepository } from "@/src/features/session-set/data/repository";
import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";
import type { Exercise } from "@packages/exercise/type";
import { SessionExerciseFactory } from "@/src/features/session-exercise/domain/factory";

// Load a stored session from DB and project into view-model
async function getInitialSessionData(sessionId: string): Promise<{
  name: string | null;
  status: SessionStatus | null;
  exercises: SessionExerciseView[];
}> {
  const session = await sessionWorkoutRepository.get(sessionId);

  if (!session || !session.exercises) {
    return {
      name: session?.name ?? null,
      status: session?.status ?? null,
      exercises: [],
    };
  }

  return {
    name: session.name ?? null,
    status: session.status ?? null,
    exercises: session.exercises.map((ex) => ({
      ...ex,
      isOpen: true,
    })),
  };
}

export default function SessionWorkoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const isDark = colorScheme === "dark";

  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  );
  const [exercises, setExercises] = useState<SessionExerciseView[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { name, status, exercises } =
          await getInitialSessionData(sessionId);
        if (cancelled) return;
        setSessionName(name ?? null);
        setSessionStatus(status ?? null);
        setExercises(exercises);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const readOnly = sessionStatus !== "in_progress";

  const onSetCommit = useCallback(
    async (set: SessionSet) => {
      if (readOnly) return;
      try {
        await sessionSetRepository.save(set);
      } catch (err) {
        console.error("Failed to save session set", err);
      }
    },
    [readOnly],
  );

  const handleAddExercises = useCallback(
    async (selectedExercises: Exercise[]) => {
      if (readOnly || !sessionId) return;

      try {
        const created: SessionExerciseView[] = [];

        for (const [index, exercise] of selectedExercises.entries()) {
          const domain = SessionExerciseFactory.domainFromExercise(exercise, {
            workoutSessionId: sessionId,
            orderIndex: exercises.length + index,
          });

          await sessionExerciseRepository.save(domain);

          created.push({
            ...domain,
            isOpen: true,
            lastSessionSets: [],
          });
        }

        setExercises((prev) => [...prev, ...created]);
        setPickerOpen(false);
      } catch (err) {
        console.error("Failed to add exercises", err);
      }
    },
    [readOnly, sessionId, exercises.length],
  );

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <View className="flex-row items-center justify-between border-b border-zinc-200 bg-white px-4 pb-2 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text
            className="text-center text-base font-semibold text-neutral-900 dark:text-[#F8F8F2]"
            numberOfLines={1}
          >
            {sessionName ?? "Session"}
          </Text>

          <View className="mt-0.5 flex-row items-center">
            <Text className="text-[11px] text-neutral-500 dark:text-[#6272A4]">
              Session
            </Text>

            {sessionStatus && (
              <View className="ml-2 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-[1px] dark:border-[#44475A] dark:bg-[#343746]">
                <Text className="text-[10px] font-medium text-neutral-700 dark:text-[#F8F8F2]">
                  {formatStatus(sessionStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ width: 20, marginLeft: 8 }} />
      </View>

      <ScrollView
        className="flex-1 bg-white dark:bg-[#2B2D3A]"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: readOnly ? 24 : 96,
        }}
      >
        {loading && exercises.length === 0 && (
          <Text className="text-center text-[12px] text-neutral-500 dark:text-[#6272A4]">
            Loading…
          </Text>
        )}

        {!loading && exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-[#6272A4]">
            No exercises in this session.
          </Text>
        )}

        {exercises.map((ex) => (
          <SessionExerciseCard
            key={ex.id}
            value={ex}
            readOnly={readOnly}
            onChange={(next) =>
              setExercises((prev) =>
                prev.map((e) => (e.id === next.id ? next : e)),
              )
            }
            onSetCommit={onSetCommit}
          />
        ))}
      </ScrollView>

      {!readOnly ? (
        <View className="border-t border-zinc-200 bg-white px-4 py-3 dark:border-[#44475A] dark:bg-[#21222C]">
          <Pressable
            onPress={() => setPickerOpen(true)}
            className="h-12 flex-row items-center justify-center rounded-2xl bg-neutral-900 dark:bg-[#BD93F9]"
          >
            <Plus size={16} color={isDark ? "#282A36" : "#FFFFFF"} />
            <Text className="ml-2 text-sm font-medium text-white dark:text-[#282A36]">
              Add exercise
            </Text>
          </Pressable>
        </View>
      ) : null}

      {pickerOpen && !readOnly ? (
        <View className="absolute inset-0 z-50">
          <ExerciseLibraryPicker
            title="Add exercises"
            subtitle="Select exercises for this session"
            mode="multi-select"
            confirmLabel="Add to session"
            allowCreate
            showUsageSummary
            showBrowseAll
            onCancel={() => setPickerOpen(false)}
            onConfirmSelection={handleAddExercises}
          />
        </View>
      ) : null}
    </View>
  );
}

function formatStatus(status: string | null) {
  if (!status) return null;
  return status
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
