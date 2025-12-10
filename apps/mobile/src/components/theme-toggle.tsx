// src/components/theme-toggle.tsx

import React, { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_KEY = "theme"; // must match _layout

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleToggle = useCallback(async () => {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch (e) {
      console.warn("[theme] failed to persist theme", e);
    }
  }, [isDark, setColorScheme]);

  return (
    <Pressable
      onPress={handleToggle}
      className="self-end mr-4 mt-2 rounded-full bg-slate-200 px-3 py-1.5 dark:bg-slate-800"
    >
      <View className="flex-row items-center">
        <Text className="mr-1 text-[11px] text-slate-700 dark:text-slate-200">
          Theme
        </Text>
        <Text className="text-[11px] font-semibold text-slate-900 dark:text-slate-50">
          {isDark ? "Dark" : "Light"}
        </Text>
      </View>
    </Pressable>
  );
}
