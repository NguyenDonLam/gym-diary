// apps/mobile/app/session-workout/session-set-row.tsx

import React, { useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { CheckCircle2, Circle, Wind, Gauge, Flame } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionSet } from "@/src/features/session-set/domain/types";
import { useOngoingSession } from "../../session-workout/hooks/use-ongoing-session";

const EFFORT_LEVELS = [
  { id: "light", label: "Light", rpe: 5 },
  { id: "medium", label: "Medium", rpe: 7 },
  { id: "intense", label: "Intense", rpe: 10 },
] as const;

function getEffortFromRpe(rpe: number | null | undefined) {
  if (rpe == null) return EFFORT_LEVELS[1];
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
  onSetCommit?: (set: SessionSet) => void;
  readOnly?: boolean;
};

export function SessionSetRow({
  value,
  setValue,
  onSetCommit,
  readOnly = false,
}: Props) {
  const { colorScheme } = useColorScheme();
  const circleIdleColor = colorScheme === "dark" ? "#6B7280" : "#9CA3AF";
  const activeIcon = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const shellBg = colorScheme === "dark" ? "bg-neutral-900/80" : "bg-white";
  const { aggregate, getContextForSet } = useOngoingSession();

  const repsRef = useRef<TextInput | null>(null);

  // always mutate from latest to avoid stale overwrites
  const latestRef = useRef<SessionSet>(value);
  useEffect(() => {
    latestRef.current = value;
  }, [value]);

  const tpl = value.setProgram;

  const programTarget =
    tpl && tpl.targetQuantity != null && tpl.targetQuantity > 0
      ? tpl.targetQuantity
      : null;

  const repsPlaceholder = programTarget != null ? String(programTarget) : "...";

  const prevWeightStr =
    tpl?.loadValue != null && String(tpl.loadValue).trim() !== ""
      ? String(tpl.loadValue).trim()
      : "";
  const weightPlaceholder = prevWeightStr !== "" ? prevWeightStr : "...";

  const repsValue = value.quantity == null ? "" : String(value.quantity);
  const loadValue = value.loadValue ?? "";

  // IMPORTANT: placeholders do NOT count. Only real loadValue counts.
  const isValid = (v: SessionSet) =>
    v.quantity != null &&
    v.loadValue != null &&
    v.loadValue.trim() !== "" &&
    v.rpe != null;

  const showCompleted = value.isCompleted === true;

  const apply = (patch: Partial<SessionSet>) => {
    if (readOnly) return latestRef.current;
    const next: SessionSet = { ...latestRef.current, ...patch };
    latestRef.current = next;
    setValue(next);
    return next;
  };

  // ensure rpe is real (UI shows a default, but state might still be null)
  const ensureRpeDefault = (v: SessionSet): SessionSet => {
    if (v.rpe != null) return v;
    if (readOnly) return v; // do not mutate in readOnly mode
    const next: SessionSet = { ...v, rpe: EFFORT_LEVELS[1].rpe };
    latestRef.current = next;
    setValue(next);
    return next;
  };

  // marks completed ONLY when fields are actually filled (esp. loadValue)
  const commitIfValid = () => {
    if (readOnly) return;

    const v0 = latestRef.current;
    const v = ensureRpeDefault(v0);

    if (!isValid(v)) return;

    const finalSet = v.isCompleted ? v : { ...v, isCompleted: true };

    const update = aggregate?.upsertSet(finalSet, getContextForSet(finalSet));

    const nextSet: SessionSet =
      update?.setScore == null
        ? finalSet
        : {
            ...finalSet,
            e1rm: update.setScore,
            e1rmVersion: aggregate?.version ?? -1,
          };

    if (!v.isCompleted || nextSet !== v0) {
      latestRef.current = nextSet;
      setValue(nextSet);
    }

    onSetCommit?.(nextSet);
  };

  const fillFromTarget = () => {
    if (readOnly) return;
    if (programTarget == null) return;
    apply({ quantity: programTarget });
    setTimeout(commitIfValid, 0);
  };

  const onChangeReps = (raw: string) => {
    if (readOnly) return;
    const trimmed = raw.trim();
    const num = trimmed === "" ? null : Number(trimmed);
    apply({ quantity: num === null || Number.isNaN(num) ? null : num });
  };

  const onChangeLoad = (raw: string) => {
    if (readOnly) return;
    const trimmed = raw.trim();
    apply({ loadValue: trimmed === "" ? null : trimmed });
  };

  const cycleEffort = () => {
    if (readOnly) return;

    const v = latestRef.current;
    const currentRpe = v.rpe ?? EFFORT_LEVELS[1].rpe;
    const idx = EFFORT_LEVELS.findIndex((lvl) => lvl.rpe === currentRpe);
    const nextIdx = idx === -1 ? 1 : (idx + 1) % EFFORT_LEVELS.length;
    const nextLvl = EFFORT_LEVELS[nextIdx];

    apply({ rpe: nextLvl.rpe });
    setTimeout(commitIfValid, 0);
  };

  const effort = getEffortFromRpe(value.rpe);

  return (
    <View
      className={`mb-1.5 rounded-xl px-2 py-1.5 ${shellBg} ${readOnly ? "opacity-70" : ""}`}
    >
      <View className="flex-row items-center gap-2">
        {/* Left status icon: tap to autofill reps with target */}
        <Pressable
          disabled={readOnly}
          onPress={fillFromTarget}
          hitSlop={10}
          className="w-5 items-center"
        >
          {showCompleted ? (
            <CheckCircle2 width={18} height={18} color="#16A34A" />
          ) : (
            <Circle width={18} height={18} color={circleIdleColor} />
          )}
        </Pressable>

        {/* Reps */}
        <Pressable
          disabled={readOnly}
          onPress={() => repsRef.current?.focus()}
          className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5"
        >
          <TextInput
            ref={repsRef}
            className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType="numeric"
            editable={!readOnly}
            placeholder={repsPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={repsValue}
            onChangeText={onChangeReps}
            onEndEditing={commitIfValid}
          />
        </Pressable>

        {/* Load */}
        <View className="flex-1 rounded-xl bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5">
          <TextInput
            className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType="numeric"
            editable={!readOnly}
            placeholder={weightPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={loadValue}
            onChangeText={onChangeLoad}
            onEndEditing={commitIfValid}
          />
        </View>

        {/* Effort */}
        <Pressable
          disabled={readOnly}
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
    </View>
  );
}
