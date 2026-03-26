// apps/mobile/app/session-workout/ongoing.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import type {
  SessionWorkout,
  SessionStatus,
} from "@/src/features/session-workout/domain/types";

import {
  SessionExerciseCard,
  SessionExerciseView,
} from "@/src/features/session-exercise/components/form";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import { sessionSetRepository } from "@/src/features/session-set/data/repository";

import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";
import type { Exercise } from "@packages/exercise/type";
import { SessionExerciseFactory } from "@/src/features/session-exercise/domain/factory";
import { sessionExerciseRepository } from "@/src/features/session-exercise/data/repository";

type ViewModel = {
  id: string;
  name: string | null;
  status: SessionStatus | null;
  exercises: SessionExerciseView[];
  mode: "ongoing" | "completed";
};

function toView(session: SessionWorkout, mode: ViewModel["mode"]): ViewModel {
  return {
    id: session.id,
    name: session.name ?? null,
    status: session.status ?? null,
    exercises: (session.exercises ?? []).map((ex) => ({ ...ex, isOpen: true })),
    mode,
  };
}

export default function OngoingSessionPage() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const isDark = colorScheme === "dark";

  const { ongoingSession, refresh, mutationVersion, bumpMutationVersion } =
    useOngoingSession();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewModel | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ongoingSession) return;

    lastSessionIdRef.current = ongoingSession.id;
    setView(toView(ongoingSession, "ongoing"));
  }, [ongoingSession?.id, mutationVersion]);

  useEffect(() => {
    if (ongoingSession) return;

    const id = lastSessionIdRef.current;
    if (!id) {
      setView(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const s = await sessionWorkoutRepository.get(id);
        if (cancelled) return;

        if (!s) {
          setView(null);
          return;
        }

        setView(toView(s, "completed"));
      } catch {
        if (!cancelled) setView(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ongoingSession, mutationVersion]);

  const readOnly = view?.mode === "completed";

  const onSetCommit = useCallback(
    async (set: SessionSet) => {
      if (readOnly) return;

      try {
        await sessionSetRepository.save(set);
        await refresh();
        bumpMutationVersion();
      } catch (err) {
        console.error("Failed to save session set", err);
      }
    },
    [readOnly, refresh, bumpMutationVersion],
  );

  const handleAddExercises = useCallback(
    async (selectedExercises: Exercise[]) => {
      if (readOnly || !view) return;

      try {
        const created: SessionExerciseView[] = [];

        for (const [index, exercise] of selectedExercises.entries()) {
          const domain = SessionExerciseFactory.domainFromExercise(exercise, {
            workoutSessionId: view.id,
            orderIndex: view.exercises.length + index,
          });

          await sessionExerciseRepository.save(domain);

          created.push({
            ...domain,
            isOpen: true,
            lastSessionSets: [],
          });
        }

        const nextExercises = [...view.exercises, ...created];

        setView((prev) =>
          !prev
            ? prev
            : {
                ...prev,
                exercises: nextExercises,
              },
        );

        setPickerOpen(false);
      } catch (err) {
        console.error("Failed to add exercises", err);
      }
    },
    [readOnly, view],
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
            {view?.name ??
              (view?.mode === "completed"
                ? "Completed session"
                : "Ongoing session")}
          </Text>

          <View className="mt-0.5 flex-row items-center">
            <Text className="text-[11px] text-neutral-500 dark:text-[#6272A4]">
              Session
            </Text>

            {view?.mode === "completed" ? (
              <View className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-[1px] dark:border-[#44475A] dark:bg-[#343746]">
                <Text className="text-[10px] font-medium text-emerald-700 dark:text-[#50FA7B]">
                  Completed
                </Text>
              </View>
            ) : view?.status ? (
              <View className="ml-2 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-[1px] dark:border-[#44475A] dark:bg-[#343746]">
                <Text className="text-[10px] font-medium text-neutral-700 dark:text-[#F8F8F2]">
                  {formatStatus(view.status)}
                </Text>
              </View>
            ) : null}
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
        {loading && !view && (
          <Text className="text-center text-[12px] text-neutral-500 dark:text-[#6272A4]">
            Loading…
          </Text>
        )}

        {!loading && !view && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-[#6272A4]">
            No ongoing session.
          </Text>
        )}

        {!loading && view && view.exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-[#6272A4]">
            No exercises in this session.
          </Text>
        )}

        {view?.exercises.map((ex) => (
          <SessionExerciseCard
            key={ex.id}
            value={ex}
            readOnly={readOnly}
            onChange={(next) => {
              if (readOnly) return;
              setView((prev) =>
                !prev
                  ? prev
                  : {
                      ...prev,
                      exercises: prev.exercises.map((e) =>
                        e.id === next.id ? next : e,
                      ),
                    },
              );
            }}
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
