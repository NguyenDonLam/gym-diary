import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SetProgramFormData, LoadUnit } from "../domain/type";
import { X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

type SetProgramFormProps = {
  formData: SetProgramFormData;
  index: number;
  setFormData: (next: SetProgramFormData) => void;
  onRemove: () => void;
};

// domain: "kg" | "lb" | "band" | "time" | "custom"
const LOAD_UNITS: LoadUnit[] = ["kg", "lb", "band", "time", "custom"];

// ordered: green, purple, black, red, yellow
const BAND_OPTIONS = [
  {
    id: "green",
    label: "Green",
    baseClass: "bg-emerald-100 dark:bg-emerald-950",
    activeClass: "bg-emerald-400 dark:bg-emerald-500",
  },
  {
    id: "purple",
    label: "Purple",
    baseClass: "bg-violet-100 dark:bg-violet-950",
    activeClass: "bg-violet-400 dark:bg-violet-500",
  },
  {
    id: "black",
    label: "Black",
    baseClass: "bg-neutral-200 dark:bg-neutral-800",
    activeClass: "bg-neutral-800 dark:bg-neutral-50",
  },
  {
    id: "red",
    label: "Red",
    baseClass: "bg-red-100 dark:bg-red-950",
    activeClass: "bg-red-400 dark:bg-red-500",
  },
  {
    id: "yellow",
    label: "Yellow",
    baseClass: "bg-amber-100 dark:bg-amber-950",
    activeClass: "bg-amber-400 dark:bg-amber-500",
  },
];

export default function SetProgramForm({
  formData,
  index,
  setFormData,
  onRemove,
}: SetProgramFormProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const update = (patch: Partial<SetProgramFormData>) => {
    setFormData({ ...formData, ...patch });
  };

  const cycleUnit = () => {
    const current = formData.loadUnit;
    const idx = LOAD_UNITS.indexOf(current);
    const next =
      idx === -1 || idx === LOAD_UNITS.length - 1
        ? LOAD_UNITS[0]
        : LOAD_UNITS[idx + 1];

    update({ loadUnit: next, loadValue: "" });
  };

  const handleChangeLoadValue = (raw: string) => {
    const unit = formData.loadUnit;

    if (unit === "kg" || unit === "lb") {
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

  const loadKeyboardType: any = isNumericUnit ? "numeric" : "default";

  const removeIconColor = isDark ? "#FCA5A5" : "#DC2626";

  return (
    <View className="mt-2 flex-row items-center gap-2">
      {/* index */}
      <Text className="w-5 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
        {index + 1}
      </Text>

      {/* REPS */}
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1 dark:bg-neutral-800">
        <Text className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">
          REPS
        </Text>
        <TextInput
          className="mt-0.5 text-center text-[11px] text-neutral-900 dark:text-neutral-50"
          keyboardType="number-pad"
          placeholder="8"
          placeholderTextColor="#9CA3AF"
          value={formData.reps}
          onChangeText={(v) => update({ reps: v })}
        />
      </View>

      {/* LOAD (value + unit) */}
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1 dark:bg-neutral-800">
        <View className="mb-0.5 flex-row items-center justify-between">
          <Text className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">
            LOAD
          </Text>
          <Pressable
            onPress={cycleUnit}
            className="rounded-full bg-white px-2 py-[1px] dark:bg-neutral-700"
          >
            <Text className="text-[9px] font-medium text-neutral-700 dark:text-neutral-100">
              {formData.loadUnit}
            </Text>
          </Pressable>
        </View>

        {/* kg / lb / time / custom */}
        {!isBandUnit && (
          <TextInput
            className="mt-0.5 text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType={loadKeyboardType}
            placeholder={
              isTimeUnit ? "14:30" : formData.loadUnit === "custom" ? "" : "60"
            }
            placeholderTextColor="#9CA3AF"
            value={formData.loadValue}
            onChangeText={handleChangeLoadValue}
          />
        )}

        {/* band → chips */}
        {isBandUnit && (
          <View className="mt-1 flex-row flex-wrap gap-2">
            {BAND_OPTIONS.map((band) => {
              const active = formData.loadValue === band.id;
              return (
                <Pressable
                  key={band.id}
                  onPress={() => selectBand(band.id)}
                  className={`h-7 px-3 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-600 ${
                    active ? band.activeClass : band.baseClass
                  }`}
                >
                  <Text
                    className={`text-[10px] font-semibold ${
                      band.id === "black" && active
                        ? "text-neutral-900 dark:text-neutral-900"
                        : "text-neutral-900 dark:text-neutral-50"
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
      <View className="flex-1 rounded-2xl bg-neutral-50 px-2 py-1 dark:bg-neutral-800">
        <Text className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">
          RPE
        </Text>
        <TextInput
          className="mt-0.5 text-center text-[11px] text-neutral-900 dark:text-neutral-50"
          keyboardType="numeric"
          placeholder="7.5"
          placeholderTextColor="#9CA3AF"
          value={formData.rpe}
          onChangeText={(v) => update({ rpe: v })}
        />
      </View>

      {/* Remove */}
      <Pressable
        className="h-7 w-7 items-center justify-center rounded-full bg-red-50 dark:bg-red-900"
        onPress={onRemove}
      >
        <X size={14} color={removeIconColor} />
      </Pressable>
    </View>
  );
}
