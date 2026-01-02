// src/features/history/components/session-row.tsx
import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, Clock3, Timer, Flame, Check } from "lucide-react-native";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import { COLOR_STRIP_MAP } from "@/src/features/program-workout/domain/type";

type Props = {
  session: SessionWorkout;
  isActive?: boolean;
  onPress: () => void;
  onDeletePress?: () => void;
};

const CHIP_STYLES = {
  neutral: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-200",
  },
  good: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  bad: {
    bg: "bg-rose-100 dark:bg-rose-900/25",
    text: "text-rose-800 dark:text-rose-200",
  },
} as const;

const Chip = memo(function Chip({
  icon,
  label,
  variant = "neutral",
}: {
  icon: React.ReactNode;
  label?: string;
  variant?: keyof typeof CHIP_STYLES;
}) {
  const s = CHIP_STYLES[variant];
  return (
    <View
      className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${s.bg}`}
    >
      {icon}
      {label ? <Text className={`text-[11px] ${s.text}`}>{label}</Text> : null}
    </View>
  );
});

export const SessionRow = memo(function SessionRow({
  session,
  isActive,
  onPress,
}: Props) {
  const ICON = "#9CA3AF";
  const handleTap = onPress;

  const color = session.sourceProgram?.color ?? "neutral";
  const stripClass = COLOR_STRIP_MAP[color];

  const startedAt = session.startedAt;
  const endedAt = session.endedAt ?? null;

  const startLabel = startedAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  let durationLabel = "—";
  if (endedAt) {
    const ms = endedAt.getTime() - startedAt.getTime();
    if (Number.isFinite(ms) && ms > 0) {
      const mins = Math.round(ms / 60000);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      durationLabel = h <= 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
  }

  let growthLabel = "SS —";
  let growthVariant: "neutral" | "good" | "bad" = "neutral";
  const norm = session.strengthScore;
  if (norm != null && Number.isFinite(norm) && norm > 0) {
    const pct = (norm - 1) * 100;
    if (Number.isFinite(pct)) {
      const sign = pct >= 0 ? "+" : "";
      growthLabel = `${sign}${pct.toFixed(2)}%`;
      growthVariant = pct > 0.0001 ? "good" : pct < -0.0001 ? "bad" : "neutral";
    }
  }

  const isCompleted = session.status === "completed";

  return (
    <Pressable
      className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-slate-900 ${isActive ? "opacity-80" : ""}`}
      onPress={handleTap}
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
                icon={<Clock3 width={14} height={14} color={ICON} />}
                label={startLabel}
              />
              <Chip
                icon={<Timer width={14} height={14} color={ICON} />}
                label={durationLabel}
              />
              <Chip
                variant={growthVariant}
                icon={<Flame width={14} height={14} color={ICON} />}
                label={growthLabel}
              />
              {isCompleted ? (
                <Chip
                  variant="good"
                  icon={<Check width={14} height={14} color="#059669" />}
                />
              ) : null}
            </View>
          </View>
        </View>

        <ChevronRight width={16} height={16} color={ICON} />
      </View>
    </Pressable>
  );
});
