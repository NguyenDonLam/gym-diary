import React from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // make the bar itself transparent; we'll fully paint via tabBarBackground
        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },

        tabBarActiveTintColor: isDark ? "#e5e7eb" : "#0f172a",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#64748b",

        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? "#020617" : "#ffffff", // slate-950 / white
              borderTopWidth: 0.5,
              borderTopColor: isDark ? "#1f2937" : "#e5e7eb", // slate-800 / gray-200
            }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
        }}
      />
    </Tabs>
  );
}
