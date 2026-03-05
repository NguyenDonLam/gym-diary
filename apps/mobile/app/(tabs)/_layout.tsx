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

        tabBarStyle: {
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },

        tabBarActiveTintColor: isDark ? "#BD93F9" : "#0f172a",
        tabBarInactiveTintColor: isDark ? "#6272A4" : "#64748b",

        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              backgroundColor: isDark ? "#21222C" : "#ffffff",
              borderTopWidth: 1,
              borderTopColor: isDark ? "#44475A" : "#e5e7eb",
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
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}
