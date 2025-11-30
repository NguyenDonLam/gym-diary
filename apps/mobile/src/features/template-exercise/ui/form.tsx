// src/features/template-exercise/ui/form.tsx
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { TemplateExerciseFormData } from "../domain/type";
import { TemplateSetFormData } from "../../template-set/domain/type";
import { Exercise } from "../../exercise/domain/types";
import { useExercises } from "../../exercise/hooks/use-exercises";
import TemplateSetForm from "@/src/features/template-set/ui/form";

type TemplateExerciseFormProps = {
  formData: TemplateExerciseFormData;
  index: number;
  setFormData: (next: TemplateExerciseFormData) => void;
  onRemove: () => void;
};

export default function TemplateExerciseForm({
  formData,
  index,
  setFormData,
  onRemove,
}: TemplateExerciseFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const { options: exerciseOptions } = useExercises();

  const update = (patch: Partial<TemplateExerciseFormData>) => {
    setFormData({ ...formData, ...patch });
  };

  // exercise name / selection

  const setExerciseCustomName = (name: string) => {
    update({
      name,
      isCustom: true,
      exerciseId: null,
    });
  };

  const selectExerciseOption = (option: Exercise) => {
    update({
      exerciseId: option.id,
      name: option.name,
      isCustom: false,
    });
    setPickerOpen(false);
    setPickerSearch("");
  };

  const switchToCustom = () => {
    update({
      isCustom: true,
      exerciseId: null,
    });
    setPickerOpen(false);
    setPickerSearch("");
  };

  // sets

  const addSet = () => {
    const nextSets: TemplateSetFormData[] = [
      ...formData.sets,
      {
        id: Math.random().toString(36).slice(2),
        reps: "",
        loadValue: "",
        loadUnit: "kg", // default, adjust if you want per-user default
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

  const query = pickerSearch.trim();
  const matches =
    pickerOpen && exerciseOptions.length > 0
      ? exerciseOptions
          .filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10)
      : [];

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
          <Text
            className={`text-sm ${
              formData.name ? "text-neutral-900" : "text-neutral-400"
            }`}
            numberOfLines={1}
          >
            {formData.name || "Select exercise"}
          </Text>
          <Text className="text-xs text-neutral-400">
            {pickerOpen ? "▲" : "▼"}
          </Text>
        </Pressable>

        {/* Custom name input (only when isCustom) */}
        {formData.isCustom && (
          <TextInput
            className="mt-2 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900"
            placeholder="Custom exercise name"
            placeholderTextColor="#9CA3AF"
            value={formData.name}
            onChangeText={setExerciseCustomName}
          />
        )}

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
                  No matches. Use custom name below.
                </Text>
              </View>
            ) : (
              matches.map((opt, i) => (
                <Pressable
                  key={opt.id}
                  className={`px-3 py-1.5 ${
                    i < matches.length - 1 ? "border-b border-neutral-200" : ""
                  }`}
                  onPress={() => selectExerciseOption(opt)}
                >
                  <Text className="text-xs text-neutral-900">{opt.name}</Text>
                </Pressable>
              ))
            )}

            {/* Custom option */}
            <Pressable className="px-3 py-2" onPress={switchToCustom}>
              <Text className="text-[11px] font-semibold text-neutral-800">
                + Custom exercise name
              </Text>
              <Text className="text-[10px] text-neutral-500">
                Use your own label (not in list).
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Presets row */}
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Text className="text-[11px] text-neutral-500">Quick presets:</Text>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(3, 8)}
        >
          <Text className="text-[11px] text-neutral-800">3 × 8</Text>
        </Pressable>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(4, 10)}
        >
          <Text className="text-[11px] text-neutral-800">4 × 10</Text>
        </Pressable>
        <Pressable
          className="rounded-full border border-neutral-300 px-2 py-0.5"
          onPress={() => applyPreset(5, 5)}
        >
          <Text className="text-[11px] text-neutral-800">5 × 5</Text>
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
