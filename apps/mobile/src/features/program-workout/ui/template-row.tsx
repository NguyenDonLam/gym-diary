// src/features/program-workout/components/template-row.tsx
import React from "react";
import { Pressable, Text, View } from "react-native";
import { GripVertical, Trash2 } from "lucide-react-native";
import { COLOR_STRIP_MAP, ProgramColor, WorkoutProgram } from "../domain/type";

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
      className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 dark:bg-slate-900 ${
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
            className="mr-2"
          >
            <GripVertical width={16} height={16} color="#9CA3AF" />
          </Pressable>

          <View className={`mr-3 h-7 w-1 rounded-full ${stripClass}`} />

          <View className="shrink">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-slate-50">
              {template.name}
            </Text>
            <Text className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
              Tap to start · long-press to edit
            </Text>
          </View>
        </View>

        <Pressable onPress={onDeletePress} hitSlop={8}>
          <Trash2 width={16} height={16} color="#9CA3AF" />
        </Pressable>
      </View>
    </Pressable>
  );
}
