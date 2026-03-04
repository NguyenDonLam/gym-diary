// app/(tabs)/insights/exercise/[exerciseId].tsx
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

// Adjust these imports to your actual feature paths (same pattern as program stats).
import { exerciseStatRepository } from "@/src/features/exercise-stats/data/repository";
import { exercisePeriodStatRepository } from "@/src/features/exercise-period-stats/data/repository";
import { exerciseRepository } from "@/src/features/exercise/data/exercise-repository";

type PeriodKey = "week" | "month" | "year" | "lifetime";

export default function ExerciseProgressionScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();

  const [period, setPeriod] = useState<PeriodKey>("month");

  const [exercise, setExercise] = useState<any>(null);
  const [lifetime, setLifetime] = useState<any>(null);
  const [allPeriods, setAllPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
        setAllPeriods(Array.isArray(periods) ? periods : []);
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

  const periodRows = useMemo(() => {
    if (period === "lifetime") return [];
    return allPeriods
      .filter(
        (r) => r?.periodType === period || r?.periodType === String(period),
      )
      .slice()
      .sort((a, b) => Number(a?.periodStart) - Number(b?.periodStart));
  }, [allPeriods, period]);

  const latest = periodRows[periodRows.length - 1] ?? null;

  const debugJson = useMemo(() => {
    return {
      exerciseId,
      loading,
      error,
      selectedPeriod: period,
      exercise,
      lifetime,
      allPeriodsCount: allPeriods.length,
      periodRowsCount: periodRows.length,
      latest,
      allPeriods,
      periodRows,
    };
  }, [
    exerciseId,
    loading,
    error,
    period,
    exercise,
    lifetime,
    allPeriods,
    periodRows,
    latest,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontSize: 12, marginBottom: 8 }}>
          Exercise insight debug JSON
        </Text>

        <Text style={{ color: "#9CA3AF", fontSize: 10, marginBottom: 12 }}>
          period={period} (setPeriod in code to switch week/month/year/lifetime)
        </Text>

        <Text style={{ color: "#E5E7EB", fontSize: 10 }}>
          {JSON.stringify(debugJson, null, 2)}
        </Text>
      </ScrollView>
    </View>
  );
}
