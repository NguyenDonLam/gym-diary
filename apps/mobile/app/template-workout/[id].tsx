// apps/mobile/app/template-workout/[id].tsx
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
import { TemplateWorkoutFormFactory } from "@/src/features/template-workout/domain/form-factory";

export default function TemplateWorkoutEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<TemplateWorkoutFormData>(
    TemplateWorkoutFormFactory.createEmpty()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoadedTemplate, setHasLoadedTemplate] = useState(false);

  // Load existing template
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

        const template: TemplateWorkout | null =
          await workoutTemplateRepository.get(id);

        if (!template) {
          if (!cancelled) {
            setLoadError("Template not found.");
          }
          return;
        }

        if (!cancelled) {
          const form = TemplateWorkoutFormFactory.fromDomain(template);
          setFormData(form);
          setHasLoadedTemplate(true);
        }
      } catch {
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
    hasLoadedTemplate &&
    formData.name.trim().length > 0 &&
    !isSaving &&
    !isLoading;

  const handleCancel = () => {
    if (isSaving) return;
    router.back();
  };

  const handleSave = async () => {
    if (!canSave || !id || typeof id !== "string") return;

    setIsSaving(true);
    try {
      const template = TemplateWorkoutFormFactory.toDomain(formData);
      // ensure we keep the existing id when saving
      template.id = id;

      await workoutTemplateRepository.save(template);

      router.replace("/workout");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading / error state
  if (isLoading || !hasLoadedTemplate) {
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

        <View className="flex-1 items-center justify-center px-4">
          {loadError ? (
            <Text className="text-sm text-red-500 text-center">
              {loadError}
            </Text>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Normal edit state
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
