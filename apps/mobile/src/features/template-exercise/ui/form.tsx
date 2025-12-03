// src/features/template-exercise/ui/form.tsx
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { TemplateExerciseFormData } from "../domain/type";
import { TemplateSetFormData } from "../../template-set/domain/type";
import { Exercise } from "../../../../../../packages/exercise/type";
import { useExercises } from "../../exercise/hooks/use-exercises";
import TemplateSetForm from "@/src/features/template-set/ui/form";

type TemplateExerciseFormProps = {
  formData: TemplateExerciseFormData;
  index: number;
  setFormData: (next: TemplateExerciseFormData) => void;
  onRemove: () => void;
};

// TODO: replace this with real repository call.
async function createExercise(name: string): Promise<Exercise> {
  throw new Error("createExercise(name: string) is not implemented yet.");
}

export default function TemplateExerciseForm({
  formData,
  index,
  setFormData,
  onRemove,
}: TemplateExerciseFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { options: exerciseOptions } = useExercises();

  const update = (patch: Partial<TemplateExerciseFormData>) => {
    setFormData({ ...formData, ...patch });
  };

  // currently selected exercise, based on exerciseId in formData
  const selectedExercise = useMemo(
    () =>
      formData.exerciseId
        ? (exerciseOptions.find((opt) => opt.id === formData.exerciseId) ??
          null)
        : null,
    [exerciseOptions, formData.exerciseId]
  );

  // sets

  const addSet = () => {
    const nextSets: TemplateSetFormData[] = [
      ...formData.sets,
      {
        id: Math.random().toString(36).slice(2),
        reps: "",
        loadValue: "",
        loadUnit: "kg",
        rpe: "",
      },
    ];
    update({ sets: nextSets });
  };

  const applyPreset = (count: number, reps: number) => {
    const nextSets: TemplateSetFormData[] = Array.from({ length: count }).map(
      () => ({
        id: Math.random().toString(36).slice(2),
        reps: String(reps),
        loadValue: "",
        loadUnit: "kg",
        rpe: "",
      })
    );
    update({ sets: nextSets });
  };

  const copyLastSetDown = () => {
    if (formData.sets.length === 0) return;
    const last = formData.sets[formData.sets.length - 1];
    const nextSets: TemplateSetFormData[] = [
      ...formData.sets,
      {
        id: Math.random().toString(36).slice(2),
        reps: last.reps,
        loadValue: last.loadValue,
        loadUnit: last.loadUnit,
        rpe: last.rpe,
      },
    ];
    update({ sets: nextSets });
  };

  const removeSet = (setId: string) => {
    const nextSets = formData.sets.filter((s) => s.id !== setId);
    update({ sets: nextSets });
  };

  // picker matches

  const query = pickerSearch.trim().toLowerCase();
  const matches =
    pickerOpen && exerciseOptions.length > 0
      ? exerciseOptions
          .filter((opt) =>
            query ? opt.name.toLowerCase().includes(query) : true
          )
          .slice(0, 10)
      : [];

  const selectExerciseOption = (option: Exercise) => {
    update({
      exerciseId: option.id,
    });
    setPickerOpen(false);
    setPickerSearch("");
    setCreatingNew(false);
    setNewExerciseName("");
  };

  const startCreateNew = () => {
    setCreatingNew(true);
    setNewExerciseName(pickerSearch.trim());
  };

  const cancelCreateNew = () => {
    setCreatingNew(false);
    setNewExerciseName("");
  };

  const handleCreateNew = async () => {
    const name = newExerciseName.trim();
    if (!name) return;

    try {
      setIsCreating(true);
      const created = await createExercise(name);
      update({ exerciseId: created.id });
      setPickerOpen(false);
      setPickerSearch("");
      setNewExerciseName("");
      setCreatingNew(false);
    } finally {
      setIsCreating(false);
    }
  };

  const selectorLabel =
    selectedExercise?.name ?? "Select an exercise from the list";

  return (
    <View className="mb-4 rounded-2xl border border-neutral-200 bg-white px-3 py-3">
      {/* Exercise header */}
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="w-5 text-[11px] text-neutral-500">#{index + 1}</Text>
          <Text className="text-[11px] text-neutral-400">Exercise</Text>
        </View>
        <Pressable onPress={onRemove}>
          <Text className="text-[11px] text-red-500">Remove</Text>
        </Pressable>
      </View>

      {/* Exercise selector */}
      <View>
        {/* Selector button */}
        <Pressable
          className="flex-row items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-1.5"
          onPress={() => setPickerOpen((prev) => !prev)}
        >
          <Text className="flex-1 text-xs text-neutral-900" numberOfLines={1}>
            {selectorLabel}
          </Text>
          <Text className="ml-2 text-xs text-neutral-400">
            {pickerOpen ? "▲" : "▼"}
          </Text>
        </Pressable>

        {/* Picker dropdown */}
        {pickerOpen && (
          <View className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50">
            {/* Search bar */}
            <View className="border-b border-neutral-200 px-3 py-1.5">
              <TextInput
                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900"
                placeholder="Search exercises"
                placeholderTextColor="#9CA3AF"
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
            </View>

            {matches.length === 0 ? (
              <View className="px-3 py-2">
                <Text className="text-[11px] text-neutral-500">
                  No matches found.
                </Text>
              </View>
            ) : (
              matches.map((opt, i) => {
                const isSelected = opt.id === formData.exerciseId;
                return (
                  <Pressable
                    key={opt.id}
                    className={`flex-row items-center justify-between px-3 py-1.5 ${
                      i < matches.length - 1
                        ? "border-b border-neutral-200"
                        : ""
                    } ${isSelected ? "bg-neutral-200" : ""}`}
                    onPress={() => selectExerciseOption(opt)}
                  >
                    <Text className="text-xs text-neutral-900">{opt.name}</Text>
                    {isSelected && (
                      <Text className="text-[10px] text-neutral-600">
                        Selected
                      </Text>
                    )}
                  </Pressable>
                );
              })
            )}

            {/* Create new exercise section */}
            <View className="border-t border-neutral-200 px-3 py-2">
              {!creatingNew ? (
                <Pressable onPress={startCreateNew}>
                  <Text className="text-[11px] font-semibold text-neutral-800">
                    + Create new exercise
                  </Text>
                  <Text className="text-[10px] text-neutral-500">
                    Add a new exercise to your library
                  </Text>
                </Pressable>
              ) : (
                <>
                  <Text className="mb-1 text-[11px] text-neutral-600">
                    New exercise name
                  </Text>
                  <TextInput
                    className="mb-2 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900"
                    placeholder="e.g. Dumbbell incline press"
                    placeholderTextColor="#9CA3AF"
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                  />
                  <View className="flex-row justify-end gap-3">
                    <Pressable onPress={cancelCreateNew} disabled={isCreating}>
                      <Text className="text-[11px] text-neutral-500">
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCreateNew}
                      disabled={isCreating || !newExerciseName.trim()}
                    >
                      <Text className="text-[11px] font-semibold text-neutral-900">
                        {isCreating ? "Creating..." : "Create"}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Presets row */}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Text className="text-[11px] text-neutral-500">Quick presets:</Text>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(1, 8)}
        >
          <Text className="text-[11px] text-neutral-800">1 × 8</Text>
        </Pressable>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(2, 10)}
        >
          <Text className="text-[11px] text-neutral-800">2 × 10</Text>
        </Pressable>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(3, 12)}
        >
          <Text className="text-[11px] text-neutral-800">3 × 12</Text>
        </Pressable>
        {formData.sets.length > 0 && (
          <Pressable
            className="rounded-full border border-dashed border-neutral-400 px-2 py-0.5"
            onPress={copyLastSetDown}
          >
            <Text className="text-[11px] text-neutral-700">
              Copy last set ↓
            </Text>
          </Pressable>
        )}
      </View>

      {/* Table header */}
      <View className="mt-3 flex-row border-b border-neutral-200 pb-1">
        <Text className="w-8 text-[11px] text-neutral-500">#</Text>
        <Text className="flex-1 text-[11px] text-neutral-500">Reps</Text>
        <Text className="flex-1 text-[11px] text-neutral-500">Load</Text>
        <Text className="flex-1 text-[11px] text-neutral-500">RPE</Text>
        <Text className="w-8 text-right text-[11px] text-neutral-500">—</Text>
      </View>

      {/* Sets rows */}
      {formData.sets.length === 0 ? (
        <View className="mt-2">
          <Text className="text-[11px] text-neutral-400">
            No sets yet. Use presets above or Add set below.
          </Text>
        </View>
      ) : (
        formData.sets.map((s, setIndex) => (
          <TemplateSetForm
            key={s.id}
            formData={s}
            index={setIndex}
            setFormData={(next) => {
              const nextSets = formData.sets.map((curr) =>
                curr.id === s.id ? next : curr
              );
              update({ sets: nextSets });
            }}
            onRemove={() => removeSet(s.id)}
          />
        ))
      )}

      {/* Add set button */}
      <Pressable
        className="mt-2 self-start rounded-full border border-dashed border-neutral-400 px-3 py-1"
        onPress={addSet}
      >
        <Text className="text-[11px] text-neutral-700">+ Add set</Text>
      </Pressable>
    </View>
  );
}
