import React from "react";
import { SafeAreaView, View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useWorkoutTemplates } from "@/src/features/template-workout/hooks/useWorkoutTemplate";

export default function Workout() {
  const router = useRouter();

  const {templates} = useWorkoutTemplates(); 

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
              templates.map((tpl) => (
                <Pressable
                  key={tpl.id}
                  className="border-b border-neutral-200 py-2.5"
                  onPress={() => handleStartFromTemplate(tpl.id)}
                  onLongPress={() => handleEditTemplate(tpl.id)}
                >
                  <View className="shrink">
                    <Text className="text-[15px] font-semibold text-neutral-900">
                      {tpl.name}
                    </Text>
                    {/* <View className="mt-0.5 flex-row flex-wrap">
                      {tpl.tag ? (
                        <Text className="mr-2 text-xs text-neutral-600">
                          {tpl.tag}
                        </Text>
                      ) : null}
                      <Text className="mr-2 text-xs text-neutral-600">
                        {tpl.duration}
                      </Text>
                    </View> */}
                    <Text className="mt-0.5 text-[11px] text-neutral-400">
                      Tap to start · long-press to edit
                    </Text>
                  </View>
                </Pressable>
              ))
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
