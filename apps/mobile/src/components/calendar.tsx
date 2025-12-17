import React, { memo, useMemo, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useColorScheme } from "nativewind";

type CalendarCell = { date: Date; key: string; inMonth: boolean };

type CalendarMonthProps = {
  monthDate: Date; // any date within the month; component will render that month
  selectedDateKey?: string; // "YYYY-MM-DD"
  markedDates?: Record<string, unknown>; // presence => marked (sessions exist)
  onDayPress?: (dateKey: string, date: Date) => void;
  onPrevMonth?: (nextMonthDate: Date) => void; // first day of prev month
  onNextMonth?: (nextMonthDate: Date) => void; // first day of next month
  renderDayBackgroundClassName?: (args: {
    dateKey: string;
    date: Date;
    inMonth: boolean;
    isSelected: boolean;
    isMarked: boolean;
  }) => string | undefined;
};

const toKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const buildMonthMatrix = (base: Date): CalendarCell[] => {
  const year = base.getFullYear();
  const month = base.getMonth();
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

const monthLabelOf = (d: Date) =>
  d.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const CalendarMonth = memo(function CalendarMonth(
  props: CalendarMonthProps
) {
  const {
    monthDate,
    selectedDateKey,
    markedDates,
    onDayPress,
    onPrevMonth,
    onNextMonth,
    renderDayBackgroundClassName,
  } = props;

  const { colorScheme } = useColorScheme();
  const schemeClass = colorScheme === "dark" ? "dark" : "";

  const monthFirst = useMemo(() => firstDayOfMonth(monthDate), [monthDate]);
  const monthCells = useMemo(() => buildMonthMatrix(monthFirst), [monthFirst]);
  const monthLabel = useMemo(() => monthLabelOf(monthFirst), [monthFirst]);

  const handlePrev = useCallback(() => {
    const next = new Date(
      monthFirst.getFullYear(),
      monthFirst.getMonth() - 1,
      1
    );
    onPrevMonth?.(next);
  }, [monthFirst, onPrevMonth]);

  const handleNext = useCallback(() => {
    const next = new Date(
      monthFirst.getFullYear(),
      monthFirst.getMonth() + 1,
      1
    );
    onNextMonth?.(next);
  }, [monthFirst, onNextMonth]);

  const handlePressDay = useCallback(
    (cell: CalendarCell) => {
      onDayPress?.(cell.key, cell.date);
    },
    [onDayPress]
  );

  return (
    <View className={`${schemeClass}`}>
      <View className="flex-row items-center justify-between mb-1">
        <Pressable
          onPress={handlePrev}
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900"
        >
          <Text className="text-zinc-800 dark:text-zinc-200">{"<"}</Text>
        </Pressable>

        <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          {monthLabel}
        </Text>

        <Pressable
          onPress={handleNext}
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900"
        >
          <Text className="text-zinc-800 dark:text-zinc-200">{">"}</Text>
        </Pressable>
      </View>

      <View className="flex-row justify-between mt-1 mb-0.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Text key={d} className="w-10 text-center text-[11px] text-zinc-500">
            {d}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {monthCells.map((cell) => {
          const isSelected = !!selectedDateKey && cell.key === selectedDateKey;
          const isMarked = !!markedDates?.[cell.key];

          const customBg =
            renderDayBackgroundClassName?.({
              dateKey: cell.key,
              date: cell.date,
              inMonth: cell.inMonth,
              isSelected,
              isMarked,
            }) ?? "";

          const dayClasses = [
            "w-10 h-10 items-center justify-center rounded-full my-0.5",
            "border border-transparent",
            !cell.inMonth && "opacity-30",
            isMarked && "border-zinc-300 dark:border-zinc-700",
            isSelected && "border-2 border-emerald-500 dark:border-emerald-400",
            customBg,
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
              onPress={() => handlePressDay(cell)}
            >
              <Text className={dayTextClasses}>{cell.date.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});
