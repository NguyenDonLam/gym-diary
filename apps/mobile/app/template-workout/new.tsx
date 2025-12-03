import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  TemplateWorkout,
  TemplateWorkoutFormData,
} from "@/src/features/template-workout/domain/type";
import TemplateWorkoutForm from "@/src/features/template-workout/ui/form";
import { workoutTemplateRepository } from "@/src/features/template-workout/data/template-workout-repository";

function toFormData(template: TemplateWorkout): TemplateWorkoutFormData {
  return {
    name: template.name,
    description: template.description ?? "",
    // Adjust this mapping if your domain shape differs
    exercises: template.exercises as TemplateWorkoutFormData["exercises"],
  };
}

export default function TemplateWorkoutEdit() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<TemplateWorkoutFormData | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || typeof id !== "string") {
        setLoadError("Invalid template id.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);

        const template = await workoutTemplateRepository.findById(id);

        if (!template) {
          if (!cancelled) {
            setLoadError("Template not found.");
          }
          return;
        }

        if (!cancelled) {
          setFormData(toFormData(template));
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError("Failed to load template.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const canSave =
    !!formData && formData.name.trim().length > 0 && !isSaving && !isLoading;

  const handleCancel = () => {
    if (isSaving) return;
    router.back();
  };

  const handleSave = async () => {
    if (!canSave || !formData || !id || typeof id !== "string") return;

    setIsSaving(true);
    try {
      // Reuse your factory and force the existing id
      const template = await TemplateWorkoutFactory.fromForm(formData);
      // @ts-expect-error: ensure TemplateWorkout has an id field
      template.id = id;

      await workoutTemplateRepository.save(template);

      router.replace("/workout");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3">
          <Pressable onPress={handleCancel} disabled={isSaving}>
            <Text className="text-sm text-neutral-500">Cancel</Text>
          </Pressable>

          <Text className="text-base font-semibold text-neutral-900">
            Edit template
          </Text>

          <View className="px-3 py-1.5">
            <ActivityIndicator />
          </View>
        </View>

        <View className="flex-1 items-center justify-center">
          {loadError ? (
            <Text className="text-sm text-red-500">{loadError}</Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Pressable onPress={handleCancel} disabled={isSaving}>
          <Text className="text-sm text-neutral-500">Cancel</Text>
        </Pressable>

        <Text className="text-base font-semibold text-neutral-900">
          Edit template
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
