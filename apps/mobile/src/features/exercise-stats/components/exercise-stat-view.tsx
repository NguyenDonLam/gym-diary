// src/features/exercise-stats/components/exercise-stats-view.tsx
import React from "react";
import { View, Text } from "react-native";
import { Trophy, TrendingUp, BarChart3, Sigma } from "lucide-react-native";
import type { ExerciseStat } from "@/src/features/exercise-stats/domain/types";

type Props = {
  stat: ExerciseStat | null | undefined;
  className?: string;
};

export function ExerciseStatsView({ stat, className }: Props) {
  const ok = (n: number | null | undefined) =>
    typeof n === "number" && Number.isFinite(n) ? n : null;

  const fmtInt = (n: number | null | undefined) => {
    const v = ok(n);
    return v == null ? "—" : new Intl.NumberFormat().format(Math.round(v));
  };

  const fmtNum = (n: number | null | undefined, dp = 1) => {
    const v = ok(n);
    return v == null ? "—" : v.toFixed(dp);
  };

  const fmtKg = (n: number | null | undefined, dp = 0) => {
    const v = ok(n);
    return v == null ? "—" : `${v.toFixed(dp)} kg`;
  };

  const fmtDeltaPct = (
    baseline: number | null | undefined,
    best: number | null | undefined,
    dp = 1,
  ) => {
    const b0 = ok(baseline);
    const b1 = ok(best);
    if (b0 == null || b1 == null || b0 === 0) return "—";
    const p = ((b1 - b0) / b0) * 100;
    const sign = p > 0 ? "+" : "";
    return `${sign}${p.toFixed(dp)}%`;
  };

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
        <Text className="text-neutral-400 text-xs">No exercise stats yet</Text>
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
      {/* Highlights (different from program: two “best” KPIs) */}
      <View className="flex-row justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-full bg-amber-400/20 items-center justify-center">
            <Trophy size={13} color="#FBBF24" />
          </View>
          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">Best e1RM</Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtKg(stat.bestSetE1rm, 0)}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">Best score</Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtNum(stat.bestExerciseStrengthScore, 1)}
            </Text>
          </View>
          <View className="h-6 w-6 rounded-full bg-fuchsia-400/20 items-center justify-center">
            <TrendingUp size={13} color="#E879F9" />
          </View>
        </View>
      </View>

      <View className="border-t border-neutral-800 my-2" />

      {/* Totals (exercise schema: volume/sets/samples) */}
      <View className="flex-row items-center gap-2 mb-1">
        <BarChart3 size={14} color="#34D399" />
        <Text className="text-neutral-300 text-xs font-semibold">Totals</Text>
      </View>

      <Row
        label="Total volume"
        value={fmtInt(stat.totalVolumeKg)}
        sub="kg·reps"
      />
      <Row label="Total sets" value={fmtInt(stat.totalSetCount)} />
      <Row label="Samples" value={fmtInt(stat.sampleCount)} />

      <View className="border-t border-neutral-800 my-2" />

      {/* Baseline (exercise schema: baseline score + baseline e1rm) */}
      <View className="flex-row items-center gap-2 mb-0.5">
        <Sigma size={14} color="#60A5FA" />
        <Text className="text-neutral-300 text-xs font-semibold">Baseline</Text>
      </View>

      <Row label="Baseline e1RM" value={fmtKg(stat.baselineSetE1rm, 0)} />
      <Row
        label="Baseline score"
        value={fmtNum(stat.baselineExerciseStrengthScore, 1)}
      />
      <Row
        label="e1RM change"
        value={fmtDeltaPct(stat.baselineSetE1rm, stat.bestSetE1rm, 1)}
      />
    </View>
  );
}
