// apps/mobile/app/template-workout/[id].tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  WorkoutProgram,
  WorkoutProgramFormData,
} from "@/src/features/program-workout/domain/type";
import WorkoutProgramForm from "@/src/features/program-workout/ui/form";
import { workoutTemplateRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { WorkoutProgramFormFactory } from "@/src/features/program-workout/domain/form-factory";

export default function TemplateWorkoutEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [formData, setFormData] = useState<WorkoutProgramFormData>(
    WorkoutProgramFormFactory.createEmpty()
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

        const template: WorkoutProgram | null =
          await workoutTemplateRepository.get(id);

        if (!template) {
          if (!cancelled) {
            setLoadError("Template not found.");
          }
          return;
        }

        if (!cancelled) {
          const form = WorkoutProgramFormFactory.fromDomain(template);
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
      const template = WorkoutProgramFormFactory.toDomain(formData);
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0} // adjust in screen if you have a header
      >
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
        <WorkoutProgramForm formData={formData} setFormData={setFormData} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
