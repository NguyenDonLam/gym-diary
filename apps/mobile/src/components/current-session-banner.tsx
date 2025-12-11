// src/features/session-workout/components/current-session-banner.tsx

import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { usePathname, useRouter } from "expo-router";
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

const COLLAPSED_OFFSET = -16; // less hidden so bigger tap area
const EXPANDED_OFFSET = 0;
const HIDDEN_OFFSET = -80;
const AUTO_COMPACT_MS = 3000;

export function CurrentSessionBanner({ dbReady, onFinish }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { ongoing, clearOngoing } = useOngoingSession();

  const [current, setCurrent] = useState<typeof ongoing>(null);
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const autoCompactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { label: timerLabel } = useSessionTimer(sessionStartMs);

  const animateTo = (y: number, fadeTo?: number) => {
    const anims: Animated.CompositeAnimation[] = [
      Animated.timing(translateY, {
        toValue: y,
        duration: 160,
        useNativeDriver: true,
      }),
    ];
    if (fadeTo != null) {
      anims.push(
        Animated.timing(opacity, {
          toValue: fadeTo,
          duration: 160,
          useNativeDriver: true,
        })
      );
    }
    Animated.parallel(anims).start();
  };

  const clearAutoCompactTimer = () => {
    if (autoCompactTimer.current) {
      clearTimeout(autoCompactTimer.current);
      autoCompactTimer.current = null;
    }
  };

  useEffect(() => {
    if (!dbReady) return;

    if (ongoing) {
      const ms = new Date(ongoing.startedAt).getTime();
      if (Number.isNaN(ms)) {
        setSessionStartMs(null);
        setCurrent(null);
        return;
      }

      clearAutoCompactTimer();

      setCurrent(ongoing);
      setSessionStartMs(ms);
      setIsExpanded(true);

      translateY.setValue(EXPANDED_OFFSET);
      opacity.setValue(1);

      autoCompactTimer.current = setTimeout(() => {
        setIsExpanded(false);
        animateTo(COLLAPSED_OFFSET);
      }, AUTO_COMPACT_MS);

      return;
    }

    if (!ongoing && current) {
      clearAutoCompactTimer();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: HIDDEN_OFFSET,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrent(null);
        setSessionStartMs(null);
        setIsExpanded(false);
      });
    }

    return () => {
      clearAutoCompactTimer();
    };
  }, [dbReady, ongoing, current, translateY, opacity]);

  if (!current || !sessionStartMs) return null;

  const { id: sessionId, name } = current;

  const handleToggleExpand = () => {
    clearAutoCompactTimer();

    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    animateTo(nextExpanded ? EXPANDED_OFFSET : COLLAPSED_OFFSET);

    if (nextExpanded) {
      autoCompactTimer.current = setTimeout(() => {
        setIsExpanded(false);
        animateTo(COLLAPSED_OFFSET);
      }, AUTO_COMPACT_MS);
    }
  };

  const handleTapBanner = () => {
    if (!isExpanded) {
      handleToggleExpand();
      return;
    }

    const target = `/session-workout/${sessionId}`;

    // If already on this session page, do nothing
    if (pathname === target) {
      return;
    }

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

      clearAutoCompactTimer();

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: HIDDEN_OFFSET,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        await db
          .update(workoutSessions)
          .set({
            endedAt,
            status: "completed",
            updatedAt: endedAt,
          })
          .where(eq(workoutSessions.id, sessionId));

        await clearOngoing();
      });
    } catch (e) {
      console.warn("[session-timer] failed to finish session", e);
    }
  };

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        zIndex: 20,
        transform: [{ translateY }],
        opacity,
      }}
      pointerEvents="box-none"
    >
      <View className="pt-1 px-4 pb-2" pointerEvents="auto">
        <View className="flex-row items-stretch gap-x-2">
          {/* banner */}
          <Pressable
            onPress={handleTapBanner}
            hitSlop={16}
            style={{ flex: 4 }}
            className={`rounded-2xl bg-slate-100 shadow-sm shadow-black/10 dark:bg-slate-900 dark:shadow-black/40 ${
              isExpanded ? "px-3 py-2" : "px-3 py-1.5"
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                <Text
                  numberOfLines={1}
                  className="flex-1 text-[11px] font-medium text-slate-900 dark:text-slate-50"
                >
                  {name ?? "Session in progress"}
                </Text>
              </View>

              <View className="items-end">
                {isExpanded ? (
                  <>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400">
                      Tap to open (auto-hide).
                    </Text>
                    <Text className="font-mono text-[13px] font-semibold text-slate-900 dark:text-slate-50">
                      {timerLabel}
                    </Text>
                  </>
                ) : (
                  <Text className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                    {timerLabel}
                  </Text>
                )}
              </View>
            </View>
          </Pressable>

          {/* finish button */}
          <Pressable
            onPress={handleFinishPress}
            hitSlop={16}
            style={{ flex: 0.9 }}
            className={`items-center justify-center rounded-2xl bg-emerald-600 shadow-sm shadow-black/25 dark:bg-emerald-500 ${
              isExpanded ? "py-1.5" : "py-1.5"
            }`}
          >
            <View className="items-center">
              <CheckCircle2 size={16} color="#ffffff" />
              {isExpanded && (
                <Text className="mt-0.5 text-[9px] font-semibold text-white">
                  Finish
                </Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
