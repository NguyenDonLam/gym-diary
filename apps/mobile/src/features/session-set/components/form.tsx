// apps/mobile/app/session-workout/session-set-row.tsx

import React, { useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { CheckCircle2, Circle, Wind, Gauge, Flame } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionSet } from "@/src/features/session-set/domain/types";

const EFFORT_LEVELS = [
  { id: "light", label: "Light", rpe: 5 },
  { id: "medium", label: "Medium", rpe: 7 },
  { id: "intense", label: "Intense", rpe: 10 },
] as const;

function getEffortFromRpe(rpe: number | null | undefined) {
  if (!rpe) return EFFORT_LEVELS[1];
  const found = EFFORT_LEVELS.find((lvl) => lvl.rpe === rpe);
  return found ?? EFFORT_LEVELS[1];
}

function renderEffortIcon(
  id: (typeof EFFORT_LEVELS)[number]["id"],
  color: string
) {
  const size = 14;
  if (id === "light") return <Wind size={size} color={color} />;
  if (id === "medium") return <Gauge size={size} color={color} />;
  return <Flame size={size} color={color} />;
}

type Props = {
  value: SessionSet;
  setValue: (next: SessionSet) => void;
  onSetCommit?: (set: SessionSet) => void; // this should persist the set to DB
};

export function SessionSetRow({ value, setValue, onSetCommit }: Props) {
  const { colorScheme } = useColorScheme();
  const circleIdleColor = colorScheme === "dark" ? "#6B7280" : "#9CA3AF";
  const activeIcon = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const shellBg = colorScheme === "dark" ? "bg-neutral-900/80" : "bg-white";

  const repsRef = React.useRef<TextInput | null>(null);

  const tpl = value.setProgram;

  const programTargetReps =
    tpl && tpl.targetQuantity != null ? tpl.targetQuantity : null;

  const rawPrevWeight = tpl?.loadValue ?? null;
  const prevWeightStr =
    rawPrevWeight !== null && rawPrevWeight !== undefined
      ? String(rawPrevWeight)
      : "";

  const repsValue =
    value.targetQuantity === null ? "" : String(value.targetQuantity);
  const loadValue = value.loadValue ?? "";

  const repsPlaceholder =
    programTargetReps && programTargetReps > 0
      ? String(programTargetReps)
      : "...";

  const weightPlaceholder =
    prevWeightStr && prevWeightStr.length > 0 ? prevWeightStr : "...";

  const isDone =
    value.targetQuantity !== null &&
    value.loadValue !== null &&
    value.loadValue.trim() !== "" &&
    value.rpe !== null;

  // one effect: debounce-save ONLY when the row is done
  const skipFirstRef = useRef(true);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }

    // cancel any pending save
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }

    // only commit when done
    if (!isDone) return;

    tRef.current = setTimeout(() => {
      onSetCommit?.(value);
      tRef.current = null;
    }, 500);

    return () => {
      if (tRef.current) {
        clearTimeout(tRef.current);
        tRef.current = null;
      }
    };
  }, [
    isDone,
    value.targetQuantity,
    value.loadValue,
    value.rpe,
    value.isWarmup,
    value.note,
    value.id,
    onSetCommit,
  ]);

  const fillRepsFromProgram = () => {
    if (programTargetReps == null || programTargetReps <= 0) return;
    setValue({ ...value, targetQuantity: programTargetReps });
  };

  const onChangeReps = (raw: string) => {
    const trimmed = raw.trim();
    const num = trimmed === "" ? null : Number(trimmed);
    setValue({
      ...value,
      targetQuantity: num === null || Number.isNaN(num) ? null : num,
    });
  };

  const onChangeLoad = (raw: string) => {
    const trimmed = raw.trim();
    setValue({ ...value, loadValue: trimmed === "" ? null : raw });
  };

  const cycleEffort = () => {
    const currentRpe = value.rpe ?? EFFORT_LEVELS[1].rpe;
    const idx = EFFORT_LEVELS.findIndex((lvl) => lvl.rpe === currentRpe);
    const nextIdx = idx === -1 ? 1 : (idx + 1) % EFFORT_LEVELS.length;
    const next = EFFORT_LEVELS[nextIdx];
    setValue({ ...value, rpe: next.rpe });
  };

  const effort = getEffortFromRpe(value.rpe);

  let clamped = 0;
  let barClass = "bg-neutral-300 dark:bg-neutral-700";

  if (programTargetReps && programTargetReps > 0) {
    const goal = programTargetReps + 1;
    const current = value.targetQuantity ?? 0;

    let ratio = current / goal;
    if (!isFinite(ratio) || ratio < 0) ratio = 0;
    clamped = Math.max(0, Math.min(ratio, 1));

    if (current === 0) barClass = "bg-neutral-300 dark:bg-neutral-700";
    else if (current < programTargetReps)
      barClass = "bg-amber-400 dark:bg-amber-500";
    else if (current === programTargetReps)
      barClass = "bg-sky-500 dark:bg-sky-500";
    else barClass = "bg-emerald-500 dark:bg-emerald-500";
  }

  return (
    <View className={`mb-1.5 rounded-xl px-2 py-1.5 ${shellBg}`}>
      <View className="flex-row items-center gap-2">
        {/* Left status icon: tap to autofill reps from program target */}
        <Pressable
          onPress={fillRepsFromProgram}
          hitSlop={10}
          className="w-5 items-center"
        >
          {isDone ? (
            <CheckCircle2 width={18} height={18} color="#16A34A" />
          ) : (
            <Circle width={18} height={18} color={circleIdleColor} />
          )}
        </Pressable>

        {/* Reps */}
        <Pressable
          onPress={() => repsRef.current?.focus()}
          className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5"
        >
          <TextInput
            ref={repsRef}
            className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType="numeric"
            placeholder={repsPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={repsValue}
            onChangeText={onChangeReps}
            onEndEditing={() => onSetCommit?.(value)} // still commit edits after done
          />
        </Pressable>

        {/* Load */}
        <View className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5">
          <TextInput
            className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType="numeric"
            placeholder={weightPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={loadValue}
            onChangeText={onChangeLoad}
            onEndEditing={() => onSetCommit?.(value)}
          />
        </View>

        {/* Effort */}
        <Pressable
          onPress={cycleEffort}
          hitSlop={8}
          className="w-20 flex-row items-center justify-center gap-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-1.5 py-0.5"
        >
          {renderEffortIcon(effort.id, activeIcon)}
          <Text className="text-[9px] text-neutral-900 dark:text-neutral-50">
            {effort.label}
          </Text>
        </Pressable>
      </View>

      {programTargetReps && programTargetReps > 0 && (
        <View className="mt-1 flex-row items-center">
          <View className="flex-1 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <View
              className={`h-full ${barClass}`}
              style={{ width: `${clamped * 100}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
