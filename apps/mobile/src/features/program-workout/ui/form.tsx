// src/features/template-workout/ui/form.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DraggableFlatList, {
  DragEndParams,
} from "react-native-draggable-flatlist";
import { ListChecks, Plus, X, Check } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { WorkoutProgramFormData } from "../domain/type";
import { generateId } from "@/src/lib/id";
import type { Exercise } from "@packages/exercise/type";
import { ExerciseProgramFormData } from "../../program-exercise/domain/type";
import ExerciseProgramForm from "../../program-exercise/ui/form";
import { ProgramColor } from "@/db/enums";
import ExerciseLibraryPicker from "../../exercise/components/exercise-library-picker";

type WorkoutProgramFormProps = {
  formData: WorkoutProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkoutProgramFormData>>;
};

const PROGRAM_COLOR_OPTIONS: {
  value: ProgramColor;
  label: string;
  tileBg: string;
  dotBg: string;
}[] = [
  {
    value: "neutral",
    label: "Neutral",
    tileBg: "bg-neutral-100 dark:bg-neutral-800",
    dotBg: "bg-neutral-500",
  },
  {
    value: "red",
    label: "Red",
    tileBg: "bg-red-100 dark:bg-red-800",
    dotBg: "bg-red-500",
  },
  {
    value: "orange",
    label: "Orange",
    tileBg: "bg-orange-100 dark:bg-orange-800",
    dotBg: "bg-orange-500",
  },
  {
    value: "yellow",
    label: "Yellow",
    tileBg: "bg-yellow-100 dark:bg-yellow-700",
    dotBg: "bg-yellow-400",
  },
  {
    value: "green",
    label: "Green",
    tileBg: "bg-green-100 dark:bg-green-800",
    dotBg: "bg-green-500",
  },
  {
    value: "teal",
    label: "Teal",
    tileBg: "bg-teal-100 dark:bg-teal-800",
    dotBg: "bg-teal-500",
  },
  {
    value: "blue",
    label: "Blue",
    tileBg: "bg-blue-100 dark:bg-blue-800",
    dotBg: "bg-blue-500",
  },
  {
    value: "purple",
    label: "Purple",
    tileBg: "bg-purple-100 dark:bg-purple-800",
    dotBg: "bg-purple-500",
  },
  {
    value: "pink",
    label: "Pink",
    tileBg: "bg-pink-100 dark:bg-pink-800",
    dotBg: "bg-pink-500",
  },
];

export default function WorkoutProgramForm({
  formData,
  setFormData,
}: WorkoutProgramFormProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const primaryIconColor = isDark ? "#111827" : "#F9FAFB";
  const secondaryIconColor = isDark ? "#D1D5DB" : "#4B5563";
  const accentIconColor = isDark ? "#F9FAFB" : "#111827";

  const { name, description, exercises, color } = formData;

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const selectedExerciseIds = useMemo(
    () =>
      exercises.map((ex) => ex.exerciseId).filter((id): id is string => !!id),
    [exercises],
  );

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

  const setColor = (value: ProgramColor) => {
    setFormData((prev) => ({
      ...prev,
      color: value,
    }));
  };

  const addExercisesFromLibrary = (selected: Exercise[]) => {
    if (selected.length === 0) return;

    setFormData((prev) => {
      const existingIds = new Set(
        prev.exercises
          .map((ex) => ex.exerciseId)
          .filter((id): id is string => !!id),
      );

      const nextExercises: ExerciseProgramFormData[] = [...prev.exercises];

      for (const ex of selected) {
        if (existingIds.has(ex.id)) continue;

        nextExercises.push({
          id: generateId(),
          exerciseId: ex.id,
          isCustom: false,
          sets: [],
          quantityUnit: "reps",
        });

        existingIds.add(ex.id);
      }

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
  };

  const handleConfirmLibrary = (selected: Exercise[]) => {
    addExercisesFromLibrary(selected);
    setLibraryOpen(false);
  };

  const updateExercise = (
    exerciseId: string,
    updater: (prev: ExerciseProgramFormData) => ExerciseProgramFormData,
  ) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.id === exerciseId ? updater(ex) : ex,
      ),
    }));
  };

  const removeExercise = (exerciseId: string) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
    }));
  };

  const currentColorOption =
    PROGRAM_COLOR_OPTIONS.find((opt) => opt.value === color) ??
    PROGRAM_COLOR_OPTIONS[0];

  const handleDragEnd = ({ data }: DragEndParams<ExerciseProgramFormData>) => {
    setFormData((prev) => ({
      ...prev,
      exercises: data,
    }));
  };

  const renderHeader = () => (
    <View>
      <View className="mb-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 dark:border-[#44475A] dark:bg-[#282A36]">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-neutral-100/70 dark:bg-[#44475A]">
              <ListChecks width={14} height={14} color={secondaryIconColor} />
            </View>

            <Text className="text-[11px] font-semibold text-neutral-800 dark:text-[#F8F8F2]">
              Details
            </Text>
          </View>

          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="flex-row items-center rounded-full px-2 py-[3px]"
          >
            <View
              className={`mr-1 h-3 w-3 rounded-full ${currentColorOption.dotBg}`}
            />

            <Text className="text-[10px] text-neutral-600 dark:text-[#F8F8F2]">
              {currentColorOption.label}
            </Text>
          </Pressable>
        </View>

        <TextInput
          className="mt-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:border-[#44475A] dark:bg-[#44475A] dark:text-[#F8F8F2]"
          placeholder="Session name"
          placeholderTextColor={isDark ? "#6272A4" : "#9CA3AF"}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          className="mt-2 min-h-[56px] max-h-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-900 dark:border-[#44475A] dark:bg-[#44475A] dark:text-[#F8F8F2]"
          placeholder="Optional notes, focus or cues"
          placeholderTextColor={isDark ? "#6272A4" : "#9CA3AF"}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#44475A]">
            <View className="h-1.5 w-1.5 rounded-full bg-neutral-500 dark:bg-[#6272A4]" />
          </View>

          <Text className="text-[11px] text-neutral-600 dark:text-[#6272A4]">
            Exercises
          </Text>
        </View>

        <Pressable
          onPress={() => setLibraryOpen(true)}
          className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900 dark:bg-[#BD93F9]"
        >
          <Plus size={14} color={primaryIconColor} />
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="mt-4 items-center">
      <View className="h-10 w-10 items-center justify-center rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-600">
        <Plus size={16} color={secondaryIconColor} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={56}
    >
      <View className="flex-1 bg-white px-4 pt-3 dark:bg-[#2B2D3A]">
        {renderHeader()}

        <DraggableFlatList
          style={{ flex: 1 }}
          containerStyle={{ flex: 1 }}
          data={exercises}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          activationDistance={8}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 70,
          }}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item, drag, isActive }) => (
            <View className={isActive ? "opacity-80" : ""}>
              <ExerciseProgramForm
                formData={item}
                setFormData={(next) => updateExercise(item.id, () => next)}
                onRemove={() => removeExercise(item.id)}
                onDrag={drag}
              />
            </View>
          )}
        />

        {libraryOpen ? (
          <View className="absolute inset-0 z-50">
            <ExerciseLibraryPicker
              title="Add exercises"
              subtitle="Select exercises for this template"
              mode="multi-select"
              initialSelectedIds={selectedExerciseIds}
              confirmLabel="Add to template"
              allowCreate
              showUsageSummary
              showBrowseAll
              onCancel={() => setLibraryOpen(false)}
              onConfirmSelection={handleConfirmLibrary}
            />
          </View>
        ) : null}

        {colorPickerOpen && (
          <View
            className="absolute inset-0 bg-[#21222C]/70"
            style={{ zIndex: 60 }}
          >
            <View className="absolute inset-x-8 top-32 bottom-32 rounded-3xl bg-white px-4 py-3 dark:bg-[#343746]">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] text-neutral-900 dark:text-[#F8F8F2]">
                  Choose program colour
                </Text>

                <Pressable
                  onPress={() => setColorPickerOpen(false)}
                  className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#44475A]"
                >
                  <X size={14} color={secondaryIconColor} />
                </Pressable>
              </View>

              <ScrollView className="mt-2" keyboardShouldPersistTaps="handled">
                <View className="flex-row flex-wrap gap-3">
                  {PROGRAM_COLOR_OPTIONS.map((opt) => {
                    const selected = opt.value === color;

                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => {
                          setColor(opt.value);
                          setColorPickerOpen(false);
                        }}
                        className={`h-16 w-16 items-center justify-center rounded-2xl ${
                          opt.tileBg
                        } ${
                          selected
                            ? "border-2 border-neutral-900 dark:border-[#F8F8F2]"
                            : "border border-transparent"
                        }`}
                      >
                        <View
                          className={`mb-1 h-4 w-4 rounded-full ${opt.dotBg}`}
                        />

                        <Text className="text-[11px] text-neutral-900 dark:text-[#F8F8F2]">
                          {opt.label}
                        </Text>

                        {selected && (
                          <View className="mt-0.5">
                            <Check size={10} color={accentIconColor} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View className="h-4" />
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
