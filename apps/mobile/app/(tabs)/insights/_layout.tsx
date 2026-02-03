import React, { useMemo } from "react";
import { Pressable, Text, useColorScheme } from "react-native";
import { Stack, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

export function HeaderBack() {
  const isDark = useColorScheme() === "dark";

  return (
    <Pressable
      onPress={() => {
        const canGoBack = (
          router as unknown as { canGoBack?: () => boolean }
        ).canGoBack?.();
        if (canGoBack) router.back();
        else router.push("/(tabs)/insights");
      }}
      hitSlop={12}
      className="px-3 py-2"
    >
      <ArrowLeft size={22} color={isDark ? "#FFFFFF" : "#000000"} />
    </Pressable>
  );
}


export default function InsightsLayout() {
  const scheme = useColorScheme();

  const screenOptions = useMemo(() => {
    const isDark = scheme === "dark";

    return {
      headerShown: true,
      headerStyle: { backgroundColor: isDark ? "#000000" : "#FFFFFF" },
      headerTintColor: isDark ? "#FFFFFF" : "#000000",
      headerTitleStyle: { color: isDark ? "#FFFFFF" : "#000000" },
      contentStyle: { backgroundColor: isDark ? "#000000" : "#FAFAFA" },
    } as const;
  }, [scheme]);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: "Insights" }} />

      <Stack.Screen
        name="progression"
        options={{
          title: "Progression",
          headerLeft: () => <HeaderBack />,
        }}
      />

      <Stack.Screen
        name="program/index"
        options={{
          title: "Program",
          headerLeft: () => <HeaderBack />,
        }}
      />
      <Stack.Screen
        name="program/[programId]"
        options={{
          title: "",
          headerLeft: () => <HeaderBack />,
        }}
      />

      <Stack.Screen
        name="exercise/index"
        options={{
          title: "Exercise",
          headerLeft: () => <HeaderBack />,
        }}
      />
      <Stack.Screen
        name="exercise/[exerciseId]"
        options={{
          title: "Exercise stats",
          headerLeft: () => <HeaderBack />,
        }}
      />
    </Stack>
  );
}
