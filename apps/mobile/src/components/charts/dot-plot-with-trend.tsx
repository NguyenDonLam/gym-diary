import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";

export type DotPlotPoint = {
  x: number;
  y: number;
  label: string;
  detailLabel?: string;
};

type Props = {
  points: DotPlotPoint[];
  title: string;
  subtitle?: string;
  className?: string;
  emptyLabel?: string;
  height?: number;
  accentColor?: string;
  trendColor?: string;
  metricLabel?: string;
  valueFormatter?: (value: number) => string;
};

const DOT_SIZE = 8;
const SELECTED_DOT_SIZE = 12;
const HIT_WIDTH = 36;

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  if (abs >= 100) return String(Math.round(value));
  if (abs >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function linearRegression(points: DotPlotPoint[]) {
  if (points.length < 2) return null;

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;

  let numerator = 0;
  let denominator = 0;

  for (const point of points) {
    const dx = point.x - meanX;
    numerator += dx * (point.y - meanY);
    denominator += dx * dx;
  }

  if (denominator === 0) return null;

  const slope = numerator / denominator;
  const intercept = meanY - slope * meanX;

  return {
    predict: (x: number) => slope * x + intercept,
  };
}

function paddedDomain(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const pad = Math.max(Math.abs(min) * 0.1, 1);
    return { min: min - pad, max: max + pad };
  }

  const pad = (max - min) * 0.12;
  return { min: min - pad, max: max + pad };
}

export function DotPlotWithTrend({
  points,
  title,
  subtitle,
  className,
  emptyLabel = "No chart data yet",
  height = 116,
  accentColor = "#38BDF8",
  trendColor = "#FBBF24",
  metricLabel = "Score",
  valueFormatter = formatCompact,
}: Props) {
  const [plotWidth, setPlotWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(Number.MAX_SAFE_INTEGER);

  const series = useMemo(() => {
    return points
      .filter((point) => isFiniteNumber(point.x) && isFiniteNumber(point.y))
      .slice()
      .sort((a, b) => a.x - b.x);
  }, [points]);

  useEffect(() => {
    setSelectedIndex((current) => {
      if (series.length === 0) return 0;
      if (current < 0 || current >= series.length) return series.length - 1;
      return current;
    });
  }, [series.length]);

  const xMin = series[0]?.x ?? 0;
  const xMax = series[series.length - 1]?.x ?? 0;
  const xRange = xMax - xMin;

  const regression = useMemo(() => linearRegression(series), [series]);

  const yDomain = useMemo(() => {
    if (series.length === 0) return { min: 0, max: 1 };
    const trendY =
      regression && series.length > 1
        ? [regression.predict(xMin), regression.predict(xMax)]
        : [];
    return paddedDomain([...series.map((point) => point.y), ...trendY]);
  }, [regression, series, xMax, xMin]);

  const yRange = yDomain.max - yDomain.min;
  const yMid = yDomain.min + yRange / 2;
  const activeIndex =
    series.length === 0
      ? 0
      : Math.min(Math.max(selectedIndex, 0), series.length - 1);
  const selected = series[activeIndex];

  const onPlotLayout = (event: LayoutChangeEvent) => {
    setPlotWidth(event.nativeEvent.layout.width);
  };

  const xFor = (x: number) => {
    if (plotWidth <= 0) return 0;
    if (xRange <= 0) return plotWidth / 2;
    return (
      SELECTED_DOT_SIZE / 2 +
      ((x - xMin) / xRange) * (plotWidth - SELECTED_DOT_SIZE)
    );
  };

  const yFor = (y: number) => {
    if (yRange <= 0) return height / 2;
    const t = (yDomain.max - y) / yRange;
    return SELECTED_DOT_SIZE / 2 + t * (height - SELECTED_DOT_SIZE);
  };

  const trendLine = (() => {
    if (!regression || series.length < 2 || plotWidth <= 0) return null;

    const start = {
      x: xFor(xMin),
      y: yFor(regression.predict(xMin)),
    };
    const end = {
      x: xFor(xMax),
      y: yFor(regression.predict(xMax)),
    };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length <= 0) return null;

    return {
      length,
      angle: Math.atan2(dy, dx),
      left: (start.x + end.x) / 2 - length / 2,
      top: (start.y + end.y) / 2 - 1,
    };
  })();

  const cardClassName = [
    "border border-neutral-800 bg-neutral-950 rounded-xl px-3 py-3",
    className ?? "",
  ].join(" ");

  if (series.length === 0) {
    return (
      <View className={cardClassName}>
        <Text className="text-neutral-300 text-xs font-semibold">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 text-[10px] text-neutral-500">{subtitle}</Text>
        ) : null}
        <Text className="mt-3 text-xs text-neutral-500">{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View className={cardClassName}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            className="text-neutral-300 text-xs font-semibold"
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1 text-[10px] text-neutral-500" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {selected ? (
          <View className="items-end">
            <Text className="text-[10px] text-neutral-500" numberOfLines={1}>
              {selected.detailLabel ?? selected.label}
            </Text>
            <Text className="text-sm font-semibold text-neutral-50">
              {valueFormatter(selected.y)}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-3 flex-row">
        <View
          style={{
            width: 40,
            height,
            justifyContent: "space-between",
            paddingRight: 6,
          }}
        >
          <Text style={{ color: "#A3A3A3", fontSize: 9 }}>
            {valueFormatter(yDomain.max)}
          </Text>
          <Text style={{ color: "#A3A3A3", fontSize: 9 }}>
            {valueFormatter(yMid)}
          </Text>
          <Text style={{ color: "#A3A3A3", fontSize: 9 }}>
            {valueFormatter(yDomain.min)}
          </Text>
        </View>

        <View
          onLayout={onPlotLayout}
          style={{ flex: 1, height, position: "relative" }}
        >
          {[0, height / 2, height - 1].map((top) => (
            <View
              key={top}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top,
                height: 1,
                backgroundColor: "#262626",
              }}
            />
          ))}

          {trendLine ? (
            <View
              style={{
                position: "absolute",
                left: trendLine.left,
                top: trendLine.top,
                width: trendLine.length,
                height: 2,
                borderRadius: 999,
                backgroundColor: trendColor,
                opacity: 0.9,
                transform: [{ rotate: `${trendLine.angle}rad` }],
                zIndex: 1,
              }}
            />
          ) : null}

          {series.map((point, index) => {
            const x = xFor(point.x);
            const y = yFor(point.y);
            const isSelected = index === selectedIndex;
            const dotSize = isSelected ? SELECTED_DOT_SIZE : DOT_SIZE;
            const color = isSelected ? accentColor : "#737373";

            return (
              <Pressable
                key={`${point.x}-${point.label}-${index}`}
                accessibilityRole="button"
                accessibilityLabel={`${point.label} ${metricLabel.toLowerCase()} ${valueFormatter(
                  point.y,
                )}`}
                onPress={() => setSelectedIndex(index)}
                hitSlop={8}
                style={{
                  position: "absolute",
                  left: x - HIT_WIDTH / 2,
                  top: 0,
                  width: HIT_WIDTH,
                  height,
                  alignItems: "center",
                  zIndex: 3,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: y + DOT_SIZE / 2,
                    width: 2,
                    height: Math.max(0, height - y - DOT_SIZE / 2),
                    borderRadius: 999,
                    backgroundColor: isSelected ? accentColor : "#404040",
                    opacity: isSelected ? 0.7 : 0.45,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    top: y - dotSize / 2,
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: color,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: "#E0F2FE",
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-2 flex-row items-center justify-between pl-10">
        <Text className="text-[9px] text-neutral-500" numberOfLines={1}>
          {series[0]?.label}
        </Text>
        {series.length > 2 &&
        selected &&
        activeIndex > 0 &&
        activeIndex < series.length - 1 ? (
          <Text className="text-[9px] text-neutral-400" numberOfLines={1}>
            {selected.label}
          </Text>
        ) : null}
        <Text className="text-[9px] text-neutral-500" numberOfLines={1}>
          {series[series.length - 1]?.label}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center gap-4">
        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: accentColor,
            }}
          />
          <Text className="text-[10px] text-neutral-400">{metricLabel}</Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View
            style={{
              width: 18,
              height: 2,
              borderRadius: 999,
              backgroundColor: trendColor,
            }}
          />
          <Text className="text-[10px] text-neutral-400">
            {trendLine ? "Best fit" : "Best fit needs 2 points"}
          </Text>
        </View>
      </View>
    </View>
  );
}
