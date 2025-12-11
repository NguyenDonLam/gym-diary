// src/features/session-workout/components/current-session-banner.tsx

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { eq } from "drizzle-orm";

import { useSessionTimer } from "@/src/features/program-workout/hooks/use-session-timer";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";

type Props = {
  dbReady: boolean;
  onFinish?: (sessionId: string) => void;
};

export function CurrentSessionBanner({ dbReady, onFinish }: Props) {
  const router = useRouter();
  const { ongoing, clearOngoing } = useOngoingSession();

  // keep a local copy so we can animate out even after ongoing === null
  const [current, setCurrent] = useState<typeof ongoing>(null);
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const { label: timerLabel } = useSessionTimer(sessionStartMs);

  useEffect(() => {
    if (!dbReady) return;

    // new / updated ongoing session -> snap into place
    if (ongoing) {
      const ms = new Date(ongoing.startedAt).getTime();
      if (Number.isNaN(ms)) {
        setSessionStartMs(null);
        setCurrent(null);
        return;
      }

      // reset animation state for showing
      translateY.setValue(0);
      opacity.setValue(1);

      setCurrent(ongoing);
      setSessionStartMs(ms);
      return;
    }

    // ongoing turned null, but we still have a current banner -> animate out
    if (!ongoing && current) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -16, // slide up a bit
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrent(null);
        setSessionStartMs(null);
      });
    }
  }, [dbReady, ongoing, current, opacity, translateY]);

  if (!current || !sessionStartMs) return null;

  const { id: sessionId, name } = current;

  const handlePress = () => {
    router.push({
      pathname: "/session-workout/[id]",
      params: { id: sessionId },
    });
  };

  const handleFinishPress = async () => {
    if (!sessionId) return;

    if (onFinish) {
      onFinish(sessionId);
      return;
    }

    try {
      const endedAt = new Date().toISOString();

      await db
        .update(workoutSessions)
        .set({
          endedAt,
          status: "completed",
          updatedAt: endedAt,
        })
        .where(eq(workoutSessions.id, sessionId));

      // this triggers the "animate out" branch above
      await clearOngoing();
    } catch (e) {
      console.warn("[session-timer] failed to finish session", e);
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity,
      }}
      className="mx-4 mb-2 mt-1 flex-row items-stretch gap-x-2"
    >
      {/* 4/5 width: banner */}
      <Pressable
        onPress={handlePress}
        hitSlop={8}
        style={{ flex: 4 }}
        className="rounded-2xl bg-slate-100 px-3 py-2 shadow-sm shadow-black/10 dark:bg-slate-900 dark:shadow-black/40"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <View>
              <Text className="text-[11px] font-medium text-slate-900 dark:text-slate-50">
                {name ?? "Session in progress"}
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

      {/* 1/5 width: finish button */}
      <Pressable
        onPress={handleFinishPress}
        hitSlop={8}
        style={{ flex: 1 }}
        className="items-center justify-center rounded-2xl bg-emerald-600 shadow-sm shadow-black/25 dark:bg-emerald-500"
      >
        <View className="items-center">
          <CheckCircle2 size={18} color="#ffffff" />
          <Text className="mt-1 text-[10px] font-semibold text-white">
            Finish
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
