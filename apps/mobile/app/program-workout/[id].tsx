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
import { WorkoutProgramFormFactory } from "@/src/features/program-workout/domain/form-factory";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";

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
          await workoutProgramRepository.get(id);

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

      await workoutProgramRepository.save(template);

      router.replace("/workout");
    } finally {
      setIsSaving(false);
    }
  };

  // Loading / error state
  if (isLoading || !hasLoadedTemplate) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-row items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white dark:bg-neutral-950">
          <Pressable onPress={handleCancel} disabled={isSaving}>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Cancel
            </Text>
          </Pressable>

          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            Edit template
          </Text>

          <View className="px-3 py-1.5">
            <ActivityIndicator />
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-4 bg-white dark:bg-neutral-950">
          {loadError ? (
            <Text className="text-sm text-red-500 dark:text-red-400 text-center">
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
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="flex-row items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white dark:bg-neutral-950">
          <Pressable onPress={handleCancel} disabled={isSaving}>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Cancel
            </Text>
          </Pressable>

          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
            Edit template
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={`rounded-full px-3 py-1.5 ${
              canSave
                ? "bg-black dark:bg-neutral-50"
                : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                canSave
                  ? "text-white dark:text-neutral-900"
                  : "text-neutral-500 dark:text-neutral-300"
              }`}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <View className="flex-1 bg-white dark:bg-neutral-950">
          <WorkoutProgramForm formData={formData} setFormData={setFormData} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
