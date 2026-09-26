import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { Tabs } from "expo-router";
import { router, usePathname } from "expo-router";
import { useSectionRailItems } from "./section-rail-context";
import { useColorScheme } from "nativewind";
import { LayoutDashboard, Dumbbell, ClipboardList } from "lucide-react-native";

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
  const section = state.routes[state.index].name;
  const registered = useSectionRailItems(section);
  const pathname = usePathname();
  const items =
    section === "insights"
      ? [
          {
            id: "overview",
            label: "All",
            accessibilityLabel: "Insights overview",
            icon: LayoutDashboard,
            selected:
              !pathname.includes("/exercise") && !pathname.includes("/program"),
            onPress: () => router.navigate("/(tabs)/insights"),
          },
          {
            id: "exercises",
            label: "Moves",
            accessibilityLabel: "Exercise statistics",
            icon: Dumbbell,
            selected: pathname.includes("/exercise"),
            onPress: () =>
              pathname.includes("/exercise/")
                ? router.replace("/(tabs)/insights/exercise")
                : router.navigate("/(tabs)/insights/exercise"),
          },
          {
            id: "programs",
            label: "Plans",
            accessibilityLabel: "Program statistics",
            icon: ClipboardList,
            selected: pathname.includes("/program"),
            onPress: () =>
              pathname.includes("/program/")
                ? router.replace("/(tabs)/insights/program")
                : router.navigate("/(tabs)/insights/program"),
          },
        ]
      : section === "settings/index" || section === "workout"
        ? []
        : registered;

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
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 6, gap: 6 }}
      >
        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={
              "accessibilityLabel" in item
                ? item.accessibilityLabel
                : item.label
            }
            accessibilityState={{
              selected: item.selected,
              disabled: "disabled" in item && item.disabled,
            }}
            disabled={"disabled" in item && item.disabled}
            onPress={item.onPress}
            style={{
              minHeight: "icon" in item ? 60 : 44,
              padding: 6,
              borderRadius: 12,
              justifyContent: "center",
              gap: 4,
              backgroundColor: item.selected
                ? dark
                  ? "#353047"
                  : "#F3EEFF"
                : "transparent",
            }}
          >
            {"icon" in item ? (
              <item.icon
                size={20}
                style={{ alignSelf: "center" }}
                color={
                  item.selected
                    ? dark
                      ? "#BD93F9"
                      : "#6D28D9"
                    : dark
                      ? "#A1A1B5"
                      : "#64748B"
                }
              />
            ) : null}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                fontSize: 11,
                textAlign: "center",
                fontWeight: item.selected ? "700" : "500",
                color: item.selected
                  ? dark
                    ? "#BD93F9"
                    : "#6D28D9"
                  : dark
                    ? "#A1A1B5"
                    : "#64748B",
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {items.length > 0 ? (
        <View
          style={{
            height: 1,
            marginHorizontal: 12,
            backgroundColor: dark ? "#44475A" : "#E5E7EB",
          }}
        />
      ) : null}
      <ScrollView
        style={{
          flexGrow: 0,
          flexShrink: 1,
          maxHeight: items.length ? "70%" : "100%",
        }}
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
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  maxWidth: "100%",
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
