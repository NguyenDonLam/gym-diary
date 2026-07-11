import React from "react";
import { Pressable, Text, View } from "react-native";
import { Clock3, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useRestTimer } from "../hooks/use-rest-timer";

type RestTimerBannerProps = {
  sessionId?: string | null;
};

export function RestTimerBanner({ sessionId }: RestTimerBannerProps) {
  const { colorScheme } = useColorScheme();
  const { activeTimer, remainingSeconds, label, cancelRestTimer } =
    useRestTimer();

  if (!activeTimer || remainingSeconds <= 0) return null;
  if (
    sessionId &&
    activeTimer.sessionId &&
    activeTimer.sessionId !== sessionId
  ) {
    return null;
  }

  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#282A36" : "#FFFFFF";
  const detail =
    activeTimer.exerciseName && activeTimer.setIndex
      ? `${activeTimer.exerciseName} set ${activeTimer.setIndex}`
      : activeTimer.exerciseName;

  return (
    <View className="border-b border-emerald-200 bg-emerald-600 px-4 py-2 dark:border-[#44475A] dark:bg-[#50FA7B]">
      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <View className="mr-2 h-8 w-8 items-center justify-center rounded-full bg-white/15 dark:bg-[#282A36]/10">
            <Clock3 size={16} color={iconColor} />
          </View>

          <View className="min-w-0 flex-1">
            <Text className="text-[11px] font-semibold uppercase text-white/75 dark:text-[#282A36]/70">
              Rest
            </Text>
            <Text
              className="text-[18px] font-semibold text-white dark:text-[#282A36]"
              numberOfLines={1}
            >
              {label}
              {detail ? `  ${detail}` : ""}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            void cancelRestTimer();
          }}
          hitSlop={8}
          className="ml-3 h-9 w-9 items-center justify-center rounded-full bg-white/15 dark:bg-[#282A36]/10"
        >
          <X size={17} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}
