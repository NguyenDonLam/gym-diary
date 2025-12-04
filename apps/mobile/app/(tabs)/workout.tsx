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

const COLOR_STRIP_MAP: Record<TemplateColor, string> = {
  neutral: "bg-neutral-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

export default function Workout() {
  const router = useRouter();
  const { templates, deleteTemplate } = useWorkoutTemplates();

  const handleStartFromTemplate = (id: string) => {
    console.log("start session from template", id);
  };

  const handleEditTemplate = (id: string) => {
    router.push({
      pathname: "/template-workout/[id]",
      params: { id },
    });
  };

  const handleCreateTemplate = () => {
    router.push("/template-workout/new");
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert("Delete template", `Delete "${name}"?`, [
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
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-3 pb-2">
          <Text className="text-lg font-bold text-neutral-900">
            Session templates
          </Text>
          <Text className="mt-1 text-xs text-neutral-700">
            Tap template to start. Long-press to edit.
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">
            Total: {templates.length}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-4 pt-2 pb-1">
            <Text className="text-base font-semibold text-neutral-900">
              Templates
            </Text>

            <Pressable
              className="rounded-full px-3 py-1.5"
              onPress={handleCreateTemplate}
            >
              <Text className="text-[13px] font-semibold text-neutral-900">
                New template
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            {templates.length > 0 ? (
              templates.map((tpl) => {
                const color = (tpl.color as TemplateColor) ?? "neutral";
                const stripClass = COLOR_STRIP_MAP[color];

                return (
                  <Pressable
                    key={tpl.id}
                    className="mb-2 rounded-xl bg-neutral-50 px-3 py-2"
                    onPress={() => handleStartFromTemplate(tpl.id)}
                    onLongPress={() => handleEditTemplate(tpl.id)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        {/* colour strip on the left */}
                        <View
                          className={`mr-3 h-7 w-1 rounded-full ${stripClass}`}
                        />
                        <View className="shrink">
                          <Text className="text-[15px] font-semibold text-neutral-900">
                            {tpl.name}
                          </Text>
                          <Text className="mt-0.5 text-[11px] text-neutral-500">
                            Tap to start · long-press to edit
                          </Text>
                        </View>
                      </View>

                      <Pressable
                        onPress={() =>
                          handleDeleteTemplate(tpl.id, tpl.name ?? "")
                        }
                        hitSlop={8}
                      >
                        <Trash2 width={16} height={16} color="#9CA3AF" />
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
