// apps/mobile/app/session-workout/session-exercise-card.tsx

import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Wind,
  Gauge,
  Flame,
  Clock3,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { generateId } from "@/src/lib/id";

type LastSetSnapshot = {
  id: string;
  reps: number | null;
  load: string | null; // e.g. "80", "80kg", "BW"
};

export type SessionExerciseView = SessionExercise & {
  isOpen?: boolean;
  lastSessionSets?: LastSetSnapshot[]; // ⬅️ new
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

// Effort presets mapped to RPE
const EFFORT_LEVELS = [
  { id: "light", label: "Light", rpe: 5 },
  { id: "medium", label: "Medium", rpe: 7 },
  { id: "intense", label: "Intense", rpe: 10 },
];

function getEffortFromRpe(rpe: number | null | undefined) {
  if (!rpe) return EFFORT_LEVELS[1]; // medium
  const found = EFFORT_LEVELS.find((lvl) => lvl.rpe === rpe);
  return found ?? EFFORT_LEVELS[1];
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
  const lastSets = value.lastSessionSets ?? []; 

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
    field: keyof Pick<SessionSet, "reps" | "loadValue">,
    rawValue: string
  ) => {
    update((prev) => {
      const nextSets = (prev.sets ?? []).map((s) => {
        if (s.id !== setId) return s;

        if (field === "reps") {
          const num = rawValue.trim() === "" ? null : Number(rawValue);
          return { ...s, reps: Number.isNaN(num) ? null : num };
        }

        return { ...s, loadValue: rawValue.trim() === "" ? null : rawValue };
      });

      return { ...prev, sets: nextSets };
    });
  };

  const setEffort = (setId: string, nextRpe: number) => {
    update((prev) => {
      const nextSets = (prev.sets ?? []).map((s) =>
        s.id === setId ? { ...s, rpe: nextRpe } : s
      );
      return { ...prev, sets: nextSets };
    });
    onSetCommit?.(setId);
  };

  const cycleEffort = (set: SessionSet) => {
    const currentRpe = set.rpe ?? EFFORT_LEVELS[1].rpe;
    const idx = EFFORT_LEVELS.findIndex((lvl) => lvl.rpe === currentRpe);
    const nextIdx = idx === -1 ? 1 : (idx + 1) % EFFORT_LEVELS.length;
    const next = EFFORT_LEVELS[nextIdx];
    setEffort(set.id, next.rpe);
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
        rpe: EFFORT_LEVELS[1].rpe, // default medium

        isCompleted: false,
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

  const shellBg = colorScheme === "dark" ? "bg-neutral-900/80" : "bg-white";

  const renderEffortIcon = (id: string, active: boolean) => {
    const size = 14;
    const color = active
      ? colorScheme === "dark"
        ? "#F9FAFB"
        : "#111827"
      : colorScheme === "dark"
        ? "#9CA3AF"
        : "#6B7280";

    if (id === "light") return <Wind size={size} color={color} />;
    if (id === "medium") return <Gauge size={size} color={color} />;
    return <Flame size={size} color={color} />;
  };

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

            {/* status pill */}
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

            {/* last session summary – minimal numbers */}
            {lastSets.length > 0 && (
              <View className="mt-0.5 flex-row items-center justify-between">
                <View className="flex-row items-center mr-2">
                  <Clock3
                    width={11}
                    height={11}
                    color={colorScheme === "dark" ? "#9CA3AF" : "#6B7280"}
                  />
                  <Text className="ml-1 text-[9px] text-neutral-500 dark:text-neutral-400">
                    last
                  </Text>
                </View>

                <View className="flex-1 flex-row flex-wrap justify-end gap-1">
                  {lastSets.map((s, idx) => {
                    const reps = s.reps ?? 0;
                    const load = s.load ?? "";
                    const label =
                      load !== "" ? `${load}×${reps || "?"}` : `${reps || "?"}`;

                    return (
                      <View
                        key={s.id ?? idx}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800"
                      >
                        <Text className="text-[9px] text-neutral-700 dark:text-neutral-200">
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
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

          {/* single label row */}
          {sets.length > 0 && (
            <View className="mb-1 flex-row items-center gap-2 px-1">
              <Text className="w-5 text-[9px] text-neutral-500 dark:text-neutral-500">
                ✓
              </Text>
              <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-neutral-500">
                Reps
              </Text>
              <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-neutral-500">
                Load
              </Text>
              <Text className="w-16 text-center text-[9px] text-neutral-500 dark:text-neutral-500">
                Effort
              </Text>
            </View>
          )}

          <View>
            {sets.map((set) => {
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

                goalLabel = `${prevRepsNum}→${goal}`;
              }

              const repsValue = set.reps === null ? "" : String(set.reps);
              const loadValue = set.loadValue ?? "";
              const repsPlaceholder =
                prevRepsNum && prevRepsNum > 0 ? String(prevRepsNum) : "...";
              const weightPlaceholder =
                prevWeightStr && prevWeightStr.length > 0
                  ? prevWeightStr
                  : "...";

              const effort = getEffortFromRpe(set.rpe);
              const hasPrevEffort = prevRpeNum && prevRpeNum > 0;

              return (
                <View
                  key={set.id}
                  className={`mb-1.5 rounded-xl px-2 py-1.5 ${shellBg}`}
                >
                  <View className="flex-row items-center gap-2">
                    <View className="w-5 items-center">
                      {done ? (
                        <CheckCircle2 width={18} height={18} color="#16A34A" />
                      ) : (
                        <Circle
                          width={18}
                          height={18}
                          color={circleIdleColor}
                        />
                      )}
                    </View>

                    {/* Reps */}
                    <View className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5">
                      <TextInput
                        className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
                        keyboardType="numeric"
                        placeholder={repsPlaceholder}
                        placeholderTextColor="#9CA3AF"
                        value={repsValue}
                        onChangeText={(text) =>
                          updateSetField(set.id, "reps", text)
                        }
                        onEndEditing={() => onSetCommit?.(set.id)}
                      />
                    </View>

                    {/* Load */}
                    <View className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5">
                      <TextInput
                        className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
                        keyboardType="numeric"
                        placeholder={weightPlaceholder.toString()}
                        placeholderTextColor="#9CA3AF"
                        value={loadValue}
                        onChangeText={(text) =>
                          updateSetField(set.id, "loadValue", text)
                        }
                        onEndEditing={() => onSetCommit?.(set.id)}
                      />
                    </View>

                    {/* Effort (mapped to RPE 5/7/10) */}
                    <Pressable
                      onPress={() => cycleEffort(set)}
                      hitSlop={8}
                      className="w-20 flex-row items-center justify-center gap-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5"
                    >
                      {renderEffortIcon(effort.id, true)}
                      <Text className="text-[9px] text-neutral-900 dark:text-neutral-50">
                        {effort.label}
                      </Text>
                    </Pressable>
                  </View>

                  {/* reps meter + tiny numeric goal */}
                  {prevRepsNum && prevRepsNum > 0 && (
                    <View className="mt-1 flex-row items-center">
                      <View className="flex-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <View
                          className={`h-full ${barClass}`}
                          style={{
                            width: `${clamped * 100}%`,
                          }}
                        />
                      </View>
                      {goalLabel && (
                        <Text className="ml-2 text-[10px] text-neutral-500 dark:text-neutral-400">
                          {goalLabel}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* optional tiny hint if template had RPE but user hasn't touched effort */}
                  {hasPrevEffort && set.rpe == null && (
                    <Text className="mt-0.5 text-[9px] text-neutral-400 dark:text-neutral-500">
                      target {prevRpeNum}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* minimal add button */}
          <Pressable
            onPress={addSet}
            className="mt-2 self-end h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
          >
            <Text className="text-[14px] text-neutral-700 dark:text-neutral-200">
              +
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
