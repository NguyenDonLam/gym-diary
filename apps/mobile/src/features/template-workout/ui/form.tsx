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
      id: Math.random().toString(36).slice(2),
      exerciseId: null,
      name: "",
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
          <Text className="mb-1 text-[11px] font-semibold text-neutral-600">
            Template info
          </Text>
          <TextInput
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            placeholder="Template name (e.g. Upper A, Full body)"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="mt-2 h-20 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            placeholder="Description (optional)"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Exercises header row */}
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-neutral-700">
            Exercises & sets
          </Text>
          <Pressable
            onPress={addExercise}
            className="rounded-full border border-neutral-300 px-3 py-1"
          >
            <Text className="text-[11px] font-semibold text-neutral-800">
              + Add exercise
            </Text>
          </Pressable>
        </View>

        {/* Exercises list */}
        {exercises.length === 0 ? (
          <View className="mt-4 items-center">
            <Text className="text-xs text-neutral-500">
              No exercises yet. Add one above.
            </Text>
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
