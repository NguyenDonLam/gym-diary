import React, { useMemo } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";
import {
  History,
  Dumbbell,
  LineChart,
  Settings as SettingsIcon,
} from "lucide-react-native";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const screenOptions = useMemo(
    () => ({
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
    }),
    [isDark],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <History size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size }) => (
            <Dumbbell size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <LineChart size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings/index"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon size={size} color={color} />
          ),
          tabBarItemStyle: { display: "flex" },
        }}
      />
    </Tabs>
  );
}
