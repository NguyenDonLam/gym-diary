import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";

type CalendarCell = { date: Date; key: string; inMonth: boolean };
type CalendarMonthProps = {
  monthDate: Date; // any date in month (component normalizes to first-of-month)
  selectedDateKey?: string; // "YYYY-MM-DD"
  dayBackgrounds?: Record<string, string>; // dateKey -> background color
  onDayPress?: (dateKey: string, date: Date) => void;
  onMonthChange?: (nextMonthFirstDay: Date) => void;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

const buildMonthMatrix = (monthFirst: Date): CalendarCell[] => {
  const year = monthFirst.getFullYear();
  const month = monthFirst.getMonth();
  const firstOfMonth = new Date(year, month, 1);

  const firstDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offset = (firstDay + 6) % 7; // Monday=0
  const start = new Date(year, month, 1 - offset);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, key: toKey(d), inMonth: d.getMonth() === month });
  }
  return cells;
};

const startOfDayLocal = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

const addDaysLocal = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const minutesBetween = (start: Date | null, end: Date | null) => {
  if (!start || !end) return 0;
  const ms = Math.max(0, end.getTime() - start.getTime());
  return Math.round(ms / 60000);
};

const formatDuration = (mins: number) => {
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

const CalendarMonth = memo(function CalendarMonth({
  monthDate,
  selectedDateKey,
  dayBackgrounds,
  onDayPress,
  onMonthChange,
}: CalendarMonthProps) {
  const monthFirst = useMemo(() => firstDayOfMonth(monthDate), [monthDate]);

  const monthLabel = useMemo(
    () =>
      monthFirst.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [monthFirst]
  );

  const monthCells = useMemo(() => buildMonthMatrix(monthFirst), [monthFirst]);

  const goPrev = useCallback(() => {
    const next = new Date(
      monthFirst.getFullYear(),
      monthFirst.getMonth() - 1,
      1
    );
    onMonthChange?.(next);
  }, [monthFirst, onMonthChange]);

  const goNext = useCallback(() => {
    const next = new Date(
      monthFirst.getFullYear(),
      monthFirst.getMonth() + 1,
      1
    );
    onMonthChange?.(next);
  }, [monthFirst, onMonthChange]);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Pressable
          onPress={goPrev}
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900"
        >
          <Text className="text-zinc-800 dark:text-zinc-200">{"<"}</Text>
        </Pressable>

        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {monthLabel}
        </Text>

        <Pressable
          onPress={goNext}
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900"
        >
          <Text className="text-zinc-800 dark:text-zinc-200">{">"}</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-between mt-1 mb-0.5">
        {DAYS.map((d) => (
          <Text key={d} className="w-10 text-center text-[11px] text-zinc-500">
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {monthCells.map((cell) => {
          const isSelected = !!selectedDateKey && cell.key === selectedDateKey;
          const bg = dayBackgrounds?.[cell.key];

          const dayClasses = [
            "w-10 h-10 items-center justify-center rounded-full my-0.5",
            "border border-transparent",
            !cell.inMonth && "opacity-30",
            isSelected && "border-2 border-emerald-500 dark:border-emerald-400",
          ]
            .filter(Boolean)
            .join(" ");

          const dayTextClasses = [
            "text-[13px] text-zinc-900 dark:text-zinc-100",
            !cell.inMonth && "text-xs text-zinc-500 dark:text-zinc-500",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <Pressable
              key={cell.key}
              className={dayClasses}
              style={bg ? { backgroundColor: bg } : undefined}
              onPress={() => onDayPress?.(cell.key, cell.date)}
            >
              <Text className={dayTextClasses}>{cell.date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

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
    const map: Record<string, string> = {};
    for (const [dateKey, list] of Object.entries(sessionsByDate)) {
      const winner = list[list.length - 1];
      const color = winner?.sourceProgram?.color ?? null;
      if (color) map[dateKey] = color;
    }
    return map;
  }, [sessionsByDate]);

  const selectedSessions = sessionsByDate[selectedDateKey] ?? [];
  const selectedSession = selectedSessions[0] ?? null;

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

  const selectedDuration =
    selectedSession && selectedSession.endedAt
      ? formatDuration(
          minutesBetween(selectedSession.startedAt, selectedSession.endedAt)
        )
      : "—";

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
        <View className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            Selected day
          </Text>
          <Text className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedDateKey}
          </Text>

          {selectedSession ? (
            <View className="mt-1.5">
              <Text className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedSession.name ?? "Session"}
              </Text>

              <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Duration: {selectedDuration}
              </Text>

              {selectedSessions.length > 1 && (
                <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Also: {selectedSessions.length - 1} more session
                  {selectedSessions.length - 1 === 1 ? "" : "s"}
                </Text>
              )}

              <Text className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Status: completed
              </Text>
            </View>
          ) : (
            <View className="mt-1.5">
              <Text className="text-[13px] text-zinc-700 dark:text-zinc-300">
                No session logged.
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              This month ({monthLabel})
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.thisMonthCount} session
              {stats.thisMonthCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Last 7 days
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {stats.last7Count} session{stats.last7Count === 1 ? "" : "s"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
