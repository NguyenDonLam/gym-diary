import React from "react";
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

type TemplateWorkoutFormProps = {
  formData: TemplateWorkoutFormData;
  setFormData: React.Dispatch<React.SetStateAction<TemplateWorkoutFormData>>;
};

export default function TemplateWorkoutForm({
  formData,
  setFormData,
}: TemplateWorkoutFormProps) {
  const { name, description, exercises } = formData;

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

  const addExercise = () => {
    const newExercise: TemplateExerciseFormData = {
      id: generateId(),
      exerciseId: null,
      isCustom: false,
      sets: [],
    };

    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newExercise],
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

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template meta block */}
        <View className="mb-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3">
          {/* tiny icon row instead of text label */}
          <View className="mb-1 flex-row items-center gap-1">
            <Text className="text-[13px]">Session Details</Text>
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

        {/* Exercises header row – minimal */}
        <View className="mb-2 flex-row items-center justify-between">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-[11px] text-neutral-500">●</Text>
          </View>
          <Pressable
            onPress={addExercise}
            className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900"
          >
            <Text className="text-[14px] text-white">＋</Text>
          </Pressable>
        </View>

        {/* Exercises list */}
        {exercises.length === 0 ? (
          <View className="mt-4 items-center">
            {/* subtle hint, no words */}
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
    </SafeAreaView>
  );
}
