// src/features/session-workout/components/current-session-banner.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";

import { useSessionTimer } from "@/src/features/program-workout/hooks/use-session-timer";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import type { FinishProgramDraftRoute } from "@/src/features/session-workout/hooks/use-ongoing-session";
import { confirmFinishSession } from "@/src/features/session-workout/ui/finish-session-prompt";

type Props = {
  dbReady: boolean;
  onFinish?: (sessionId: string) => void;
};

const COLLAPSED_OFFSET = -16;
const HIDDEN_OFFSET = -80;

export function CurrentSessionBanner({ dbReady, onFinish }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    ongoingSession,
    endSession,
    getFinishProgramSavePrompt,
    createFinishProgramDraft,
  } = useOngoingSession();

  const [current, setCurrent] = useState<typeof ongoingSession>(null);
  const [sessionStartMs, setSessionStartMs] = useState<number | null>(null);

  const translateY = useRef(new Animated.Value(HIDDEN_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const { label: timerLabel } = useSessionTimer(sessionStartMs);

  useEffect(() => {
    if (!dbReady) return;

    if (ongoingSession) {
      const ms = new Date(ongoingSession.startedAt).getTime();
      if (Number.isNaN(ms)) {
        setSessionStartMs(null);
        setCurrent(null);
        return;
      }

      setCurrent(ongoingSession);
      setSessionStartMs(ms);

      translateY.setValue(COLLAPSED_OFFSET);
      opacity.setValue(1);

      return;
    }

    if (!ongoingSession && current) {
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
      });
    }
  }, [dbReady, ongoingSession, current, translateY, opacity]);

  if (!current || !sessionStartMs) return null;

  const { id: sessionId, name } = current;

  const handleTapBanner = () => {
    const target = `/session-workout/${sessionId}`;
    if (pathname === target) return;

    router.push({
      pathname: "/session-workout/[id]",
      params: { id: sessionId },
    });
  };

  const openProgramDraft = (draft: FinishProgramDraftRoute) => {
    if (draft.kind === "edit") {
      router.push({
        pathname: "/program-workout/[id]",
        params: { id: draft.programId, draftKey: draft.draftKey },
      });
      return;
    }

    router.push({
      pathname: "/program-workout/new",
      params: { draftKey: draft.draftKey },
    });
  };

  const handleFinishPress = async () => {
    if (!sessionId) return;

    if (onFinish) {
      onFinish(sessionId);
      return;
    }

    void confirmFinishSession({
      getPrompt: getFinishProgramSavePrompt,
      createProgramDraft: createFinishProgramDraft,
      finish: () =>
        new Promise<void>((resolve, reject) => {
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
            endSession().then(resolve).catch(reject);
          });
        }),
      onFinished: ({ draft }) => {
        if (draft) openProgramDraft(draft);
      },
      onError: (e) => {
        console.warn("[current-session-banner] failed to finish session", e);
      },
    });
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
          <Pressable
            onPress={handleTapBanner}
            hitSlop={16}
            style={{ flex: 4 }}
            className="rounded-2xl bg-slate-100 shadow-sm shadow-black/10 dark:bg-slate-900 dark:shadow-black/40 px-3 py-1.5"
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

              <Text className="font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                {timerLabel}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleFinishPress}
            hitSlop={16}
            style={{ flex: 0.9 }}
            className="items-center justify-center rounded-2xl bg-emerald-600 shadow-sm shadow-black/25 dark:bg-emerald-500 py-1.5"
          >
            <CheckCircle2 size={16} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
