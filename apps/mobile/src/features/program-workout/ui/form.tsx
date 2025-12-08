// src/features/template-workout/ui/form.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import DraggableFlatList, {
  DragEndParams,
} from "react-native-draggable-flatlist";
import { ListChecks } from "lucide-react-native";

import TemplateExerciseForm from "@/src/features/template-exercise/ui/form";
import { WorkoutProgramFormData, ProgramColor } from "../domain/type";
import { TemplateExerciseFormData } from "../../template-exercise/domain/type";
import { TemplateSetFormData } from "../../template-set/domain/type";
import { generateId } from "@/src/lib/id";
import { useExercises } from "../../exercise/hooks/use-exercises";
import { Exercise } from "@packages/exercise";
import { exerciseRepository } from "../../exercise/data/exercise-repository";
import { exerciseFactory } from "../../exercise/domain/factory";

type TemplateWorkoutFormProps = {
  formData: WorkoutProgramFormData;
  setFormData: React.Dispatch<React.SetStateAction<WorkoutProgramFormData>>;
};

const TEMPLATE_COLOR_OPTIONS: {
  value: ProgramColor;
  label: string;
  tileBg: string;
  dotBg: string;
}[] = [
  {
    value: "neutral",
    label: "Neutral",
    tileBg: "bg-neutral-100",
    dotBg: "bg-neutral-500",
  },
  { value: "red", label: "Red", tileBg: "bg-red-100", dotBg: "bg-red-500" },
  {
    value: "orange",
    label: "Orange",
    tileBg: "bg-orange-100",
    dotBg: "bg-orange-500",
  },
  {
    value: "yellow",
    label: "Yellow",
    tileBg: "bg-yellow-100",
    dotBg: "bg-yellow-400",
  },
  {
    value: "green",
    label: "Green",
    tileBg: "bg-green-100",
    dotBg: "bg-green-500",
  },
  { value: "teal", label: "Teal", tileBg: "bg-teal-100", dotBg: "bg-teal-500" },
  { value: "blue", label: "Blue", tileBg: "bg-blue-100", dotBg: "bg-blue-500" },
  {
    value: "purple",
    label: "Purple",
    tileBg: "bg-purple-100",
    dotBg: "bg-purple-500",
  },
  { value: "pink", label: "Pink", tileBg: "bg-pink-100", dotBg: "bg-pink-500" },
];

function makeDefaultSets(): TemplateSetFormData[] {
  return Array.from({ length: 3 }).map(() => ({
    id: generateId(),
    reps: "8",
    loadValue: "",
    loadUnit: "kg",
    rpe: "",
  }));
}

export default function WorkoutProgramForm({
  formData,
  setFormData,
}: TemplateWorkoutFormProps) {
  const { name, description, exercises, color } = formData;

  const { options: exerciseOptions, refetch } = useExercises();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");

  // Dedicated create-exercise mini-form
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");

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
          .filter((id): id is string => !!id)
      );

      const nextExercises: TemplateExerciseFormData[] = [...prev.exercises];

      for (const ex of selected) {
        if (existingIds.has(ex.id)) continue;

        nextExercises.push({
          id: generateId(),
          exerciseId: ex.id,
          isCustom: false,
          sets: [],
        });

        existingIds.add(ex.id);
      }

      return {
        ...prev,
        exercises: nextExercises,
      };
    });
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

  const filteredExerciseOptions = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    if (!q) return exerciseOptions;
    return exerciseOptions.filter((opt) =>
      String((opt as any).name ?? "")
        .toLowerCase()
        .includes(q)
    );
  }, [exerciseOptions, librarySearch]);

  const handleOpenCreateExercise = () => {
    setNewExerciseName(librarySearch.trim());
    setCreateExerciseOpen(true);
  };

  const handleSubmitCreateExercise = async () => {
    const baseName = newExerciseName.trim();
    if (!baseName) {
      return;
    }

    try {
      const exercise = exerciseFactory.create({ name: baseName });
      const saved = await exerciseRepository.save(exercise);

      // refresh exercise options so the library list is up to date
      await refetch();

      // attach new exercise to this template
      addExercisesFromLibrary([saved]);

      // mark as selected in the overlay
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(saved.id);
        return next;
      });

      setCreateExerciseOpen(false);
      setNewExerciseName("");
      setLibrarySearch("");
    } catch (error) {
      console.error("Failed to create exercise", error);
    }
  };


  const handleCancelCreateExercise = () => {
    setCreateExerciseOpen(false);
    setNewExerciseName("");
  };

  const currentColorOption =
    TEMPLATE_COLOR_OPTIONS.find((opt) => opt.value === color) ??
    TEMPLATE_COLOR_OPTIONS[0];

  const handleDragEnd = ({ data }: DragEndParams<TemplateExerciseFormData>) => {
    setFormData((prev) => ({
      ...prev,
      exercises: data,
    }));
  };

  const renderHeader = () => (
    <View>
      {/* Template meta block – tighter, with icon header and inline colour */}
      <View className="mb-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3">
        {/* Row: icon + label + colour pill */}
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-neutral-100">
              <ListChecks width={14} height={14} color="#4B5563" />
            </View>
            <Text className="text-[12px] font-semibold text-neutral-800">
              Template details
            </Text>
          </View>

          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="flex-row items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-1"
          >
            <View
              className={`mr-1 h-3 w-3 rounded-full ${currentColorOption.dotBg}`}
            />
            <Text className="text-[11px] text-neutral-800">
              {currentColorOption.label}
            </Text>
          </Pressable>
        </View>

        {/* Name input */}
        <TextInput
          className="mt-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900"
          placeholder="Session name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        {/* Notes – compact textarea */}
        <TextInput
          className="mt-2 min-h-[56px] max-h-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-900"
          placeholder="Optional notes, focus or cues"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Exercises header row – add opens multi-select library */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-neutral-100">
            <Text className="text-[11px] text-neutral-500">●</Text>
          </View>
          <Text className="text-[11px] text-neutral-600">Exercises</Text>
        </View>
        <Pressable
          onPress={() => setLibraryOpen(true)}
          className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900"
        >
          <Text className="text-[14px] text-white">＋</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View className="mt-4 items-center">
      <View className="h-10 w-10 items-center justify-center rounded-2xl border border-dashed border-neutral-300">
        <Text className="text-[16px] text-neutral-400">＋</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <DraggableFlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          onDragEnd={handleDragEnd}
          activationDistance={8}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 24,
          }}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          renderItem={({ item, drag, isActive }) => {
            const exerciseIndex = exercises.findIndex(
              (ex) => ex.id === item.id
            );

            return (
              <View className={isActive ? "opacity-80" : ""}>
                <TemplateExerciseForm
                  formData={item}
                  index={exerciseIndex >= 0 ? exerciseIndex : 0}
                  setFormData={(next) => updateExercise(item.id, () => next)}
                  onRemove={() => removeExercise(item.id)}
                  onDrag={drag}
                />
              </View>
            );
          }}
        />

        {/* LIBRARY OVERLAY – multi-select */}
        {libraryOpen && (
          <View className="absolute inset-0 bg-black/25" style={{ zIndex: 50 }}>
            <View className="absolute inset-x-4 top-24 bottom-24 rounded-3xl bg-white px-4 py-4">
              {/* Header */}
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[14px] font-semibold text-neutral-900">
                  Exercise library
                </Text>

                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={handleCloseLibrary}
                    className="h-7 px-3 items-center justify-center rounded-full"
                  >
                    <Text className="text-[12px] text-neutral-500">Close</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleConfirmLibrary}
                    className="h-7 px-3 items-center justify-center rounded-full bg-neutral-900"
                  >
                    <Text className="text-[12px] font-medium text-white">
                      Done
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Search + new */}
              <View className="mb-3 flex-row items-center gap-2">
                <View className="flex-1 rounded-2xl bg-neutral-100 px-3 py-1.5">
                  <TextInput
                    className="text-[12px] text-neutral-900"
                    placeholder="Search exercises"
                    placeholderTextColor="#9CA3AF"
                    value={librarySearch}
                    onChangeText={setLibrarySearch}
                  />
                </View>

                <Pressable
                  onPress={handleOpenCreateExercise}
                  className="h-8 px-3 items-center justify-center rounded-2xl bg-neutral-900"
                >
                  <Text className="text-[11px] font-medium text-white">
                    New
                  </Text>
                </Pressable>
              </View>

              {/* List */}
              <ScrollView keyboardShouldPersistTaps="handled" className="mt-1">
                {filteredExerciseOptions.map((opt) => {
                  const isSelected = selectedIds.has(opt.id);
                  const name = (opt as any).name ?? "";
                  const trimmed = String(name).trim();
                  const initial = trimmed ? trimmed[0]!.toUpperCase() : "?";

                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => toggleSelect(opt.id)}
                      className={`mb-1 flex-row items-center rounded-xl px-3 py-2 ${
                        isSelected ? "bg-neutral-900" : "bg-neutral-50"
                      }`}
                    >
                      {/* Exercise icon / initial */}
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

                      {/* Name */}
                      <Text
                        className={`flex-1 text-[13px] ${
                          isSelected ? "text-white" : "text-neutral-900"
                        }`}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>

                      {/* Selection indicator */}
                      <View
                        className={`ml-2 h-4 w-4 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-white bg-white"
                            : "border-neutral-300 bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <View className="h-3 w-3 rounded-full bg-neutral-900" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}

                <View className="h-4" />
              </ScrollView>
            </View>
          </View>
        )}

        {/* Create exercise mini-modal */}
        {createExerciseOpen && (
          <View className="absolute inset-0 bg-black/40" style={{ zIndex: 60 }}>
            <View className="absolute inset-x-8 top-32 rounded-2xl bg-white px-4 py-3">
              <Text className="mb-2 text-[13px] font-semibold text-neutral-900">
                New exercise
              </Text>

              <TextInput
                className="mb-3 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-900"
                placeholder="Exercise name"
                placeholderTextColor="#9CA3AF"
                value={newExerciseName}
                onChangeText={setNewExerciseName}
              />

              <View className="flex-row items-center justify-end gap-2">
                <Pressable
                  onPress={handleCancelCreateExercise}
                  className="h-7 px-3 items-center justify-center rounded-full bg-neutral-100"
                >
                  <Text className="text-[12px] text-neutral-600">Cancel</Text>
                </Pressable>

                <Pressable
                  onPress={handleSubmitCreateExercise}
                  className="h-7 px-3 items-center justify-center rounded-full bg-neutral-900"
                >
                  <Text className="text-[12px] font-medium text-white">
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {colorPickerOpen && (
          <View className="absolute inset-0 bg-black/40" style={{ zIndex: 60 }}>
            <View className="absolute inset-x-8 top-32 bottom-32 rounded-3xl bg-white px-4 py-3">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-[13px] text-neutral-900">
                  Choose template colour
                </Text>
                <Pressable
                  onPress={() => setColorPickerOpen(false)}
                  className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100"
                >
                  <Text className="text-[12px] text-neutral-600">✕</Text>
                </Pressable>
              </View>

              <ScrollView className="mt-2" keyboardShouldPersistTaps="handled">
                <View className="flex-row flex-wrap gap-3">
                  {TEMPLATE_COLOR_OPTIONS.map((opt) => {
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
                            ? "border-2 border-neutral-900"
                            : "border border-transparent"
                        }`}
                      >
                        <View
                          className={`mb-1 h-4 w-4 rounded-full ${opt.dotBg}`}
                        />
                        <Text className="text-[11px] text-neutral-900">
                          {opt.label}
                        </Text>
                        {selected && (
                          <Text className="mt-0.5 text-[10px] text-neutral-900">
                            ✓
                          </Text>
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
    </SafeAreaView>
  );
}
