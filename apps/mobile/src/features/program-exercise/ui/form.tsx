import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { ExerciseProgramFormData } from "../domain/type";
import { SetProgramFormData } from "../../program-set/domain/type";
import { useExercises } from "../../exercise/hooks/use-exercises";
import SetProgramForm from "@/src/features/program-set/ui/form";
import { GripVertical, X, Plus, Minus } from "lucide-react-native";
import { useColorScheme } from "nativewind";

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

  const handleBg = isDark ? "bg-[#343746]" : "bg-neutral-100";

  const deleteBg = handleBg;
  const deleteColor = isDark ? "#F8F8F2" : "#6B7280";

  const chipBg = isDark ? "bg-[#BD93F9]" : "bg-neutral-900";
  const chipText = isDark ? "text-[#282A36]" : "text-white";

  const update = (patch: Partial<ExerciseProgramFormData>) =>
    setFormData({ ...formData, ...patch });

  const addSet = () => {
    const next: SetProgramFormData = {
      id: Math.random().toString(36).slice(2),
      targetQuantity: 0,
      loadValue: "",
      loadUnit: "kg",
      rpe: "",
    };
    update({ sets: [...formData.sets, next] });
  };

  const removeLastSet = () => {
    if (formData.sets.length === 0) return;
    update({ sets: formData.sets.slice(0, -1) });
  };

  const applyPreset = (count: number, reps: number) => {
    const nextSets: SetProgramFormData[] = Array.from({ length: count }).map(
      () => ({
        id: Math.random().toString(36).slice(2),
        targetQuantity: reps,
        loadValue: "",
        loadUnit: "kg",
        rpe: "",
      })
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
      className={`mb-2 rounded-2xl border px-3 py-2 ${cardBg} ${cardBorder}`}
    >
      {/* Header */}
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {onDrag ? (
            <Pressable
              onLongPress={onDrag}
              delayLongPress={120}
              hitSlop={8}
              className={`mr-2 h-6 w-6 items-center justify-center rounded-full ${handleBg}`}
            >
              <GripVertical size={14} color={isDark ? "#6272A4" : "#6B7280"} />
            </Pressable>
          ) : (
            <View className="mr-2 h-6 w-6" />
          )}

          <Text
            className={`flex-1 text-[13px] font-medium ${textMain}`}
            numberOfLines={1}
          >
            {exerciseName}
          </Text>
        </View>

        <Pressable
          onPress={onRemove}
          hitSlop={8}
          className={`h-6 w-6 items-center justify-center rounded-full ${deleteBg}`}
        >
          <X size={13} color={deleteColor} />
        </Pressable>
      </View>

      {/* Presets */}
      {formData.sets.length === 0 && (
        <View className="mb-1 flex-row flex-wrap gap-1.5">
          <Pressable
            className={`rounded-full px-2.5 py-0.5 ${chipBg}`}
            onPress={() => applyPreset(1, 8)}
          >
            <Text className={`text-[10px] font-semibold ${chipText}`}>1×8</Text>
          </Pressable>

          <Pressable
            className={`rounded-full px-2.5 py-0.5 ${chipBg}`}
            onPress={() => applyPreset(2, 10)}
          >
            <Text className={`text-[10px] font-semibold ${chipText}`}>
              2×10
            </Text>
          </Pressable>

          <Pressable
            className={`rounded-full px-2.5 py-0.5 ${chipBg}`}
            onPress={() => applyPreset(3, 12)}
          >
            <Text className={`text-[10px] font-semibold ${chipText}`}>
              3×12
            </Text>
          </Pressable>
        </View>
      )}

      {formData.sets.length > 0 && (
        <View className="mt-1 mb-0.5 flex-row items-center gap-2 px-1">
          <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-[#6272A4]">
            Target Volume
          </Text>
          <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-[#6272A4]">
            Load
          </Text>
          <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-[#6272A4]">
            Effort
          </Text>
        </View>
      )}

      {/* Sets */}
      {formData.sets.map((s, setIndex) => (
        <SetProgramForm
          key={s.id}
          formData={s}
          index={setIndex}
          setFormData={(next) =>
            update({
              sets: formData.sets.map((curr) =>
                curr.id === s.id ? next : curr,
              ),
            })
          }
        />
      ))}

      {/* Controls */}
      <View className="mt-1 flex-row justify-end gap-2">
        <Pressable
          onPress={removeLastSet}
          disabled={formData.sets.length === 0}
          hitSlop={8}
          className={`h-6 w-6 items-center justify-center rounded-full ${
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
          className={`h-6 w-6 items-center justify-center rounded-full ${chipBg}`}
        >
          <Plus size={12} color={isDark ? "#282A36" : "#F9FAFB"} />
        </Pressable>
      </View>
    </View>
  );
}
