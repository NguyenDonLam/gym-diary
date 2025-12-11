// src/features/program-workout/components/unassigned-header-row.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDown, ChevronLeft } from "lucide-react-native";

type Props = {
  templateCount: number;
  open: boolean;
  onToggle: () => void;
};

export function UnassignedHeaderRow({ templateCount, open, onToggle }: Props) {
  return (
    <Pressable
      onPress={onToggle}
      className="mt-2 mb-1 flex-row items-center justify-between"
    >
      <Text className="text-[12px] font-semibold text-neutral-700 dark:text-neutral-200">
        No folder
      </Text>
      <View className="flex-row items-center">
        <Text className="mr-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          {templateCount} template
          {templateCount === 1 ? "" : "s"}
        </Text>
        {open ? (
          <ChevronDown width={14} height={14} color="#9CA3AF" />
        ) : (
          <ChevronLeft width={14} height={14} color="#9CA3AF" />
        )}
      </View>
    </Pressable>
  );
}
