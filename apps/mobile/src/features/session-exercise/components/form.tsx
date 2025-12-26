// apps/mobile/app/session-workout/session-exercise-card.tsx

import React from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronRight, Clock3 } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { SessionSetRow } from "../../session-set/components/form";
import { SessionSetFactory } from "../../session-set/domain/factory";
import { useOngoingSession } from "../../session-workout/hooks/use-ongoing-session";

type LastSetSnapshot = {
  id: string;
  reps: number | null;
  load: string | null;
};

export type SessionExerciseView = SessionExercise & {
  isOpen?: boolean;
  lastSessionSets?: LastSetSnapshot[];
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

function replaceSet(sets: SessionSet[] | undefined, next: SessionSet) {
  const xs = sets ?? [];
  return xs.map((s) => (s.id === next.id ? next : s));
}

type Props = {
  value: SessionExerciseView;
  onChange: (next: SessionExerciseView) => void;
  onSetCommit?: (set: SessionSet) => void;
  readOnly?: boolean;
};

export function SessionExerciseCard({
  value,
  onChange,
  onSetCommit,
  readOnly = false,
}: Props) {
  const { colorScheme } = useColorScheme();
  const chevronColor = colorScheme === "dark" ? "#E5E7EB" : "#4B5563";
  const subtleIcon = colorScheme === "dark" ? "#9CA3AF" : "#6B7280";

  const sets = value.sets ?? [];
  const lastSets = value.lastSessionSets ?? [];

  const completedCount = sets.reduce(
    (acc, s) => acc + (s.isCompleted === true ? 1 : 0),
    0
  );
  const totalSets = sets.length;
  const colors = getExerciseCardColors(completedCount, totalSets);

  const { aggregate } = useOngoingSession();

  const toggleOpen = () => {
    onChange({ ...value, isOpen: !value.isOpen });
  };

  const addSet = () => {
    if (readOnly) return;

    const last = sets[sets.length - 1];

    const newSet = SessionSetFactory.create({
      sessionExerciseId: value.id,
      orderIndex: sets.length,
      loadUnit: last?.loadUnit ?? "kg",
      loadValue: last?.loadValue ?? null,
      rpe: last?.rpe ?? 7,
    });

    onChange({
      ...value,
      isOpen: true,
      sets: [...sets, newSet],
    });
  };

  return (
    <View
      className={`mb-3 rounded-2xl border ${colors.containerBorder} ${colors.containerBg}`}
    >
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
              {value.exerciseName}
            </Text>

            <View className="mt-0.5 flex-row items-center">
              <View
                className={`mr-1 rounded-full px-2 py-0.5 ${colors.statusPillBg}`}
              >
                <Text
                  className={`text-[10px] font-medium ${colors.statusText}`}
                >
                  {completedCount}/{totalSets} sets
                </Text>
              </View>
            </View>

            {lastSets.length > 0 && (
              <View className="mt-0.5 flex-row items-center justify-between">
                <View className="flex-row items-center mr-2">
                  <Clock3 width={11} height={11} color={subtleIcon} />
                  <Text className="ml-1 text-[9px] text-neutral-500 dark:text-neutral-400">
                    last
                  </Text>
                </View>

                <View className="flex-1 flex-row flex-wrap justify-end gap-1">
                  {lastSets.map((s, idx) => {
                    const repsLabel =
                      s.reps != null && s.reps > 0 ? String(s.reps) : "?";
                    const load = (s.load ?? "").trim();
                    const label =
                      load !== "" ? `${load}×${repsLabel}` : repsLabel;

                    return (
                      <View
                        key={s.id ?? String(idx)}
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

      {value.isOpen && (
        <View className="border-t border-neutral-200 dark:border-neutral-800 px-3 pt-2 pb-2">
          {value.note ? (
            <Text className="mb-2 text-[11px] text-neutral-500 dark:text-neutral-400">
              {value.note}
            </Text>
          ) : null}

          {sets.length > 0 && (
            <View className="mb-1 flex-row items-center gap-2 px-1">
              <Text className="w-5 text-[9px] text-neutral-500 dark:text-neutral-500">
                ✓
              </Text>
              <Text className="flex-1 text-center text-[9px] text-neutral-500 dark:text-neutral-500">
                Volume
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
            {sets.map((set) => (
              <SessionSetRow
                key={set.id}
                value={set}
                readOnly={readOnly}
                setValue={(next) => {
                  if (readOnly) return;
                  onChange({
                    ...value,
                    sets: replaceSet(value.sets, next),
                  });
                }}
                onSetCommit={(nextSet) => {
                  if (readOnly) return;

                  const exScore =
                    aggregate?.getExerciseScore(nextSet.sessionExerciseId) ??
                    null;

                  onChange({
                    ...value,
                    sets: replaceSet(value.sets, nextSet),
                    strengthScore: exScore,
                    strengthScoreVersion: aggregate?.version ?? -1,
                  });

                  onSetCommit?.(nextSet);
                }}
              />
            ))}
          </View>

          {!readOnly && (
            <Pressable
              onPress={addSet}
              className="mt-2 self-end h-6 w-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <Text className="text-[14px] text-neutral-700 dark:text-neutral-200">
                +
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
