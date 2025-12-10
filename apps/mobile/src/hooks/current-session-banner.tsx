// src/features/session-workout/components/current-session-banner.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import { useSessionTimer } from "@/src/features/program-workout/hooks/use-session-timer";

type Props = {
  dbReady: boolean;
};

export function CurrentSessionBanner({ dbReady }: Props) {
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);

  const { label: timerLabel } = useSessionTimer(sessionStartMs);

  useEffect(() => {
    if (!dbReady) return;

    let cancelled = false;

    const load = async () => {
      try {
        const ongoingId = await AsyncStorage.getItem("ongoing");
        if (!ongoingId) {
          if (!cancelled) {
            setSessionId(null);
            setSessionStartMs(null);
          }
          return;
        }

        const session = await sessionWorkoutRepository.get(ongoingId);
        if (!session || !session.startedAt) {
          if (!cancelled) {
            setSessionId(null);
            setSessionStartMs(null);
          }
          return;
        }

        const ms = new Date(session.startedAt as any).getTime();
        if (Number.isNaN(ms)) {
          if (!cancelled) {
            setSessionId(null);
            setSessionStartMs(null);
          }
          return;
        }

        if (!cancelled) {
          setSessionId(ongoingId);
          setSessionStartMs(ms);
        }
      } catch (e) {
        console.warn("[session-timer] failed to load ongoing session", e);
        if (!cancelled) {
          setSessionId(null);
          setSessionStartMs(null);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [dbReady]);

  if (!sessionId || !sessionStartMs) return null;

  const shortId = sessionId.length > 6 ? sessionId.slice(0, 6) : sessionId;

  const handlePress = () => {
    router.push({
      pathname: "/session-workout/[id]",
      params: { id: sessionId },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mx-4 mb-2 mt-1 rounded-2xl bg-slate-100 px-3 py-2 shadow-sm shadow-black/10 dark:bg-slate-900 dark:shadow-black/40"
      hitSlop={8}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <View>
            <Text className="text-[11px] font-medium text-slate-900 dark:text-slate-50">
              Session in progress
            </Text>
            <Text className="text-[10px] text-slate-500 dark:text-slate-400">
              #{shortId}
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="text-[10px] text-slate-500 dark:text-slate-400">
            Elapsed
          </Text>
          <Text className="font-mono text-[14px] font-semibold text-slate-900 dark:text-slate-50">
            {timerLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
