// src/features/history/components/session-row.tsx
import React, { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import {
  ChevronRight,
  Clock3,
  Timer,
  Dumbbell,
  Flame,
  Check,
} from "lucide-react-native";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import {
  COLOR_STRIP_MAP,
  type ProgramColor,
} from "@/src/features/program-workout/domain/type";

import {
  getSessionInsightsWithBaseline,
  type SessionExtractors,
} from "../ui/session-insights";

/**
 * TEMP / DUMMY extractors
 * Replace these with real field paths once SessionWorkout is fully hydrated
 */
const extractors: SessionExtractors<SessionWorkout, any, any> = {
  getStartedAt: (s) => s.startedAt,
  getEndedAt: (s) => s.endedAt ?? null,

  getExercises: (s: any) => s.exercises ?? [],
  getSets: (ex: any) => ex.sets ?? [],

  getLoad: (set: any) => set.loadValue ?? null,
  getReps: (set: any) => set.targetQuantity ?? null,

  isCountableSet: (set: any) => !set.isWarmup,
};

type Props = {
  session: SessionWorkout;
  isActive?: boolean;
  onPress: () => void;
  onDeletePress?: () => void;
};

const Chip = memo(function Chip({
  icon,
  label,
  variant,
}: {
  icon: React.ReactNode;
  label?: string;
  variant?: "neutral" | "good";
}) {
  const bg =
    variant === "good"
      ? "bg-emerald-100 dark:bg-emerald-900/30"
      : "bg-zinc-100 dark:bg-zinc-800";

  const text =
    variant === "good"
      ? "text-emerald-800 dark:text-emerald-200"
      : "text-zinc-700 dark:text-zinc-200";

  return (
    <View
      className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${bg}`}
    >
      {icon}
      {label ? <Text className={`text-[11px] ${text}`}>{label}</Text> : null}
    </View>
  );
});

export const SessionRow = memo(function SessionRow({
  session,
  isActive,
  onPress,
}: Props) {
  const color = (session.sourceProgram?.color ?? "neutral") as ProgramColor;
  const stripClass = COLOR_STRIP_MAP[color];

  /**
   * TEMP / DUMMY baseline session
   * Simulates a weaker previous session for visual comparison
   */
  const baselineSession = useMemo(() => {
    const cloned: any = JSON.parse(JSON.stringify(session));
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    cloned.startedAt = new Date(session.startedAt.getTime() - weekMs);
    cloned.endedAt = session.endedAt
      ? new Date(session.endedAt.getTime() - weekMs)
      : null;

    // if no exercises exist on session, inject dummy ones so comparisons render
    if (!Array.isArray(cloned.exercises) || cloned.exercises.length === 0) {
      cloned.exercises = [
        {
          sets: [
            { loadValue: 40, targetQuantity: 8, isWarmup: false },
            { loadValue: 40, targetQuantity: 8, isWarmup: false },
            { loadValue: 40, targetQuantity: 8, isWarmup: false },
          ],
        },
      ];
      return cloned;
    }

    // otherwise scale down existing sets
    for (const ex of cloned.exercises) {
      for (const set of ex?.sets ?? []) {
        if (typeof set.loadValue === "number")
          set.loadValue = Math.round(set.loadValue * 0.9);
        if (typeof set.targetQuantity === "number")
          set.targetQuantity = Math.max(
            1,
            Math.round(set.targetQuantity * 0.9)
          );
      }
    }

    return cloned;
  }, [session]);


  const insights = useMemo(() => {
    return getSessionInsightsWithBaseline(session, baselineSession, extractors);
  }, [session, baselineSession]);

  return (
    <Pressable
      className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-slate-900 ${
        isActive ? "opacity-80" : ""
      }`}
      onPress={onPress}
      hitSlop={2}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`mr-3 h-7 w-1 rounded-full ${stripClass}`} />

          <View className="shrink">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-slate-50">
              {session.name ?? "Session"}
            </Text>

            <View className="mt-1 flex-row flex-wrap gap-2">
              <Chip
                icon={<Clock3 width={14} height={14} color="#9CA3AF" />}
                label={insights.startLabel}
              />
              <Chip
                icon={<Timer width={14} height={14} color="#9CA3AF" />}
                label={insights.durationLabel}
              />
              <Chip
                icon={<Dumbbell width={14} height={14} color="#9CA3AF" />}
                label={insights.setDeltaPctLabel}
              />
              <Chip
                icon={<Flame width={14} height={14} color="#9CA3AF" />}
                label={insights.volumeDeltaPctLabel}
              />
              {insights.isCompleted && (
                <Chip
                  variant="good"
                  icon={<Check width={14} height={14} color="#059669" />}
                />
              )}
            </View>
          </View>
        </View>

        <ChevronRight width={16} height={16} color="#9CA3AF" />
      </View>
    </Pressable>
  );
});
