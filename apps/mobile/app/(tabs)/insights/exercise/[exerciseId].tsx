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
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
            Exercise
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 11, marginTop: 2 }}>
            {exercise?.name ?? exerciseId}
          </Text>
          {error ? (
            <Text style={{ color: "#F87171", fontSize: 11, marginTop: 6 }}>
              {error}
            </Text>
          ) : null}
        </View>

        {/* Lifetime stats */}
        <ExerciseStatsView stat={lifetime} className="mb-4" />

        {/* Period stats */}
        <View>
          {/* Period selector */}
          <View className="flex-row border border-neutral-700 rounded-xl overflow-hidden mb-2">
            {(["week", "month", "year"] as PeriodKey[]).map((p) => {
              const active = period === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={[
                    "flex-1 py-2",
                    active ? "bg-neutral-800" : "bg-neutral-950",
                    p !== "year" ? "border-r border-neutral-700" : "",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-center text-xs",
                      active
                        ? "text-neutral-50 font-semibold"
                        : "text-neutral-400",
                    ].join(" ")}
                  >
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ExercisePeriodStatsView stat={latest} className="mb-3" />

          {/* Delta */}
          <ExercisePeriodDeltaView
            rows={periodRows}
            period={period}
            className="mb-3"
          />
        </View>

        {loading ? (
          <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 8 }}>
            loading…
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
