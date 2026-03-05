import React from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";

type ThemeOption =  "light" | "dark";

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const isActive = (value: ThemeOption) => {
    return colorScheme === value;
  };

  const ThemeButton = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: ThemeOption;
    isLast?: boolean;
  }) => {
    const active = isActive(value);

    return (
      <Pressable
        onPress={() => setColorScheme(value)}
        className={[
          "flex-1 rounded-full px-3 py-2",
          active
            ? "bg-neutral-900 dark:bg-slate-50"
            : "bg-white dark:bg-slate-950",
          !isLast ? "mr-2" : "",
        ].join(" ")}
      >
        <Text
          className={[
            "text-center text-[13px] font-semibold",
            active
              ? "text-white dark:text-slate-900"
              : "text-neutral-900 dark:text-slate-50",
          ].join(" ")}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <Text className="text-lg font-bold text-neutral-900 dark:text-[#F8F8F2]">
          Settings
        </Text>
        <Text className="mt-1 text-xs text-neutral-700 dark:text-[#6272A4]">
          Preferences and app options.
        </Text>
      </View>

      <View className="px-4 pt-4">
        <View className="mb-3 rounded-2xl bg-neutral-100 p-4 dark:bg-[#343746]">
          <Text className="text-base font-semibold text-neutral-900 dark:text-[#F8F8F2]">
            Appearance
          </Text>

          <Text className="mt-1 text-xs text-neutral-700 dark:text-[#6272A4]">
            Choose how the app looks.
          </Text>

          <View className="mt-3 flex-row">
            <ThemeButton label="Light" value="light" />
            <ThemeButton label="Dark" value="dark" isLast />
          </View>
        </View>
      </View>
    </View>
  );
}
