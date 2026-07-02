import React, { useEffect, useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";

type ThemeOption =  "light" | "dark";

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { autoEndAfterMinutes, setAutoEndAfterMinutes } = useOngoingSession();
  const [autoEndDraft, setAutoEndDraft] = useState("");

  useEffect(() => {
    setAutoEndDraft(
      autoEndAfterMinutes === false ? "" : String(autoEndAfterMinutes),
    );
  }, [autoEndAfterMinutes]);

  const isActive = (value: ThemeOption) => {
    return colorScheme === value;
  };

  const ThemeButton = ({
    label,
    value,
    isLast = false,
  }: {
    label: string;
    value: ThemeOption;
    isLast?: boolean;
  }) => {
    const active = isActive(value);

    return (
      <Pressable
        onPress={() => setColorScheme(value)}
        className={[
          "flex-1 rounded-full px-3 py-2",
          active
            ? "bg-neutral-900 dark:bg-[#BD93F9] "
            : "bg-white dark:bg-[#2B2D3A]",
          !isLast ? "mr-2" : "",
        ].join(" ")}
      >
        <Text
          className={[
            "text-center text-[13px] font-semibold",
            active
              ? "text-white dark:text-slate-900"
              : "text-neutral-900 dark:text-slate-50",
          ].join(" ")}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const saveAutoEndDraft = async () => {
    const normalized = autoEndDraft.trim().replace(",", ".");
    const minutes = Number.parseFloat(normalized);

    if (!Number.isFinite(minutes) || minutes <= 0) {
      setAutoEndDraft(
        autoEndAfterMinutes === false ? "" : String(autoEndAfterMinutes),
      );
      return;
    }

    await setAutoEndAfterMinutes(minutes);
  };

  const disableAutoEnd = async () => {
    Keyboard.dismiss();
    setAutoEndDraft("");
    await setAutoEndAfterMinutes(false);
  };

  const confirmAutoEndDraft = async () => {
    await saveAutoEndDraft();
    Keyboard.dismiss();
  };

  const autoEndEnabled = autoEndAfterMinutes !== false;
  const hasAutoEndDraft = autoEndDraft.trim().length > 0;
  const confirmIconColor = colorScheme === "dark" ? "#282A36" : "#FFFFFF";
  const idleIconColor = colorScheme === "dark" ? "#F8F8F2" : "#111827";

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-emerald-500 dark:bg-[#21222C]">
        <Text className="text-lg font-bold text-neutral-900 dark:text-[#F8F8F2]">
          Settings
        </Text>
        <Text className="mt-1 text-xs text-neutral-700 dark:text-[#6272A4]">
          Preferences and app options.
        </Text>
      </View>

      <View className="px-4 pt-4">
        <View className="mb-3 rounded-2xl bg-neutral-100 p-4 dark:bg-[#343746] ">
          <Text className="text-base font-semibold text-neutral-900 dark:text-[#F8F8F2]">
            Appearance
          </Text>

          <Text className="mt-1 text-xs text-neutral-700 dark:text-[#6272A4]">
            Choose how the app looks.
          </Text>

          <View className="mt-3 flex-row">
            <ThemeButton label="Light" value="light" />
            <ThemeButton label="Dark" value="dark" isLast />
          </View>
        </View>

        <View className="mb-3 rounded-2xl bg-neutral-100 p-4 dark:bg-[#343746] ">
          <Text className="text-base font-semibold text-neutral-900 dark:text-[#F8F8F2]">
            Workout sessions
          </Text>

          <View className="mt-3">
            <Text className="text-xs font-medium text-neutral-700 dark:text-[#F8F8F2]">
              Auto end after inactivity
            </Text>

            <View className="mt-2 flex-row items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Disable automatic session ending"
                accessibilityState={{ selected: !autoEndEnabled }}
                onPress={() => void disableAutoEnd()}
                className={[
                  "h-11 items-center justify-center rounded-full px-4",
                  !autoEndEnabled
                    ? "bg-neutral-900 dark:bg-[#BD93F9]"
                    : "bg-white dark:bg-[#2B2D3A]",
                ].join(" ")}
              >
                <Text
                  className={[
                    "text-[13px] font-semibold",
                    !autoEndEnabled
                      ? "text-white dark:text-slate-900"
                      : "text-neutral-900 dark:text-slate-50",
                  ].join(" ")}
                >
                  Off
                </Text>
              </Pressable>

              <View
                className={[
                  "ml-2 h-11 flex-1 flex-row items-center rounded-full border bg-white px-3 dark:bg-[#2B2D3A]",
                  autoEndEnabled
                    ? "border-neutral-900 dark:border-[#BD93F9]"
                    : "border-transparent dark:border-transparent",
                ].join(" ")}
              >
                <TextInput
                  accessibilityLabel="Auto end after minutes"
                  className="flex-1 text-[13px] font-semibold text-neutral-900 dark:text-[#F8F8F2]"
                  keyboardType="decimal-pad"
                  placeholder="Minutes"
                  placeholderTextColor={
                    colorScheme === "dark" ? "#6272A4" : "#9CA3AF"
                  }
                  value={autoEndDraft}
                  onChangeText={setAutoEndDraft}
                  onEndEditing={() => void saveAutoEndDraft()}
                  onSubmitEditing={() => void saveAutoEndDraft()}
                />
                <Text className="ml-2 text-[12px] font-medium text-neutral-500 dark:text-[#6272A4]">
                  min
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Set automatic session ending minutes"
                  onPress={() => void confirmAutoEndDraft()}
                  className={[
                    "ml-2 h-9 w-9 items-center justify-center rounded-full",
                    hasAutoEndDraft
                      ? "bg-neutral-900 dark:bg-[#BD93F9]"
                      : "bg-neutral-200 dark:bg-[#44475A]",
                  ].join(" ")}
                >
                  <Check
                    size={16}
                    color={hasAutoEndDraft ? confirmIconColor : idleIconColor}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
