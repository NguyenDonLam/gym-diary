// src/features/exercise-period-stats/components/exercise-period-delta-view.tsx
import React, { useMemo } from "react";
import { View, Text } from "react-native";
import type { ExercisePeriodStat } from "../domain/types";

type Props = {
  rows: ExercisePeriodStat[];
  period: "week" | "month" | "year";
  className?: string;
};

type Delta = {
  sessions: number;

  // % change vs previous (null if prev is null/0 or curr is null)
  bestE1rmPct: number | null;
  medianE1rmPct: number | null;

  // point change (null if either is null)
  bestStrengthDelta: number | null;
  medianStrengthDelta: number | null;
};

function dir(v: number): "up" | "flat" | "down" {
  if (v > 0) return "up";
  if (v < 0) return "down";
  return "flat";
}

function Tone({
  direction,
  children,
}: {
  direction: "up" | "flat" | "down";
  children: React.ReactNode;
}) {
  const cls =
    direction === "up"
      ? "text-emerald-300"
      : direction === "flat"
        ? "text-neutral-400"
        : "text-rose-300";
  return <Text className={cls}>{children}</Text>;
}

function MetricRow({
  label,
  valueText,
  direction,
  divider,
}: {
  label: string;
  valueText: string;
  direction: "up" | "flat" | "down";
  divider?: boolean;
}) {
  const icon = direction === "up" ? "▲" : direction === "flat" ? "—" : "▼";
  const tone =
    direction === "up"
      ? "text-emerald-300"
      : direction === "flat"
        ? "text-neutral-400"
        : "text-rose-300";

  return (
    <View>
      {divider ? <View className="h-px bg-neutral-800/80 my-1" /> : null}

      <View className="flex-row items-center justify-between py-1.5">
        <Text className="text-neutral-400 text-xs">{label}</Text>

        <View className="flex-row items-center">
          <Text className={["text-xs font-semibold", tone].join(" ")}>
            {valueText}
          </Text>
          <Text className={["text-xs ml-2", tone].join(" ")}>{icon}</Text>
        </View>
      </View>
    </View>
  );
}

function pctChange(prev: number | null, curr: number | null): number | null {
  if (prev == null || curr == null) return null;
  if (prev === 0) return null;
  return (curr - prev) / prev;
}

function delta(prev: number | null, curr: number | null): number | null {
  if (prev == null || curr == null) return null;
  return curr - prev;
}

export function ExercisePeriodDeltaView({ rows, period, className }: Props) {
  const d = useMemo<Delta | null>(() => {
    if (rows.length < 2) return null;

    const prev = rows[rows.length - 2];
    const curr = rows[rows.length - 1];

    return {
      sessions: curr.sessionCount - prev.sessionCount,

      bestE1rmPct: pctChange(prev.bestSetE1rm, curr.bestSetE1rm),
      medianE1rmPct: pctChange(prev.medianSetE1rm, curr.medianSetE1rm),

      bestStrengthDelta: delta(prev.bestStrengthScore, curr.bestStrengthScore),
      medianStrengthDelta: delta(
        prev.medianStrengthScore,
        curr.medianStrengthScore,
      ),
    };
  }, [rows]);

  if (!d) return null;

  const items: Array<{
    key: string;
    label: string;
    value: number | null;
    render: (v: number) => string;
    directionFrom: (v: number) => "up" | "flat" | "down";
  }> = [
    {
      key: "sessions",
      label: "Sessions",
      value: d.sessions,
      render: (v) => `${v > 0 ? "+" : ""}${Math.trunc(v)}`,
      directionFrom: dir,
    },
    {
      key: "bestE1rm",
      label: "Estimated Max",
      value: d.bestE1rmPct,
      render: (v) => `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
      directionFrom: dir,
    },
    {
      key: "medianE1rm",
      label: "Median e1RM",
      value: d.medianE1rmPct,
      render: (v) => `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`,
      directionFrom: dir,
    },
    {
      key: "bestStrength",
      label: "Best strength",
      value: d.bestStrengthDelta,
      render: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`,
      directionFrom: dir,
    },
    {
      key: "medianStrength",
      label: "Median strength",
      value: d.medianStrengthDelta,
      render: (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}`,
      directionFrom: dir,
    },
  ];

  const visible = items.filter((x) => x.value != null);

  if (visible.length === 0) return null;

  return (
    <View
      className={[
        // Different from Program card: no border, softer surface, dividers only between rows.
        "bg-neutral-900/40 rounded-2xl px-4 py-3",
        className ?? "",
      ].join(" ")}
    >
      <Text className="text-neutral-300 text-xs mb-2">
        Change since last {period}
      </Text>

      {visible.map((it, idx) => {
        const v = it.value as number;
        return (
          <MetricRow
            key={it.key}
            divider={idx !== 0}
            label={it.label}
            valueText={it.render(v)}
            direction={it.directionFrom(v)}
          />
        );
      })}
    </View>
  );
}
