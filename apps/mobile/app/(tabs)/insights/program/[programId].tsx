// app/(tabs)/insights/program/[programId].tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import {
  ArrowLeft,
  BarChart3,
  Dumbbell,
  Clock3,
  Activity,
  ChevronRight,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PeriodType } from "@/db/enums";

import type { ProgramPeriodStat } from "@/src/features/program-period-stats/domain/types";
import type { ProgramStat } from "@/src/features/program-stats/domain/types";
import { programStatRepository } from "@/src/features/program-stats/data/repository";
import { programPeriodStatRepository } from "@/src/features/program-period-stats/data/repository";

type PeriodKey = "week" | "month" | "year" | "lifetime";
type MetricKey = "sessions" | "growth" | "volume" | "duration";

type SummaryTile = {
  label: string;
  value: string;
  hint?: string | null;
  icon: React.ReactNode;
};

type TrendPoint = { xLabel: string; value: number };
type TrendSeries = { points: TrendPoint[]; unitLabel?: string | null };

type MiniStat = { label: string; value: string };
type ProgressRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  stats: MiniStat[];
};

function periodLabel(p: PeriodKey) {
  if (p === "lifetime") return "Lifetime";
  if (p === "week") return "Week";
  if (p === "month") return "Month";
  return "Year";
}

function metricLabel(m: MetricKey) {
  if (m === "sessions") return "Sessions";
  if (m === "growth") return "Growth";
  if (m === "volume") return "Volume";
  return "Duration";
}

function periodKeyToPeriodType(p: Exclude<PeriodKey, "lifetime">): PeriodType {
  if (p === "year") return "year";
  if (p === "month") return "month";
  return "week";
}

function safeNum(n: number | null | undefined, fallback = 0) {
  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

function fmtInt(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function fmt1(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(
    n
  );
}

function fmtPctFraction(frac: number) {
  // frac is 0.05 for +5%
  const pct = frac * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${fmt1(pct)}%`;
}

function fmtMinutes(min: number) {
  const v = Math.round(min);
  if (v < 60) return `${v} min`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatPeriodStartLabel(
  period: Exclude<PeriodKey, "lifetime">,
  d: Date
) {
  if (period === "year") return String(d.getFullYear());
  if (period === "month") {
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  // week: show month/day (start of week)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        "rounded-full border px-3 py-2",
        active
          ? "bg-neutral-900 border-neutral-900 dark:bg-neutral-50 dark:border-neutral-50"
          : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800",
      ].join(" ")}
    >
      <Text
        className={[
          "text-[11px] font-semibold",
          active
            ? "text-white dark:text-neutral-900"
            : "text-neutral-700 dark:text-neutral-200",
        ].join(" ")}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatTile({ t }: { t: SummaryTile }) {
  return (
    <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          {t.label}
        </Text>
        <View className="opacity-70">{t.icon}</View>
      </View>

      <Text className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        {t.value}
      </Text>

      {t.hint ? (
        <Text className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400">
          {t.hint}
        </Text>
      ) : null}
    </View>
  );
}

function SparkBars({ series }: { series?: TrendSeries | null }) {
  const pts = series?.points ?? [];
  const max = Math.max(...pts.map((p) => p.value), 1);

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
          Trend
        </Text>
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          {series?.unitLabel ?? ""}
        </Text>
      </View>

      <View className="mt-3 flex-row items-end gap-1">
        {(pts.length ? pts : []).slice(-28).map((p, idx) => {
          const h = Math.max(2, Math.round((p.value / max) * 64));
          return (
            <View
              key={`${p.xLabel}-${idx}`}
              style={{ height: h }}
              className="w-2 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
          );
        })}
        {!pts.length ? (
          <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
            No period stats yet
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function BreakdownRow({ row }: { row: ProgressRow }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text
            className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50"
            numberOfLines={1}
          >
            {row.title}
          </Text>
          {row.subtitle ? (
            <Text className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {row.subtitle}
            </Text>
          ) : null}
        </View>

        <ChevronRight
          size={18}
          className="text-neutral-300 dark:text-neutral-700"
        />
      </View>

      <View className="mt-3 flex-row gap-3">
        {row.stats.slice(0, 3).map((s, i) => (
          <View
            key={`${row.id}-${i}`}
            className="flex-1 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"
          >
            <Text className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              {s.label}
            </Text>
            <Text className="mt-1 text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              {s.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProgramStatsScreen() {
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#F9FAFB" : "#111827";

  const [period, setPeriod] = useState<PeriodKey>("week");
  const [metric, setMetric] = useState<MetricKey>("growth");

  const [lifetime, setLifetime] = useState<ProgramStat | null>(null);
  const [periodRows, setPeriodRows] = useState<ProgramPeriodStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load lifetime + period rows (period rows depend on selected period)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!programId) return;

      setLoading(true);
      setError(null);

      try {
        const [life, allPeriods] = await Promise.all([
          programStatRepository.get(programId),
          programPeriodStatRepository.getAllForProgram(programId),
        ]);

        if (cancelled) return;

        setLifetime(life);

        const filtered =
          period === "lifetime"
            ? []
            : allPeriods
                .filter(
                  (r) =>
                    r.periodType ===
                    periodKeyToPeriodType(
                      period as Exclude<PeriodKey, "lifetime">
                    )
                )
                .slice()
                .sort(
                  (a, b) => +new Date(a.periodStart) - +new Date(b.periodStart)
                );

        setPeriodRows(filtered);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load stats");
        setLifetime(null);
        setPeriodRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [programId, period]);

  const latestPeriodRow = useMemo(() => {
    if (!periodRows.length) return null;
    return periodRows[periodRows.length - 1];
  }, [periodRows]);

  const summaryTiles: SummaryTile[] = useMemo(() => {
    const p = periodLabel(period);

    const sessionsValue =
      period === "lifetime"
        ? lifetime
          ? fmtInt(safeNum(lifetime.totalSessionCount))
          : "—"
        : latestPeriodRow
          ? fmtInt(safeNum(latestPeriodRow.sessionCount))
          : "—";

    const growthValue =
      period === "lifetime"
        ? lifetime && lifetime.medianProgression != null
          ? fmtPctFraction(safeNum(lifetime.medianProgression))
          : "—"
        : latestPeriodRow
          ? fmtPctFraction(safeNum(latestPeriodRow.averageProgression))
          : "—";

    const volumeValue =
      period === "lifetime"
        ? lifetime
          ? fmtInt(safeNum(lifetime.totalVolumeKg))
          : "—"
        : latestPeriodRow
          ? fmtInt(safeNum(latestPeriodRow.volumeKg))
          : "—";

    const durationValue =
      period === "lifetime"
        ? lifetime
          ? fmtMinutes(safeNum(lifetime.totalDurationSec) / 60)
          : "—"
        : latestPeriodRow
          ? fmtMinutes(safeNum(latestPeriodRow.durationSec) / 60)
          : "—";

    return [
      {
        label: `Sessions (${p})`,
        value: sessionsValue,
        hint: period === "lifetime" ? "Total completed workouts" : "Latest bin",
        icon: <Dumbbell size={16} color={iconColor} />,
      },
      {
        label: period === "lifetime" ? "Median growth" : `Avg growth (${p})`,
        value: growthValue,
        hint:
          period === "lifetime"
            ? "From program_stats"
            : "From program_period_stats",
        icon: <Activity size={16} color={iconColor} />,
      },
      {
        label: `Volume (${p})`,
        value: volumeValue,
        hint: "kg × reps",
        icon: <BarChart3 size={16} color={iconColor} />,
      },
      {
        label: `Duration (${p})`,
        value: durationValue,
        hint: "Completed sessions only",
        icon: <Clock3 size={16} color={iconColor} />,
      },
    ];
  }, [period, lifetime, latestPeriodRow, iconColor]);

  const series: TrendSeries | null = useMemo(() => {
    if (period === "lifetime") return { points: [], unitLabel: "" };

    const unitLabel =
      metric === "growth"
        ? "%"
        : metric === "volume"
          ? "kg·reps"
          : metric === "duration"
            ? "min"
            : "sessions";

    const p = period as Exclude<PeriodKey, "lifetime">;

    const points: TrendPoint[] = periodRows.map((r) => {
      const d = new Date(r.periodStart);
      const xLabel = formatPeriodStartLabel(p, d);

      const value =
        metric === "sessions"
          ? safeNum(r.sessionCount)
          : metric === "growth"
            ? safeNum(r.averageProgression) * 100
            : metric === "volume"
              ? safeNum(r.volumeKg)
              : safeNum(r.durationSec) / 60;

      return { xLabel, value };
    });

    return { points, unitLabel };
  }, [period, metric, periodRows]);

  const rows: ProgressRow[] = useMemo(() => {
    const periodStats: MiniStat[] =
      period === "lifetime"
        ? [
            {
              label: "sessions",
              value: lifetime
                ? fmtInt(safeNum(lifetime.totalSessionCount))
                : "—",
            },
            {
              label: "sets",
              value: lifetime ? fmtInt(safeNum(lifetime.totalSetCount)) : "—",
            },
            {
              label: "reps",
              value: lifetime ? fmtInt(safeNum(lifetime.totalRepCount)) : "—",
            },
          ]
        : [
            {
              label: "sessions",
              value: latestPeriodRow
                ? fmtInt(safeNum(latestPeriodRow.sessionCount))
                : "—",
            },
            {
              label: "volume",
              value: latestPeriodRow
                ? fmtInt(safeNum(latestPeriodRow.volumeKg))
                : "—",
            },
            {
              label: "growth",
              value: latestPeriodRow
                ? fmtPctFraction(safeNum(latestPeriodRow.averageProgression))
                : "—",
            },
          ];

    return [
      {
        id: "totals",
        title:
          period === "lifetime" ? "Lifetime totals" : "Latest period snapshot",
        subtitle:
          period === "lifetime"
            ? "program_stats"
            : latestPeriodRow
              ? `${(period as Exclude<PeriodKey, "lifetime">).toUpperCase()} starting ${new Date(
                  latestPeriodRow.periodStart
                ).toLocaleDateString()}`
              : "program_period_stats",
        stats: periodStats,
      },
    ];
  }, [period, lifetime, latestPeriodRow]);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 28,
      }}
    >
      <View className="mb-4">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
          >
            <ArrowLeft size={18} color={iconColor} />
          </Pressable>

          <View className="flex-1">
            <Text
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-50"
              numberOfLines={1}
            >
              Program
            </Text>
            <Text
              className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {programId ?? "—"} · {periodLabel(period)} · {metricLabel(metric)}
              {loading ? " · loading" : ""}
            </Text>
            {error ? (
              <Text className="mt-1 text-[11px] text-red-600">{error}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Text className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
          Period
        </Text>
        <View className="mt-2 flex-row flex-wrap gap-2">
          <Chip
            label="Week"
            active={period === "week"}
            onPress={() => setPeriod("week")}
          />
          <Chip
            label="Month"
            active={period === "month"}
            onPress={() => setPeriod("month")}
          />
          <Chip
            label="Year"
            active={period === "year"}
            onPress={() => setPeriod("year")}
          />
          <Chip
            label="Lifetime"
            active={period === "lifetime"}
            onPress={() => setPeriod("lifetime")}
          />
        </View>

        <View className="mt-4">
          <Text className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Metric
          </Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            <Chip
              label="Sessions"
              active={metric === "sessions"}
              onPress={() => setMetric("sessions")}
            />
            <Chip
              label="Growth"
              active={metric === "growth"}
              onPress={() => setMetric("growth")}
            />
            <Chip
              label="Volume"
              active={metric === "volume"}
              onPress={() => setMetric("volume")}
            />
            <Chip
              label="Duration"
              active={metric === "duration"}
              onPress={() => setMetric("duration")}
            />
          </View>
        </View>
      </View>

      <View className="mb-4">
        <View className="flex-row gap-3">
          <StatTile t={summaryTiles[0]} />
          <StatTile t={summaryTiles[1]} />
        </View>
        <View className="mt-3 flex-row gap-3">
          <StatTile t={summaryTiles[2]} />
          <StatTile t={summaryTiles[3]} />
        </View>
      </View>

      <View className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
              Program trend
            </Text>
            <Text className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {period === "lifetime"
                ? "no trend for lifetime"
                : "program_period_stats"}
            </Text>
          </View>
          <BarChart3 size={16} color={iconColor} />
        </View>

        <SparkBars series={series} />
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-50">
          Breakdown
        </Text>
      </View>

      <View className="gap-3">
        {rows.map((r) => (
          <BreakdownRow key={r.id} row={r} />
        ))}
      </View>
    </ScrollView>
  );
}
