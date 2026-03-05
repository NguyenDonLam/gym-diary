// src/features/program-stats/components/program-stats-view.tsx
import React from "react";
import { View, Text } from "react-native";
import type { ProgramStat } from "@/src/features/program-stats/domain/types";
import { Dumbbell, Clock3, BarChart3, TrendingUp } from "lucide-react-native";

type Props = {
  stat: ProgramStat | null | undefined;
  className?: string;
};

export function ProgramStatsView({ stat, className }: Props) {
  const num = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;

  const fmtInt = (v: unknown) => {
    const n = num(v);
    return n == null ? "—" : new Intl.NumberFormat().format(Math.round(n));
  };

  const fmtPct = (v: unknown) => {
    const n = num(v);
    if (n == null) return "—";
    const p = n * 100;
    const sign = p > 0 ? "+" : "";
    return `${sign}${p.toFixed(1)}%`;
  };

  const fmtDuration = (sec: unknown) => {
    const s = num(sec);
    if (s == null) return "—";
    const min = Math.round(s / 60);
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
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
        <Text className="text-neutral-400 text-xs">No lifetime stats yet</Text>
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
      {/* Primary */}
      <View className="flex-row justify-between mb-1">
        {/* Sessions */}
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 rounded-full bg-emerald-400/20 items-center justify-center">
            <Dumbbell size={13} color="#34D399" />
          </View>

          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">Sessions</Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtInt(stat.totalSessionCount)}
            </Text>
          </View>
        </View>

        {/* Time */}
        <View className="flex-row items-center gap-2">
          <View className="items-center">
            <Text className="text-neutral-500 text-[10px]">Total time</Text>
            <Text className="text-neutral-50 text-lg font-semibold leading-tight">
              {fmtDuration(stat.totalDurationSec)}
            </Text>
          </View>

          <View className="h-6 w-6 rounded-full bg-sky-400/20 items-center justify-center">
            <Clock3 size={13} color="#38BDF8" />
          </View>
        </View>
      </View>

      <View className="border-t border-neutral-800 my-2" />

      {/* Work volume */}
      <View className="flex-row items-center gap-2 mb-1">
        <BarChart3 size={14} color="#FBBF24" />
        <Text className="text-neutral-300 text-xs font-semibold">
          Work volume
        </Text>
      </View>

      <Row
        label="Total volume"
        value={fmtInt(stat.totalVolumeKg)}
        sub="kg·reps"
      />
      <Row label="Total sets" value={fmtInt(stat.totalSetCount)} />
      <Row label="Total reps" value={fmtInt(stat.totalRepCount)} />

      <View className="border-t border-neutral-800 my-2" />

      {/* Change */}
      <View className="flex-row items-center gap-2 mb-0.5">
        <TrendingUp size={14} color="#A78BFA" />
        <Text className="text-neutral-300 text-xs font-semibold">Change</Text>
      </View>

      <Row label="Median growth" value={fmtPct(stat.medianProgression)} />
    </View>
  );
}
