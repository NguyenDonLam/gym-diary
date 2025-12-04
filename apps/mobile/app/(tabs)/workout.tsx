import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Trash2 } from "lucide-react-native";
import { useWorkoutTemplates } from "@/src/features/template-workout/hooks/use-workout-template";
import { TemplateColor } from "@/src/features/template-workout/domain/type";

const ROW_BG_MAP: Record<TemplateColor, string> = {
  neutral: "bg-neutral-50",
  red: "bg-red-50",
  orange: "bg-orange-50",
  yellow: "bg-yellow-50",
  green: "bg-green-50",
  teal: "bg-teal-50",
  blue: "bg-blue-50",
  purple: "bg-purple-50",
  pink: "bg-pink-50",
};

export default function Workout() {
  const router = useRouter();

  const { templates, deleteTemplate } = useWorkoutTemplates();

  const handleStartFromTemplate = (id: string) => {
    console.log("start session from template", id);
  };

  const handleEditTemplate = (id: string) => {
    console.log("edit template", id);
    router.push({
      pathname: "/template-workout/[id]",
      params: { id },
    });
  };

  const handleCreateTemplate = () => {
    router.push("/template-workout/new");
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert(
      "Delete template",
      `Delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTemplate(id).catch((err) => {
              console.error("Failed to delete template", err);
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <Text className="text-lg font-bold">Session templates</Text>
          <Text className="mt-1 text-xs text-neutral-700">
            Tap template to start. Long-press to edit.
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">
            Total: {templates.length}
          </Text>
        </View>

        {/* Bottom sheet area */}
        <View className="flex-1 rounded-t-2xl border-t border-neutral-200 bg-white">
          <View className="flex-row items-center justify-between px-4 pt-2.5 pb-1.5">
            <Text className="text-base font-semibold">Templates</Text>

            <Pressable
              className="rounded-full border border-neutral-300 px-3 py-1.5"
              onPress={handleCreateTemplate}
            >
              <Text className="text-[13px] font-semibold text-neutral-900">
                New template
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {templates.length > 0 ? (
              templates.map((tpl) => {
                const rowBgClass =
                  ROW_BG_MAP[(tpl.color as TemplateColor) ?? "neutral"];

                return (
                  <Pressable
                    key={tpl.id}
                    className={`mb-2 rounded-xl border border-neutral-200 px-3 py-2.5 ${rowBgClass}`}
                    onPress={() => handleStartFromTemplate(tpl.id)}
                    onLongPress={() => handleEditTemplate(tpl.id)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="shrink">
                        <Text className="text-[15px] font-semibold text-neutral-900">
                          {tpl.name}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-neutral-500">
                          Tap to start · long-press to edit
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          handleDeleteTemplate(tpl.id, tpl.name ?? "")
                        }
                        hitSlop={8}
                        className="ml-3 h-7 w-7 items-center justify-center rounded-full bg-white/80"
                      >
                        <Trash2 width={16} height={16} color="#4B5563" />
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View className="pt-6 items-center">
                <Text className="text-base font-semibold text-neutral-900">
                  No templates yet
                </Text>
                <Text className="mt-1 text-[13px] text-center text-neutral-500">
                  Use “New template” to create your first one.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
