// app/(tabs)/insights/program/[programId].tsx
import React, { useEffect, useMemo, useState, useLayoutEffect } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useLocalSearchParams, Stack, useNavigation } from "expo-router";

import type { ProgramPeriodStat } from "@/src/features/program-period-stats/domain/types";
import type { ProgramStat } from "@/src/features/program-stats/domain/types";

import { programStatRepository } from "@/src/features/program-stats/data/repository";
import { programPeriodStatRepository } from "@/src/features/program-period-stats/data/repository";

import { ProgramStatsView } from "@/src/features/program-stats/components/program-stats-view";
import { ProgramPeriodStatsView } from "@/src/features/program-period-stats/components/program-period-stats-view";
import { COLOR_STRIP_MAP, WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";

type PeriodKey = "week" | "month" | "year";

export default function ProgramStatsPage() {
  const { programId } = useLocalSearchParams<{ programId: string }>();

  const [period, setPeriod] = useState<PeriodKey>("week");
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [lifetime, setLifetime] = useState<ProgramStat | null>(null);
  const [allPeriods, setAllPeriods] = useState<ProgramPeriodStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // data fetch
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

  const navigation = useNavigation();

  useLayoutEffect(() => {
    if (!program) return;

    navigation.setOptions({
      title: program.name,
    });
  }, [navigation, program]);




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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 16 }}
    >
      {error ? (
        <Text className="text-red-400 text-xs mb-3">{error}</Text>
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

      {/* Lifetime stats */}
      <ProgramStatsView stat={lifetime} className="mb-3" />

      {/* Period selector */}
      <View className="flex-row border border-neutral-700 rounded-xl overflow-hidden mt-3 mb-3">
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
                  active ? "text-neutral-50 font-semibold" : "text-neutral-400",
                ].join(" ")}
              >
                {p}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Latest period */}
      <Text className="text-neutral-300 text-xs mb-2">Latest {period}</Text>

      <ProgramPeriodStatsView stat={latest} className="mb-3" />

      {/* History */}
      <Text className="text-neutral-300 text-xs mb-2">
        All {period} rows ({periodRows.length})
      </Text>

      {periodRows.map((r, i) => (
        <ProgramPeriodStatsView key={i} stat={r} className="mb-3" />
      ))}

      {loading ? (
        <Text className="text-neutral-500 text-xs mt-2">loading…</Text>
      ) : null}
    </ScrollView>
  );
}
