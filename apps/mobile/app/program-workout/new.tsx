import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WorkoutProgramFormData } from "@/src/features/program-workout/domain/type";
import WorkoutProgramForm from "@/src/features/program-workout/ui/form";
import { WorkoutProgramFactory } from "@/src/features/program-workout/domain/factory";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
export default function ProgramWorkoutCreate() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();


  const [formData, setFormData] = useState<WorkoutProgramFormData>(
    WorkoutProgramFactory.createForm({folderId})
  );


  const [isSaving, setIsSaving] = useState(false);

  const canSave = formData.name.trim().length > 0 && !isSaving;

  const handleCancel = () => {
    if (isSaving) return;
    router.push("/(tabs)/workout");
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const template = await WorkoutProgramFactory.domainFromForm(formData);
      await workoutProgramRepository.save(template);

      router.replace("/workout");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-[#2B2D3A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 dark:border-[#44475A] px-4 py-3 bg-white dark:bg-[#21222C]">
        <Pressable onPress={handleCancel} disabled={isSaving}>
          <Text className="text-sm text-neutral-500 dark:text-[#6272A4]">
            Cancel
          </Text>
        </Pressable>

        <Text className="text-base font-semibold text-neutral-900 dark:text-[#F8F8F2]">
          New template
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-full px-3 py-1.5 ${
            canSave
              ? "bg-black dark:bg-[#BD93F9]"
              : "bg-neutral-300 dark:bg-[#44475A]"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              canSave
                ? "text-white dark:text-[#282A36]"
                : "text-neutral-500 dark:text-[#6272A4]"
            }`}
          >
            Save
          </Text>
        </Pressable>
      </View>

      {/* Body */}
      <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
        <WorkoutProgramForm formData={formData} setFormData={setFormData} />
      </View>
    </KeyboardAvoidingView>
  );
}
