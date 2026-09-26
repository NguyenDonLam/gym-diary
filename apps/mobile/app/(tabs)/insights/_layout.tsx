import React from "react";
import { Tabs } from "expo-router";
import { useInsightsHeaderOptions } from "@/src/navigation/insights-navigation";
import { insightsTabBackBehavior } from "@/src/navigation/navigation-policy";

export default function InsightsLayout() {
  const options = useInsightsHeaderOptions();
  return (
    <Tabs
      initialRouteName="index"
      backBehavior={insightsTabBackBehavior}
      tabBar={() => null}
      screenOptions={{
        ...options,
        popToTopOnBlur: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Insights" }} />
      <Tabs.Screen name="exercise" options={{ headerShown: false }} />
      <Tabs.Screen name="program" options={{ headerShown: false }} />
      <Tabs.Screen
        name="progression"
        options={{ title: "Progression", href: null }}
      />
    </Tabs>
  );
}
