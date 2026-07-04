import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { GripVertical, Minus, Plus, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import SetProgramForm from "@/src/features/program-set/ui/form";
import { useExercises } from "../../exercise/hooks/use-exercises";
import { SetProgramFormData } from "../../program-set/domain/type";
import { ExerciseProgramFormData } from "../domain/type";

type ExerciseProgramFormProps = {
  formData: ExerciseProgramFormData;
  setFormData: (next: ExerciseProgramFormData) => void;
  onRemove: () => void;
  onDrag?: () => void;
};

export default function ExerciseProgramForm({
  formData,
  setFormData,
  onRemove,
  onDrag,
}: ExerciseProgramFormProps) {
  const { options: exerciseOptions } = useExercises();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const cardBg = isDark ? "bg-[#282A36]" : "bg-white";
  const cardBorder = isDark ? "border-[#44475A]" : "border-neutral-200";

  const textMain = isDark ? "text-[#F8F8F2]" : "text-neutral-900";
  const textSoft = isDark ? "text-[#6272A4]" : "text-neutral-500";

  const chipBg = isDark ? "bg-[#BD93F9]" : "bg-neutral-900";
  const chipText = isDark ? "text-[#282A36]" : "text-white";

  const update = (patch: Partial<ExerciseProgramFormData>) =>
    setFormData({ ...formData, ...patch });

  const addSet = () => {
    const next: SetProgramFormData = {
      id: Math.random().toString(36).slice(2),
      targetQuantity: null,
      loadValue: "",
      loadUnit: "kg",
      rpe: "10",
    };
    update({ sets: [...formData.sets, next] });
  };

  const removeLastSet = () => {
    if (formData.sets.length === 0) return;
    update({ sets: formData.sets.slice(0, -1) });
  };

  const presetOptions =
    formData.quantityUnit === "time"
      ? [
          { count: 1, quantity: 30, label: "1x30s" },
          { count: 2, quantity: 45, label: "2x45s" },
          { count: 3, quantity: 60, label: "3x60s" },
        ]
      : [
          { count: 1, quantity: 8, label: "1x8" },
          { count: 2, quantity: 10, label: "2x10" },
          { count: 3, quantity: 12, label: "3x12" },
        ];

  const applyPreset = (count: number, quantity: number) => {
    const nextSets: SetProgramFormData[] = Array.from({ length: count }).map(
      () => ({
        id: Math.random().toString(36).slice(2),
        targetQuantity: quantity,
        loadValue: "",
        loadUnit: "kg",
        rpe: "10",
      }),
    );
    update({ sets: nextSets });
  };

  const exerciseName = useMemo(() => {
    if (!formData.exerciseId) return "Exercise";
    const found = exerciseOptions.find((e) => e.id === formData.exerciseId);
    return found?.name || "Exercise";
  }, [exerciseOptions, formData.exerciseId]);

  return (
    <View
      className={`mb-2 rounded-2xl border px-3 py-2.5 ${cardBg} ${cardBorder}`}
    >
      <View className="mb-2 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {onDrag ? (
            <Pressable
              onLongPress={onDrag}
              delayLongPress={120}
              hitSlop={8}
              className={`mr-2 h-8 flex-row items-center rounded-xl border px-2 ${
                isDark
                  ? "border-[#6272A4] bg-[#343746]"
                  : "border-neutral-300 bg-neutral-50"
              }`}
            >
              <GripVertical size={14} color={isDark ? "#6272A4" : "#6B7280"} />

            </Pressable>
          ) : (
            <View className="mr-2 h-8 w-14" />
          )}

          <Text
            className={`flex-1 text-[15px] font-semibold ${textMain}`}
            numberOfLines={1}
          >
            {exerciseName}
          </Text>
        </View>

        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className={`h-8 w-8 items-center justify-center rounded-xl border ${
            isDark
              ? "border-[#44475A] bg-[#343746]"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <X size={14} color="#EF4444" />
        </Pressable>
      </View>

      {formData.sets.length === 0 ? (
        <View className="mb-2 flex-row flex-wrap gap-2">
          {presetOptions.map((preset) => (
            <Pressable
              key={preset.label}
              className={`rounded-full px-3 py-1.5 ${chipBg}`}
              onPress={() => applyPreset(preset.count, preset.quantity)}
            >
              <Text className={`text-[11px] font-semibold ${chipText}`}>
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {formData.sets.length > 0 ? (
        <View className="mb-1 flex-row items-center gap-2 px-2">
          <View className="w-7" />
          <Text
            className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-[#6272A4]"
            style={{ flex: 0.82 }}
          >
            Target
          </Text>
          <Text
            className="text-[9px] font-semibold uppercase text-neutral-400 dark:text-[#6272A4]"
            style={{ flex: 1.55 }}
          >
            Load
          </Text>
          <Text
            className="text-center text-[9px] font-semibold uppercase text-neutral-400 dark:text-[#6272A4]"
            style={{ width: 70 }}
          >
            Effort
          </Text>
        </View>
      ) : null}

      {formData.sets.map((set, setIndex) => (
        <SetProgramForm
          key={set.id}
          formData={set}
          index={setIndex}
          quantityUnit={formData.quantityUnit}
          setFormData={(next) =>
            update({
              sets: formData.sets.map((curr) =>
                curr.id === set.id ? next : curr,
              ),
            })
          }
        />
      ))}

      <View className="mt-2 flex-row items-center justify-between">
        <Text className={`text-[11px] ${textSoft}`}>
          {formData.sets.length} {formData.sets.length === 1 ? "set" : "sets"}
        </Text>

        <View className="flex-row gap-2">
          <Pressable
            onPress={removeLastSet}
            disabled={formData.sets.length === 0}
            hitSlop={8}
            className={`h-8 w-8 items-center justify-center rounded-full ${
              formData.sets.length === 0
                ? "bg-neutral-200 dark:bg-[#44475A]"
                : chipBg
            }`}
          >
            <Minus
              size={12}
              color={
                formData.sets.length === 0
                  ? "#6272A4"
                  : isDark
                    ? "#282A36"
                    : "#F9FAFB"
              }
            />
          </Pressable>

          <Pressable
            onPress={addSet}
            hitSlop={8}
            className={`h-8 flex-row items-center justify-center rounded-full px-3 ${chipBg}`}
          >
            <Plus size={12} color={isDark ? "#282A36" : "#F9FAFB"} />
            <Text className={`ml-1 text-[11px] font-semibold ${chipText}`}>
              Set
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
