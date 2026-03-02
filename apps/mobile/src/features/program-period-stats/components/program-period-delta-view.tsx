import React, { useMemo } from "react";
import { View, Text } from "react-native";
import type { ProgramPeriodStat } from "../domain/types";

type Props = {
  rows: ProgramPeriodStat[];
  period: "week" | "month" | "year";
  className?: string;
};

export function ProgramPeriodDeltaView({ rows, period, className }: Props) {
  const delta = useMemo(() => {
    if (rows.length < 2) return null;

    const prev = rows[rows.length - 2];
    const curr = rows[rows.length - 1];

    return {
      sessions: curr.sessionCount - prev.sessionCount,
      volumePct:
        prev.volumeKg > 0
          ? (curr.volumeKg - prev.volumeKg) / prev.volumeKg
          : null,
      growth: curr.averageProgression - prev.averageProgression,
    };
  }, [rows]);

  if (!delta) return null;

  const Row = ({ label, value }: { label: string; value: number | null }) => {
    if (value == null) return null;

    const up = value > 0;
    const flat = value === 0;

    return (
      <View className="flex-row justify-between items-center py-1">
        <Text className="text-neutral-400 text-xs">{label}</Text>

        <View className="flex-row items-center gap-1">
          <Text
            className={[
              "text-xs font-semibold",
              up
                ? "text-emerald-400"
                : flat
                  ? "text-neutral-400"
                  : "text-rose-400",
            ].join(" ")}
          >
            {up ? "+" : ""}
            {label === "Volume"
              ? `${(value * 100).toFixed(1)}%`
              : value.toFixed(1)}
          </Text>

          <Text
            className={[
              "text-xs",
              up
                ? "text-emerald-400"
                : flat
                  ? "text-neutral-400"
                  : "text-rose-400",
            ].join(" ")}
          >
            {up ? "↑" : flat ? "→" : "↓"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      className={[
        "border border-neutral-800 bg-neutral-950 rounded-xl px-3 py-2",
        className ?? "",
      ].join(" ")}
    >
      <Text className="text-neutral-300 text-xs mb-1">
        Change vs last recorded {period}
      </Text>

      <Row label="Sessions" value={delta.sessions} />
      <Row label="Volume" value={delta.volumePct} />
      <Row label="Growth" value={delta.growth} />
    </View>
  );
}
