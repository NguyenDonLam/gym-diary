import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DraggableFlatList, {
  DragEndParams,
} from "react-native-draggable-flatlist";
import { Dumbbell, ListChecks, Palette, Plus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import ValueWheelSheet from "@/src/components/value-wheel-sheet";
import { WorkoutProgramFormData } from "../domain/type";
import { generateId } from "@/src/lib/id";
import type { Exercise } from "@gym-diary/exercise/type";
import { ExerciseProgramFormData } from "../../program-exercise/domain/type";
import ExerciseProgramForm from "../../program-exercise/ui/form";
import { ProgramColor } from "@/db/enums";
import ExerciseLibraryPicker from "../../exercise/components/exercise-library-picker";
import { useKeyboardHeight } from "@/src/hooks/use-keyboard-height";

type WorkoutProgramFormProps = {
  formData: WorkoutProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkoutProgramFormData>>;
};

const PROGRAM_COLOR_OPTIONS: {
  value: ProgramColor;
  label: string;
  dotBg: string;
}[] = [
  {
    value: "neutral",
    label: "Neutral",
    dotBg: "bg-neutral-500",
  },
  {
    value: "red",
    label: "Red",
    dotBg: "bg-red-500",
  },
  {
    value: "orange",
    label: "Orange",
    dotBg: "bg-orange-500",
  },
  {
    value: "yellow",
    label: "Yellow",
    dotBg: "bg-yellow-400",
  },
  {
    value: "green",
    label: "Green",
    dotBg: "bg-green-500",
  },
  {
    value: "teal",
    label: "Teal",
    dotBg: "bg-teal-500",
  },
  {
    value: "blue",
    label: "Blue",
    dotBg: "bg-blue-500",
  },
  {
    value: "purple",
    label: "Purple",
    dotBg: "bg-purple-500",
  },
  {
    value: "pink",
    label: "Pink",
    dotBg: "bg-pink-500",
  },
];

export default function WorkoutProgramForm({
  formData,
  setFormData,
}: WorkoutProgramFormProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const primaryIconColor = isDark ? "#282A36" : "#FFFFFF";
  const secondaryIconColor = isDark ? "#F8F8F2" : "#111827";
  const mutedIconColor = isDark ? "#6272A4" : "#6B7280";

  const { name, description, exercises, color } = formData;

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const listBottomPadding = keyboardHeight > 0 ? keyboardHeight + 180 : 120;

  const selectedExerciseIds = useMemo(
    () =>
      exercises.map((ex) => ex.exerciseId).filter((id): id is string => !!id),
    [exercises],
  );

  const exerciseCount = exercises.length;
  const setCount = useMemo(
    () => exercises.reduce((total, exercise) => total + exercise.sets.length, 0),
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
          quantityUnit: ex.quantityUnit ?? "reps",
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
      <View className="mb-4 rounded-[28px] bg-neutral-950 px-4 pb-4 pt-4 dark:bg-[#21222C]">
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-2 h-9 w-9 items-center justify-center rounded-2xl bg-white/10">
              <ListChecks width={18} height={18} color="#FFFFFF" />
            </View>

            <View>
              <Text className="text-[11px] font-semibold uppercase text-white/50">
                Program
              </Text>
              <Text className="text-[12px] text-white/75">
                Build the workout template
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="h-9 flex-row items-center rounded-full bg-white/10 px-3"
            hitSlop={8}
          >
            <View
              className={`mr-2 h-3.5 w-3.5 rounded-full ${currentColorOption.dotBg}`}
            />
            <Text className="mr-1.5 text-[11px] font-semibold text-white">
              Colour
            </Text>
            <Palette size={14} color="#FFFFFF" />
          </Pressable>
        </View>

        <TextInput
          className="rounded-2xl bg-white px-4 py-3 text-[22px] font-semibold text-neutral-950 dark:bg-[#343746] dark:text-[#F8F8F2]"
          placeholder="Program name"
          placeholderTextColor={isDark ? "#6272A4" : "#A3A3A3"}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />

        <TextInput
          className="mt-3 min-h-[78px] rounded-2xl bg-white/95 px-4 py-3 text-[13px] text-neutral-900 dark:bg-[#343746] dark:text-[#F8F8F2]"
          placeholder="Notes, focus, warmups..."
          placeholderTextColor={isDark ? "#6272A4" : "#A3A3A3"}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2">
            <Text className="text-[20px] font-semibold text-white">
              {exerciseCount}
            </Text>
            <Text className="text-[11px] text-white/55">
              {exerciseCount === 1 ? "Exercise" : "Exercises"}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2">
            <Text className="text-[20px] font-semibold text-white">
              {setCount}
            </Text>
            <Text className="text-[11px] text-white/55">
              {setCount === 1 ? "Planned set" : "Planned sets"}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-white/10 px-3 py-2">
            <Text className="text-[20px] font-semibold text-white">
              {currentColorOption.label}
            </Text>
            <Text className="text-[11px] text-white/55">Colour</Text>
          </View>
        </View>
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-9 w-9 items-center justify-center rounded-2xl bg-white dark:bg-[#343746]">
            <Dumbbell size={17} color={mutedIconColor} />
          </View>

          <View>
            <Text className="text-[15px] font-semibold text-neutral-950 dark:text-[#F8F8F2]">
              Exercises
            </Text>
            <Text className="text-[11px] text-neutral-500 dark:text-[#6272A4]">
              Drag to reorder once added
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setLibraryOpen(true)}
          className="h-10 flex-row items-center justify-center rounded-full bg-neutral-900 px-4 dark:bg-[#BD93F9]"
          hitSlop={8}
        >
          <Plus size={16} color={primaryIconColor} />
          <Text className="ml-1.5 text-[13px] font-semibold text-white dark:text-[#282A36]">
            Add
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="mt-8 items-center rounded-[28px] border border-dashed border-neutral-300 bg-white px-5 py-8 dark:border-[#44475A] dark:bg-[#282A36]">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-[#343746]">
        <Plus size={20} color={secondaryIconColor} />
      </View>
      <Text className="mt-3 text-[14px] font-semibold text-neutral-900 dark:text-[#F8F8F2]">
        No exercises yet
      </Text>
      <Pressable
        onPress={() => setLibraryOpen(true)}
        className="mt-4 h-10 flex-row items-center rounded-full bg-neutral-900 px-4 dark:bg-[#BD93F9]"
      >
        <Plus size={15} color={primaryIconColor} />
        <Text className="ml-1.5 text-[13px] font-semibold text-white dark:text-[#282A36]">
          Add exercise
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={56}
    >
      <View className="flex-1 bg-neutral-50 px-4 pt-4 dark:bg-[#2B2D3A]">
        <DraggableFlatList
          style={{ flex: 1 }}
          containerStyle={{ flex: 1 }}
          data={exercises}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          activationDistance={8}
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: listBottomPadding,
          }}
          ListHeaderComponent={renderHeader()}
          ListEmptyComponent={renderEmpty()}
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
              subtitle="Select exercises for this program"
              mode="multi-select"
              initialSelectedIds={selectedExerciseIds}
              confirmLabel="Add to program"
              allowCreate
              showUsageSummary
              showBrowseAll
              onCancel={() => setLibraryOpen(false)}
              onConfirmSelection={handleConfirmLibrary}
            />
          </View>
        ) : null}

        {colorPickerOpen ? (
          <ValueWheelSheet
            title="Program colour"
            subtitle="Pick the tag used in your workout list"
            columns={[
              {
                id: "color",
                label: "Colour",
                selectedValue: color,
                options: PROGRAM_COLOR_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                  swatchClassName: option.dotBg,
                })),
              },
            ]}
            onCancel={() => setColorPickerOpen(false)}
            onConfirm={(values) => {
              const next = values.color as ProgramColor | undefined;
              if (next) {
                setColor(next);
              }
              setColorPickerOpen(false);
            }}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
