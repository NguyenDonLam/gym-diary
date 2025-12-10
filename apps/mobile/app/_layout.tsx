// apps/mobile/app/_layout.tsx (only showing relevant parts)

import "../global.css";
import React, { Suspense, useEffect } from "react";
import { ActivityIndicator, View, SafeAreaView } from "react-native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { runAllSeeds } from "@/db/seeds";
import { DATABASE_NAME, db, expoDb } from "@/db";
import "react-native-get-random-values";

import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { CurrentSessionBanner } from "@/src/hooks/current-session-banner";
import { ThemeToggle } from "@/src/components/theme-toggle";
const THEME_KEY = "theme"; // "light" | "dark"

export default function RootLayout() {
  useDrizzleStudio(expoDb);
  const { success } = useMigrations(db, migrations);

  const { colorScheme, setColorScheme } = useColorScheme();

  useEffect(() => {
    if (!success) return;

    runAllSeeds(db).catch((e) => console.warn("seeding failed", e));
  }, [success]);

  // load stored theme once
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") {
          setColorScheme(stored);
        }
      } catch (e) {
        console.warn("[theme] failed to load theme", e);
      }
    };

    loadTheme();
  }, [setColorScheme]);

  if (!success) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          options={{ enableChangeListener: true }}
          useSuspense
        >
          {/* Root background for everything, including under tabs */}
          <View className="flex-1 bg-white dark:bg-slate-950">
            <SafeAreaView className="flex-1">
              <View className="flex-1">
                <CurrentSessionBanner dbReady={success} />
                <ThemeToggle />

                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="program-workout"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="program-workout/new"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="program-workout/[id]"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="session-workout/[id]"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </View>
            </SafeAreaView>
          </View>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );

}
