// apps/mobile/app/history/progression.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useColorScheme } from "nativewind";
import {
  ChevronLeft,
  Search,
  BarChart3,
  Dumbbell,
  Clock3,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
} from "lucide-react-native";
import { useRouter } from "expo-router";

export const PROGRAM_COLORS = [
  "neutral",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
] as const;
export type ProgramColor = (typeof PROGRAM_COLORS)[number];

type ScopeKey = "overall" | "program" | "exercise";
type MetricKey = "score" | "volume" | "duration";

type ProgramChipItem = { id: string; name: string; color: ProgramColor };
type ExerciseChipItem = { id: string; name: string; group?: string | null };

type TrendPoint = { xLabel: string; value: number };
type TrendSeries = { points: TrendPoint[]; unitLabel?: string | null };

type SummaryTile = {
  label: string;
  value: string;
  sub?: string | null;
  icon?: React.ReactNode;
};

type ProgressRow = {
  id: string;
  title: string;
  subtitle?: string | null;

  last?: string | null;
  delta?: string | null;
  baseline?: string | null;

  trend?: "up" | "down" | "flat" | "none";
};

const COLOR_STYLES: Record<
  ProgramColor,
  {
    dot: string;
    chipOn: string;
    chipOff: string;
    textOn: string;
    textOff: string;
  }
> = {
  neutral: {
    dot: "bg-neutral-400 dark:bg-neutral-500",
    chipOn:
      "bg-neutral-900 dark:bg-neutral-50 border-neutral-900 dark:border-neutral-50",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white dark:text-neutral-900",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  red: {
    dot: "bg-red-500 dark:bg-red-400",
    chipOn: "bg-red-600 dark:bg-red-500 border-red-600 dark:border-red-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  orange: {
    dot: "bg-orange-500 dark:bg-orange-400",
    chipOn:
      "bg-orange-600 dark:bg-orange-500 border-orange-600 dark:border-orange-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  yellow: {
    dot: "bg-yellow-500 dark:bg-yellow-400",
    chipOn:
      "bg-yellow-500 dark:bg-yellow-400 border-yellow-500 dark:border-yellow-400",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-neutral-900",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  green: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    chipOn:
      "bg-emerald-600 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  teal: {
    dot: "bg-teal-500 dark:bg-teal-400",
    chipOn: "bg-teal-600 dark:bg-teal-500 border-teal-600 dark:border-teal-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  blue: {
    dot: "bg-blue-500 dark:bg-blue-400",
    chipOn: "bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  purple: {
    dot: "bg-purple-500 dark:bg-purple-400",
    chipOn:
      "bg-purple-600 dark:bg-purple-500 border-purple-600 dark:border-purple-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
  pink: {
    dot: "bg-pink-500 dark:bg-pink-400",
    chipOn: "bg-pink-600 dark:bg-pink-500 border-pink-600 dark:border-pink-500",
    chipOff:
      "bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800",
    textOn: "text-white",
    textOff: "text-neutral-900 dark:text-neutral-50",
  },
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

function TrendIcon({ trend }: { trend?: ProgressRow["trend"] }) {
  const base = "text-neutral-400 dark:text-neutral-500";
  if (trend === "up")
    return (
      <TrendingUp
        size={14}
        className="text-emerald-600 dark:text-emerald-400"
      />
    );
  if (trend === "down")
    return (
      <TrendingDown size={14} className="text-rose-600 dark:text-rose-400" />
    );
  if (trend === "flat") return <Minus size={14} className={base} />;
  return <Minus size={14} className={base} />;
}

function ProgressRowCard({ row }: { row: ProgressRow }) {
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

        <View className="flex-row items-center gap-2">
          <TrendIcon trend={row.trend} />
          <View className="w-16 items-end">
            <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
              last
            </Text>
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              {row.last ?? "—"}
            </Text>
          </View>

          <View className="w-16 items-end">
            <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Δ
            </Text>
            <Text className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
              {row.delta ?? "—"}
            </Text>
          </View>

          <View className="w-16 items-end">
            <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
              base
            </Text>
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              {row.baseline ?? "—"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ProgressionScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#F9FAFB" : "#111827";

  // UI placeholders (wire later)
  const programs: ProgramChipItem[] = [];
  const exercises: ExerciseChipItem[] = [];

  const [scope, setScope] = useState<ScopeKey>("overall");
  const [metric, setMetric] = useState<MetricKey>("score");

  const [query, setQuery] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );

  const headerTitle =
    scope === "overall"
      ? "Progression"
      : scope === "program"
        ? "Program progression"
        : "Exercise progression";

  const scopeSubtitle =
    scope === "overall"
      ? "All sessions combined"
      : scope === "program"
        ? "Only sessions from the selected program"
        : "Only sets for the selected exercise";

  const summaryTiles: SummaryTile[] = useMemo(() => {
    if (scope === "overall") {
      return [
        {
          label: "Sessions",
          value: "—",
          icon: <Dumbbell size={14} color={iconColor} />,
        },
        {
          label: "Avg growth",
          value: "—",
          icon: <BarChart3 size={14} color={iconColor} />,
        },
        {
          label: "Avg duration",
          value: "—",
          icon: <Clock3 size={14} color={iconColor} />,
        },
        {
          label: "Streak",
          value: "—",
          sub: "days",
          icon: <BarChart3 size={14} color={iconColor} />,
        },
      ];
    }
    if (scope === "program") {
      return [
        {
          label: "Program",
          value: selectedProgramId ? "Selected" : "None",
          icon: <Dumbbell size={14} color={iconColor} />,
        },
        {
          label: "Sessions",
          value: "—",
          icon: <Dumbbell size={14} color={iconColor} />,
        },
        {
          label: "Avg growth",
          value: "—",
          icon: <BarChart3 size={14} color={iconColor} />,
        },
        {
          label: "Consistency",
          value: "—",
          sub: "per week",
          icon: <Clock3 size={14} color={iconColor} />,
        },
      ];
    }
    return [
      {
        label: "Exercise",
        value: selectedExerciseId ? "Selected" : "None",
        icon: <Dumbbell size={14} color={iconColor} />,
      },
      {
        label: "Best e1RM",
        value: "—",
        icon: <BarChart3 size={14} color={iconColor} />,
      },
      {
        label: "Volume",
        value: "—",
        icon: <Dumbbell size={14} color={iconColor} />,
      },
      {
        label: "Recent delta",
        value: "—",
        icon: <BarChart3 size={14} color={iconColor} />,
      },
    ];
  }, [scope, selectedProgramId, selectedExerciseId, iconColor]);

  const series: TrendSeries | null = useMemo(() => {
    const unitLabel =
      metric === "score"
        ? "score"
        : metric === "volume"
          ? "kg·reps"
          : "minutes";
    return { points: [], unitLabel };
  }, [metric]);

  const rows: ProgressRow[] = useMemo(() => {
    if (scope === "overall") {
      return [
        {
          id: "p1",
          title: "Overall strength score",
          subtitle: "session-level",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
        {
          id: "p2",
          title: "Overall volume",
          subtitle: "all exercises",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
        {
          id: "p3",
          title: "Overall duration",
          subtitle: "time in session",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
      ];
    }
    if (scope === "program") {
      return [
        {
          id: "r1",
          title: "Program strength score",
          subtitle: "within program only",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
        {
          id: "r2",
          title: "Program volume",
          subtitle: "within program only",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
        {
          id: "r3",
          title: "Program duration",
          subtitle: "within program only",
          last: "—",
          delta: "—",
          baseline: "—",
          trend: "none",
        },
      ];
    }
    return [
      {
        id: "e1",
        title: "Exercise e1RM",
        subtitle: "best set (estimated)",
        last: "—",
        delta: "—",
        baseline: "—",
        trend: "none",
      },
      {
        id: "e2",
        title: "Exercise volume",
        subtitle: "total kg·reps",
        last: "—",
        delta: "—",
        baseline: "—",
        trend: "none",
      },
      {
        id: "e3",
        title: "Exercise consistency",
        subtitle: "sessions containing exercise",
        last: "—",
        delta: "—",
        baseline: "—",
        trend: "none",
      },
    ];
  }, [scope]);

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return programs;
    return programs.filter((p) => p.name.toLowerCase().includes(q));
  }, [programs, query]);

  const filteredExercises = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, query]);

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 pt-3 pb-2 dark:border-neutral-800 dark:bg-neutral-950">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 items-center justify-center">
          <Text
            className="text-base font-semibold text-neutral-900 dark:text-neutral-50"
            numberOfLines={1}
          >
            {headerTitle}
          </Text>
          <Text
            className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400"
            numberOfLines={1}
          >
            {scopeSubtitle}
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
        {/* Scope selector */}
        <View className="mb-3">
          <Text className="mb-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Scope
          </Text>
          <View className="flex-row gap-2">
            <Pill
              label="Overall"
              active={scope === "overall"}
              onPress={() => setScope("overall")}
            />
            <Pill
              label="Program"
              active={scope === "program"}
              onPress={() => {
                setScope("program");
                setSelectedExerciseId(null);
              }}
            />
            <Pill
              label="Exercise"
              active={scope === "exercise"}
              onPress={() => {
                setScope("exercise");
                setSelectedProgramId(null);
              }}
            />
          </View>
        </View>

        {/* Context picker (program/exercise) */}
        {scope !== "overall" && (
          <View className="mb-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
                {scope === "program" ? "Select program" : "Select exercise"}
              </Text>
              <Filter size={14} color={iconColor} />
            </View>

            <View className="mt-2 flex-row items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
              <Search size={14} color={iconColor} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={
                  scope === "program" ? "Search programs" : "Search exercises"
                }
                placeholderTextColor={
                  colorScheme === "dark" ? "#737373" : "#9CA3AF"
                }
                className="ml-2 flex-1 text-[12px] text-neutral-900 dark:text-neutral-50"
              />
            </View>

            {scope === "program" ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
              >
                <View className="flex-row items-center gap-2">
                  {filteredPrograms.length === 0 ? (
                    <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
                      <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        No programs loaded.
                      </Text>
                    </View>
                  ) : (
                    filteredPrograms.map((p) => {
                      const isOn = p.id === selectedProgramId;
                      const st = COLOR_STYLES[p.color];
                      return (
                        <Pressable
                          key={p.id}
                          onPress={() => setSelectedProgramId(p.id)}
                          className={`flex-row items-center gap-2 rounded-full border px-3 py-2 ${
                            isOn ? st.chipOn : st.chipOff
                          }`}
                        >
                          <View
                            className={`h-2.5 w-2.5 rounded-full ${st.dot}`}
                          />
                          <Text
                            className={`text-[11px] font-semibold ${isOn ? st.textOn : st.textOff}`}
                          >
                            {p.name}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            ) : (
              <View className="mt-3 gap-2">
                {filteredExercises.length === 0 ? (
                  <View className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
                    <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      No exercises loaded.
                    </Text>
                  </View>
                ) : (
                  filteredExercises.slice(0, 8).map((e) => {
                    const isOn = e.id === selectedExerciseId;
                    return (
                      <Pressable
                        key={e.id}
                        onPress={() => setSelectedExerciseId(e.id)}
                        className={`rounded-2xl border px-3 py-2 ${
                          isOn
                            ? "bg-neutral-900 border-neutral-900 dark:bg-neutral-50 dark:border-neutral-50"
                            : "bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800"
                        }`}
                      >
                        <Text
                          className={`text-[12px] font-semibold ${
                            isOn
                              ? "text-white dark:text-neutral-900"
                              : "text-neutral-900 dark:text-neutral-50"
                          }`}
                          numberOfLines={1}
                        >
                          {e.name}
                        </Text>
                        {e.group ? (
                          <Text
                            className={`mt-0.5 text-[10px] ${
                              isOn
                                ? "text-white/80 dark:text-neutral-700"
                                : "text-neutral-500 dark:text-neutral-400"
                            }`}
                            numberOfLines={1}
                          >
                            {e.group}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* Metric selector */}
        <View className="mb-3">
          <Text className="mb-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Metric
          </Text>
          <View className="flex-row gap-2">
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
              label="Duration"
              active={metric === "duration"}
              onPress={() => setMetric("duration")}
            />
          </View>
        </View>

        {/* Summary grid */}
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

        {/* Trend */}
        <View className="mb-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              {scope === "overall"
                ? "Overall trend"
                : scope === "program"
                  ? "Program trend"
                  : "Exercise trend"}
            </Text>
            <BarChart3 size={14} color={iconColor} />
          </View>

          <Text className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400">
            Placeholder chart (wire later)
          </Text>

          <MiniBars series={series} />
        </View>

        {/* Breakdown list */}
        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
              Breakdown
            </Text>
            <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
              last / Δ / baseline
            </Text>
          </View>

          <View className="gap-2">
            {rows.map((r) => (
              <ProgressRowCard key={r.id} row={r} />
            ))}
          </View>
        </View>

        {/* Callouts */}
        <View className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <Text className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-50">
            Notes
          </Text>
          <Text className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
            Overall: aggregates across all sessions.
          </Text>
          <Text className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
            Program: aggregates only sessions with a matching programId.
          </Text>
          <Text className="mt-1 text-[11px] text-neutral-600 dark:text-neutral-300">
            Exercise: aggregates only sets belonging to an exerciseId.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
