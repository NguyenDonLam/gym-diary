import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useSectionRail } from "@/src/components/section-rail-context";

export function HistoryMonthNavigation({
  month,
  onChange,
}: {
  month: Date;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(month.getFullYear());
  const today = new Date();
  const nearest = [0, -1, -2].map(
    (offset) => new Date(today.getFullYear(), today.getMonth() + offset, 1),
  );
  const sameMonth = (date: Date) =>
    date.getMonth() === month.getMonth() &&
    date.getFullYear() === month.getFullYear();
  if (!nearest.some(sameMonth)) nearest.push(month);
  useSectionRail("history", [
    ...nearest.map((date) => ({
      id: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en", { month: "short", year: "2-digit" }),
      selected: sameMonth(date),
      onPress: () => onChange(date),
    })),
    {
      id: "calendar",
      label: "Months",
      onPress: () => {
        setYear(month.getFullYear());
        setOpen(true);
      },
    },
  ]);
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          accessibilityViewIsModal
          className="w-full max-w-sm  bg-white p-5 dark:bg-[#282A36]"
        >
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            Choose month
          </Text>
          <View className="my-3 flex-row items-center justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous year"
              onPress={() => setYear((value) => value - 1)}
              className="p-3"
            >
              <Text className="text-violet-500">Previous</Text>
            </Pressable>
            <Text className="font-semibold text-zinc-900 dark:text-white">
              {year}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next year"
              onPress={() => setYear((value) => value + 1)}
              className="p-3"
            >
              <Text className="text-violet-500">Next</Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap">
            {Array.from({ length: 12 }, (_, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityState={{
                  selected:
                    year === month.getFullYear() && index === month.getMonth(),
                }}
                onPress={() => {
                  onChange(new Date(year, index, 1));
                  setOpen(false);
                }}
                style={{
                  width: "25%",
                  minHeight: 48,
                  justifyContent: "center",
                }}
              >
                <Text
                  className={
                    year === month.getFullYear() && index === month.getMonth()
                      ? "text-center font-bold text-violet-500"
                      : "text-center text-zinc-700 dark:text-zinc-300"
                  }
                >
                  {new Date(year, index, 1).toLocaleDateString("en", {
                    month: "short",
                  })}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            className="mt-3 items-end p-3"
          >
            <Text className="font-medium text-violet-500">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
