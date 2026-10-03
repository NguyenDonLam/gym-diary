/**
 * New workout program flow:
 * - Read optional folderId and draftKey from Expo Router parameters.
 * - Initialize editable WorkoutProgramFormData with
 *   WorkoutProgramFactory.createForm({ folderId }).
 * - When draftKey is present, consume its one-time saved form draft from
 *   program-form-draft-store and replace the initial form data if found.
 * - Pass formData and setFormData to WorkoutProgramForm, which renders and
 *   edits the nested program, exercise, and set fields.
 * - Allow Save only for a nonblank program name while no save is running.
 * - Save converts the draft with WorkoutProgramFactory.domainFromForm,
 *   persists it through workoutProgramRepository.save, then returns to
 *   /(tabs)/workout; the saving flag is cleared in finally.
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
import { WorkoutProgramFormData } from "@/src/features/program-workout/domain/type";
import WorkoutProgramForm from "@/src/features/program-workout/ui/form";
import { WorkoutProgramFactory } from "@/src/features/program-workout/domain/factory";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { consumeProgramFormDraft } from "@/src/features/program-workout/data/program-form-draft-store";
export default function ProgramWorkoutCreate() {
  const router = useRouter();
  const { folderId, draftKey } = useLocalSearchParams<{
    folderId?: string;
    draftKey?: string;
  }>();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [formData, setFormData] = useState<WorkoutProgramFormData>(
    WorkoutProgramFactory.createForm({ folderId }),
  );

  useEffect(() => {
    if (!draftKey || typeof draftKey !== "string") return;

    let cancelled = false;

    consumeProgramFormDraft(draftKey)
      .then((draft) => {
        if (cancelled || !draft) return;
        setFormData(draft);
      })
      .catch((error) => {
        console.warn("[program-workout/new] failed to load draft", error);
      });

    return () => {
      cancelled = true;
    };
  }, [draftKey]);

  const [isSaving, setIsSaving] = useState(false);

  const canSave = formData.name.trim().length > 0 && !isSaving;

  const handleCancel = () => {
    if (isSaving) return;
    router.replace("/(tabs)/workout");
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const template = await WorkoutProgramFactory.domainFromForm(formData);
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
    >
      <View className="flex-row items-center border-b border-zinc-200 bg-neutral-50 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <View className="w-[88px] items-start">
          <Pressable
            onPress={handleCancel}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Cancel program creation"
            className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#343746]"
          >
            <X size={24} color={isDark ? "#F8F8F2" : "#111827"} />
          </Pressable>
        </View>

        <View className="flex-1 items-center">
          <Text className="text-[17px] font-semibold text-neutral-950 dark:text-[#F8F8F2]">
            New program
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
        <WorkoutProgramForm formData={formData} setFormData={setFormData} />
      </View>
    </KeyboardAvoidingView>
  );
}
