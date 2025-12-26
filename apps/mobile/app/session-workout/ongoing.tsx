// apps/mobile/app/session-workout/ongoing.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
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

  const { ongoingSession, refresh, mutationVersion } = useOngoingSession();

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewModel | null>(null);

  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // When we have an ongoing session, show it and remember its id
  useEffect(() => {
    if (!ongoingSession) return;

    lastSessionIdRef.current = ongoingSession.id;
    setView(toView(ongoingSession, "ongoing"));
  }, [ongoingSession]);

  // When session ends (ongoing becomes null), fetch the just-finished session by last id
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
      } catch (err) {
        console.error("Failed to save session set", err);
      }
    },
    [readOnly]
  );

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text
            className="text-base font-semibold text-neutral-900 dark:text-neutral-50 text-center"
            numberOfLines={1}
          >
            {view?.name ??
              (view?.mode === "completed"
                ? "Completed session"
                : "Ongoing session")}
          </Text>

          <View className="mt-0.5 flex-row items-center">
            <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Session
            </Text>

            {view?.mode === "completed" ? (
              <View className="ml-2 px-2 py-[1px] rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                <Text className="text-[10px] font-medium text-emerald-700 dark:text-emerald-200">
                  Completed
                </Text>
              </View>
            ) : view?.status ? (
              <View className="ml-2 px-2 py-[1px] rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <Text className="text-[10px] font-medium text-neutral-700 dark:text-neutral-200">
                  {formatStatus(view.status)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={{ width: 20, marginLeft: 8 }} />
      </View>

      <ScrollView
        className="flex-1 bg-white dark:bg-neutral-950"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        {loading && !view && (
          <Text className="text-center text-[12px] text-neutral-500 dark:text-neutral-400">
            Loading…
          </Text>
        )}

        {!loading && !view && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
            No ongoing session.
          </Text>
        )}

        {!loading && view && view.exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
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
                        e.id === next.id ? next : e
                      ),
                    }
              );
            }}
            onSetCommit={onSetCommit}
          />
        ))}
      </ScrollView>
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
