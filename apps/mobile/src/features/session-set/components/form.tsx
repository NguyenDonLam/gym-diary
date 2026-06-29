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
const DEFAULT_EFFORT = EFFORT_LEVELS[2];

const LOAD_UNIT_OPTIONS: { id: SessionSet["loadUnit"]; label: string }[] = [
  { id: "kg", label: "kg" },
  { id: "lb", label: "lb" },
  { id: "band", label: "band" },
  { id: "custom", label: "custom" },
];

const BAND_OPTIONS = [
  {
    id: "green",
    label: "Green",
    dotClass: "bg-emerald-500 dark:bg-emerald-300",
  },
  {
    id: "purple",
    label: "Purple",
    dotClass: "bg-violet-500 dark:bg-violet-300",
  },
  {
    id: "black",
    label: "Black",
    dotClass: "bg-neutral-900 dark:bg-neutral-50",
  },
  {
    id: "red",
    label: "Red",
    dotClass: "bg-red-500 dark:bg-red-300",
  },
  {
    id: "yellow",
    label: "Yellow",
    dotClass: "bg-amber-400 dark:bg-amber-300",
  },
] as const;

const KG_TO_LB = 2.2046226218;
const LB_TO_KG = 0.45359237;

function isNumericLoadUnit(unit: SessionSet["loadUnit"]) {
  return unit === "kg" || unit === "lb";
}

function getEffortFromRpe(rpe: number | null | undefined) {
  if (rpe == null) return DEFAULT_EFFORT;
  const found = EFFORT_LEVELS.find((lvl) => lvl.rpe === rpe);
  return found ?? DEFAULT_EFFORT;
}

function getNextLoadUnit(current: SessionSet["loadUnit"]) {
  const currentIndex = LOAD_UNIT_OPTIONS.findIndex((u) => u.id === current);
  if (currentIndex === -1) return LOAD_UNIT_OPTIONS[0].id;
  return LOAD_UNIT_OPTIONS[(currentIndex + 1) % LOAD_UNIT_OPTIONS.length].id;
}

function getLoadUnitLabel(unit: SessionSet["loadUnit"]) {
  return LOAD_UNIT_OPTIONS.find((u) => u.id === unit)?.label ?? String(unit);
}

function parseNumericLoad(raw: string | null | undefined): number | null {
  if (raw == null) return null;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const normalized = trimmed.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function formatNumericLoad(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function renderEffortIcon(
  id: (typeof EFFORT_LEVELS)[number]["id"],
  color: string,
) {
  const size = 16;
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
  const circleIdleColor = colorScheme === "dark" ? "#D4D4D4" : "#4B5563";
  const completedActionColor = colorScheme === "dark" ? "#052E16" : "#FFFFFF";
  const activeIcon = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const shellBg = colorScheme === "dark" ? "bg-neutral-900/80" : "bg-white";
  const { aggregate, getContextForSet } = useOngoingSession();

  const repsRef = useRef<TextInput | null>(null);

  const latestRef = useRef<SessionSet>(value);
  const rememberedNumericRef = useRef<{
    kg: string | null;
    lb: string | null;
  }>({
    kg: null,
    lb: null,
  });

  useEffect(() => {
    latestRef.current = value;

    if (!isNumericLoadUnit(value.loadUnit)) return;

    const parsed = parseNumericLoad(value.loadValue);
    if (parsed == null) return;

    if (value.loadUnit === "kg") {
      rememberedNumericRef.current.kg = formatNumericLoad(parsed);
      rememberedNumericRef.current.lb = formatNumericLoad(parsed * KG_TO_LB);
      return;
    }

    rememberedNumericRef.current.lb = formatNumericLoad(parsed);
    rememberedNumericRef.current.kg = formatNumericLoad(parsed * LB_TO_KG);
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

  const hasValidLoad = (v: SessionSet) => {
    if (v.loadValue == null) return false;

    const trimmed = v.loadValue.trim();
    if (trimmed === "") return false;

    if (!isNumericLoadUnit(v.loadUnit)) return true;

    const raw = parseNumericLoad(trimmed);
    return raw != null && raw >= 0;
  };

  const isValid = (v: SessionSet) =>
    v.quantity != null && hasValidLoad(v) && v.rpe != null;

  const showCompleted = value.isCompleted === true;

  const apply = (patch: Partial<SessionSet>) => {
    if (readOnly) return latestRef.current;
    const next: SessionSet = { ...latestRef.current, ...patch };
    latestRef.current = next;
    setValue(next);
    return next;
  };

  const ensureRpeDefault = (v: SessionSet): SessionSet => {
    if (v.rpe != null) return v;
    if (readOnly) return v;
    const next: SessionSet = { ...v, rpe: DEFAULT_EFFORT.rpe };
    latestRef.current = next;
    setValue(next);
    return next;
  };

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

  const completeSet = () => {
    if (readOnly) return;

    if (programTarget != null && latestRef.current.quantity == null) {
      apply({ quantity: programTarget });
    }

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

    const unit = latestRef.current.loadUnit;

    if (unit === "kg" || unit === "lb") {
      let cleaned = raw.replace(/[^0-9.,]/g, "");
      const firstDot = cleaned.search(/[.,]/);
      if (firstDot !== -1) {
        const head = cleaned.slice(0, firstDot + 1);
        const tail = cleaned.slice(firstDot + 1).replace(/[.,]/g, "");
        cleaned = head + tail;
      }

      const nextValue = cleaned === "" ? null : cleaned;
      apply({ loadValue: nextValue });

      const parsed = parseNumericLoad(nextValue);
      if (parsed != null) {
        if (unit === "kg") {
          rememberedNumericRef.current.kg = formatNumericLoad(parsed);
          rememberedNumericRef.current.lb = formatNumericLoad(
            parsed * KG_TO_LB,
          );
        } else {
          rememberedNumericRef.current.lb = formatNumericLoad(parsed);
          rememberedNumericRef.current.kg = formatNumericLoad(
            parsed * LB_TO_KG,
          );
        }
      }
      return;
    }

    apply({ loadValue: raw.trim() === "" ? null : raw });
  };

  const getRememberedNumericValue = (targetUnit: "kg" | "lb") => {
    const hit = rememberedNumericRef.current[targetUnit];
    return hit ?? "0";
  };

  const cycleLoadUnit = () => {
    if (readOnly) return;

    const current = latestRef.current;
    const nextUnit = getNextLoadUnit(current.loadUnit);

    let nextLoadValue: string | null;

    if (current.loadUnit === "kg" || current.loadUnit === "lb") {
      const parsed = parseNumericLoad(current.loadValue);
      if (parsed != null) {
        if (current.loadUnit === "kg") {
          rememberedNumericRef.current.kg = formatNumericLoad(parsed);
          rememberedNumericRef.current.lb = formatNumericLoad(
            parsed * KG_TO_LB,
          );
        } else {
          rememberedNumericRef.current.lb = formatNumericLoad(parsed);
          rememberedNumericRef.current.kg = formatNumericLoad(
            parsed * LB_TO_KG,
          );
        }
      }
    }

    if (nextUnit === "band") {
      nextLoadValue = BAND_OPTIONS[0].id;
    } else if (nextUnit === "custom") {
      nextLoadValue = "0";
    } else if (nextUnit === "kg") {
      nextLoadValue = getRememberedNumericValue("kg");
    } else {
      nextLoadValue = getRememberedNumericValue("lb");
    }

    apply({
      loadUnit: nextUnit,
      loadValue: nextLoadValue,
    });

    setTimeout(commitIfValid, 0);
  };

  const cycleBand = () => {
    if (readOnly) return;

    const currentId = latestRef.current.loadValue;
    const idx = BAND_OPTIONS.findIndex((b) => b.id === currentId);
    const next =
      idx === -1 || idx === BAND_OPTIONS.length - 1
        ? BAND_OPTIONS[0]
        : BAND_OPTIONS[idx + 1];

    apply({ loadValue: next.id });
    setTimeout(commitIfValid, 0);
  };

  const cycleEffort = () => {
    if (readOnly) return;

    const v = latestRef.current;
    const currentRpe = v.rpe ?? DEFAULT_EFFORT.rpe;
    const idx = EFFORT_LEVELS.findIndex((lvl) => lvl.rpe === currentRpe);
    const nextIdx = idx === -1 ? 2 : (idx + 1) % EFFORT_LEVELS.length;
    const nextLvl = EFFORT_LEVELS[nextIdx];

    apply({ rpe: nextLvl.rpe });
    setTimeout(commitIfValid, 0);
  };

  const effort = getEffortFromRpe(value.rpe);
  const isBandUnit = value.loadUnit === "band";
  const loadKeyboardType =
    value.loadUnit === "kg" || value.loadUnit === "lb"
      ? "decimal-pad"
      : "default";
  const selectedBand =
    BAND_OPTIONS.find((b) => b.id === value.loadValue) ?? BAND_OPTIONS[0];

  return (
    <View
      className={`mb-2 rounded-xl px-2.5 py-2 ${shellBg} ${readOnly ? "opacity-70" : ""}`}
    >
      <View className="flex-row items-center gap-2">
        <Pressable
          disabled={readOnly}
          accessibilityRole="button"
          accessibilityLabel={showCompleted ? "Set logged" : "Log set"}
          accessibilityState={{ disabled: readOnly, selected: showCompleted }}
          onPress={completeSet}
          className={`h-12 w-12 items-center justify-center rounded-xl border ${
            showCompleted
              ? "border-emerald-600 bg-emerald-600 dark:border-emerald-400 dark:bg-emerald-400"
              : "border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          }`}
        >
          {showCompleted ? (
            <CheckCircle2 width={24} height={24} color={completedActionColor} />
          ) : (
            <Circle width={24} height={24} color={circleIdleColor} />
          )}
        </Pressable>

        <Pressable
          disabled={readOnly}
          onPress={() => repsRef.current?.focus()}
          className="h-12 flex-1 justify-center rounded-xl bg-neutral-50 px-2 dark:bg-neutral-900"
        >
          <TextInput
            ref={repsRef}
            className="text-center text-[14px] font-semibold text-neutral-900 dark:text-neutral-50"
            keyboardType="numeric"
            editable={!readOnly}
            placeholder={repsPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={repsValue}
            onChangeText={onChangeReps}
            onEndEditing={commitIfValid}
          />
        </Pressable>

        <View className="h-12 flex-1 flex-row items-center rounded-xl bg-neutral-50 px-2 dark:bg-neutral-900">
          {isBandUnit ? (
            <Pressable
              disabled={readOnly}
              onPress={cycleBand}
              hitSlop={8}
              className="h-full flex-1 items-center justify-center"
            >
              <View
                className={`h-5 w-12 rounded-full ${selectedBand.dotClass}`}
              />
            </Pressable>
          ) : (
            <TextInput
              className="flex-1 text-center text-[14px] font-semibold text-neutral-900 dark:text-neutral-50"
              keyboardType={loadKeyboardType}
              editable={!readOnly}
              placeholder={weightPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={loadValue}
              onChangeText={onChangeLoad}
              onEndEditing={commitIfValid}
            />
          )}

          <Pressable
            disabled={readOnly}
            onPress={cycleLoadUnit}
            hitSlop={8}
            className="ml-1 h-9 min-w-[46px] items-center justify-center rounded-lg bg-neutral-200 px-2 dark:bg-neutral-800"
          >
            <Text className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-50">
              {getLoadUnitLabel(value.loadUnit)}
            </Text>
          </Pressable>
        </View>

        <Pressable
          disabled={readOnly}
          onPress={cycleEffort}
          hitSlop={8}
          className="h-12 w-[88px] flex-row items-center justify-center gap-1 rounded-xl bg-neutral-50 px-2 dark:bg-neutral-900"
        >
          {renderEffortIcon(effort.id, activeIcon)}
          <Text className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-50">
            {effort.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
