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
  onDrag?: () => void; // drag handle
};

export default function TemplateExerciseForm({
  formData,
  index,
  setFormData,
  onRemove,
  onDrag,
}: TemplateExerciseFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

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
    console.log(JSON.stringify(formData.sets))
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
  };

  const selectorLabel = selectedExercise?.name ?? "Select exercise";

  const getInitial = (opt: Exercise) => {
    const trimmed = (opt.name ?? "").trim();
    if (!trimmed) return "?";
    return trimmed[0]!.toUpperCase();
  };

  return (
    <View
      className="mb-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3"
      style={{
        overflow: "visible",
        zIndex: pickerOpen ? 20 : 0,
        elevation: pickerOpen ? 20 : 0,
      }}
    >
      {/* Header: compact row with handle + remove */}
      <View className="mb-2 flex-row items-center justify-between">
        {onDrag ? (
          <Pressable
            onLongPress={onDrag}
            delayLongPress={120}
            hitSlop={8}
            className="mr-2 h-7 px-3 flex-row items-center justify-center rounded-full bg-neutral-100"
          >
            <Text className="text-[16px] text-neutral-400">☰</Text>
          </Pressable>
        ) : (
          <View className="mr-2 h-7 w-7" />
        )}

        <Pressable
          onPress={onRemove}
          className="h-7 w-7 items-center justify-center rounded-full bg-red-50"
        >
          <Text className="text-[12px] text-red-500">✕</Text>
        </Pressable>
      </View>

      {/* Selector + dropdown */}
      <View className="relative z-10">
        <Pressable
          className="flex-row items-center justify-between rounded-xl border border-neutral-300 bg-white px-3 py-2"
          onPress={() => setPickerOpen((prev) => !prev)}
        >
          <Text
            className={`flex-1 text-[12px] ${
              selectedExercise ? "text-neutral-900" : "text-neutral-400"
            }`}
            numberOfLines={1}
          >
            {selectorLabel}
          </Text>
          <Text className="ml-2 text-xs text-neutral-400">
            {pickerOpen ? "▴" : "▾"}
          </Text>
        </Pressable>

        {pickerOpen && (
          <View
            className="mt-2 rounded-xl border border-neutral-200 bg-white"
            style={{
              zIndex: 30,
              elevation: 30,
            }}
          >
            {/* Search */}
            <View className="border-b border-neutral-100 px-3 py-2">
              <TextInput
                className="text-xs text-neutral-900"
                placeholder="Search exercises"
                placeholderTextColor="#9CA3AF"
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
            </View>

            {/* List */}
            <View className="max-h-72">
              {matches.length === 0 ? (
                <View className="px-3 py-3">
                  <Text className="text-[11px] text-neutral-500">
                    No exercises found
                  </Text>
                </View>
              ) : (
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {matches.map((opt) => {
                    const isSelected = opt.id === formData.exerciseId;

                    return (
                      <Pressable
                        key={opt.id}
                        className={`flex-row items-center justify-between px-3 py-2 ${
                          isSelected ? "bg-neutral-900" : "bg-white"
                        }`}
                        onPress={() => selectExerciseOption(opt)}
                      >
                        <Text
                          className={`flex-1 text-[12px] ${
                            isSelected
                              ? "font-medium text-white"
                              : "text-neutral-900"
                          }`}
                          numberOfLines={1}
                        >
                          {opt.name}
                        </Text>

                        {isSelected && (
                          <View className="ml-2 h-4 w-4 rounded-full border border-white" />
                        )}
                      </Pressable>
                    );
                  })}
                  <View className="h-2" />
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Presets – chips only */}
      {formData.sets.length === 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="flex-row items-center rounded-full bg-neutral-900 px-3 py-1"
            onPress={() => applyPreset(1, 8)}
          >
            <Text className="text-[11px] font-semibold text-white">1×8</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center rounded-full bg-neutral-800 px-3 py-1"
            onPress={() => applyPreset(2, 10)}
          >
            <Text className="text-[11px] font-semibold text-white">2×10</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center rounded-full bg-neutral-700 px-3 py-1"
            onPress={() => applyPreset(3, 12)}
          >
            <Text className="text-[11px] font-semibold text-white">3×12</Text>
          </Pressable>
        </View>
      )}

      {formData.sets.map((s, setIndex) => (
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
      ))}

      <Pressable
        className="mt-2 h-7 w-7 items-center justify-center self-end rounded-full bg-neutral-900"
        onPress={addSet}
      >
        <Text className="text-[14px] text-white">＋</Text>
      </Pressable>
    </View>
  );
}
