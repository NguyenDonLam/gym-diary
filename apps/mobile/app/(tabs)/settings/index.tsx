import React from "react";
import { Pressable, Text, View } from "react-native";
import { useColorScheme } from "nativewind";

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const bg = isDark ? "#020617" : "#ffffff";
  const card = isDark ? "#0f172a" : "#f8fafc";
  const border = isDark ? "#1f2937" : "#e2e8f0";
  const text = isDark ? "#e5e7eb" : "#0f172a";
  const subtext = isDark ? "#94a3b8" : "#475569";
  const activeBg = isDark ? "#1e293b" : "#e2e8f0";

  const ThemeButton = ({
    label,
    value,
  }: {
    label: string;
    value: "light" | "dark";
  }) => {
    const active = colorScheme === value;

    return (
      <Pressable
        onPress={() => setColorScheme(value)}
        style={{
          flex: 1,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: active ? activeBg : "transparent",
          alignItems: "center",
          marginRight: value !== "dark" ? 8 : 0,
        }}
      >
        <Text
          style={{
            color: text,
            fontSize: 14,
            fontWeight: active ? "700" : "500",
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: text,
          marginBottom: 20,
        }}
      >
        Settings
      </Text>

      <View
        style={{
          backgroundColor: card,
          borderWidth: 1,
          borderColor: border,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: text,
            marginBottom: 6,
          }}
        >
          Appearance
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: subtext,
            marginBottom: 14,
          }}
        >
          Choose how the app looks.
        </Text>

        <View style={{ flexDirection: "row" }}>
          <ThemeButton label="Light" value="light" />
          <ThemeButton label="Dark" value="dark" />
        </View>
      </View>

      <View
        style={{
          backgroundColor: card,
          borderWidth: 1,
          borderColor: border,
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: text,
            marginBottom: 6,
          }}
        >
          Language
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: subtext,
          }}
        >
          Coming soon.
        </Text>
      </View>
    </View>
  );
}
