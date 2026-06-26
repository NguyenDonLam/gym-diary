import React, { useMemo } from "react";

import {
  DotPlotWithTrend,
  type DotPlotPoint,
} from "@/src/components/charts/dot-plot-with-trend";

import type { ExercisePeriodStat } from "../domain/types";

type PeriodKey = "week" | "month" | "year";

type Props = {
  rows: ExercisePeriodStat[];
  period: PeriodKey;
  className?: string;
};

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPeriodLabel(date: Date, period: PeriodKey): string {
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

function formatScore(value: number): string {
  return value.toFixed(2);
}

export function ExerciseStrengthScoreTrendView({
  rows,
  period,
  className,
}: Props) {
  const points = useMemo<DotPlotPoint[]>(() => {
    return rows.flatMap((row) => {
      const score = row.bestStrengthScore;
      if (!isFiniteNumber(score)) return [];

      return [
        {
          x: row.periodStart.getTime(),
          y: score,
          label: formatPeriodLabel(row.periodStart, period),
          detailLabel: formatPeriodLabel(row.periodStart, period),
        },
      ];
    });
  }, [rows, period]);

  return (
    <DotPlotWithTrend
      points={points}
      title="Strength score trend"
      subtitle={`Best strength score by ${period}`}
      emptyLabel={`No strength scores for this ${period} view yet`}
      valueFormatter={formatScore}
      className={className}
    />
  );
}
