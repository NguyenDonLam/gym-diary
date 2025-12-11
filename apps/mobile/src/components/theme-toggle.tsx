// src/components/theme-toggle.tsx

import React, { useCallback } from "react";
import { Pressable } from "react-native";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Moon, Sun } from "lucide-react-native";

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
      className="mr-4 mt-2 h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800"
      hitSlop={8}
    >
      {isDark ? (
        <Sun width={14} height={14} color="#e5e7eb" />
      ) : (
        <Moon width={14} height={14} color="#0f172a" />
      )}
    </Pressable>
  );
}
