import React from "react";
import { AppTabRail } from "@/src/components/app-tab-rail";
import { Tabs } from "expo-router";

import {
  History,
  Dumbbell,
  LineChart,
  Camera,
  Settings as SettingsIcon,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarPosition: "right" }}
      tabBar={(props) => <AppTabRail {...props} />}
    >
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
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
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
