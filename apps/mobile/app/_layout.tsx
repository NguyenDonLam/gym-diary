import { Stack } from "expo-router";
import "../global.css";
import { Suspense, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { SQLiteProvider } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { runAllSeeds } from "@/db/seeds";
import { DATABASE_NAME, db, expoDb } from "@/db";
import "react-native-get-random-values";

import "react-native-gesture-handler";

import { GestureHandlerRootView } from "react-native-gesture-handler";


export default function RootLayout() {
  useDrizzleStudio(expoDb);
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    if (!success) return;
    runAllSeeds(db).catch((e) => console.warn("seeding failed", e));
  }, [success]);

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
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          </Stack>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}
