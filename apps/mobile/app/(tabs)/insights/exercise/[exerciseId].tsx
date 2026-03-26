// app/(tabs)/insights/exercise/[exerciseId].tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";

import type { Exercise } from "@packages/exercise";
import type { ExerciseStat } from "@/src/features/exercise-stats/domain/types";
import type { ExercisePeriodStat } from "@/src/features/exercise-period-stats/domain/types";

import { exerciseRepository } from "@/src/features/exercise/data/exercise-repository";
import { exerciseStatRepository } from "@/src/features/exercise-stats/data/repository";
import { exercisePeriodStatRepository } from "@/src/features/exercise-period-stats/data/repository";

import { ExerciseStatsView } from "@/src/features/exercise-stats/components/exercise-stat-view";
import { ExercisePeriodStatsView } from "@/src/features/exercise-period-stats/components/exercise-period-stats-view";
import { ExercisePeriodDeltaView } from "@/src/features/exercise-period-stats/components/exercise-period-delta-view";

type PeriodKey = "week" | "month" | "year";

export default function ExerciseProgressionScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const [period, setPeriod] = useState<PeriodKey>("month");

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [lifetime, setLifetime] = useState<ExerciseStat | null>(null);
  const [allPeriods, setAllPeriods] = useState<ExercisePeriodStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [ex, life, periods] = await Promise.all([
          exerciseRepository.get(exerciseId),
          exerciseStatRepository.get(exerciseId),
          exercisePeriodStatRepository.getAllForExercise(exerciseId),
        ]);

        if (cancelled) return;

        setExercise(ex ?? null);
        setLifetime(life ?? null);
        setAllPeriods(periods ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(String(e));
        setExercise(null);
        setLifetime(null);
        setAllPeriods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  const periodRows = useMemo<ExercisePeriodStat[]>(() => {
    return allPeriods
      .filter((r) => r.periodType === period)
      .slice()
      .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
  }, [allPeriods, period]);

  const latest = periodRows[periodRows.length - 1] ?? null;

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <ScrollView contentContainerClassName="pb-4">
        <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
          <Text className="text-sm font-semibold text-neutral-900 dark:text-[#F8F8F2]">
            Exercise
          </Text>

          <Text className="mt-1 text-xs text-neutral-500 dark:text-[#6272A4]">
            {exercise?.name ?? exerciseId}
          </Text>

          {error ? (
            <Text className="mt-2 text-xs text-red-600 dark:text-[#FF5555]">
              {error}
            </Text>
          ) : null}
        </View>

        <View className="px-4 pt-4">
          {/* Lifetime stats */}
          <ExerciseStatsView
            stat={lifetime}
            exercise={exercise}
            className="mb-4"
          />

          {/* Period stats */}
          <View>
            <View className="mb-2 flex-row overflow-hidden rounded-xl border border-neutral-200 dark:border-[#44475A]">
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

            <ExercisePeriodStatsView
              stat={latest}
              exercise={exercise}
              className="mb-3"
            />

            <ExercisePeriodDeltaView
              rows={periodRows}
              period={period}
              className="mb-3"
            />
          </View>

          {loading ? (
            <Text className="mt-2 text-xs text-neutral-500 dark:text-[#6272A4]">
              loading…
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
