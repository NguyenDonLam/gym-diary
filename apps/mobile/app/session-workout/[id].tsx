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
import {
  sessionExerciseRepository,
  type SessionExerciseProgressHistoryPoint,
} from "@/src/features/session-exercise/data/repository";
import type {
  SessionStatus,
  SessionWorkout,
} from "@/src/features/session-workout/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import { sessionSetRepository } from "@/src/features/session-set/data/repository";
import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";
import type { Exercise } from "@gym-diary/exercise/type";
import { SessionExerciseFactory } from "@/src/features/session-exercise/domain/factory";
import { useKeyboardHeight } from "@/src/hooks/use-keyboard-height";
import { RestTimerBanner } from "@/src/features/session-workout/components/rest-timer-banner";
import { findRestTimerTargetForSet } from "@/src/features/session-workout/domain/rest-timer-target";
import { useRestTimer } from "@/src/features/session-workout/hooks/use-rest-timer";
import { normalizeRestSeconds } from "@/src/features/program-set/domain/rest";

type ProgressHistoryLookup = Record<
  string,
  SessionExerciseProgressHistoryPoint[]
>;

type SetCommitEvent = {
  becameCompleted: boolean;
};

async function getProgressHistoryLookup(
  exercises: { exerciseId: string | null }[],
): Promise<ProgressHistoryLookup> {
  const exerciseIds = exercises
    .map((ex) => ex.exerciseId)
    .filter((id): id is string => Boolean(id));

  return sessionExerciseRepository.getProgressHistoryByExerciseIds(exerciseIds);
}

function toExerciseViews(
  exercises: SessionWorkout["exercises"],
  progressHistoryByExerciseId: ProgressHistoryLookup,
): SessionExerciseView[] {
  return (exercises ?? []).map((ex) => ({
    ...ex,
    isOpen: true,
    isProgressOpen: false,
    progressHistory: ex.exerciseId
      ? progressHistoryByExerciseId[ex.exerciseId] ?? []
      : [],
  }));
}

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

  const progressHistoryByExerciseId = await getProgressHistoryLookup(
    session.exercises,
  );

  return {
    name: session.name ?? null,
    status: session.status ?? null,
    exercises: toExerciseViews(session.exercises, progressHistoryByExerciseId),
  };
}

export default function SessionWorkoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const isDark = colorScheme === "dark";
  const { startRestTimer } = useRestTimer();

  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null,
  );
  const [exercises, setExercises] = useState<SessionExerciseView[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const keyboardHeight = useKeyboardHeight();

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
  const scrollBottomPadding = readOnly
    ? 24
    : keyboardHeight > 0
      ? keyboardHeight + 120
      : 96;

  const startRestAfterCompletedSet = useCallback(
    (set: SessionSet, event?: SetCommitEvent) => {
      if (readOnly || set.isCompleted !== true) return;
      if (event && !event.becameCompleted) return;

      const currentTarget = findRestTimerTargetForSet(exercises, set.id);
      if (!currentTarget) return;

      const durationSeconds = normalizeRestSeconds(set.restSeconds);
      if (durationSeconds <= 0) return;

      void startRestTimer({
        sessionId: currentTarget.sessionId,
        setId: set.id,
        exerciseName: currentTarget.exerciseName,
        setIndex: currentTarget.setIndex,
        durationSeconds,
        source: "auto",
      });
    },
    [exercises, readOnly, startRestTimer],
  );

  const onSetCommit = useCallback(
    async (set: SessionSet, event?: SetCommitEvent) => {
      if (readOnly) return;
      try {
        startRestAfterCompletedSet(set, event);
        await sessionSetRepository.save(set);
      } catch (err) {
        console.error("Failed to save session set", err);
      }
    },
    [readOnly, startRestAfterCompletedSet],
  );

  const onSetAdd = useCallback(
    async (set: SessionSet) => {
      if (readOnly) return;

      try {
        await sessionSetRepository.save(set);
      } catch (err) {
        console.error("Failed to add session set", err);
        throw err;
      }
    },
    [readOnly],
  );

  const handleAddExercises = useCallback(
    async (selectedExercises: Exercise[]) => {
      if (readOnly || !sessionId) return;

      try {
        const created: SessionExerciseView[] = [];
        const progressHistoryByExerciseId =
          await sessionExerciseRepository.getProgressHistoryByExerciseIds(
            selectedExercises.map((exercise) => exercise.id),
          );

        for (const [index, exercise] of selectedExercises.entries()) {
          const domain = SessionExerciseFactory.domainFromExercise(exercise, {
            workoutSessionId: sessionId,
            orderIndex: exercises.length + index,
          });

          await sessionExerciseRepository.save(domain);

          created.push({
            ...domain,
            isOpen: true,
            isProgressOpen: false,
            progressHistory: progressHistoryByExerciseId[exercise.id] ?? [],
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

      <RestTimerBanner sessionId={sessionId} />

      <ScrollView
        className="flex-1 bg-white dark:bg-[#2B2D3A]"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: scrollBottomPadding,
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
            onSetAdd={onSetAdd}
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
