// apps/mobile/app/session-workout/ongoing.tsx

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import {
  SessionExerciseCard,
  SessionExerciseView,
} from "@/src/features/session-exercise/components/form";
import type { SessionStatus } from "@/src/features/session-workout/domain/types";
import type { SessionSet } from "@/src/features/session-set/domain/types";
import { sessionSetRepository } from "@/src/features/session-set/data/repository";

function projectToView(session: {
  name?: string | null;
  status?: SessionStatus | null;
  exercises?: SessionExerciseView[] | null;
}): {
  name: string | null;
  status: SessionStatus | null;
  exercises: SessionExerciseView[];
} {
  const exercises = (session.exercises ?? []).map((ex: SessionExerciseView) => ({
    ...ex,
    isOpen: true,
  })) as SessionExerciseView[];

  return {
    name: (session.name as string | null) ?? null,
    status: (session.status as SessionStatus | null) ?? null,
    exercises,
  };
}

export default function OngoingSessionPage() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";

  const { ongoingSession, refresh } = useOngoingSession();

  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(
    null
  );
  const [exercises, setExercises] = useState<SessionExerciseView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!ongoingSession) {
      setSessionName(null);
      setSessionStatus(null);
      setExercises([]);
      return;
    }

    const v = projectToView(ongoingSession);
    setSessionName(v.name);
    setSessionStatus(v.status);
    setExercises(v.exercises);
  }, [ongoingSession]);

  const readOnly = false;

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
            {sessionName ?? "Ongoing session"}
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

        {!loading && !ongoingSession && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500 dark:text-neutral-400">
            No ongoing session.
          </Text>
        )}

        {!loading && ongoingSession && exercises.length === 0 && (
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
