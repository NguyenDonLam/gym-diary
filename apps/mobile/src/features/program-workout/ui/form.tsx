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
import {
  ListChecks,
  Plus,
  X,
  Check,
  Search,
  BookOpen,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { WorkoutProgramFormData, ProgramColor } from "../domain/type";
import { SetProgramFormData } from "../../program-set/domain/type";
import { generateId } from "@/src/lib/id";
import { useExercises } from "../../exercise/hooks/use-exercises";
import { Exercise } from "@packages/exercise";
import { ExerciseProgramFormData } from "../../program-exercise/domain/type";
import ExerciseProgramForm from "../../program-exercise/ui/form";
import { exerciseFactory } from "../../exercise/domain/factory";
import { exerciseRepository } from "../../exercise/data/exercise-repository";

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

  // greys, no pure black / pure white
  const primaryIconColor = isDark ? "#111827" : "#F9FAFB";
  const secondaryIconColor = isDark ? "#D1D5DB" : "#4B5563";
  const accentIconColor = isDark ? "#F9FAFB" : "#111827";

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

      const nextExercises: ExerciseProgramFormData[] = [...prev.exercises];

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
    updater: (prev: ExerciseProgramFormData) => ExerciseProgramFormData
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
      <View className="mb-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 dark:border-neutral-700 dark:bg-neutral-800">
        <View className="mb-2 flex-row items-center justify-between">
          {/* Left: icon + short label */}
          <View className="flex-row items-center">
            <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-neutral-100/70 dark:bg-neutral-800">
              <ListChecks width={14} height={14} color={secondaryIconColor} />
            </View>
            <Text className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-100">
              Details
            </Text>
          </View>

          {/* Right: very small color chip selector */}
          <Pressable
            onPress={() => setColorPickerOpen(true)}
            className="flex-row items-center rounded-full px-2 py-[3px]"
          >
            <View
              className={`mr-1 h-3 w-3 rounded-full ${currentColorOption.dotBg}`}
            />
            <Text className="text-[10px] text-neutral-600 dark:text-neutral-200">
              {currentColorOption.label}
            </Text>
          </Pressable>
        </View>

        <TextInput
          className="mt-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
          placeholder="Session name"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          className="mt-2 min-h-[56px] max-h-24 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-900 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-50"
          placeholder="Optional notes, focus or cues"
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <View className="h-1.5 w-1.5 rounded-full bg-neutral-500 dark:bg-neutral-400" />
          </View>
          <Text className="text-[11px] text-neutral-600 dark:text-neutral-300">
            Exercises
          </Text>
        </View>
        <Pressable
          onPress={() => setLibraryOpen(true)}
          className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-200"
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
    keyboardVerticalOffset={56} // header height
  >
    <View className="flex-1 px-4 pt-3 bg-white dark:bg-neutral-900">
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
          paddingBottom: 160, // fixes bottom cut-off
        }}
        ListEmptyComponent={renderEmpty}
        renderItem={({ item, drag, isActive }) => {
          const exerciseIndex = exercises.findIndex((ex) => ex.id === item.id);

          return (
            <View className={isActive ? "opacity-80" : ""}>
              <ExerciseProgramForm
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

      {libraryOpen && (
        <View
          className="absolute inset-0 bg-neutral-900/60"
          style={{ zIndex: 50 }}
        >
          <View className="absolute inset-x-4 top-16 bottom-16 rounded-3xl bg-white px-3 py-3 dark:bg-neutral-800">
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <BookOpen size={16} color={secondaryIconColor} />
                <Text className="ml-1 text-[13px] text-neutral-900 dark:text-neutral-50">
                  Exercise library
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={handleCloseLibrary}
                  className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700"
                >
                  <X size={14} color={secondaryIconColor} />
                </Pressable>

                <Pressable
                  onPress={handleConfirmLibrary}
                  className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-200"
                >
                  <Check size={14} color={primaryIconColor} />
                </Pressable>
              </View>
            </View>

            <View className="mb-2 flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-full bg-neutral-100 px-2 dark:bg-neutral-800">
                <Search size={14} color="#9CA3AF" style={{ marginRight: 4 }} />
                <TextInput
                  className="flex-1 py-1 text-[12px] text-neutral-900 dark:text-neutral-50"
                  placeholder=""
                  placeholderTextColor="#9CA3AF"
                  value={librarySearch}
                  onChangeText={setLibrarySearch}
                />
              </View>

              <Pressable
                onPress={handleOpenCreateExercise}
                className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-200"
              >
                <Plus size={13} color={primaryIconColor} />
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
                    className={`mb-1 flex-row items-center rounded-2xl px-2 py-1.5 ${
                      isSelected
                        ? "bg-neutral-900"
                        : "bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <View className="mr-2 h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
                      {isSelected && (
                        <Check size={12} color={accentIconColor} />
                      )}
                    </View>
                    <View
                      className={`mr-2 h-7 w-7 items-center justify-center rounded-xl ${
                        isSelected
                          ? "bg-neutral-800"
                          : "bg-neutral-200 dark:bg-neutral-700"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          isSelected
                            ? "text-white"
                            : "text-neutral-800 dark:text-neutral-50"
                        }`}
                      >
                        {initial}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-[12px] ${
                          isSelected
                            ? "text-white"
                            : "text-neutral-900 dark:text-neutral-50"
                        }`}
                        numberOfLines={1}
                      >
                        {name}
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
                <Text className="text-[12px] font-medium text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {colorPickerOpen && (
        <View
          className="absolute inset-0 bg-neutral-900/60"
          style={{ zIndex: 60 }}
        >
          <View className="absolute inset-x-8 top-32 bottom-32 rounded-3xl bg-white px-4 py-3 dark:bg-neutral-800">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-[13px] text-neutral-900 dark:text-neutral-50">
                Choose program colour
              </Text>
              <Pressable
                onPress={() => setColorPickerOpen(false)}
                className="h-7 w-7 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700"
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
                          ? "border-2 border-neutral-900 dark:border-neutral-100"
                          : "border border-transparent"
                      }`}
                    >
                      <View
                        className={`mb-1 h-4 w-4 rounded-full ${opt.dotBg}`}
                      />
                      <Text className="text-[11px] text-neutral-900 dark:text-neutral-50">
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
