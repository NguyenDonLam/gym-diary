// src/features/program-period-stats/components/program-period-stats-view.tsx
import React from "react";
import { View, Text } from "react-native";
import type { ProgramPeriodStat } from "@/src/features/program-period-stats/domain/types";
import { CalendarDays } from "lucide-react-native";

type Props = {
  stat: ProgramPeriodStat | null | undefined;
  className?: string;
};

export function ProgramPeriodStatsView({ stat, className }: Props) {
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

  const fmtDate = (d: unknown) => {
    if (d instanceof Date) return d.toISOString().slice(0, 10);
    if (typeof d !== "string") return String(d ?? "—");
    const t = Date.parse(d);
    if (!Number.isFinite(t)) return d;
    return new Date(t).toISOString().slice(0, 10);
  };

  const Mini = ({
    label,
    value,
    accent,
    sub,
  }: {
    label: string;
    value: string;
    accent?: string;
    sub?: string;
  }) => (
    <View className="min-w-[72px]">
      <Text className="text-neutral-500 text-[10px]">{label}</Text>
      <Text
        className={["text-sm font-semibold", accent ?? "text-neutral-100"].join(
          " ",
        )}
      >
        {value}
        {sub ? (
          <Text className="text-neutral-500 text-[10px]"> {sub}</Text>
        ) : null}
      </Text>
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
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-2">
        <View className="h-6 w-6 rounded-full bg-sky-400/20 items-center justify-center">
          <CalendarDays size={13} color="#38BDF8" />
        </View>
        <Text className="text-neutral-200 text-xs font-semibold">
          {String(stat.periodType ?? "Period")}
        </Text>
        <Text className="text-neutral-500 text-xs">
          {fmtDate(stat.periodStart)}
        </Text>
      </View>

      {/* Primary line */}
      <View className="flex-row justify-between mb-1">
        <Mini
          label="Sessions"
          value={fmtInt(stat.sessionCount)}
          accent="text-emerald-400"
        />
        <Mini
          label="Time"
          value={fmtDuration(stat.durationSec)}
          accent="text-sky-400"
        />
      </View>

      {/* Secondary line */}
      <View className="flex-row justify-between">
        <Mini label="Volume" value={fmtInt(stat.volumeKg)} sub="kg·reps" />
        <Mini
          label="Growth"
          value={fmtPct(stat.averageProgression)}
          accent="text-violet-400"
        />
      </View>
    </View>
  );
}
