import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import {
  TemplateWorkout,
  TemplateWorkoutFormData,
} from "@/src/features/template-workout/domain/type";
import TemplateWorkoutForm from "@/src/features/template-workout/ui/form";
import {
  TemplateSet,
  TemplateSetFormData,
} from "@/src/features/template-set/domain/type";
import {
  TemplateExercise,
  TemplateExerciseFormData,
} from "@/src/features/template-exercise/domain/type";
import { Exercise } from "@packages/exercise";
import { workoutTemplateRepository } from "@/src/features/template-workout/data/template-workout-repository";
import { TemplateWorkoutFormFactory } from "@/src/features/template-workout/domain/form-factory";
export default function TemplateWorkoutCreate() {
  const router = useRouter();

  const [formData, setFormData] = useState<TemplateWorkoutFormData>({
    name: "",
    description: "",
    exercises: [],
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
      const template = await TemplateWorkoutFormFactory.toDomain(formData);
      console.log("start saving", JSON.stringify(template, null, 2));
      await workoutTemplateRepository.save(template);

      router.replace("/workout");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
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
      <TemplateWorkoutForm formData={formData} setFormData={setFormData} />
    </SafeAreaView>
  );
}