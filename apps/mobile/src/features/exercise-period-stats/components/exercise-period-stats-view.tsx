// src/features/exercise-period-stats/components/exercise-period-stats-view.tsx
import React from "react";
import { View, Text } from "react-native";
import { CalendarDays, Dumbbell, Trophy, Sigma } from "lucide-react-native";
import type { ExercisePeriodStat } from "@/src/features/exercise-period-stats/domain/types";
import { Exercise } from "@packages/exercise";

type Props = {
  stat: ExercisePeriodStat | null | undefined;
  exercise: Exercise | null | undefined;
  className?: string;
};

export function ExercisePeriodStatsView({ stat, exercise, className }: Props) {
  const isNum = (n: number | null | undefined): n is number =>
    typeof n === "number" && Number.isFinite(n);

  const fmtInt = (n: number | null | undefined) =>
    isNum(n) ? new Intl.NumberFormat().format(Math.round(n)) : "—";

  const fmtKg = (n: number | null | undefined, dp = 0) =>
    isNum(n) ? `${n.toFixed(dp)} kg` : "—";

  const fmtScore = (n: number | null | undefined, dp = 1) =>
    isNum(n) ? n.toFixed(dp) : "—";

  const fmtDateShort = (d: Date | null | undefined) => {
    if (!d) return "—";
    const t = d.getTime();
    if (!Number.isFinite(t)) return "—";
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(d);
  };

  const fmtPeriodType = (p: ExercisePeriodStat["periodType"]) => {
    if (p === "week") return "Week";
    if (p === "month") return "Month";
    if (p === "year") return "Year";
    return String(p);
  };

  const fmtDuration = (seconds: number) => {
    const s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  const fmtQuantity = (
    n: number | null | undefined,
    unit: Exercise["quantityUnit"],
  ) => {
    if (!isNum(n)) return "—";
    if (unit === "time") return fmtDuration(n);
    return `${fmtInt(n)} reps`;
  };

  const quantityUnit = exercise?.quantityUnit ?? "reps";

  const quantityLabel = quantityUnit === "time" ? "Total time" : "Total reps";

  const Row = ({
    label,
    value,
    sub,
  }: {
    label: string;
    value: string;
    sub?: string;
  }) => (
    <View className="flex-row justify-between py-0.5">
      <Text className="text-neutral-400 text-xs">{label}</Text>
      <View className="flex-row items-baseline gap-1">
        <Text className="text-neutral-100 text-sm font-medium">{value}</Text>
        {sub ? (
          <Text className="text-neutral-500 text-[10px]">{sub}</Text>
        ) : null}
      </View>
    </View>
  );

  if (!stat) {
    return (
      <View
        className={[
          "border border-neutral-800 bg-neutral-950 rounded-xl px-3 py-2",
          className ?? "",
        ].join(" ")}
      >
        <Text className="text-neutral-400 text-xs">No period stats yet</Text>
      </View>
    );
  }

  return (
    <View
      className={[
        "border border-neutral-800 bg-neutral-950 rounded-xl px-3 py-2",
        className ?? "",
      ].join(" ")}
    >
      <View className="flex-row justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-full bg-sky-400/20 items-center justify-center">
            <CalendarDays size={13} color="#38BDF8" />
          </View>

          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">
              {fmtPeriodType(stat.periodType)}
            </Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtDateShort(stat.periodStart)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">Sessions</Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtInt(stat.sessionCount)}
            </Text>
          </View>

          <View className="h-6 w-6 rounded-full bg-emerald-400/20 items-center justify-center">
            <Dumbbell size={13} color="#34D399" />
          </View>
        </View>
      </View>

      <View className="border-t border-neutral-800 my-2" />

      <Row
        label={quantityLabel}
        value={fmtQuantity(stat.totalQuantity, quantityUnit)}
      />

      <View className="border-t border-neutral-800 my-2" />

      <View className="flex-row items-center gap-2 mb-1">
        <Trophy size={14} color="#FBBF24" />
        <Text className="text-neutral-300 text-xs font-semibold">e1RM</Text>
      </View>

      <Row label="Best set e1RM" value={fmtKg(stat.bestSetE1rm, 0)} />
      <Row label="Median set e1RM" value={fmtKg(stat.medianSetE1rm, 0)} />

      <View className="border-t border-neutral-800 my-2" />

      <View className="flex-row items-center gap-2 mb-0.5">
        <Sigma size={14} color="#A78BFA" />
        <Text className="text-neutral-300 text-xs font-semibold">Score</Text>
      </View>

      <Row label="Best score" value={fmtScore(stat.bestStrengthScore, 1)} />
      <Row label="Median score" value={fmtScore(stat.medianStrengthScore, 1)} />

      <View className="border-t border-neutral-800 my-2" />

      <Row label="Updated" value={fmtDateShort(stat.updatedAt)} />
    </View>
  );
}
