import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { WorkoutProgramFormData } from "@/src/features/program-workout/domain/type";
import WorkoutProgramForm from "@/src/features/program-workout/ui/form";
import { WorkoutProgramFactory } from "@/src/features/program-workout/domain/factory";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
export default function TemplateWorkoutCreate() {
  const router = useRouter();

  const [formData, setFormData] = useState<WorkoutProgramFormData>({
    name: "",
    description: "",
    color: "neutral",
    exercises: [],
    folderId: null,
  });

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
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0} // adjust in screen if you have a header
    >
      {/* Top bar */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Pressable onPress={handleCancel} disabled={isSaving}>
          <Text className="text-sm text-neutral-500">Cancel</Text>
        </Pressable>

        <Text className="text-base font-semibold text-neutral-900">
          New template
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-full px-3 py-1.5 ${
            canSave ? "bg-black" : "bg-neutral-300"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              canSave ? "text-white" : "text-neutral-500"
            }`}
          >
            Save
          </Text>
        </Pressable>
      </View>

      {/* Form body */}
      <WorkoutProgramForm formData={formData} setFormData={setFormData} />
    </KeyboardAvoidingView>
  );
}
