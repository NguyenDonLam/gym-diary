import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useColorScheme } from "nativewind";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";

import {
  addDaysLocal,
  buildMonthMatrix,
  firstDayOfMonth,
  startOfDayLocal,
  toKey,
} from "@/src/features/history/ui/date";
import { CalendarMonth } from "@/src/features/history/ui/calendar-month";
import { LoadUnit, ProgramColor } from "@/db/enums";
import { router } from "expo-router";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import { DaySummaryCard } from "@/src/features/history/ui/day-summary-card";

function parseLoadKg(
  loadValue: string | null | undefined,
  loadUnit: LoadUnit | null | undefined,
) {
  if (!loadValue) return null;
  const t = loadValue.trim();
  if (!t) return null;

  const raw = Number.parseFloat(t);
  if (!Number.isFinite(raw) || raw <= 0) return null;

  const u = String(loadUnit ?? "").toLowerCase();

  if (u === "lb" || u === "lbs") return raw * 0.45359237;
  if (u === "kg" || u === "kgs") return raw;

  return null;
}

function WorkoutSessionStat({
  selectedDateKey,
  sessions,
}: {
  selectedDateKey: string;
  sessions: SessionWorkout[];
  growthBySessionId: Record<string, number | null | undefined>;
}) {
  function growthPctFromNormalizedStrengthScore(
    norm: number | null | undefined,
  ) {
    if (norm == null || !Number.isFinite(norm) || norm <= 0) return null;
    const pct = (norm - 1) * 100;
    return Number.isFinite(pct) ? pct : null;
  }

  const stat = useMemo(() => {
    const byTime = [...sessions].sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    );

    let setCount = 0;
    let volumeKg = 0;

    let growthSum = 0;
    let growthN = 0;

    for (const s of byTime) {
      for (const ex of s.exercises ?? []) {
        for (const set of ex.sets ?? []) {
          if (!(set.isCompleted ?? true)) continue;

          const reps = set.quantity ?? 0;
          if (!Number.isFinite(reps) || reps <= 0) continue;

          setCount += 1;

          const loadKg = parseLoadKg(set.loadValue, set.loadUnit);
          if (loadKg != null) volumeKg += loadKg * reps;
        }
      }

      const g = growthPctFromNormalizedStrengthScore(s.strengthScore);
      if (g == null) continue;

      growthSum += g;
      growthN += 1;
    }

    const avgGrowthPct = growthN > 0 ? growthSum / growthN : null;

    return { setCount, volumeKg, avgGrowthPct };
  }, [sessions]);

  return (
    <View className="mb-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-[#44475A] dark:bg-[#343746]">
      <Text className="text-sm font-semibold text-zinc-900 dark:text-[#F8F8F2]">
        Workout stats
      </Text>

      <Text className="mt-1 text-xs text-zinc-500 dark:text-[#6272A4]">
        Date:{" "}
        <Text className="text-zinc-900 dark:text-[#F8F8F2]">
          {selectedDateKey}
        </Text>
      </Text>

      <View className="mt-2">
        <Text className="text-xs text-zinc-500 dark:text-[#6272A4]">
          Sets:{" "}
          <Text className="text-zinc-900 dark:text-[#F8F8F2]">
            {stat.setCount}
          </Text>
        </Text>

        <Text className="mt-1 text-xs text-zinc-500 dark:text-[#6272A4]">
          Volume (kg·reps):{" "}
          <Text className="text-zinc-900 dark:text-[#F8F8F2]">
            {Number.isFinite(stat.volumeKg) ? Math.round(stat.volumeKg) : "—"}
          </Text>
        </Text>

        <Text className="mt-1 text-xs text-zinc-500 dark:text-[#6272A4]">
          Avg session growth:{" "}
          <Text className="text-zinc-900 dark:text-[#F8F8F2]">
            {stat.avgGrowthPct == null
              ? "—"
              : `${stat.avgGrowthPct >= 0 ? "+" : ""}${stat.avgGrowthPct.toFixed(2)}%`}
          </Text>
        </Text>
      </View>
    </View>
  );
}

export default function History() {
  const { colorScheme } = useColorScheme();
  const schemeClass = colorScheme === "dark" ? "dark" : "";
  const tabBarHeight = useBottomTabBarHeight();

  const [monthDate, setMonthDate] = useState(() => firstDayOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toKey(new Date()),
  );
  const { mutationVersion } = useOngoingSession();

  const [sessions, setSessions] = useState<SessionWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const monthFirst = firstDayOfMonth(monthDate);
        const grid = buildMonthMatrix(monthFirst);

        const rangeStart = startOfDayLocal(grid[0].date);
        const rangeEndExclusive = startOfDayLocal(
          addDaysLocal(grid[41].date, 1),
        );

        const rows = await sessionWorkoutRepository.getCompletedInRange(
          rangeStart.toISOString(),
          rangeEndExclusive.toISOString(),
        );

        if (cancelled) return;
        setSessions(rows);
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error ? e.message : "Failed to load sessions",
        );
        setSessions([]);
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [monthDate, mutationVersion]);

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionWorkout[]> = {};
    for (const s of sessions) {
      const key = toKey(s.startedAt);
      (map[key] ||= []).push(s);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    }
    return map;
  }, [sessions]);

  const dayBackgrounds = useMemo(() => {
    const map: Record<string, ProgramColor> = {};

    const durationMs = (s: SessionWorkout) => {
      const start = s.startedAt?.getTime?.() ?? NaN;
      const end = s.endedAt?.getTime?.() ?? NaN;
      const d = end - start;
      return Number.isFinite(d) && d > 0 ? d : 0;
    };

    for (const [dateKey, list] of Object.entries(sessionsByDate)) {
      let winner: SessionWorkout | null = null;
      let best = -1;

      for (const s of list) {
        const d = durationMs(s);
        if (d > best) {
          best = d;
          winner = s;
        }
      }

      const color = winner?.color ?? null;
      if (color) map[dateKey] = color;
    }

    return map;
  }, [sessionsByDate]);

  const growthBySessionId = useMemo(() => {
    const byTime = [...sessions].sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
    );

    const out: Record<string, number | null> = {};

    let prevScore: number | null = null;

    for (const s of byTime) {
      const curr = s.strengthScore;
      if (curr == null || !Number.isFinite(curr)) {
        out[s.id] = null;
        continue;
      }

      if (prevScore == null || !Number.isFinite(prevScore) || prevScore <= 0) {
        out[s.id] = null;
        prevScore = curr;
        continue;
      }

      const pct = ((curr - prevScore) / prevScore) * 100;
      out[s.id] = Number.isFinite(pct) ? pct : null;

      prevScore = curr;
    }

    return out;
  }, [sessions]);

  const selectedSessions = sessionsByDate[selectedDateKey] ?? [];

  return (
    <View className={`${schemeClass} flex-1 bg-white dark:bg-[#2B2D3A]`}>
      <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <Text className="text-xl font-bold text-zinc-900 dark:text-[#F8F8F2]">
          History
        </Text>
      </View>

      <View className="px-4 pb-2 pt-3">
        <CalendarMonth
          monthDate={monthDate}
          selectedDateKey={selectedDateKey}
          dayBackgrounds={dayBackgrounds}
          onDayPress={(key) => setSelectedDateKey(key)}
          onMonthChange={(next) => setMonthDate(next)}
        />

        {isLoading && (
          <Text className="mt-2 text-xs text-zinc-500 dark:text-[#6272A4]">
            Loading…
          </Text>
        )}
        {loadError && (
          <Text className="mt-2 text-xs text-red-600 dark:text-[#FF5555]">
            {loadError}
          </Text>
        )}
      </View>

      <View
        className="flex-1 px-4"
        style={{ paddingBottom: tabBarHeight + 12 }}
      >
        <WorkoutSessionStat
          selectedDateKey={selectedDateKey}
          sessions={selectedSessions}
          growthBySessionId={growthBySessionId}
        />

        <DaySummaryCard
          selectedDateKey={selectedDateKey}
          sessions={selectedSessions}
          bottomInset={tabBarHeight}
          onSessionPress={(s) => {
            router.push(`/session-workout/${s.id}`);
          }}
        />
      </View>
    </View>
  );
}
