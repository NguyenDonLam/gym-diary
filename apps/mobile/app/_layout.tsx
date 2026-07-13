import "../global.css";
import React, { Suspense, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import {
  OngoingSessionProvider,
  useOngoingSession,
} from "@/src/features/session-workout/hooks/use-ongoing-session";
import { RestTimerProvider } from "@/src/features/session-workout/hooks/use-rest-timer";
import { WorkoutLiveActivityCoordinator } from "@/src/features/session-workout/live-activity/coordinator";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const THEME_KEY = "theme";
const DEMO_SEED_KEY = "gym-diary:demo-seed:v1";
let demoSeedPromise: Promise<void> | null = null;
const queryClient = new QueryClient();

async function prepareDemoData() {
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      const hasSeededDemo = await AsyncStorage.getItem(DEMO_SEED_KEY);
      if (hasSeededDemo === "complete") return;

      await runAllSeeds(db);
      await AsyncStorage.setItem(DEMO_SEED_KEY, "complete");
    })().catch((error) => {
      demoSeedPromise = null;
      throw error;
    });
  }

  await demoSeedPromise;
}

function getActiveSessionFrameRadius(width: number, height: number) {
  const shortestSide = Math.min(width, height);

  // iPad windows keep square content corners, including in split view where the
  // window itself can be phone-sized. The size check covers Android tablets and
  // desktop/web layouts without assigning a model-specific radius.
  const usesSquareDisplay =
    (Platform.OS === "ios" && Platform.isPad) || shortestSide >= 600;

  if (usesSquareDisplay) return 0;

  return Math.round(Math.min(Math.max(shortestSide * 0.14, 44), 72));
}

function ActiveSessionFrame({ children }: { children: React.ReactNode }) {
  const { ongoingSession } = useOngoingSession();
  const { width, height } = useWindowDimensions();

  return (
    <View
      className="flex-1 bg-white dark:bg-[#21222C]"
      style={
        ongoingSession
          ? [
              styles.activeSessionFrame,
              { borderRadius: getActiveSessionFrameRadius(width, height) },
            ]
          : null
      }
    >
      {children}
    </View>
  );
}

function BootScreen({
  title,
  detail,
  onRetry,
}: {
  title: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-[#21222C] px-4">
      <ActivityIndicator size="large" color="#BD93F9" />
      <Text className="mt-3 font-semibold text-[#F8F8F2]">{title}</Text>
      {detail ? (
        <Text selectable className="mt-2 text-center text-[#6272A4]">
          {detail}
        </Text>
      ) : null}
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          className="mt-5 rounded-xl bg-[#BD93F9] px-5 py-3"
          onPress={onRetry}
        >
          <Text className="font-semibold text-[#21222C]">Try again</Text>
        </Pressable>
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
  const [seedStatus, setSeedStatus] = useState<
    "pending" | "running" | "ready" | "failed"
  >("pending");
  const [seedErr, setSeedErr] = useState<string | null>(null);
  const [seedAttempt, setSeedAttempt] = useState(0);

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

    let cancelled = false;

    (async () => {
      try {
        setSeedStatus("running");
        setSeedErr(null);

        await prepareDemoData();
        if (!cancelled) setSeedStatus("ready");
      } catch (e: any) {
        console.warn("seeding failed", e);
        if (!cancelled) {
          setSeedErr(String(e?.message ?? e));
          setSeedStatus("failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [success, seedAttempt]);

  if (migErrorMsg)
    return <BootScreen title="Migration failed" detail={migErrorMsg} />;
  if (!success) return <BootScreen title="Migrating database…" />;
  if (seedStatus === "failed") {
    return (
      <BootScreen
        title="Demo setup failed"
        detail={seedErr ?? undefined}
        onRetry={() => setSeedAttempt((attempt) => attempt + 1)}
      />
    );
  }
  if (seedStatus !== "ready") {
    return <BootScreen title="Preparing your training diary…" />;
  }

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
                <RestTimerProvider>
                  <WorkoutLiveActivityCoordinator />
                  <ActiveSessionFrame>
                    <SafeAreaView
                      className="flex-1 bg-white dark:bg-[#21222C]"
                      edges={["top", "bottom"]}
                    >
                      <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen name="program-workout" />
                          <Stack.Screen name="program-workout/new" />
                          <Stack.Screen name="program-workout/[id]" />
                          <Stack.Screen name="session-workout/[id]" />
                        </Stack>
                      </View>
                    </SafeAreaView>
                  </ActiveSessionFrame>
                </RestTimerProvider>
              </OngoingSessionProvider>
            </SQLiteProvider>
          </Suspense>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  activeSessionFrame: {
    borderColor: "#10B981",
    borderWidth: 9,
    overflow: "hidden",
  },
});
