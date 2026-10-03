/**
 * Edit workout program flow:
 * - Read program id and optional draftKey from Expo Router parameters.
 * - Validate id, then load the full program through workoutProgramRepository.
 * - Convert the saved domain program to WorkoutProgramFormData with
 *   WorkoutProgramFactory.formFromDomain.
 * - If draftKey exists, consume its one-time form draft and use it in place
 *   of the saved values; cancellation prevents stale async updates.
 * - Render the editor header immediately. Show form-shaped placeholders or
 *   an inline load error in the content area until this route's data arrives;
 *   only then mount WorkoutProgramForm with editable formData.
 * - Save requires a loaded program, a nonblank name, and no active load/save.
 * - Convert the form back with domainFromForm, restore the route's original
 *   id, persist via workoutProgramRepository.save, then return to Workout.
 * - Cancel returns to Workout unless a save is in progress.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import {
  WorkoutProgram,
  WorkoutProgramFormData,
} from "@/src/features/program-workout/domain/type";
import WorkoutProgramForm from "@/src/features/program-workout/ui/form";
import { WorkoutProgramFactory } from "@/src/features/program-workout/domain/factory";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { consumeProgramFormDraft } from "@/src/features/program-workout/data/program-form-draft-store";

export default function ProgramWorkoutEditScreen() {
  const router = useRouter();
  const { id, draftKey } = useLocalSearchParams<{
    id: string;
    draftKey?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [formData, setFormData] = useState<WorkoutProgramFormData>(
    WorkoutProgramFactory.createForm(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const routeKey = JSON.stringify([id, draftKey]);
  const [loadedRouteKey, setLoadedRouteKey] = useState<string | null>(null);

  // Load existing template
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!id || typeof id !== "string") {
        setLoadError("Invalid template id.");
        setLoadedRouteKey(routeKey);
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
            setLoadedRouteKey(routeKey);
          }
          return;
        }

        if (!cancelled) {
          let form = WorkoutProgramFactory.formFromDomain(template);
          if (draftKey && typeof draftKey === "string") {
            const draft = await consumeProgramFormDraft(draftKey);
            if (draft) form = draft;
          }

          setFormData(form);
          setLoadedRouteKey(routeKey);
        }
      } catch (error) {
        console.warn("[program-workout/edit] failed to load template", error);
        if (!cancelled) {
          setLoadError("Failed to load template.");
          setLoadedRouteKey(routeKey);
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
  }, [id, draftKey, routeKey]);

  const hasLoadedTemplate = loadedRouteKey === routeKey && !loadError;
  const showLoadError = loadedRouteKey === routeKey && loadError && !isLoading;

  const canSave =
    hasLoadedTemplate &&
    formData.name.trim().length > 0 &&
    !isSaving &&
    !isLoading;

  const handleCancel = () => {
    if (isSaving) return;
    router.replace("/(tabs)/workout");
  };

  const handleSave = async () => {
    if (!canSave || !id || typeof id !== "string") return;

    setIsSaving(true);
    try {
      const template = WorkoutProgramFactory.domainFromForm(formData);
      // ensure we keep the existing id when saving
      template.id = id;

      await workoutProgramRepository.save(template);

      router.replace("/(tabs)/workout");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-neutral-50 dark:bg-[#2B2D3A]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View className="flex-row items-center border-b border-neutral-200 bg-neutral-50 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <View className="w-[88px] items-start">
          <Pressable
            onPress={handleCancel}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Cancel program editing"
            className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#343746]"
          >
            <X size={24} color={isDark ? "#F8F8F2" : "#111827"} />
          </Pressable>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-[17px] font-semibold text-neutral-950 dark:text-[#F8F8F2]">
            Edit program
          </Text>
          <Text className="mt-0.5 text-[11px] text-neutral-500 dark:text-[#6272A4]">
            Workout template
          </Text>
        </View>

        <View className="w-[88px] items-end">
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save program"
            className={`h-11 flex-row items-center justify-center gap-1.5 rounded-full px-3.5 ${
              canSave
                ? "bg-neutral-900 dark:bg-[#BD93F9]"
                : "bg-neutral-300 dark:bg-[#44475A]"
            }`}
          >
            <Check
              size={18}
              color={
                canSave
                  ? isDark
                    ? "#282A36"
                    : "#FFFFFF"
                  : isDark
                    ? "#6272A4"
                    : "#737373"
              }
            />
            <Text
              className={`text-[13px] font-semibold ${
                canSave
                  ? "text-white dark:text-[#282A36]"
                  : "text-neutral-500 dark:text-[#6272A4]"
              }`}
            >
              Save
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 bg-neutral-50 dark:bg-[#2B2D3A]">
        {isLoading || !hasLoadedTemplate ? (
          showLoadError ? (
            <View className="px-4 pt-5">
              <Text className="text-sm text-red-500 dark:text-[#FF5555]">
                {loadError}
              </Text>
            </View>
          ) : (
            <View accessibilityLabel="Loading program" className="px-4 pt-4">
              <View className="h-48 bg-neutral-200 dark:bg-[#343746]" />
              <View className="mt-5 h-6 w-40 bg-neutral-200 dark:bg-[#343746]" />
              <View className="mt-3 h-24 bg-neutral-200 dark:bg-[#343746]" />
              <View className="mt-3 h-24 bg-neutral-200 dark:bg-[#343746]" />
            </View>
          )
        ) : (
          <WorkoutProgramForm formData={formData} setFormData={setFormData} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
