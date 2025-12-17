import "../global.css";
import React, { Suspense, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
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
import { CurrentSessionBanner } from "@/src/components/current-session-banner";
import { OngoingSessionProvider } from "@/src/features/session-workout/hooks/use-ongoing-session";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const THEME_KEY = "theme";

export default function RootLayout() {
  useDrizzleStudio(expoDb);
  const { success } = useMigrations(db, migrations);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (!success) return;
    runAllSeeds(db).catch((e) => console.warn("seeding failed", e));
  }, [success]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") setColorScheme(stored);
      } catch (e) {
        console.warn("[theme] failed to load theme", e);
      }
    })();
  }, [setColorScheme]);

  if (!success) return <ActivityIndicator size="large" />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Suspense fallback={<ActivityIndicator size="large" />}>
          <SQLiteProvider
            databaseName={DATABASE_NAME}
            options={{ enableChangeListener: true }}
            useSuspense
          >
            <OngoingSessionProvider>
              <View className="flex-1 bg-white dark:bg-slate-950">
                <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
                  <View style={{ flex: 1 }}>
                    <CurrentSessionBanner dbReady={success} />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="program-workout" />
                      <Stack.Screen name="program-workout/new" />
                      <Stack.Screen name="program-workout/[id]" />
                      <Stack.Screen name="session-workout/[id]" />
                    </Stack>
                  </View>
                </SafeAreaView>
              </View>
            </OngoingSessionProvider>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
