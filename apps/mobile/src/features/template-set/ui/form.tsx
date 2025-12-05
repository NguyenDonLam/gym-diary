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

// domain: "kg" | "lb" | "band" | "time" | "custom"
const LOAD_UNITS: LoadUnit[] = ["kg", "lb", "band", "time", "custom"];

// ordered: green, purple, black, red, yellow
const BAND_OPTIONS = [
  {
    id: "green",
    label: "Green",
    baseClass: "bg-emerald-100",
    activeClass: "bg-emerald-400",
  },
  {
    id: "purple",
    label: "Purple",
    baseClass: "bg-violet-100",
    activeClass: "bg-violet-400",
  },
  {
    id: "black",
    label: "Black",
    baseClass: "bg-neutral-200",
    activeClass: "bg-neutral-800",
  },
  {
    id: "red",
    label: "Red",
    baseClass: "bg-red-100",
    activeClass: "bg-red-400",
  },
  {
    id: "yellow",
    label: "Yellow",
    baseClass: "bg-amber-100",
    activeClass: "bg-amber-400",
  },
];

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

    // reset value when unit changes
    update({ loadUnit: next, loadValue: "" });
  };

  const handleChangeLoadValue = (raw: string) => {
    const unit = formData.loadUnit;

    if (unit === "kg" || unit === "lb") {
      // numeric only (allow one dot/comma)
      let cleaned = raw.replace(/[^0-9.,]/g, "");
      const firstDot = cleaned.search(/[.,]/);
      if (firstDot !== -1) {
        const head = cleaned.slice(0, firstDot + 1);
        const tail = cleaned.slice(firstDot + 1).replace(/[.,]/g, "");
        cleaned = head + tail;
      }
      update({ loadValue: cleaned });
      return;
    }

    if (unit === "time") {
      // minutes, mm:ss, or ranges like "14-15" / "14:30-15:00"
      const cleaned = raw.replace(/[^0-9:\-]/g, "");
      update({ loadValue: cleaned });
      return;
    }

    if (unit === "custom") {
      update({ loadValue: raw });
      return;
    }

    // band ignores typing
  };

  const selectBand = (id: string) => {
    update({ loadValue: id });
  };

  const isBandUnit = formData.loadUnit === "band";
  const isTimeUnit = formData.loadUnit === "time";
  const isNumericUnit =
    formData.loadUnit === "kg" || formData.loadUnit === "lb";

  // time needs ":" / "-" so use default keyboard there
  const loadKeyboardType: any = isNumericUnit ? "numeric" : "default";

  return (
    <View className="mt-2 flex-row items-center gap-2">
      {/* index, low emphasis */}
      <Text className="w-5 text-center text-[10px] text-neutral-400">
        {index + 1}
      </Text>

      {/* REPS */}
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

      {/* LOAD (value + unit) */}
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

        {/* kg / lb / time / custom → field */}
        {!isBandUnit && (
          <TextInput
            className="mt-0.5 text-center text-[11px] text-neutral-900"
            keyboardType={loadKeyboardType}
            placeholder={
              isTimeUnit
                ? "14:30" // mm:ss or minutes, your choice
                : formData.loadUnit === "custom"
                  ? ""
                  : "60"
            }
            placeholderTextColor="#9CA3AF"
            value={formData.loadValue}
            onChangeText={handleChangeLoadValue}
          />
        )}

        {/* band → full colour chips (green, purple, black, red, yellow) */}
        {isBandUnit && (
          <View className="mt-1 flex-row flex-wrap gap-2">
            {BAND_OPTIONS.map((band) => {
              const active = formData.loadValue === band.id;
              return (
                <Pressable
                  key={band.id}
                  onPress={() => selectBand(band.id)}
                  className={`h-7 px-3 items-center justify-center rounded-full border border-neutral-200 ${
                    active ? band.activeClass : band.baseClass
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      band.id === "black" && active
                        ? "text-white"
                        : "text-neutral-900"
                    }`}
                  >
                    {band.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* RPE */}
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

      {/* Remove */}
      <Pressable
        className="h-7 w-7 items-center justify-center rounded-full bg-red-50"
        onPress={onRemove}
      >
        <Text className="text-[12px] text-red-500">✕</Text>
      </Pressable>
    </View>
  );
}
