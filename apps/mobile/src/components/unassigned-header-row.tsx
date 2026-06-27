// src/features/program-workout/components/unassigned-header-row.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";

type Props = {
  programCount: number;
  open: boolean;
  onToggle: () => void;
};

export function UnassignedHeaderRow({
  programCount,
  open,
  onToggle,
}: Props) {
  return (
    <Pressable
      onPress={onToggle}
      className="mt-2 mb-1 flex-row items-center justify-between rounded-2xl bg-neutral-50 px-2 py-2 dark:bg-[#21222C]"
    >
      <View>
        <Text className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
          No folder
        </Text>
        <Text className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
          {programCount} program
          {programCount === 1 ? "" : "s"}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white dark:border-[#44475A] dark:bg-[#343746]">
          {open ? (
            <ChevronDown width={17} height={17} color="#9CA3AF" />
          ) : (
            <ChevronRight width={17} height={17} color="#9CA3AF" />
          )}
        </View>
      </View>
    </Pressable>
  );
}
