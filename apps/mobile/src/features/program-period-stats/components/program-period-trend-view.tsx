// src/features/program-period-stats/components/program-period-trend-view.tsx
import React, { useMemo } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { CartesianChart, Line, Scatter } from "victory-native";
import { useFont } from "@shopify/react-native-skia";
import type { ProgramPeriodStat } from "../domain/types";

type Props = {
  rows: ProgramPeriodStat[];
  className?: string;
};

type TrendPoint = {
  period: number; // ms since epoch
  growth: number; // percent
};

// TODO: NOT YET IMPLEMENTED, try use victory native for graphing later on
export function ProgramPeriodTrendView({ }: Props) {
  return <></>
}
