import "../global.css";
import React, { Suspense, useEffect, useMemo, useState } from "react";
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
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "#21222C",
      }}
    >
      <ActivityIndicator size="large" color="#BD93F9" />
      <Text style={{ color: "#F8F8F2", marginTop: 12, fontWeight: "600" }}>
        {title}
      </Text>
      {detail ? (
        <Text
          selectable
          style={{ color: "#6272A4", marginTop: 8, textAlign: "center" }}
        >
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

  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [seedErr, setSeedErr] = useState<string | null>(null);

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
        <SafeAreaProvider key={colorScheme}>
          <Suspense fallback={<BootScreen title="Loading…" />}>
            <SQLiteProvider
              databaseName={DATABASE_NAME}
              options={{ enableChangeListener: true }}
              useSuspense
            >
              <OngoingSessionProvider>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#21222C" : "#FFFFFF",
                  }}
                >
                  <SafeAreaView
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? "#21222C" : "#FFFFFF",
                    }}
                    edges={["top", "bottom"]}
                  >
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: isDark ? "#2B2D3A" : "#FFFFFF",
                      }}
                    >
                      <CurrentSessionBanner dbReady={success} />

                      <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="program-workout" />
                        <Stack.Screen name="program-workout/new" />
                        <Stack.Screen name="program-workout/[id]" />
                        <Stack.Screen name="session-workout/[id]" />
                      </Stack>

                      {seedErr ? (
                        <View
                          style={{
                            position: "absolute",
                            left: 12,
                            right: 12,
                            bottom: 12,
                            backgroundColor: isDark ? "#3A3D4F" : "#111827",
                            padding: 12,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: isDark ? "#FF5555" : "#E5E7EB",
                              fontWeight: "600",
                            }}
                          >
                            Seeding failed
                          </Text>
                          <Text
                            selectable
                            style={{
                              color: isDark ? "#F8F8F2" : "#9CA3AF",
                              marginTop: 6,
                            }}
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
