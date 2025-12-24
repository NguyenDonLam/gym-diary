// src/features/history/components/session-row.tsx
import React, { memo, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronRight, Clock3, Timer, Flame, Check } from "lucide-react-native";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import {
  COLOR_STRIP_MAP,
  type ProgramColor,
} from "@/src/features/program-workout/domain/type";

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
  variant?: "neutral" | "good" | "bad";
}) {
  const bg =
    variant === "good"
      ? "bg-emerald-100 dark:bg-emerald-900/30"
      : variant === "bad"
        ? "bg-rose-100 dark:bg-rose-900/25"
        : "bg-zinc-100 dark:bg-zinc-800";

  const text =
    variant === "good"
      ? "text-emerald-800 dark:text-emerald-200"
      : variant === "bad"
        ? "text-rose-800 dark:text-rose-200"
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

function fmtTime(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDuration(start: Date, end: Date | null | undefined) {
  if (!end) return "—";
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "—";
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// strengthScore is already normalized ratio vs previous (e.g. 1.005 => +0.50%)
function growthFromNormalizedStrengthScore(norm: number | null | undefined) {
  if (norm == null || !Number.isFinite(norm) || norm <= 0) {
    return { label: "SS —", variant: "neutral" as const };
  }

  const pct = (norm - 1) * 100;
  if (!Number.isFinite(pct)) {
    return { label: "SS —", variant: "neutral" as const };
  }

  const sign = pct >= 0 ? "+" : "";
  const label = `${sign}${pct.toFixed(2)}%`;
  const variant: "good" | "bad" | "neutral" = pct > 0.0001 ? "good" : pct < -0.0001 ? "bad" : "neutral";
  return { label, variant };
}

export const SessionRow = memo(function SessionRow({
  session,
  isActive,
  onPress,
}: Props) {
  const color = (session.sourceProgram?.color ?? "neutral") as ProgramColor;
  const stripClass = COLOR_STRIP_MAP[color];

  const stats = useMemo(() => {
    const startedAt = session.startedAt;
    const endedAt = session.endedAt ?? null;

    const norm = (session as any).strengthScore as number | null | undefined;
    const growth = growthFromNormalizedStrengthScore(norm);

    return {
      startLabel: fmtTime(startedAt),
      durationLabel: fmtDuration(startedAt, endedAt),
      growthLabel: growth.label,
      growthVariant: growth.variant,
      isCompleted: session.status === "completed",
    };
  }, [session]);

  return (
    <Pressable
      className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-slate-900 ${isActive ? "opacity-80" : ""}`}
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
                label={stats.startLabel}
              />
              <Chip
                icon={<Timer width={14} height={14} color="#9CA3AF" />}
                label={stats.durationLabel}
              />
              <Chip
                variant={stats.growthVariant}
                icon={<Flame width={14} height={14} color="#9CA3AF" />}
                label={stats.growthLabel}
              />
              {stats.isCompleted && (
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
