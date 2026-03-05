// app/(tabs)/insights/program/[programId].tsx
import React, { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";

import type { ProgramPeriodStat } from "@/src/features/program-period-stats/domain/types";
import type { ProgramStat } from "@/src/features/program-stats/domain/types";

import { programStatRepository } from "@/src/features/program-stats/data/repository";
import { programPeriodStatRepository } from "@/src/features/program-period-stats/data/repository";

import { ProgramStatsView } from "@/src/features/program-stats/components/program-stats-view";
import { ProgramPeriodStatsView } from "@/src/features/program-period-stats/components/program-period-stats-view";
import { ProgramPeriodTrendView } from "@/src/features/program-period-stats/components/program-period-trend-view";

import {
  COLOR_STRIP_MAP,
  WorkoutProgram,
} from "@/src/features/program-workout/domain/type";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { ProgramPeriodDeltaView } from "@/src/features/program-period-stats/components/program-period-delta-view";

type PeriodKey = "week" | "month" | "year";

// 🔧 DEBUG SWITCH
const DEBUG_TREND = true;

export default function ProgramStatsPage() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const navigation = useNavigation();

  const [period, setPeriod] = useState<PeriodKey>("week");
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [lifetime, setLifetime] = useState<ProgramStat | null>(null);
  const [allPeriods, setAllPeriods] = useState<ProgramPeriodStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------
  // Fetch data
  // -----------------------------
  useEffect(() => {
    if (!programId) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [p, life, periods] = await Promise.all([
          workoutProgramRepository.get(programId),
          programStatRepository.get(programId),
          programPeriodStatRepository.getAllForProgram(programId),
        ]);
        if (cancelled) return;
        setProgram(p);
        setLifetime(life);
        setAllPeriods(periods);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
        setProgram(null);
        setLifetime(null);
        setAllPeriods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [programId]);

  // -----------------------------
  // Header title
  // -----------------------------
  useLayoutEffect(() => {
    if (!program) return;
    navigation.setOptions({ title: program.name });
  }, [navigation, program]);

  // -----------------------------
  // Real period rows
  // -----------------------------
  const periodRows = useMemo(() => {
    return allPeriods
      .filter((r) => r.periodType === period)
      .slice()
      .sort(
        (a, b) =>
          new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime(),
      );
  }, [allPeriods, period]);

  const latest = periodRows[periodRows.length - 1] ?? null;

  // -----------------------------
  // Debug rows (SAFE + TYPED)
  // -----------------------------
  const debugPeriodRows = useMemo<ProgramPeriodStat[]>(() => {
    if (!DEBUG_TREND) return periodRows;

    return [
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-01-01"),
        averageProgression: -0.04,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-01-08"),
        averageProgression: 0.02,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-01-15"),
        averageProgression: 0.06,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-01-22"),
        averageProgression: 0.01,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-01-29"),
        averageProgression: 0.09,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-02-05"),
        averageProgression: -0.02,
      }),
      makeDummyPeriodStat({
        periodType: period,
        periodStart: new Date("2024-02-12"),
        averageProgression: 0.12,
      }),
    ];
  }, [DEBUG_TREND, periodRows, period]);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-[#2B2D3A]"
      contentContainerClassName="pb-4"
    >
      <View className="px-4 pt-4">
        {error ? (
          <Text className="text-red-600 dark:text-[#FF5555] text-xs mb-3">
            {error}
          </Text>
        ) : null}

        {program ? (
          <View className="mb-3">
            <View
              className={[
                "h-2 rounded-full",
                COLOR_STRIP_MAP[program.color],
              ].join(" ")}
            />
          </View>
        ) : null}

        {/* Lifetime */}
        <ProgramStatsView stat={lifetime} className="mb-3" />

        {/* Period selector */}
        <View className="flex-row overflow-hidden rounded-xl border border-neutral-200 dark:border-[#44475A] mt-3 mb-3">
          {(["week", "month", "year"] as PeriodKey[]).map((p) => {
            const active = period === p;

            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className={[
                  "flex-1 py-2",
                  active
                    ? "bg-neutral-900 dark:bg-[#44475A]"
                    : "bg-neutral-100 dark:bg-[#343746]",
                  p !== "year"
                    ? "border-r border-neutral-200 dark:border-[#44475A]"
                    : "",
                ].join(" ")}
              >
                <Text
                  className={[
                    "text-center text-xs",
                    active
                      ? "text-white dark:text-[#F8F8F2] font-semibold"
                      : "text-neutral-600 dark:text-[#6272A4]",
                  ].join(" ")}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Latest */}
        <Text className="text-neutral-600 dark:text-[#6272A4] text-xs mb-2">
          Latest {period}
        </Text>

        <ProgramPeriodStatsView stat={latest} className="mb-3" />
        <ProgramPeriodDeltaView rows={periodRows} period={period} />

        {/* Trend */}
        <ProgramPeriodTrendView rows={periodRows} className="mb-4" />

        {loading ? (
          <Text className="text-neutral-500 dark:text-[#6272A4] text-xs mt-2">
            loading…
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

// --------------------------------
// Dummy factory (TYPE-SAFE)
// --------------------------------
function makeDummyPeriodStat(
  overrides: Partial<ProgramPeriodStat>,
): ProgramPeriodStat {
  return {
    id: "debug",
    programId: "debug",
    periodType: "week",
    periodStart: new Date("2024-01-01"),
    sessionCount: 0,
    volumeKg: 0,
    durationSec: 0,
    averageProgression: 0,
    updatedAt: new Date(),
    ...overrides,
  };
}
