import React, { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import {
  COLOR_STRIP_MAP,
  type ProgramColor,
} from "@/src/features/program-workout/domain/type";
import { buildMonthMatrix, firstDayOfMonth } from "./date";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Props = {
  monthDate: Date;
  selectedDateKey?: string;
  dayBackgrounds?: Record<string, ProgramColor>;
  onDayPress?: (dateKey: string, date: Date) => void;
  onMonthChange?: (nextMonthFirstDay: Date) => void;
};

export const CalendarMonth = memo(function CalendarMonth({
  monthDate,
  selectedDateKey,
  dayBackgrounds,
  onDayPress,
  onMonthChange,
}: Props) {
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
    onMonthChange?.(
      new Date(monthFirst.getFullYear(), monthFirst.getMonth() - 1, 1)
    );
  }, [monthFirst, onMonthChange]);

  const goNext = useCallback(() => {
    onMonthChange?.(
      new Date(monthFirst.getFullYear(), monthFirst.getMonth() + 1, 1)
    );
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

          const bgColor = dayBackgrounds?.[cell.key];
          const bgClass = bgColor ? COLOR_STRIP_MAP[bgColor] : "";

          const dayClasses = [
            "w-10 h-10 items-center justify-center rounded-full my-0.5",
            "border border-transparent",
            !cell.inMonth && "opacity-30",
            isSelected && "border-2 border-emerald-500 dark:border-emerald-400",
            bgClass,
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
