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
    <View className="mt-2 flex-row items-center gap-2">
      {/* Set index pill */}
      <Text className="w-5 text-center text-[10px] text-neutral-400">
        {index + 1}
      </Text>

      {/* REPS pill */}
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1">
        <Text className="text-[9px] font-medium text-neutral-500">REPS</Text>
        <TextInput
          className="mt-0.5 text-center text-[11px] text-neutral-900"
          keyboardType="number-pad"
          placeholder="8"
          placeholderTextColor="#9CA3AF"
          value={formData.reps}
          onChangeText={(v) => update({ reps: v })}
        />
      </View>

      {/* LOAD pill */}
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1">
        <View className="mb-0.5 flex-row items-center justify-between">
          <Text className="text-[9px] font-medium text-neutral-500">LOAD</Text>
          <Pressable
            onPress={cycleUnit}
            className="rounded-full bg-white px-2 py-[1px]"
          >
            <Text className="text-[9px] font-medium text-neutral-700">
              {formData.loadUnit}
            </Text>
          </Pressable>
        </View>
        <TextInput
          className="mt-0.5 text-center text-[11px] text-neutral-900"
          keyboardType="numeric"
          placeholder="60"
          placeholderTextColor="#9CA3AF"
          value={formData.loadValue}
          onChangeText={(v) => update({ loadValue: v })}
        />
      </View>

      {/* RPE pill */}
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1">
        <Text className="text-[9px] font-medium text-neutral-500">RPE</Text>
        <TextInput
          className="mt-0.5 text-center text-[11px] text-neutral-900"
          keyboardType="numeric"
          placeholder="7.5"
          placeholderTextColor="#9CA3AF"
          value={formData.rpe}
          onChangeText={(v) => update({ rpe: v })}
        />
      </View>

      {/* Remove icon */}
      <Pressable
        className="h-7 w-7 items-center justify-center rounded-full bg-red-50"
        onPress={onRemove}
      >
        <Text className="text-[12px] text-red-500">✕</Text>
      </Pressable>
    </View>
  );
}
