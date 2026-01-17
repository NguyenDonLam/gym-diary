// app/(tabs)/insights/exercise/[exerciseId].tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import { ChevronLeft, BarChart3, Dumbbell } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type PeriodKey = "week" | "month" | "year" | "lifetime";
type MetricKey = "e1rm" | "score" | "volume" | "sets";

type SummaryTile = {
  label: string;
  value: string;
  sub?: string | null;
  icon?: React.ReactNode;
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

function Pill({
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
      className={`rounded-full border px-3 py-1 ${
        active
          ? "bg-neutral-900 border-neutral-900 dark:bg-neutral-50 dark:border-neutral-50"
          : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800"
      }`}
    >
      <Text
        className={`text-[11px] font-semibold ${
          active
            ? "text-white dark:text-neutral-900"
            : "text-neutral-700 dark:text-neutral-200"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Tile({ t }: { t: SummaryTile }) {
  return (
    <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {t.label}
        </Text>
        {t.icon ? <View className="opacity-70">{t.icon}</View> : null}
      </View>
      <Text className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
        {t.value}
      </Text>
      {t.sub ? (
        <Text className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
          {t.sub}
        </Text>
      ) : null}
    </View>
  );
}

function MiniBars({ series }: { series?: TrendSeries | null }) {
  const fallback = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        xLabel: String(i),
        value: 10 + ((i * 9) % 45),
      })),
    []
  );

  const pts = series?.points?.length ? series.points : fallback;
  const max = Math.max(...pts.map((p) => p.value), 1);

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-50">
          Trend
        </Text>
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          {series?.unitLabel ?? ""}
        </Text>
      </View>

      <View className="mt-2 flex-row items-end gap-1">
        {pts.slice(-28).map((p, idx) => {
          const h = Math.max(2, Math.round((p.value / max) * 56));
          return (
            <View
              key={`${p.xLabel}-${idx}`}
              style={{ height: h }}
              className="w-2 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
          );
        })}
      </View>
    </View>
  );
}

function RowCard({ row }: { row: ProgressRow }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50"
            numberOfLines={1}
          >
            {row.title}
          </Text>
          {row.subtitle ? (
            <Text className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
              {row.subtitle}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-end gap-2">
          {row.stats.slice(0, 3).map((s, i) => (
            <View key={`${row.id}-${i}`} className="w-20 items-end">
              <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
                {s.label}
              </Text>
              <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function periodLabel(p: PeriodKey) {
  if (p === "lifetime") return "Lifetime";
  if (p === "week") return "Week";
  if (p === "month") return "Month";
  return "Year";
}

export default function ExerciseProgressionScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";

  const [period, setPeriod] = useState<PeriodKey>("week");
  const [metric, setMetric] = useState<MetricKey>("e1rm");

  const summaryTiles: SummaryTile[] = useMemo(() => {
    const p = periodLabel(period);
    return [
      {
        label: "Best set e1RM",
        value: "—",
        sub: "baseline —",
        icon: <BarChart3 size={14} color={iconColor} />,
      },
      {
        label: "Best exercise score",
        value: "—",
        sub: "baseline —",
        icon: <BarChart3 size={14} color={iconColor} />,
      },
      {
        label: `Volume (${p})`,
        value: "—",
        icon: <Dumbbell size={14} color={iconColor} />,
      },
      {
        label: `Sets (${p})`,
        value: "—",
        icon: <Dumbbell size={14} color={iconColor} />,
      },
    ];
  }, [period, iconColor]);

  const series: TrendSeries | null = useMemo(() => {
    const unitLabel =
      metric === "volume"
        ? "kg·reps"
        : metric === "sets"
          ? "sets"
          : metric === "e1rm"
            ? "kg"
            : "score";
    return { points: [], unitLabel };
  }, [metric]);

  const rows: ProgressRow[] = useMemo(
    () => [
      {
        id: "r1",
        title: "Breakdown (placeholder)",
        subtitle: "e.g. recent samples / PRs",
        stats: [
          { label: "period", value: "—" },
          { label: "life", value: "—" },
          { label: "base", value: "—" },
        ],
      },
    ],
    []
  );

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-3 pb-2 dark:border-neutral-800 dark:bg-neutral-950">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text
            className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            numberOfLines={1}
          >
            Exercise
          </Text>
          <Text
            className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {periodLabel(period)} · {exerciseId ?? "—"}
          </Text>
        </View>

        <View style={{ width: 20, marginLeft: 8 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        <View className="mb-3">
          <Text className="mb-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Period
          </Text>
          <View className="flex-row gap-2">
            <Pill
              label="Week"
              active={period === "week"}
              onPress={() => setPeriod("week")}
            />
            <Pill
              label="Month"
              active={period === "month"}
              onPress={() => setPeriod("month")}
            />
            <Pill
              label="Year"
              active={period === "year"}
              onPress={() => setPeriod("year")}
            />
            <Pill
              label="Lifetime"
              active={period === "lifetime"}
              onPress={() => setPeriod("lifetime")}
            />
          </View>
        </View>

        <View className="mb-3">
          <Text className="mb-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Metric
          </Text>
          <View className="flex-row gap-2">
            <Pill
              label="e1RM"
              active={metric === "e1rm"}
              onPress={() => setMetric("e1rm")}
            />
            <Pill
              label="Score"
              active={metric === "score"}
              onPress={() => setMetric("score")}
            />
            <Pill
              label="Volume"
              active={metric === "volume"}
              onPress={() => setMetric("volume")}
            />
            <Pill
              label="Sets"
              active={metric === "sets"}
              onPress={() => setMetric("sets")}
            />
          </View>
        </View>

        <View className="mb-3">
          <View className="flex-row gap-2">
            <Tile t={summaryTiles[0]} />
            <Tile t={summaryTiles[1]} />
          </View>
          <View className="mt-2 flex-row gap-2">
            <Tile t={summaryTiles[2]} />
            <Tile t={summaryTiles[3]} />
          </View>
        </View>

        <View className="mb-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              Exercise trend
            </Text>
            <BarChart3 size={14} color={iconColor} />
          </View>
          <Text className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            exercise_period_stats + exercise_stats
          </Text>
          <MiniBars series={series} />
        </View>

        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              Breakdown
            </Text>
          </View>
          <View className="gap-2">
            {rows.map((r) => (
              <RowCard key={r.id} row={r} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
