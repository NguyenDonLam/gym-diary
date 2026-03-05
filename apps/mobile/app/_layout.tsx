import "../global.css";
import React, { Suspense, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const THEME_KEY = "theme";
const queryClient = new QueryClient();

function BootScreen({ title, detail }: { title: string; detail?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#21222C] px-4">
      <ActivityIndicator size="large" color="#BD93F9" />
      <Text className="mt-3 font-semibold text-[#F8F8F2]">{title}</Text>
      {detail ? (
        <Text selectable className="mt-2 text-center text-[#6272A4]">
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  useDrizzleStudio(expoDb);

  const mig = useMigrations(db, migrations) as any;
  const success: boolean = !!mig?.success;
  const migErrorMsg: string | null = mig?.error
    ? String(mig.error?.message ?? mig.error)
    : null;

  const { setColorScheme } = useColorScheme();
  const [seedErr, setSeedErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored === "light" || stored === "dark") {
          setColorScheme(stored);
        }
      } catch (e) {
        console.warn("[theme] failed to load theme", e);
      }
    })();
  }, [setColorScheme]);

  useEffect(() => {
    if (!success) return;

    (async () => {
      try {
        await runAllSeeds(db);
      } catch (e: any) {
        console.warn("seeding failed", e);
        setSeedErr(String(e?.message ?? e));
      }
    })();
  }, [success]);

  if (migErrorMsg)
    return <BootScreen title="Migration failed" detail={migErrorMsg} />;
  if (!success) return <BootScreen title="Migrating database…" />;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Suspense fallback={<BootScreen title="Loading…" />}>
            <SQLiteProvider
              databaseName={DATABASE_NAME}
              options={{ enableChangeListener: true }}
              useSuspense
            >
              <OngoingSessionProvider>
                <View className="flex-1 bg-white dark:bg-[#21222C]">
                  <SafeAreaView
                    className="flex-1 bg-white dark:bg-[#21222C]"
                    edges={["top", "bottom"]}
                  >
                    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
                      <CurrentSessionBanner dbReady={success} />

                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="program-workout" />
                        <Stack.Screen name="program-workout/new" />
                        <Stack.Screen name="program-workout/[id]" />
                        <Stack.Screen name="session-workout/[id]" />
                      </Stack>

                      {seedErr ? (
                        <View className="absolute bottom-3 left-3 right-3 rounded-xl bg-[#111827] p-3 dark:bg-[#3A3D4F]">
                          <Text className="font-semibold text-[#E5E7EB] dark:text-[#FF5555]">
                            Seeding failed
                          </Text>
                          <Text
                            selectable
                            className="mt-1 text-[#9CA3AF] dark:text-[#F8F8F2]"
                          >
                            {seedErr}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </SafeAreaView>
                </View>
              </OngoingSessionProvider>
            </SQLiteProvider>
          </Suspense>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
