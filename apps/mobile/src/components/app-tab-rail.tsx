import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Tabs } from "expo-router";
import { useColorScheme } from "nativewind";

type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

export function AppTabRail({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === "dark";

  return (
    <View
      style={{
        width: 80 + insets.right,
        paddingRight: insets.right,
        backgroundColor: dark ? "#21222C" : "#FFFFFF",
        borderLeftWidth: 1,
        borderLeftColor: dark ? "#44475A" : "#E5E7EB",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "flex-end",
          padding: 6,
          gap: 6,
        }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const color = focused
            ? dark
              ? "#BD93F9"
              : "#6D28D9"
            : dark
              ? "#A1A1B5"
              : "#64748B";

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              testID={options.tabBarButtonTestID}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={{
                minHeight: 62,
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                paddingVertical: 8,
                borderRadius: 16,
                backgroundColor: focused
                  ? dark
                    ? "#353047"
                    : "#F3EEFF"
                  : "transparent",
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text
                style={{
                  color,
                  fontSize: 10,
                  fontWeight: focused ? "700" : "500",
                  textAlign: "center",
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
