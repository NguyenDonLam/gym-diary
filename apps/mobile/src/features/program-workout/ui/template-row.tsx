// src/features/program-workout/components/template-row.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { GripVertical, Trash2 } from "lucide-react-native";
import { COLOR_STRIP_MAP, WorkoutProgram } from "../domain/type";
import { ProgramColor } from "@/db/enums";

type Props = {
  template: WorkoutProgram;
  inFolder: boolean;
  isActive: boolean;
  onDragHandleLongPress: () => void;
  onPress: () => void;
  onLongPress: () => void;
  onDeletePress: () => void;
};

export function ProgramRow({
  template,
  inFolder,
  isActive,
  onDragHandleLongPress,
  onPress,
  onLongPress,
  onDeletePress,
}: Props) {
  const color = (template.color as ProgramColor) ?? "neutral";
  const stripClass = COLOR_STRIP_MAP[color];

  return (
    <Pressable
      className={`mb-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 dark:border-[#44475A] dark:bg-slate-900 ${
        inFolder ? "ml-4" : ""
      } ${isActive ? "opacity-80" : ""}`}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Pressable
            onLongPress={onDragHandleLongPress}
            delayLongPress={120}
            hitSlop={8}
            className="mr-2 h-9 flex-row items-center rounded-xl border border-neutral-300 bg-white px-2 dark:border-[#6272A4] dark:bg-[#343746]"
          >
            <GripVertical width={15} height={15} color="#6B7280" />
          </Pressable>

          <View className={`mr-3 h-7 w-1 rounded-full ${stripClass}`} />

          <View className="shrink">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-slate-50">
              {template.name}
            </Text>
            <Text className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              Tap to start - long-press card to edit
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onDeletePress}
          hitSlop={8}
          className="ml-2 h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white dark:border-[#44475A] dark:bg-[#343746]"
        >
          <Trash2 width={16} height={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}
