// src/features/template-set/ui/form.tsx
import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { TemplateSetFormData, LoadUnit } from "../domain/type";

type TemplateSetFormProps = {
  formData: TemplateSetFormData;
  index: number;
  setFormData: (next: TemplateSetFormData) => void;
  onRemove: () => void;
};

const LOAD_UNITS: LoadUnit[] = ["kg", "lb", "band", "bodyweight"];

export default function TemplateSetForm({
  formData,
  index,
  setFormData,
  onRemove,
}: TemplateSetFormProps) {
  const update = (patch: Partial<TemplateSetFormData>) => {
    setFormData({ ...formData, ...patch });
  };

  const cycleUnit = () => {
    const current = formData.loadUnit;
    const idx = LOAD_UNITS.indexOf(current);
    const next =
      idx === -1 || idx === LOAD_UNITS.length - 1
        ? LOAD_UNITS[0]
        : LOAD_UNITS[idx + 1];

    update({ loadUnit: next });
  };

  return (
    <View className="mt-1 flex-row items-center gap-1">
      <Text className="w-8 text-[11px] text-neutral-500">{index + 1}</Text>

      {/* Reps */}
      <TextInput
        className="flex-1 rounded border border-neutral-300 px-2 py-1 text-[11px] text-neutral-900"
        placeholder="8"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        value={formData.reps}
        onChangeText={(v) => update({ reps: v })}
      />

      {/* Load value + unit */}
      <View className="flex-1 flex-row items-center rounded border border-neutral-300 px-1">
        <TextInput
          className="flex-1 px-1 py-1 text-[11px] text-neutral-900"
          placeholder="60"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={formData.loadValue}
          onChangeText={(v) => update({ loadValue: v })}
        />
        <Pressable className="rounded px-1.5 py-0.5" onPress={cycleUnit}>
          <Text className="text-[11px] text-neutral-700">
            {formData.loadUnit}
          </Text>
        </Pressable>
      </View>

      {/* RPE */}
      <TextInput
        className="flex-1 rounded border border-neutral-300 px-2 py-1 text-[11px] text-neutral-900"
        placeholder="7.5"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        value={formData.rpe}
        onChangeText={(v) => update({ rpe: v })}
      />

      {/* Remove */}
      <Pressable className="w-8 items-end" onPress={onRemove}>
        <Text className="text-[11px] text-red-500">✕</Text>
      </Pressable>
    </View>
  );
}
