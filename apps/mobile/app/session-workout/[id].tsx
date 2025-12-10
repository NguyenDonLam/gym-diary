// apps/mobile/app/session-workout/[id].tsx

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import {
  SessionExerciseCard,
  SessionExerciseView,
} from "@/src/features/session-exercise/components/form";

// Load a stored session from DB and project into view-model
async function getInitialExercisesFromSession(
  sessionId: string
): Promise<SessionExerciseView[]> {
  try {
    await AsyncStorage.setItem("ongoing", sessionId);
  } catch (e) {
    console.log("[session] failed to store ongoing id", e);
  }

  const session = await sessionWorkoutRepository.get(sessionId);

  if (!session || !session.exercises) return [];

  // just copy domain exercises, add local UI flag
  return session.exercises.map((ex) => ({
    ...ex,
    isOpen: true,
  }));
}

export default function SessionWorkoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

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
        const rows = await getInitialExercisesFromSession(sessionId);
        if (cancelled) return;
        setExercises(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-200">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color="#111827" />
        </Pressable>

        <View className="flex-1 mr-2">
          <Text className="text-[11px] text-neutral-500">Session</Text>
          <Text
            className="text-base font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {sessionId ?? "Session"}
          </Text>
        </View>

        <Pressable className="rounded-full bg-neutral-900 px-3 py-1.5">
          <Text className="text-[12px] font-semibold text-white">Finish</Text>
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        {loading && exercises.length === 0 && (
          <Text className="text-center text-[12px] text-neutral-500">
            Loading…
          </Text>
        )}

        {!loading && exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500">
            No exercises in this session.
          </Text>
        )}

        {exercises.map((ex) => (
          <SessionExerciseCard
            key={ex.id}
            value={ex}
            onChange={(next) =>
              setExercises((prev) =>
                prev.map((e) => (e.id === next.id ? next : e))
              )
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
