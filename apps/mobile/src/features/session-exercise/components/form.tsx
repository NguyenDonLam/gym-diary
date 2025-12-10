// apps/mobile/app/session-workout/session-exercise-card.tsx

import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { generateId } from "@/src/lib/id";

export type SessionExerciseView = SessionExercise & {
  isOpen?: boolean;
};

type StatusColors = {
  containerBg: string;
  containerBorder: string;
  statusText: string;
  statusPillBg: string;
};

function getExerciseCardColors(
  completedCount: number,
  totalSets: number
): StatusColors {
  if (totalSets <= 0) {
    return {
      containerBg: "bg-neutral-50 dark:bg-neutral-900",
      containerBorder: "border-neutral-200 dark:border-neutral-800",
      statusText: "text-neutral-500 dark:text-neutral-400",
      statusPillBg: "bg-neutral-100 dark:bg-neutral-800",
    };
  }

  const ratio = completedCount / totalSets;

  if (ratio === 0) {
    return {
      containerBg: "bg-red-50 dark:bg-red-950",
      containerBorder: "border-red-400 dark:border-red-500",
      statusText: "text-red-700 dark:text-red-300",
      statusPillBg: "bg-red-100 dark:bg-red-900",
    };
  }

  if (ratio < 1) {
    return {
      containerBg: "bg-amber-50 dark:bg-amber-950",
      containerBorder: "border-amber-300 dark:border-amber-500",
      statusText: "text-amber-700 dark:text-amber-300",
      statusPillBg: "bg-amber-100 dark:bg-amber-900",
    };
  }

  return {
    containerBg: "bg-emerald-50 dark:bg-emerald-950",
    containerBorder: "border-emerald-400 dark:border-emerald-500",
    statusText: "text-emerald-700 dark:text-emerald-300",
    statusPillBg: "bg-emerald-100 dark:bg-emerald-900",
  };
}

type Props = {
  value: SessionExerciseView;
  onChange: (next: SessionExerciseView) => void;
  onSetCommit?: (setId: string) => void;
};

export function SessionExerciseCard({ value, onChange, onSetCommit }: Props) {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === "dark" ? "#E5E7EB" : "#4B5563";
  const circleIdleColor = colorScheme === "dark" ? "#6B7280" : "#9CA3AF";

  const sets = value.sets ?? [];

  const isSetDone = (s: SessionSet) =>
    s.reps !== null &&
    s.reps > 0 &&
    s.loadValue !== null &&
    s.loadValue.trim() !== "" &&
    s.rpe !== null;

  const update = (
    updater: (prev: SessionExerciseView) => SessionExerciseView
  ) => onChange(updater(value));

  const toggleOpen = () => {
    update((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const updateSetField = (
    setId: string,
    field: keyof Pick<SessionSet, "reps" | "loadValue" | "rpe">,
    rawValue: string
  ) => {
    update((prev) => {
      const nextSets = (prev.sets ?? []).map((s) => {
        if (s.id !== setId) return s;

        if (field === "reps") {
          const num = rawValue.trim() === "" ? null : Number(rawValue);
          return { ...s, reps: Number.isNaN(num) ? null : num };
        }

        if (field === "rpe") {
          const num = rawValue.trim() === "" ? null : Number(rawValue);
          return { ...s, rpe: Number.isNaN(num) ? null : num };
        }

        return { ...s, loadValue: rawValue.trim() === "" ? null : rawValue };
      });

      return { ...prev, sets: nextSets };
    });
  };

  const addSet = () => {
    update((prev) => {
      const currentSets = prev.sets ?? [];
      const nextOrderIndex = currentSets.length;
      const now = new Date();

      const newSet: SessionSet = {
        id: generateId(),
        sessionExerciseId: prev.id,
        templateSetId: null,
        templateSet: undefined,

        orderIndex: nextOrderIndex,

        reps: null,
        loadUnit: currentSets[0]?.loadUnit ?? "kg",
        loadValue: null,
        rpe: null,

        isWarmup: false,
        note: null,

        createdAt: now,
        updatedAt: now,
      };

      return {
        ...prev,
        isOpen: true,
        sets: [...currentSets, newSet],
      };
    });
  };

  const completedCount = sets.filter(isSetDone).length;
  const totalSets = sets.length;
  const colors = getExerciseCardColors(completedCount, totalSets);

  const exerciseLabel = value.exerciseName;

  return (
    <View
      className={`mb-3 rounded-2xl border ${colors.containerBorder} ${colors.containerBg}`}
    >
      {/* Exercise header */}
      <Pressable
        onPress={toggleOpen}
        className="flex-row items-center justify-between px-3 py-2"
      >
        <View className="flex-row items-center flex-1">
          {value.isOpen ? (
            <ChevronDown width={16} height={16} color={chevronColor} />
          ) : (
            <ChevronRight width={16} height={16} color={chevronColor} />
          )}

          <View className="ml-2 flex-1">
            <Text
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-50"
              numberOfLines={1}
            >
              {exerciseLabel}
            </Text>

            <View className="mt-0.5 flex-row items-center">
              <View
                className={`mr-1 rounded-full px-2 py-0.5 ${colors.statusPillBg}`}
              >
                <Text
                  className={`text-[10px] font-medium ${colors.statusText}`}
                >
                  {completedCount}/{totalSets || 0} sets
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Collapsible content */}
      {value.isOpen && (
        <View className="border-t border-neutral-200 dark:border-neutral-800 px-3 pt-2 pb-2">
          {value.note ? (
            <Text className="mb-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              {value.note}
            </Text>
          ) : null}

          <View>
            {sets.map((set, idx) => {
              const done = isSetDone(set);
              const tpl = set.templateSet;

              const prevRepsNum =
                tpl && tpl.targetReps != null ? tpl.targetReps : null;

              const rawPrevWeight = tpl?.loadValue ?? null;
              const prevWeightStr =
                rawPrevWeight !== null && rawPrevWeight !== undefined
                  ? String(rawPrevWeight)
                  : "";

              const prevRpeNum =
                tpl && tpl.targetRpe != null ? tpl.targetRpe : null;

              const currentRepsNum = set.reps ?? 0;

              let clamped = 0;
              let barClass = "bg-neutral-300 dark:bg-neutral-700";
              let goalLabel: string | null = null;

              if (prevRepsNum && prevRepsNum > 0) {
                const goal = prevRepsNum + 1;
                const current = currentRepsNum ?? 0;
                let ratio = current / goal;
                if (!isFinite(ratio) || ratio < 0) ratio = 0;
                clamped = Math.max(0, Math.min(ratio, 1));

                if (current === 0) {
                  barClass = "bg-neutral-300 dark:bg-neutral-700";
                } else if (current < prevRepsNum) {
                  barClass = "bg-amber-400 dark:bg-amber-500";
                } else if (current === prevRepsNum) {
                  barClass = "bg-sky-500 dark:bg-sky-500";
                } else if (current >= goal) {
                  barClass = "bg-emerald-500 dark:bg-emerald-500";
                } else {
                  barClass = "bg-emerald-400 dark:bg-emerald-500";
                }

                goalLabel = `${goal} reps`;
              }

              const repsValue = set.reps === null ? "" : String(set.reps);
              const loadValue = set.loadValue ?? "";
              const rpeValue = set.rpe === null ? "" : String(set.rpe);

              const repsPlaceholder =
                prevRepsNum && prevRepsNum > 0 ? String(prevRepsNum) : "Reps";
              const weightPlaceholder =
                prevWeightStr && prevWeightStr.length > 0
                  ? prevWeightStr
                  : "Weight";
              const rpePlaceholder =
                prevRpeNum && prevRpeNum > 0 ? String(prevRpeNum) : "RPE";

              return (
                <View
                  key={set.id}
                  className="mb-1.5 rounded-xl bg-white dark:bg-neutral-900 px-3 py-1.5"
                >
                  {/* top row: indicator + set label + last chip */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="mr-2">
                        {done ? (
                          <CheckCircle2
                            width={18}
                            height={18}
                            color="#16A34A"
                          />
                        ) : (
                          <Circle
                            width={18}
                            height={18}
                            color={circleIdleColor}
                          />
                        )}
                      </View>

                      <Text className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Set {idx + 1}
                      </Text>
                    </View>

                    {prevRepsNum && (
                      <View className="flex-row items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5">
                        <Text className="text-[10px] text-neutral-600 dark:text-neutral-300 mr-1">
                          {prevRepsNum}
                        </Text>
                        <Text className="text-[9px] text-neutral-400 dark:text-neutral-500">
                          last
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* inputs row */}
                  <View className="mt-1 flex-row items-center">
                    <TextInput
                      className="mx-1 flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[12px] text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-900"
                      keyboardType="numeric"
                      placeholder={repsPlaceholder}
                      placeholderTextColor="#9CA3AF"
                      value={repsValue}
                      onChangeText={(text) =>
                        updateSetField(set.id, "reps", text)
                      }
                      onEndEditing={() => onSetCommit?.(set.id)}
                    />

                    <TextInput
                      className="mx-1 flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[12px] text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-900"
                      keyboardType="numeric"
                      placeholder={weightPlaceholder.toString()}
                      placeholderTextColor="#9CA3AF"
                      value={loadValue}
                      onChangeText={(text) =>
                        updateSetField(set.id, "loadValue", text)
                      }
                      onEndEditing={() => onSetCommit?.(set.id)}
                    />

                    <TextInput
                      className="ml-1 w-14 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2 py-1 text-[12px] text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-900"
                      keyboardType="numeric"
                      placeholder={rpePlaceholder}
                      placeholderTextColor="#9CA3AF"
                      value={rpeValue}
                      onChangeText={(text) =>
                        updateSetField(set.id, "rpe", text)
                      }
                      onEndEditing={() => onSetCommit?.(set.id)}
                    />
                  </View>

                  {/* reps meter + explicit goal label */}
                  {prevRepsNum && prevRepsNum > 0 && (
                    <View className="mt-1 flex-row items-center">
                      <View className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <View
                          className={`h-full ${barClass}`}
                          style={{
                            width: `${clamped * 100}%`,
                          }}
                        />
                      </View>
                      {goalLabel && (
                        <Text className="ml-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                          goal {goalLabel}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            onPress={addSet}
            className="mt-2 self-start rounded-full border border-dashed border-neutral-300 dark:border-neutral-600 px-3 py-1"
          >
            <Text className="text-[11px] text-neutral-600 dark:text-neutral-300">
              + Add set
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
