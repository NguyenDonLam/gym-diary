import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useColorScheme } from "nativewind";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";

import type { ProgramColor } from "@/src/features/program-workout/domain/type";
import { addDaysLocal, buildMonthMatrix, firstDayOfMonth, startOfDayLocal, toKey } from "@/src/features/history/ui/date";
import { CalendarMonth } from "@/src/features/history/ui/calendar-month";
import { DaySummaryCard } from "@/src/features/history/ui/day-summary-card";

export default function History() {
  const { colorScheme } = useColorScheme();
  const schemeClass = colorScheme === "dark" ? "dark" : "";

  const [monthDate, setMonthDate] = useState(() => firstDayOfMonth(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toKey(new Date())
  );

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
          addDaysLocal(grid[41].date, 1)
        );

        const rows = await sessionWorkoutRepository.getCompletedInRange(
          rangeStart.toISOString(),
          rangeEndExclusive.toISOString()
        );

        if (cancelled) return;
        setSessions(rows);
      } catch (e) {
        if (cancelled) return;
        setLoadError(
          e instanceof Error ? e.message : "Failed to load sessions"
        );
        setSessions([]);
      } finally {
        if (cancelled) return;
        setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [monthDate]);

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
    for (const [dateKey, list] of Object.entries(sessionsByDate)) {
      const winner = list[list.length - 1];
      const color = winner?.sourceProgram?.color ?? null;
      if (color) map[dateKey] = color as ProgramColor;
    }
    return map;
  }, [sessionsByDate]);

  const selectedSessions = sessionsByDate[selectedDateKey] ?? [];

  const monthLabel = useMemo(
    () =>
      monthDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [monthDate]
  );

  const stats = useMemo(() => {
    const now = new Date();
    const monthYear = { y: monthDate.getFullYear(), m: monthDate.getMonth() };
    const last7Start = startOfDayLocal(addDaysLocal(now, -6));

    let thisMonthCount = 0;
    let last7Count = 0;

    for (const s of sessions) {
      const dt = s.startedAt;
      if (dt.getFullYear() === monthYear.y && dt.getMonth() === monthYear.m) {
        thisMonthCount++;
      }
      if (dt >= last7Start && dt <= now) {
        last7Count++;
      }
    }

    return { thisMonthCount, last7Count };
  }, [sessions, monthDate]);

  return (
    <View className={`${schemeClass} flex-1 bg-white dark:bg-zinc-950`}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-xl font-bold text-zinc-900 dark:text-white">
          History
        </Text>
        <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Calendar view of sessions.
        </Text>
      </View>

      <View className="px-4 pb-2">
        <CalendarMonth
          monthDate={monthDate}
          selectedDateKey={selectedDateKey}
          dayBackgrounds={dayBackgrounds}
          onDayPress={(key) => setSelectedDateKey(key)}
          onMonthChange={(next) => setMonthDate(next)}
        />

        {isLoading && (
          <Text className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Loading…
          </Text>
        )}
        {loadError && (
          <Text className="mt-2 text-xs text-red-600 dark:text-red-400">
            {loadError}
          </Text>
        )}
      </View>

      <View className="flex-1 px-4 pb-4">
        <DaySummaryCard
          selectedDateKey={selectedDateKey}
          sessions={selectedSessions}
        />
      </View>
    </View>
  );
}
