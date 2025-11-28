import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";

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
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Calendar view of sessions.</Text>
        </View>

        {/* CALENDAR */}
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.monthButton}>
              <Text>{"<"}</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <Pressable onPress={handleNextMonth} style={styles.monthButton}>
              <Text>{">"}</Text>
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {monthCells.map((cell) => {
              const hasSessions = !!sessionsByDate[cell.key];
              const isSelected = cell.key === selectedDateKey;
              return (
                <Pressable
                  key={cell.key}
                  style={[
                    styles.dayCell,
                    !cell.inMonth && styles.dayOutside,
                    hasSessions && styles.dayWithSession,
                    isSelected && styles.daySelected,
                  ]}
                  onPress={() => handleSelectDay(cell.key)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      !cell.inMonth && styles.dayNumberOutside,
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                  {hasSessions && <View style={styles.dot} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* BOTTOM: SELECTED DAY CARD + SIMPLE STATS */}
        <View style={styles.bottom}>
          <View style={styles.dayCard}>
            <Text style={styles.dayCardLabel}>Selected day</Text>
            <Text style={styles.dayCardDate}>{selectedDateKey}</Text>

            {selectedSession ? (
              <View style={styles.dayCardContent}>
                <Text style={styles.sessionName}>{selectedSession.name}</Text>
                <Text style={styles.sessionMeta}>
                  Duration: {selectedSession.duration}
                </Text>
                <Text style={styles.sessionMeta}>Status: completed</Text>
              </View>
            ) : (
              <View style={styles.dayCardContent}>
                <Text style={styles.restText}>No session logged.</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>This month</Text>
              <Text style={styles.statsValue}>
                {stats.thisMonthCount} session
                {stats.thisMonthCount === 1 ? "" : "s"}
              </Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={styles.statsLabel}>Last 7 days</Text>
              <Text style={styles.statsValue}>
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

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
  },

  calendar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  monthButton: {
    padding: 4,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 2,
  },
  weekday: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: CELL_SIZE / 2,
    marginVertical: 2,
  },
  dayOutside: {
    opacity: 0.3,
  },
  dayWithSession: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  daySelected: {
    borderWidth: 1,
  },
  dayNumber: {
    fontSize: 13,
  },
  dayNumberOutside: {
    fontSize: 12,
  },
  dot: {
    marginTop: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  bottom: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  dayCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  dayCardLabel: {
    fontSize: 12,
  },
  dayCardDate: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
  },
  dayCardContent: {
    marginTop: 6,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: "600",
  },
  sessionMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  restText: {
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statsCard: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statsLabel: {
    fontSize: 12,
  },
  statsValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
  },
});
