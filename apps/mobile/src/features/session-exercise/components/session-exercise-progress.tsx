// apps/mobile/app/session-workout/session-exercise-progress.tsx

import React from "react";
import { View, Text, Pressable, type LayoutChangeEvent } from "react-native";
import { BarChart3, List, Sigma, Trophy } from "lucide-react-native";
import { useColorScheme } from "nativewind";

export type TrendPoint = {
  id?: string;
  label: string; // e.g. "W-3"
  occurredAt?: string; // ISO timestamp used for time-relative chart spacing.
  bestScore: number;
  volumeScore: number;
  bestLabel: string; // e.g. "62.5×8"
};

type Metric = "best" | "volume";
type ViewMode = "dots" | "raw";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(n, 1));
}

function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function formatDelta(n: number) {
  if (!Number.isFinite(n) || n === 0) return "0";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Math.round(n)}`;
}

function getPointTime(point: TrendPoint): number | null {
  if (!point.occurredAt) return null;
  const time = new Date(point.occurredAt).getTime();
  return Number.isFinite(time) ? time : null;
}

function DotPlot({ points, metric }: { points: TrendPoint[]; metric: Metric }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [plotWidth, setPlotWidth] = React.useState(0);

  const values = points.map((p) =>
    metric === "best" ? p.bestScore : p.volumeScore
  );
  const clean = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min;

  const plotH = 56;
  const dot = 8;
  const hitWidth = 36;

  const grid = isDark ? "#262626" : "#E5E7EB";
  const axisText = isDark ? "#A3A3A3" : "#6B7280";
  const baseDot = isDark ? "#6B7280" : "#9CA3AF";
  const stem = isDark ? "#404040" : "#E5E7EB";
  const highlight = metric === "best" ? "#0EA5E9" : "#F59E0B";

  const [selected, setSelected] = React.useState(points.length - 1);

  React.useEffect(() => {
    setSelected((current) => {
      if (points.length === 0) return 0;
      if (current < 0 || current >= points.length) return points.length - 1;
      return current;
    });
  }, [points.length]);

  const yFor = (v: number) => {
    if (range <= 0) return Math.round((plotH - dot) / 2);
    const t = clamp01((v - min) / range);
    return Math.round((1 - t) * (plotH - dot));
  };

  const pointTimes = points.map(getPointTime);
  const useTimeScale = pointTimes.every(
    (time): time is number => time != null,
  );
  const fallbackXValues = points.map((_, i) => i);
  const xValues: number[] = useTimeScale
    ? pointTimes.filter((time): time is number => time != null)
    : fallbackXValues;
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xRange = xMax - xMin;

  const onPlotLayout = (event: LayoutChangeEvent) => {
    setPlotWidth(event.nativeEvent.layout.width);
  };

  const xFor = (x: number) => {
    if (plotWidth <= 0) return hitWidth / 2;
    if (xRange <= 0) return Math.round(plotWidth / 2);

    const innerWidth = Math.max(0, plotWidth - hitWidth);
    return Math.round(hitWidth / 2 + ((x - xMin) / xRange) * innerWidth);
  };

  const yVals = clean.map(yFor);
  const mid = range <= 0 ? min : min + range / 2;

  const selPoint = points[selected];
  const selValue = clean[selected];
  const prevValue = selected > 0 ? clean[selected - 1] : null;
  const delta = prevValue == null ? null : selValue - prevValue;

  return (
    <View className="mt-2 rounded-xl bg-neutral-50 px-2 py-2 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          {metric === "best" ? "best score" : "volume"}
        </Text>

        <View className="flex-row items-center gap-2">
          <Text className="text-[10px] text-neutral-600 dark:text-neutral-300">
            {selPoint?.label}
          </Text>
          <Text className="text-[10px] text-neutral-900 dark:text-neutral-50">
            {metric === "best" ? selPoint?.bestLabel : formatCompact(selValue)}
          </Text>
          {delta != null && (
            <Text
              className="text-[10px]"
              style={{ color: delta >= 0 ? highlight : axisText }}
            >
              {formatDelta(delta)}
            </Text>
          )}
        </View>
      </View>

      <View className="mt-2 flex-row">
        <View
          style={{ width: 34, height: plotH, justifyContent: "space-between" }}
        >
          <Text style={{ fontSize: 9, color: axisText }}>
            {metric === "best" ? Math.round(max) : formatCompact(max)}
          </Text>
          <Text style={{ fontSize: 9, color: axisText }}>
            {metric === "best" ? Math.round(mid) : formatCompact(mid)}
          </Text>
          <Text style={{ fontSize: 9, color: axisText }}>
            {metric === "best" ? Math.round(min) : formatCompact(min)}
          </Text>
        </View>

        <View
          onLayout={onPlotLayout}
          style={{ flex: 1, height: plotH, position: "relative" }}
        >
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 1,
              backgroundColor: grid,
              opacity: 0.6,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: Math.round(plotH / 2),
              height: 1,
              backgroundColor: grid,
              opacity: 0.6,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: plotH - 1,
              height: 1,
              backgroundColor: grid,
              opacity: 0.6,
            }}
          />

          {points.map((p, i) => {
            const x = xFor(xValues[i]);
            const y = yVals[i];
            const isSel = i === selected;
            const pointKey = `${p.id ?? p.label}-${i}`;

            const dotColor = isSel ? highlight : baseDot;
            const stemColor = isSel ? highlight : stem;

            const dotSize = isSel ? dot + 2 : dot;
            const stemTop = y + Math.round(dot / 2);
            const stemHeight = Math.max(0, plotH - stemTop - 1);

            return (
              <Pressable
                key={pointKey}
                onPress={() => setSelected(i)}
                style={{
                  position: "absolute",
                  left: x - hitWidth / 2,
                  top: 0,
                  width: hitWidth,
                  height: plotH,
                  alignItems: "center",
                }}
                hitSlop={6}
              >
                <View
                  style={{
                    position: "absolute",
                    left: (hitWidth - 2) / 2,
                    top: stemTop,
                    width: 2,
                    height: stemHeight,
                    borderRadius: 2,
                    backgroundColor: stemColor,
                    opacity: isSel ? 0.9 : 0.55,
                  }}
                />

                <View
                  style={{
                    position: "absolute",
                    left: (hitWidth - dotSize) / 2,
                    top: y,
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: dotColor,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-1 flex-row">
        <View style={{ width: 34 }} />
        <View style={{ flex: 1, height: 12, position: "relative" }}>
          {points.map((p, i) => {
            const show = i % 2 === 0 || i === points.length - 1;
            const isSel = i === selected;
            const pointKey = `${p.id ?? p.label}-${i}`;
            const x = xFor(xValues[i]);

            return (
              <View
                key={pointKey}
                style={{
                  position: "absolute",
                  left: x - hitWidth / 2,
                  width: hitWidth,
                  alignItems: "center",
                }}
              >
                <Text
                  className="text-[9px]"
                  numberOfLines={1}
                  style={{ color: isSel ? highlight : axisText }}
                >
                  {show ? p.label : ""}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function RawHistory({
  points,
  metric,
}: {
  points: TrendPoint[];
  metric: Metric;
}) {
  const last6 = points.slice(-6);

  return (
    <View className="mt-2 rounded-xl bg-neutral-50 px-2 py-2 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between">
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          last 6
        </Text>
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          {metric === "best" ? "best" : "volume"}
        </Text>
      </View>

      <View className="mt-1 gap-1">
        {last6.map((p, index) => (
          <View
            key={`${p.id ?? p.label}-${index}`}
            className="flex-row items-center justify-between"
          >
            <Text className="text-[10px] text-neutral-600 dark:text-neutral-300">
              {p.label}
            </Text>
            <Text className="text-[10px] text-neutral-800 dark:text-neutral-100">
              {metric === "best" ? p.bestLabel : String(p.volumeScore)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SessionExerciseProgress({
  history,
  initialMetric = "best",
  initialView = "dots",
}: {
  history: TrendPoint[];
  initialMetric?: Metric;
  initialView?: ViewMode;
}) {
  const { colorScheme } = useColorScheme();
  const [metric, setMetric] = React.useState<Metric>(initialMetric);
  const [view, setView] = React.useState<ViewMode>(initialView);

  if (!history || history.length === 0) return null;

  const activeIconColor = colorScheme === "dark" ? "#282A36" : "#FFFFFF";
  const idleIconColor = colorScheme === "dark" ? "#D4D4D4" : "#4B5563";
  const controlBase = "h-11 w-11 items-center justify-center rounded-xl";
  const activeControl = "bg-neutral-900 dark:bg-[#BD93F9]";
  const idleControl = "bg-transparent";

  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[10px] text-neutral-500 dark:text-neutral-400">
          progress (history)
        </Text>

        <View className="flex-row items-center gap-2">
          <View className="flex-row rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show progress chart"
              accessibilityState={{ selected: view === "dots" }}
              onPress={() => setView("dots")}
              className={`${controlBase} ${
                view === "dots" ? activeControl : idleControl
              }`}
            >
              <BarChart3
                size={17}
                color={view === "dots" ? activeIconColor : idleIconColor}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show progress list"
              accessibilityState={{ selected: view === "raw" }}
              onPress={() => setView("raw")}
              className={`${controlBase} ${
                view === "raw" ? activeControl : idleControl
              }`}
            >
              <List
                size={17}
                color={view === "raw" ? activeIconColor : idleIconColor}
              />
            </Pressable>
          </View>

          <View className="flex-row rounded-xl bg-neutral-100 p-0.5 dark:bg-neutral-800">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show best set data"
              accessibilityState={{ selected: metric === "best" }}
              onPress={() => setMetric("best")}
              className={`${controlBase} ${
                metric === "best" ? activeControl : idleControl
              }`}
            >
              <Trophy
                size={17}
                color={metric === "best" ? activeIconColor : idleIconColor}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show volume data"
              accessibilityState={{ selected: metric === "volume" }}
              onPress={() => setMetric("volume")}
              className={`${controlBase} ${
                metric === "volume" ? activeControl : idleControl
              }`}
            >
              <Sigma
                size={17}
                color={metric === "volume" ? activeIconColor : idleIconColor}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {view === "dots" ? (
        <DotPlot points={history} metric={metric} />
      ) : (
        <RawHistory points={history} metric={metric} />
      )}
    </View>
  );
}
