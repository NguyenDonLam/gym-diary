// apps/mobile/app/session-workout/[id].tsx

import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SessionExercise } from "@/src/features/session-exercise/domain/types";
import { SessionSet } from "@/src/features/session-set/domain/types";
import { generateId } from "@/src/lib/id";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";

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

// UI view-model type: domain + local UI flag
type SessionExerciseView = SessionExercise & {
  isOpen?: boolean;
};

// Load a stored session from DB and project into view-model
async function getInitialExercisesFromSession(
  sessionId: string
): Promise<SessionExerciseView[]> {
  try {
    await AsyncStorage.setItem("ongoing", sessionId);
  } catch (e) {
    console.log("[session] failed to store ongoing id", e);
  }

  const session = await sessionWorkoutRepository.get(sessionId);
  console.log("[session] loaded session", sessionId, session);

  if (!session || !session.exercises) return [];

  // just copy domain exercises, add local UI flag
  return session.exercises.map((ex) => ({
    ...ex,
    isOpen: true,
  }));
}

export default function SessionWorkoutPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const [exercises, setExercises] = useState<SessionExerciseView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawId = params.id;
    const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const rows = await getInitialExercisesFromSession(sessionId);
        if (cancelled) return;
        setExercises(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

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
    field: keyof Pick<SessionSet, "reps" | "loadValue" | "rpe">,
    value: string
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const nextSets = (ex.sets ?? []).map((s) => {
          if (s.id !== setId) return s;

          if (field === "reps") {
            const num = value.trim() === "" ? null : Number(value);
            return { ...s, reps: Number.isNaN(num) ? null : num };
          }

          if (field === "rpe") {
            const num = value.trim() === "" ? null : Number(value);
            return { ...s, rpe: Number.isNaN(num) ? null : num };
          }

          // loadValue
          return { ...s, loadValue: value.trim() === "" ? null : value };
        });

        return { ...ex, sets: nextSets };
      })
    );
  };

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const currentSets = ex.sets ?? [];
        const nextOrderIndex = currentSets.length;
        const now = new Date();

        const newSet: SessionSet = {
          id: generateId(),
          sessionExerciseId: ex.id,
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
          ...ex,
          isOpen: true,
          sets: [...currentSets, newSet],
        };
      })
    );
  };

  const rawId = params.id;
  const sessionId = Array.isArray(rawId) ? rawId[0] : rawId;

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
            {sessionId ?? "Session"}
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
        {loading && exercises.length === 0 && (
          <Text className="text-center text-[12px] text-neutral-500">
            Loading…
          </Text>
        )}

        {!loading && exercises.length === 0 && (
          <Text className="mt-4 text-center text-[12px] text-neutral-500">
            No exercises in this session.
          </Text>
        )}

        {exercises.map((ex) => {
          const sets = ex.sets ?? [];
          const isSetDone = (s: SessionSet) =>
            s.reps !== null &&
            s.reps > 0 &&
            s.loadValue !== null &&
            s.loadValue.trim() !== "" &&
            s.rpe !== null;

          const completedCount = sets.filter(isSetDone).length;
          const totalSets = sets.length;
          const colors = getExerciseCardColors(completedCount, totalSets);

          const exerciseLabel =
            ex.exerciseName ??
            ex.exerciseId ??
            ex.templateExerciseId ??
            "Exercise";

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
              {ex.isOpen && (
                <View className="border-t border-neutral-200 px-3 pt-2 pb-2">
                  {ex.note ? (
                    <Text className="mb-2 text-[11px] text-neutral-500">
                      {ex.note}
                    </Text>
                  ) : null}

                  <View>
                    {sets.map((set, idx) => {
                      const done = isSetDone(set);
                      const tpl = set.templateSet;

                      const prevRepsNum =
                        tpl && tpl.targetReps != null ? tpl.targetReps : null;
                      const prevWeightStr = tpl?.loadValue ?? "";
                      const prevRpeNum =
                        tpl && tpl.targetRpe != null ? tpl.targetRpe : null;

                      const currentRepsNum = set.reps ?? 0;

                      let clamped = 0;
                      let barClass = "bg-neutral-300";
                      let goalLabel: string | null = null;

                      if (prevRepsNum && prevRepsNum > 0) {
                        const goal = prevRepsNum + 1;
                        const current = currentRepsNum ?? 0;
                        let ratio = current / goal;
                        if (!isFinite(ratio) || ratio < 0) ratio = 0;
                        clamped = Math.max(0, Math.min(ratio, 1));

                        if (current === 0) {
                          barClass = "bg-neutral-300";
                        } else if (current < prevRepsNum) {
                          barClass = "bg-amber-400";
                        } else if (current === prevRepsNum) {
                          barClass = "bg-sky-500";
                        } else if (current >= goal) {
                          barClass = "bg-emerald-500";
                        } else {
                          barClass = "bg-emerald-400";
                        }

                        goalLabel = `${goal} reps`;
                      }

                      const repsValue =
                        set.reps === null ? "" : String(set.reps);
                      const loadValue = set.loadValue ?? "";
                      const rpeValue = set.rpe === null ? "" : String(set.rpe);

                      const repsPlaceholder =
                        prevRepsNum && prevRepsNum > 0
                          ? String(prevRepsNum)
                          : "Reps";
                      const weightPlaceholder =
                        prevWeightStr && prevWeightStr.length > 0
                          ? prevWeightStr
                          : "Weight";
                      const rpePlaceholder =
                        prevRpeNum && prevRpeNum > 0
                          ? String(prevRpeNum)
                          : "RPE";

                      return (
                        <View
                          key={set.id}
                          className="mb-1.5 rounded-xl bg-white px-3 py-1.5"
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
                                    color="#9CA3AF"
                                  />
                                )}
                              </View>

                              <Text className="text-[11px] text-neutral-500">
                                Set {idx + 1}
                              </Text>
                            </View>

                            {prevRepsNum && (
                              <View className="flex-row items-center rounded-full bg-neutral-100 px-2 py-0.5">
                                <Text className="text-[10px] text-neutral-600 mr-1">
                                  {prevRepsNum}
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
                              placeholder={repsPlaceholder}
                              placeholderTextColor="#9CA3AF"
                              value={repsValue}
                              onChangeText={(text) =>
                                updateSetField(ex.id, set.id, "reps", text)
                              }
                            />

                            <TextInput
                              className="mx-1 flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-[12px] text-neutral-900"
                              keyboardType="numeric"
                              placeholder={weightPlaceholder}
                              placeholderTextColor="#9CA3AF"
                              value={loadValue}
                              onChangeText={(text) =>
                                updateSetField(ex.id, set.id, "loadValue", text)
                              }
                            />

                            <TextInput
                              className="ml-1 w-14 rounded-lg border border-neutral-200 px-2 py-1 text-[12px] text-neutral-900"
                              keyboardType="numeric"
                              placeholder={rpePlaceholder}
                              placeholderTextColor="#9CA3AF"
                              value={rpeValue}
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
