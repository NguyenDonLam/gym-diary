import React, { useMemo } from "react";

import {
  DotPlotWithTrend,
  type DotPlotPoint,
} from "@/src/components/charts/dot-plot-with-trend";

import type { ProgramPeriodStat } from "../domain/types";

type Props = {
  rows: ProgramPeriodStat[];
  className?: string;
};

function formatPeriodLabel(date: Date, period: ProgramPeriodStat["periodType"]) {
  if (period === "year") {
    return new Intl.DateTimeFormat(undefined, { year: "numeric" }).format(date);
  }

  if (period === "month") {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      year: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function ProgramPeriodTrendView({ rows, className }: Props) {
  const period = rows[0]?.periodType ?? "period";

  const points = useMemo<DotPlotPoint[]>(() => {
    return rows
      .filter((row) => Number.isFinite(row.averageProgression))
      .map((row) => ({
        x: row.periodStart.getTime(),
        y: row.averageProgression * 100,
        label: formatPeriodLabel(row.periodStart, row.periodType),
      }));
  }, [rows]);

  return (
    <DotPlotWithTrend
      points={points}
      title="Progression trend"
      subtitle={`Average progression by ${period}`}
      emptyLabel="No progression trend data yet"
      valueFormatter={formatPercent}
      accentColor="#34D399"
      metricLabel="Progression"
      className={className}
    />
  );
}
