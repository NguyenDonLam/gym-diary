// app/(tabs)/insights/index.tsx
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, LinkProps } from "expo-router";

type TimeLens = "7D" | "4W" | "12W" | "ALL";

type OverallStats = {
  sessionsCount: number;
  workingSetsCount: number;
  totalVolume: number; // keep unitless here; format in UI layer
  trainingMinutes: number;
  deltas?: Partial<{
    sessionsCount: number;
    workingSetsCount: number;
    totalVolume: number;
    trainingMinutes: number;
  }>;
};

type ActivityStrip = {
  // One value per bucket (day/week). You decide what each bucket means based on lens.
  buckets: Array<{
    key: string; // stable id for render
    intensity: number; // 0..1
    label?: string; // optional for accessibility/debug
  }>;
};

type PreviewRow = {
  id: string;
  title: string;
  value: string; // already formatted
  subtitle?: string;
};

type InsightsIndexModel = {
  overall: OverallStats;
  activity: ActivityStrip;
  exercisePreview: PreviewRow[]; // max 3
  programPreview: PreviewRow[]; // max 3
  highlights?: Array<{
    title: string;
    rows: PreviewRow[]; // max 3
    emptyText?: string;
  }>;
};

function formatDelta(n?: number): string | null {
  if (n === undefined || n === null) return null;
  if (n === 0) return "0%";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}%`;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Replace this with your real data hook.
 * No DB/schema assumptions here; you map from your domain to InsightsIndexModel.
 */
function useInsightsIndexModel(_lens: TimeLens): {
  model: InsightsIndexModel;
  loading: boolean;
  error: null | { message: string };
} {
  // Placeholder-only: safe empty UI.
  return {
    loading: false,
    error: null,
    model: {
      overall: {
        sessionsCount: 0,
        workingSetsCount: 0,
        totalVolume: 0,
        trainingMinutes: 0,
        deltas: {
          sessionsCount: 0,
          workingSetsCount: 0,
          totalVolume: 0,
          trainingMinutes: 0,
        },
      },
      activity: {
        buckets: new Array(28).fill(0).map((_, i) => ({
          key: String(i),
          intensity: 0,
        })),
      },
      exercisePreview: [],
      programPreview: [],
      highlights: [
        { title: "PRs", rows: [], emptyText: "No PRs in this period" },
        { title: "Most trained", rows: [], emptyText: "No data yet" },
        { title: "Biggest movers", rows: [], emptyText: "No data yet" },
      ],
    },
  };
}

function MetricTile(props: {
  label: string;
  value: string;
  deltaText?: string | null;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <Text className="text-xs text-neutral-500 dark:text-neutral-400">
        {props.label}
      </Text>
      <View className="mt-2 flex-row items-end justify-between">
        <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          {props.value}
        </Text>
        {props.deltaText ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {props.deltaText}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function LensToggle(props: {
  value: TimeLens;
  onChange: (v: TimeLens) => void;
}) {
  const items: TimeLens[] = ["7D", "4W", "12W", "ALL"];

  return (
    <View className="flex-row rounded-2xl border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950">
      {items.map((it) => {
        const active = it === props.value;
        return (
          <Pressable
            key={it}
            onPress={() => props.onChange(it)}
            className={[
              "px-3 py-2 rounded-xl",
              active ? "bg-neutral-900 dark:bg-neutral-100" : "bg-transparent",
            ].join(" ")}
          >
            <Text
              className={[
                "text-xs font-medium",
                active
                  ? "text-white dark:text-neutral-900"
                  : "text-neutral-700 dark:text-neutral-300",
              ].join(" ")}
            >
              {it}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActivityStripView(props: { buckets: ActivityStrip["buckets"] }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Activity
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          Consistency view
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {props.buckets.map((b) => {
          const t = clamp01(b.intensity);
          // Neutral-only intensity using opacity (no color semantics).
          const opacityClass =
            t === 0
              ? "opacity-15"
              : t < 0.34
                ? "opacity-35"
                : t < 0.67
                  ? "opacity-60"
                  : "opacity-100";

          return (
            <View
              key={b.key}
              className={[
                "h-3 w-3 rounded-sm bg-neutral-900 dark:bg-neutral-100",
                opacityClass,
              ].join(" ")}
              accessibilityLabel={b.label ?? undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

function ModuleCard(props: {
  title: string;
  subtitle: string;
  href: LinkProps["href"];
  previewRows: PreviewRow[];
  emptyText: string;
}) {
  return (
    <Link href={props.href} asChild>
      <Pressable className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <View className="flex-row items-start justify-between">
          <View className="pr-4">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {props.title}
            </Text>
            <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {props.subtitle}
            </Text>
          </View>
          <Text className="text-neutral-400 dark:text-neutral-600">›</Text>
        </View>

        <View className="mt-3 gap-2">
          {props.previewRows.length === 0 ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {props.emptyText}
            </Text>
          ) : (
            props.previewRows.slice(0, 3).map((r) => (
              <View
                key={r.id}
                className="flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text
                    className="text-sm text-neutral-800 dark:text-neutral-200"
                    numberOfLines={1}
                  >
                    {r.title}
                  </Text>
                  {r.subtitle ? (
                    <Text
                      className="text-xs text-neutral-500 dark:text-neutral-400"
                      numberOfLines={1}
                    >
                      {r.subtitle}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {r.value}
                </Text>
              </View>
            ))
          )}
        </View>
      </Pressable>
    </Link>
  );
}

function HighlightSection(props: {
  title: string;
  rows: PreviewRow[];
  emptyText: string;
}) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {props.title}
      </Text>

      <View className="mt-3 gap-2">
        {props.rows.length === 0 ? (
          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
            {props.emptyText}
          </Text>
        ) : (
          props.rows.slice(0, 3).map((r) => (
            <View key={r.id} className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="text-sm text-neutral-800 dark:text-neutral-200"
                  numberOfLines={1}
                >
                  {r.title}
                </Text>
                {r.subtitle ? (
                  <Text
                    className="text-xs text-neutral-500 dark:text-neutral-400"
                    numberOfLines={1}
                  >
                    {r.subtitle}
                  </Text>
                ) : null}
              </View>
              <Text className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {r.value}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

export default function InsightsIndexScreen() {
  const [lens, setLens] = useState<TimeLens>("4W");
  const { model, loading, error } = useInsightsIndexModel(lens);

  const headerSubtitle = useMemo(() => {
    switch (lens) {
      case "7D":
        return "Last 7 days";
      case "4W":
        return "Last 4 weeks";
      case "12W":
        return "Last 12 weeks";
      case "ALL":
        return "All time";
    }
  }, [lens]);

  const overall = model.overall;

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      {/* Header */}
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Insights
          </Text>
          <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {headerSubtitle}
          </Text>
          {loading ? (
            <Text className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              Loading…
            </Text>
          ) : error ? (
            <Text className="mt-2 text-xs text-red-600">{error.message}</Text>
          ) : null}
        </View>
        <LensToggle value={lens} onChange={setLens} />
      </View>

      {/* Snapshot tiles */}
      <View className="flex-row gap-3">
        <MetricTile
          label="Sessions"
          value={String(overall.sessionsCount ?? 0)}
          deltaText={formatDelta(overall.deltas?.sessionsCount)}
        />
        <MetricTile
          label="Working sets"
          value={String(overall.workingSetsCount ?? 0)}
          deltaText={formatDelta(overall.deltas?.workingSetsCount)}
        />
      </View>
      <View className="flex-row gap-3">
        <MetricTile
          label="Total volume"
          value={String(overall.totalVolume ?? 0)}
          deltaText={formatDelta(overall.deltas?.totalVolume)}
        />
        <MetricTile
          label="Training time"
          value={`${String(overall.trainingMinutes ?? 0)} min`}
          deltaText={formatDelta(overall.deltas?.trainingMinutes)}
        />
      </View>

      {/* Activity strip */}
      <ActivityStripView buckets={model.activity.buckets} />

      {/* Drilldown modules */}
      <ModuleCard
        title="Exercise"
        subtitle="PRs, progression, workload"
        href="/(tabs)/insights/exercise"
        previewRows={model.exercisePreview}
        emptyText="No exercise data yet"
      />
      <ModuleCard
        title="Program"
        subtitle="Adherence, balance, workload"
        href="/(tabs)/insights/program"
        previewRows={model.programPreview}
        emptyText="No program data yet"
      />

      
    </ScrollView>
  );
}
