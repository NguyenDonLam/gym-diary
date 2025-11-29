import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable } from "react-native";

type Session = {
  id: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  duration: string;
};

// Date -> "YYYY-MM-DD"
const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Build a 6x7 grid, Monday start
const buildMonthMatrix = (base: Date) => {
  const year = base.getFullYear();
  const month = base.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstDay = firstOfMonth.getDay(); // 0 = Sun ... 6 = Sat
  const offset = (firstDay + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);

  const cells: { date: Date; key: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toKey(d);
    cells.push({
      date: d,
      key,
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
};

export default function History() {
  // placeholder history – replace with real data source
  const sessions: Session[] = [
    { id: "s1", name: "Upper", date: "2025-11-26", duration: "52 min" },
    { id: "s2", name: "Lower", date: "2025-11-24", duration: "48 min" },
    { id: "s3", name: "Full Body A", date: "2025-11-22", duration: "61 min" },
    { id: "s4", name: "Pull + Arms", date: "2025-11-20", duration: "49 min" },
    { id: "s5", name: "Upper", date: "2025-11-18", duration: "51 min" },
  ];

  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toKey(new Date())
  );

  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const monthCells = useMemo(() => buildMonthMatrix(monthDate), [monthDate]);

  const selectedSession: Session | null =
    sessionsByDate[selectedDateKey]?.[0] || null;

  const handlePrevMonth = () => {
    setMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setMonthDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleSelectDay = (key: string) => {
    setSelectedDateKey(key);
  };

  const monthLabel = monthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Simple stats: this month + last 7 days
  const stats = useMemo(() => {
    const now = new Date();
    const monthYear = { y: monthDate.getFullYear(), m: monthDate.getMonth() };
    const last7Start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6
    );

    let thisMonthCount = 0;
    let last7Count = 0;

    for (const s of sessions) {
      const [y, m, d] = s.date.split("-").map((n) => parseInt(n, 10));
      const dt = new Date(y, m - 1, d);

      if (y === monthYear.y && m - 1 === monthYear.m) {
        thisMonthCount++;
      }
      if (dt >= last7Start && dt <= now) {
        last7Count++;
      }
    }

    return { thisMonthCount, last7Count };
  }, [sessions, monthDate]);

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* HEADER */}
        <View className="px-4 pt-3 pb-2">
          <Text className="text-xl font-bold text-white">History</Text>
          <Text className="mt-1 text-xs text-zinc-400">
            Calendar view of sessions.
          </Text>
        </View>

        {/* CALENDAR */}
        <View className="px-4 pb-2">
          <View className="flex-row items-center justify-between mb-1">
            <Pressable onPress={handlePrevMonth} className="p-1">
              <Text className="text-zinc-300">{"<"}</Text>
            </Pressable>
            <Text className="text-base font-semibold text-zinc-100">
              {monthLabel}
            </Text>
            <Pressable onPress={handleNextMonth} className="p-1">
              <Text className="text-zinc-300">{">"}</Text>
            </Pressable>
          </View>

          <View className="flex-row justify-between mt-1 mb-0.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <Text
                key={d}
                className="w-10 text-center text-[11px] text-zinc-500"
              >
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {monthCells.map((cell) => {
              const hasSessions = !!sessionsByDate[cell.key];
              const isSelected = cell.key === selectedDateKey;

              const dayClasses = [
                "w-10 h-10 items-center justify-center rounded-full my-0.5",
                "border border-transparent",
                !cell.inMonth && "opacity-30",
                hasSessions && "border-zinc-600",
                isSelected && "border-2 border-emerald-400",
              ]
                .filter(Boolean)
                .join(" ");

              const dayTextClasses = [
                "text-[13px] text-zinc-100",
                !cell.inMonth && "text-xs text-zinc-500",
              ]
                .filter(Boolean)
                .join(" ");

              const dotClasses = [
                "mt-0.5 w-1 h-1 rounded-full",
                hasSessions ? "bg-emerald-400" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <Pressable
                  key={cell.key}
                  className={dayClasses}
                  onPress={() => handleSelectDay(cell.key)}
                >
                  <Text className={dayTextClasses}>{cell.date.getDate()}</Text>
                  {hasSessions && <View className={dotClasses} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BOTTOM: SELECTED DAY CARD + SIMPLE STATS */}
        <View className="flex-1 px-4 pb-4">
          <View className="mb-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
            <Text className="text-xs text-zinc-400">Selected day</Text>
            <Text className="mt-0.5 text-sm font-semibold text-zinc-100">
              {selectedDateKey}
            </Text>

            {selectedSession ? (
              <View className="mt-1.5">
                <Text className="text-[15px] font-semibold text-zinc-100">
                  {selectedSession.name}
                </Text>
                <Text className="mt-0.5 text-xs text-zinc-400">
                  Duration: {selectedSession.duration}
                </Text>
                <Text className="mt-0.5 text-xs text-zinc-400">
                  Status: completed
                </Text>
              </View>
            ) : (
              <View className="mt-1.5">
                <Text className="text-[13px] text-zinc-300">
                  No session logged.
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <Text className="text-xs text-zinc-400">This month</Text>
              <Text className="mt-0.5 text-sm font-semibold text-zinc-100">
                {stats.thisMonthCount} session
                {stats.thisMonthCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
              <Text className="text-xs text-zinc-400">Last 7 days</Text>
              <Text className="mt-0.5 text-sm font-semibold text-zinc-100">
                {stats.last7Count} session
                {stats.last7Count === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
