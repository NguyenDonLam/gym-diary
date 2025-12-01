import { Stack } from "expo-router";
import "../global.css";
import { Suspense, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { openDatabaseSync, SQLiteProvider } from "expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "../drizzle/migrations";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { runAllSeeds } from "@/db/seeds";

export const DATABASE_NAME ="gym_diary.db"
export default function RootLayout() {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  useDrizzleStudio(expoDb);
  const {success, error} = useMigrations(db, migrations);
  useEffect(() => {
    if (!success) return;
    runAllSeeds(db).catch((e) => console.warn("seeding failed", e));
  }, [success]);

  if (!success) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{enableChangeListener:true}}
        useSuspense
      >
        <Stack>
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="test"
            options={{ headerShown: false }}
          ></Stack.Screen>
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
