// apps/mobile/app/session-workout/[id].tsx

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";

import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import {
  SessionExerciseCard,
  SessionExerciseView,
} from "@/src/features/session-exercise/components/form";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { sessionSetRepository } from "@/src/features/session-set/data/repository";
import { SessionStatus } from "@/src/features/session-workout/domain/types";

// Load a stored session from DB and project into view-model
async function getInitialSessionData(sessionId: string): Promise<{
  name: string | null;
  status: SessionStatus | null;
  exercises: SessionExerciseView[];
}> {
  const session = await sessionWorkoutRepository.get(sessionId);
  try {
    if (session?.status === "in_progress") {
      await AsyncStorage.setItem("ongoing", sessionId);
    }
  } catch (e) {
    console.log("[session] failed to store ongoing id", e);
  }

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

  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [exercises, setExercises] = useState<SessionExerciseView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawId = params.id;
    const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

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
  }, [params.id]);

  const readOnly = sessionStatus != null && sessionStatus !== "in_progress";

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text
            className="text-base font-semibold text-neutral-900 dark:text-neutral-50 text-center"
            numberOfLines={1}
          >
            {sessionName ?? "Session"}
          </Text>

          <View className="mt-0.5 flex-row items-center">
            <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Session
            </Text>

            {sessionStatus && (
              <View className="ml-2 px-2 py-[1px] rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <Text className="text-[10px] font-medium text-neutral-700 dark:text-neutral-200">
                  {formatStatus(sessionStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ width: 20, marginLeft: 8 }} />
      </View>

      {/* Body */}
      <ScrollView
        className="flex-1 bg-white dark:bg-neutral-950"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        {loading && exercises.length === 0 && (
          <Text className="text-center text-[12px] text-neutral-500 dark:text-neutral-400">
            Loading…
          </Text>
        )}

        {!loading && exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
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
                prev.map((e) => (e.id === next.id ? next : e))
              )
            }
            onSetCommit={async (set: SessionSet) => {
              if (readOnly) return;
              try {
                await sessionSetRepository.save(set);
              } catch (err) {
                console.error("Failed to save session set", err);
              }
            }}
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
