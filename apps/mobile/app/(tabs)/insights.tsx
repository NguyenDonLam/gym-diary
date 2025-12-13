import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";

export default function Insights() {
  // All data here is placeholder. Wire these to your real selectors / API.
  const keyMetrics = [
    { id: "volume", label: "Weekly volume", value: "--" },
    { id: "frequency", label: "Sessions / week", value: "--" },
    { id: "duration", label: "Avg. session length", value: "--" },
  ];

  const modules = [
    {
      id: "muscle_distribution",
      title: "Muscle distribution",
      subtitle: "See which muscle groups get most of your volume.",
    },
    {
      id: "fatigue_recovery",
      title: "Fatigue / recovery",
      subtitle: "Readiness per muscle group across the week.",
    },
    {
      id: "frequency",
      title: "Training frequency",
      subtitle: "How often you hit each muscle group or pattern.",
    },
    {
      id: "strength_trend",
      title: "Strength trends",
      subtitle: "Long-term progress on your main lifts.",
    },
    {
      id: "joint_load",
      title: "Joint load map",
      subtitle: "Where your knee, shoulder, elbow stress accumulates.",
    },
    {
      id: "style_profile",
      title: "Training style profile",
      subtitle: "Volume vs intensity vs conditioning balance.",
    },
    {
      id: "dead_volume",
      title: "Dead volume",
      subtitle: "Sets that are too easy or not productive.",
    },
    {
      id: "performance_timing",
      title: "Time-to-peak performance",
      subtitle: "When in a session you usually perform best.",
    },
  ];

  const handleOpenModule = (id: string) => {
    // wire to navigation: e.g. router.push(`/insights/${id}`)
    console.log("open insights module", id);
  };

  return (
      <View className="flex-1">
        {/* HEADER */}
        <View className="px-4 pt-3 pb-2">
          <Text className="text-xl font-bold">Insights</Text>
          <Text className="mt-1 text-xs">
            High-level view of how you actually train.
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* KEY METRICS STRIP */}
          <View className="flex-row justify-between mb-3">
            {keyMetrics.map((m, index) => (
              <View
                key={m.id}
                className={`flex-1 rounded-md border px-2 py-2 ${
                  index !== keyMetrics.length - 1 ? "mr-2" : ""
                }`}
              >
                <Text className="text-[11px]">{m.label}</Text>
                <Text className="mt-1 text-sm font-semibold">{m.value}</Text>
              </View>
            ))}
          </View>

          {/* QUICK CHART PLACEHOLDERS */}
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-1">
              Volume and trends
            </Text>

            <View className="h-36 rounded-md border px-3 py-2 mb-2">
              <Text className="text-[13px] font-semibold mb-1">
                7-day volume trend
              </Text>
              <Text className="text-[11px]">
                Render line / bar chart for total sets or tonnage here.
              </Text>
            </View>

            <View className="h-36 rounded-md border px-3 py-2 mb-2">
              <Text className="text-[13px] font-semibold mb-1">
                Muscle group distribution
              </Text>
              <Text className="text-[11px]">
                Render stacked bar / radial chart for muscles here.
              </Text>
            </View>

            <View className="h-36 rounded-md border px-3 py-2">
              <Text className="text-[13px] font-semibold mb-1">
                Fatigue vs recovery
              </Text>
              <Text className="text-[11px]">
                Render per-muscle readiness curve / traffic light bars here.
              </Text>
            </View>
          </View>

          {/* ADVANCED MODULES LIST – TAP TO OPEN DETAILED GRAPHS */}
          <View className="mt-1">
            <Text className="text-sm font-semibold mb-1">
              Advanced insights
            </Text>

            {modules.map((mod) => (
              <Pressable
                key={mod.id}
                className="flex-row items-center justify-between py-2 border-b"
                onPress={() => handleOpenModule(mod.id)}
              >
                <View className="pr-2 flex-shrink">
                  <Text className="text-[14px] font-semibold">{mod.title}</Text>
                  <Text className="mt-0.5 text-xs">{mod.subtitle}</Text>
                </View>
                <Text className="text-base">{">"}</Text>
              </Pressable>
            ))}
          </View>

          {/* BOTTOM SPACER FOR THUMB AREA */}
          <View className="h-6" />
        </ScrollView>
      </View>
  );
}
