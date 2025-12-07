// apps/mobile/app/session-workout/[id].tsx

import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
} from "lucide-react-native";

type SetRow = {
  id: string;
  index: number;

  // current session
  reps: string;
  weight: string;
  rpe: string;

  // last session snapshot
  prevReps?: string | null;
  prevWeight?: string | null;
  prevRpe?: string | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  note?: string;
  isOpen: boolean;
  sets: SetRow[];
};

function getExerciseCardColors(completedCount: number, totalSets: number) {
  if (totalSets <= 0) {
    return {
      containerBg: "bg-neutral-50",
      containerBorder: "border-neutral-200",
      statusText: "text-neutral-500",
      statusPillBg: "bg-neutral-100",
    };
  }

  const ratio = completedCount / totalSets;

  if (ratio === 0) {
    return {
      containerBg: "bg-red-50",
      containerBorder: "border-red-400",
      statusText: "text-red-700",
      statusPillBg: "bg-red-100",
    };
  }

  if (ratio < 1) {
    return {
      containerBg: "bg-amber-50",
      containerBorder: "border-amber-300",
      statusText: "text-amber-700",
      statusPillBg: "bg-amber-100",
    };
  }

  return {
    containerBg: "bg-emerald-50",
    containerBorder: "border-emerald-400",
    statusText: "text-emerald-700",
    statusPillBg: "bg-emerald-100",
  };
}

export default function SessionWorkoutPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // prev* are sample values; wire them from DB/service later
  const [exercises, setExercises] = useState<ExerciseRow[]>([
    {
      id: "ex1",
      name: "Bench press",
      note: "Example exercise. Wire to real session data later.",
      isOpen: true,
      sets: [
        {
          id: "ex1s1",
          index: 1,
          reps: "",
          weight: "",
          rpe: "",
          prevReps: "8",
          prevWeight: "60",
          prevRpe: "8",
        },
        {
          id: "ex1s2",
          index: 2,
          reps: "",
          weight: "",
          rpe: "",
          prevReps: "8",
          prevWeight: "60",
          prevRpe: "8",
        },
      ],
    },
    {
      id: "ex2",
      name: "Squat",
      isOpen: false,
      sets: [
        {
          id: "ex2s1",
          index: 1,
          reps: "",
          weight: "",
          rpe: "",
          prevReps: "5",
          prevWeight: "100",
          prevRpe: "7",
        },
        {
          id: "ex2s2",
          index: 2,
          reps: "",
          weight: "",
          rpe: "",
          prevReps: "5",
          prevWeight: "100",
          prevRpe: "7",
        },
      ],
    },
  ]);

  const toggleExerciseOpen = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, isOpen: !ex.isOpen } : ex
      )
    );
  };

  const updateSetField = (
    exerciseId: string,
    setId: string,
    field: keyof Pick<SetRow, "reps" | "weight" | "rpe">,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
      )
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const nextIndex = ex.sets.length + 1;
        return {
          ...ex,
          isOpen: true,
          sets: [
            ...ex.sets,
            {
              id: `${exerciseId}-s${nextIndex}`,
              index: nextIndex,
              reps: "",
              weight: "",
              rpe: "",
            },
          ],
        };
      })
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-200">
        <Pressable onPress={() => router.back()} hitSlop={10} className="mr-2">
          <ChevronLeft width={20} height={20} color="#111827" />
        </Pressable>

        <View className="flex-1 mr-2">
          <Text className="text-[11px] text-neutral-500">Session</Text>
          <Text
            className="text-base font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {id ?? "New session"}
          </Text>
        </View>

        <Pressable className="rounded-full bg-neutral-900 px-3 py-1.5">
          <Text className="text-[12px] font-semibold text-white">Finish</Text>
        </Pressable>
      </View>

      {/* Body */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
      >
        {exercises.map((ex) => {
          const sets = ex.sets ?? [];
          const isSetDone = (s: SetRow) =>
            !!(s.reps.trim() && s.weight.trim() && s.rpe.trim());

          const completedCount = sets.filter(isSetDone).length;
          const totalSets = sets.length;
          const colors = getExerciseCardColors(completedCount, totalSets);

          return (
            <View
              key={ex.id}
              className={`mb-3 rounded-2xl border ${colors.containerBorder} ${colors.containerBg}`}
            >
              {/* Exercise header */}
              <Pressable
                onPress={() => toggleExerciseOpen(ex.id)}
                className="flex-row items-center justify-between px-3 py-2"
              >
                <View className="flex-row items-center flex-1">
                  {ex.isOpen ? (
                    <ChevronDown width={16} height={16} color="#4B5563" />
                  ) : (
                    <ChevronRight width={16} height={16} color="#4B5563" />
                  )}

                  <View className="ml-2 flex-1">
                    <Text
                      className="text-sm font-semibold text-neutral-900"
                      numberOfLines={1}
                    >
                      {ex.name}
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
              {ex.isOpen && (
                <View className="border-t border-neutral-200 px-3 pt-2 pb-2">
                  {ex.note ? (
                    <Text className="mb-2 text-[11px] text-neutral-500">
                      {ex.note}
                    </Text>
                  ) : null}

                  <View>
                    {sets.map((set) => {
                      const done = isSetDone(set);

                      const prevRepsNum = set.prevReps
                        ? Number(set.prevReps)
                        : null;
                      const currentRepsNum = set.reps ? Number(set.reps) : null;

                      let clamped = 0;
                      let barClass = "bg-neutral-300";
                      let goalLabel: string | null = null;

                      if (prevRepsNum && prevRepsNum > 0) {
                        const goal = prevRepsNum + 1; // last + 1
                        const current = currentRepsNum ?? 0;
                        let ratio = current / goal;
                        if (!isFinite(ratio) || ratio < 0) ratio = 0;
                        clamped = Math.max(0, Math.min(ratio, 1));

                        if (current === 0) {
                          barClass = "bg-neutral-300";
                        } else if (current < prevRepsNum) {
                          barClass = "bg-amber-400"; // under last
                        } else if (current === prevRepsNum) {
                          barClass = "bg-sky-500"; // matched last
                        } else if (current >= goal) {
                          barClass = "bg-emerald-500"; // hit or beat goal
                        } else {
                          barClass = "bg-emerald-400"; // between last and goal
                        }

                        goalLabel = `${goal} reps`;
                      }

                      return (
                        <View
                          key={set.id}
                          className="mb-1.5 rounded-xl bg-white px-3 py-1.5"
                        >
                          {/* top row: indicator + set label + small last chip */}
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
                                    color="#9CA3AF"
                                  />
                                )}
                              </View>

                              <Text className="text-[11px] text-neutral-500">
                                Set {set.index}
                              </Text>
                            </View>

                            {set.prevReps && (
                              <View className="flex-row items-center rounded-full bg-neutral-100 px-2 py-0.5">
                                <Text className="text-[10px] text-neutral-600 mr-1">
                                  {set.prevReps}
                                </Text>
                                <Text className="text-[9px] text-neutral-400">
                                  last
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* inputs row */}
                          <View className="mt-1 flex-row items-center">
                            <TextInput
                              className="mx-1 flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-[12px] text-neutral-900"
                              keyboardType="numeric"
                              placeholder={set.prevReps ? set.prevReps : "Reps"}
                              placeholderTextColor="#9CA3AF"
                              value={set.reps}
                              onChangeText={(text) =>
                                updateSetField(ex.id, set.id, "reps", text)
                              }
                            />

                            <TextInput
                              className="mx-1 flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-[12px] text-neutral-900"
                              keyboardType="numeric"
                              placeholder={
                                set.prevWeight ? set.prevWeight : "Weight"
                              }
                              placeholderTextColor="#9CA3AF"
                              value={set.weight}
                              onChangeText={(text) =>
                                updateSetField(ex.id, set.id, "weight", text)
                              }
                            />

                            <TextInput
                              className="ml-1 w-14 rounded-lg border border-neutral-200 px-2 py-1 text-[12px] text-neutral-900"
                              keyboardType="numeric"
                              placeholder={set.prevRpe ? set.prevRpe : "RPE"}
                              placeholderTextColor="#9CA3AF"
                              value={set.rpe}
                              onChangeText={(text) =>
                                updateSetField(ex.id, set.id, "rpe", text)
                              }
                            />
                          </View>

                          {/* reps meter + explicit goal label */}
                          {prevRepsNum && prevRepsNum > 0 && (
                            <View className="mt-1 flex-row items-center">
                              <View className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                <View
                                  className={`h-full ${barClass}`}
                                  style={{
                                    width: `${clamped * 100}%`,
                                  }}
                                />
                              </View>
                              {goalLabel && (
                                <Text className="ml-2 text-[10px] text-neutral-500">
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
                    onPress={() => addSet(ex.id)}
                    className="mt-2 self-start rounded-full border border-dashed border-neutral-300 px-3 py-1"
                  >
                    <Text className="text-[11px] text-neutral-600">
                      + Add set
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
