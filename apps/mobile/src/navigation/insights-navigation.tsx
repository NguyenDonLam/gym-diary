import React from "react";
import { Pressable } from "react-native";
import { Stack, router, type Href } from "expo-router";
import { useColorScheme } from "nativewind";
import { ArrowLeft } from "lucide-react-native";

export function InsightsBackButton({ destination }: { destination: Href }) {
  const { colorScheme } = useColorScheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => router.replace(destination)}
      hitSlop={12}
      className="px-3 py-2"
    >
      <ArrowLeft
        size={22}
        color={colorScheme === "dark" ? "#F8F8F2" : "#000000"}
      />
    </Pressable>
  );
}

export function useInsightsHeaderOptions() {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";
  return {
    headerStyle: { backgroundColor: dark ? "#21222C" : "#FFFFFF" },
    headerTintColor: dark ? "#F8F8F2" : "#000000",
    headerShadowVisible: false,
    contentStyle: { backgroundColor: dark ? "#2B2D3A" : "#FAFAFA" },
  };
}

export function InsightsDetailStack({
  title,
  detailName,
  detailTitle,
  listPath,
}: {
  title: string;
  detailName: string;
  detailTitle: string;
  listPath: Href;
}) {
  const options = useInsightsHeaderOptions();
  return (
    <Stack initialRouteName="index" screenOptions={options}>
      <Stack.Screen
        name="index"
        options={{ title, headerBackVisible: false }}
      />
      <Stack.Screen
        name={detailName}
        options={{
          title: detailTitle,
          headerBackVisible: false,
          headerLeft: () => <InsightsBackButton destination={listPath} />,
        }}
      />
    </Stack>
  );
}
