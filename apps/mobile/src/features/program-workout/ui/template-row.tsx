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
  onDragHandleLongPress?: () => void;
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
      className={`mb-2 rounded-none border border-neutral-200 bg-neutral-50 px-2.5 py-4 dark:border-[#44475A] dark:bg-slate-900 ${
        inFolder ? "ml-4" : ""
      } ${isActive ? "opacity-80" : ""}`}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {onDragHandleLongPress ? (
            <Pressable
              onLongPress={onDragHandleLongPress}
              delayLongPress={120}
              hitSlop={8}
              className="mr-2 h-9 flex-row items-center rounded-none px-2"
            >
              <GripVertical width={30} height={30} color="#6B7280" />
            </Pressable>
          ) : null}

          <View className={`mr-3 h-7 w-1 rounded-none ${stripClass}`} />

          <View className="shrink">
            <Text className="text-[15px] font-semibold text-neutral-900 dark:text-slate-50">
              {template.name}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onDeletePress}
          hitSlop={8}
          className="ml-2 h-9 w-9 items-center justify-center rounded-none"
        >
          <Trash2 width={16} height={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}
