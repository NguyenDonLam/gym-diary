// src/features/template-workout/ui/form.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import TemplateExerciseForm from "@/src/features/template-exercise/ui/form";
import { TemplateWorkoutFormData } from "../domain/type";
import { TemplateExerciseFormData } from "../../template-exercise/domain/type";
import { generateId } from "@/src/lib/id";
import { useExercises } from "@/src/features/exercise/hooks/use-exercises";
import { Exercise } from "@packages/exercise";

type TemplateWorkoutFormProps = {
  formData: TemplateWorkoutFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateWorkoutFormData>>;
};

export default function TemplateWorkoutForm({
  formData,
  setFormData,
}: TemplateWorkoutFormProps) {
  const { name, description, exercises } = formData;

  const { options: exerciseOptions } = useExercises();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const setName = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
    }));
  };

  const setDescription = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const addExercisesFromLibrary = (selected: Exercise[]) => {
    const existingIds = new Set(
      exercises.map((ex) => ex.exerciseId).filter(Boolean) as string[]
    );

    const newOnes: TemplateExerciseFormData[] = selected
      .filter((ex) => !existingIds.has(ex.id))
      .map((ex) => ({
        id: generateId(),
        exerciseId: ex.id,
        isCustom: false,
        sets: [],
      }));

    if (newOnes.length === 0) return;

    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, ...newOnes],
    }));
  };

  const updateExercise = (
    exerciseId: string,
    updater: (prev: TemplateExerciseFormData) => TemplateExerciseFormData
  ) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? updater(ex) : ex
      ),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
    }));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmLibrary = () => {
    const selected = exerciseOptions.filter((opt) => selectedIds.has(opt.id));
    addExercisesFromLibrary(selected);
    setSelectedIds(new Set());
    setLibraryOpen(false);
  };

  const handleCloseLibrary = () => {
    setSelectedIds(new Set());
    setLibraryOpen(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Template meta block */}
          <View className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3">
            <View className="mb-1 flex-row items-center gap-1">
              <Text className="text-[13px]">🏋️‍♂️</Text>
            </View>

            <TextInput
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              placeholder="Name"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="mt-2 h-16 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              placeholder="Notes"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Exercises header row – minimal, add = open library */}
          <View className="mb-2 flex-row items-center justify-between">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
              <Text className="text-[11px] text-neutral-500">●</Text>
            </View>
            <Pressable
              onPress={() => setLibraryOpen(true)}
              className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900"
            >
              <Text className="text-[14px] text-white">＋</Text>
            </Pressable>
          </View>

          {/* Exercises list */}
          {exercises.length === 0 ? (
            <View className="mt-4 items-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl border border-dashed border-neutral-300">
                <Text className="text-[16px] text-neutral-400">＋</Text>
              </View>
            </View>
          ) : (
            exercises.map((ex, index) => (
              <TemplateExerciseForm
                key={ex.id}
                formData={ex}
                index={index}
                setFormData={(next) => updateExercise(ex.id, () => next)}
                onRemove={() => removeExercise(ex.id)}
              />
            ))
          )}

          {/* Bottom spacer */}
          <View className="h-6" />
        </ScrollView>

        {/* LIBRARY OVERLAY – multi-select */}
        {libraryOpen && (
          <View className="absolute inset-0 bg-black/40" style={{ zIndex: 50 }}>
            <View className="absolute inset-x-4 top-16 bottom-16 rounded-3xl bg-white px-3 py-3">
              {/* Header icons only */}
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] text-neutral-900">📚</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={handleCloseLibrary}
                    className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100"
                  >
                    <Text className="text-[12px] text-neutral-600">✕</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmLibrary}
                    className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900"
                  >
                    <Text className="text-[12px] text-white">✓</Text>
                  </Pressable>
                </View>
              </View>

              {/* List */}
              <ScrollView keyboardShouldPersistTaps="handled" className="mt-1">
                {exerciseOptions.map((opt) => {
                  const isSelected = selectedIds.has(opt.id);
                  const initial = (opt.name?.trim?.()[0] ?? "?").toUpperCase();

                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleSelect(opt.id)}
                      className={`mb-1 flex-row items-center rounded-2xl px-2 py-1.5 ${
                        isSelected ? "bg-neutral-900" : "bg-neutral-50"
                      }`}
                    >
                      {/* check circle */}
                      <View
                        className={`mr-2 h-6 w-6 items-center justify-center rounded-full ${
                          isSelected ? "bg-white" : "bg-white"
                        }`}
                      >
                        <Text
                          className={`text-[12px] ${
                            isSelected ? "text-neutral-900" : "text-neutral-400"
                          }`}
                        >
                          {isSelected ? "✓" : ""}
                        </Text>
                      </View>

                      {/* initial badge */}
                      <View
                        className={`mr-2 h-7 w-7 items-center justify-center rounded-xl ${
                          isSelected ? "bg-neutral-800" : "bg-neutral-200"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-semibold ${
                            isSelected ? "text-white" : "text-neutral-800"
                          }`}
                        >
                          {initial}
                        </Text>
                      </View>

                      {/* name */}
                      <View className="flex-1">
                        <Text
                          className={`text-[12px] ${
                            isSelected ? "text-white" : "text-neutral-900"
                          }`}
                          numberOfLines={1}
                        >
                          {opt.name}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}

                <View className="h-4" />
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
