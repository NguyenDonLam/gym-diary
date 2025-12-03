// src/features/template-exercise/ui/form.tsx
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View, ScrollView } from "react-native";
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

// TODO: wire this to your real repository.
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
          .slice(0, 100)
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
    selectedExercise?.name ?? "Select an exercise from your library";

  const getInitial = (opt: Exercise) => {
    const trimmed = (opt.name ?? "").trim();
    if (!trimmed) return "?";
    return trimmed[0]!.toUpperCase();
  };

  return (
    // make the card a stacking context so its children z-index correctly
    <View
      className="mb-4 rounded-2xl border border-neutral-200 bg-white px-3 py-3"
      style={{ overflow: "visible", zIndex: pickerOpen ? 10 : 0 }}
    >
      {/* Exercise header */}
      <View className="mb-2 flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="rounded-full bg-neutral-900 px-2 py-[1px] text-[10px] font-semibold text-white">
              #{index + 1}
            </Text>
            <Text className="text-[11px] font-semibold text-neutral-700">
              Exercise
            </Text>
          </View>
          {selectedExercise && (
            <Text
              className="mt-1 max-w-[220px] text-[11px] text-neutral-500"
              numberOfLines={1}
            >
              {selectedExercise.name}
            </Text>
          )}
        </View>

        <Pressable
          onPress={onRemove}
          className="rounded-full bg-red-50 px-2 py-1"
        >
          <Text className="text-[10px] font-semibold text-red-500">Remove</Text>
        </Pressable>
      </View>

      {/* Exercise selector */}
      <View className="relative z-10">
        {/* Selector button */}
        <Pressable
          className="flex-row items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 py-2"
          onPress={() => setPickerOpen((prev) => !prev)}
        >
          <Text
            className={`flex-1 text-[12px] ${
              selectedExercise ? "text-neutral-900" : "text-neutral-400 italic"
            }`}
            numberOfLines={1}
          >
            {selectorLabel}
          </Text>
          <Text className="ml-2 text-xs text-neutral-400">
            {pickerOpen ? "▲" : "▼"}
          </Text>
        </Pressable>

        {/* Picker dropdown – floating, scrollable list, above other cards */}
        {pickerOpen && (
          <View className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-neutral-200 bg-neutral-50">
            {/* Search bar */}
            <View className="border-b border-neutral-200 px-3 py-1.5">
              <Text className="mb-1 text-[10px] font-medium text-neutral-500">
                Search library
              </Text>
              <TextInput
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-900"
                placeholder="Type to filter exercises"
                placeholderTextColor="#9CA3AF"
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
            </View>

            {/* Scrollable list */}
            <View className="max-h-72">
              {matches.length === 0 ? (
                <View className="px-3 py-3">
                  <Text className="text-[11px] text-neutral-500">
                    No matches in your library.
                  </Text>
                  <Text className="mt-1 text-[10px] text-neutral-400">
                    You can create a new exercise below.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="px-3 pt-2 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                    Results
                  </Text>
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    className="mt-1"
                  >
                    {matches.map((opt) => {
                      const isSelected = opt.id === formData.exerciseId;
                      const initial = getInitial(opt);

                      return (
                        <Pressable
                          key={opt.id}
                          className={`mx-2 mb-1 flex-row items-center rounded-xl px-2 py-1.5 ${
                            isSelected ? "bg-neutral-900" : "bg-transparent"
                          }`}
                          onPress={() => selectExerciseOption(opt)}
                        >
                          {/* Icon / thumbnail placeholder */}
                          <View
                            className={`mr-2 h-7 w-7 items-center justify-center rounded-xl ${
                              isSelected ? "bg-neutral-800" : "bg-neutral-100"
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-semibold ${
                                isSelected ? "text-white" : "text-neutral-700"
                              }`}
                            >
                              {initial}
                            </Text>
                          </View>

                          {/* Name */}
                          <View className="flex-1">
                            <Text
                              className={`text-[12px] ${
                                isSelected
                                  ? "font-semibold text-white"
                                  : "text-neutral-900"
                              }`}
                              numberOfLines={1}
                            >
                              {opt.name}
                            </Text>
                          </View>

                          {isSelected && (
                            <Text className="ml-2 text-[10px] font-medium text-neutral-200">
                              Selected
                            </Text>
                          )}
                        </Pressable>
                      );
                    })}
                    <View className="h-2" />
                  </ScrollView>
                </>
              )}
            </View>

            {/* Create new exercise section */}
            <View className="border-t border-neutral-200 px-3 py-2">
              {!creatingNew ? (
                <Pressable
                  onPress={startCreateNew}
                  className="flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-[11px] font-semibold text-neutral-900">
                      + Create new exercise
                    </Text>
                    <Text className="text-[10px] text-neutral-500">
                      Add it once, reuse in any template
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <>
                  <Text className="mb-1 text-[11px] text-neutral-600">
                    New exercise name
                  </Text>
                  <TextInput
                    className="mb-2 rounded-lg border border-neutral-300 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-900"
                    placeholder="e.g. Dumbbell incline press"
                    placeholderTextColor="#9CA3AF"
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                  />
                  <View className="flex-row justify-end gap-4">
                    <Pressable onPress={cancelCreateNew} disabled={isCreating}>
                      <Text className="text-[11px] text-neutral-500">
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCreateNew}
                      disabled={isCreating || !newExerciseName.trim()}
                      className="rounded-full bg-neutral-900 px-3 py-1"
                    >
                      <Text className="text-[11px] font-semibold text-white">
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
      <View className="mt-4 flex-row flex-wrap items-center gap-2">
        <Text className="text-[11px] text-neutral-500">Quick presets:</Text>
        <Pressable
          className="rounded-full bg-white px-2 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          onPress={() => applyPreset(1, 8)}
        >
          <Text className="text-[11px] font-medium text-neutral-900">
            1 × 8
          </Text>
        </Pressable>
        <Pressable
          className="rounded-full bg-white px-2 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          onPress={() => applyPreset(2, 10)}
        >
          <Text className="text-[11px] font-medium text-neutral-900">
            2 × 10
          </Text>
        </Pressable>
        <Pressable
          className="rounded-full bg-white px-2 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          onPress={() => applyPreset(3, 12)}
        >
          <Text className="text-[11px] font-medium text-neutral-900">
            3 × 12
          </Text>
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
        className="mt-2 self-start rounded-full border border-dashed border-neutral-400 bg-white px-3 py-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        onPress={addSet}
      >
        <Text className="text-[11px] font-medium text-neutral-800">
          + Add set
        </Text>
      </Pressable>
    </View>
  );
}
