// apps/mobile/app/session-workout/session-set-row.tsx

import React, { useEffect, useRef, useState } from "react";
import { AppState, View, Text, TextInput, Pressable } from "react-native";
import {
  CheckCircle2,
  Circle,
  Wind,
  Gauge,
  Flame,
  Clock3,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { SessionSet } from "@/src/features/session-set/domain/types";
import { useOngoingSession } from "../../session-workout/hooks/use-ongoing-session";
import type { QuantityUnit } from "@/db/enums";
import {
  DEFAULT_REST_SECONDS,
  formatRestDuration,
  normalizeRestSeconds,
} from "../../program-set/domain/rest";

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

function cleanSeconds(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

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
  quantityUnit?: QuantityUnit;
  onSetCommit?: (
    set: SessionSet,
    event?: { becameCompleted: boolean },
  ) => void;
  onRestStart?: (set: SessionSet) => void;
  readOnly?: boolean;
};

export function SessionSetRow({
  value,
  setValue,
  quantityUnit = "reps",
  onSetCommit,
  onRestStart,
  readOnly = false,
}: Props) {
  const { colorScheme } = useColorScheme();
  const circleIdleColor = colorScheme === "dark" ? "#D4D4D4" : "#4B5563";
  const completedActionColor = colorScheme === "dark" ? "#052E16" : "#FFFFFF";
  const activeIcon = colorScheme === "dark" ? "#F9FAFB" : "#111827";
  const shellBg = colorScheme === "dark" ? "bg-neutral-900/80" : "bg-white";
  const { aggregate, getContextForSet, recordUserInteraction } =
    useOngoingSession();

  const repsRef = useRef<TextInput | null>(null);
  const isTimeQuantity = quantityUnit === "time";
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchStartedAtMs, setStopwatchStartedAtMs] = useState<
    number | null
  >(null);
  const [stopwatchBaseSeconds, setStopwatchBaseSeconds] = useState(0);
  const [stopwatchTick, setStopwatchTick] = useState(0);

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

  const quantityPlaceholder =
    programTarget != null
      ? String(programTarget)
      : isTimeQuantity
        ? "sec"
        : "...";

  const prevWeightStr =
    tpl?.loadValue != null && String(tpl.loadValue).trim() !== ""
      ? String(tpl.loadValue).trim()
      : "";
  const weightPlaceholder = prevWeightStr !== "" ? prevWeightStr : "...";

  const quantityValue = value.quantity == null ? "" : String(value.quantity);
  const loadValue = value.loadValue ?? "";

  const hasValidLoad = (v: SessionSet) => {
    if (v.loadValue == null) return false;

    const trimmed = v.loadValue.trim();
    if (trimmed === "") return false;

    if (!isNumericLoadUnit(v.loadUnit)) return true;

    const raw = parseNumericLoad(trimmed);
    return raw != null && raw >= 0;
  };

  const hasOptionalValidLoad = (v: SessionSet) => {
    if (!isTimeQuantity) return hasValidLoad(v);
    if (v.loadValue == null || v.loadValue.trim() === "") return true;
    return hasValidLoad(v);
  };

  const hasValidQuantity = (v: SessionSet) =>
    v.quantity != null && Number.isFinite(v.quantity) && v.quantity > 0;

  const isValid = (v: SessionSet) =>
    hasValidQuantity(v) && hasOptionalValidLoad(v) && v.rpe != null;

  const showCompleted = value.isCompleted === true;
  const restSeconds = normalizeRestSeconds(value.restSeconds);

  const apply = (patch: Partial<SessionSet>) => {
    if (readOnly) return latestRef.current;
    const next: SessionSet = { ...latestRef.current, ...patch };
    latestRef.current = next;
    setValue(next);
    recordUserInteraction();
    return next;
  };

  const getCurrentStopwatchSeconds = () => {
    if (!stopwatchRunning || stopwatchStartedAtMs == null) {
      return Math.max(0, latestRef.current.quantity ?? stopwatchBaseSeconds);
    }

    const elapsed = Math.floor((Date.now() - stopwatchStartedAtMs) / 1000);
    return Math.max(0, stopwatchBaseSeconds + elapsed);
  };

  useEffect(() => {
    if (!isTimeQuantity || !stopwatchRunning || stopwatchStartedAtMs == null) {
      return;
    }

    const id = setInterval(() => {
      setStopwatchTick((tick) => tick + 1);
    }, 250);

    return () => clearInterval(id);
  }, [isTimeQuantity, stopwatchRunning, stopwatchStartedAtMs]);

  useEffect(() => {
    if (!isTimeQuantity || !stopwatchRunning || readOnly) return;

    const elapsed =
      stopwatchStartedAtMs == null
        ? 0
        : Math.floor((Date.now() - stopwatchStartedAtMs) / 1000);
    const seconds = Math.max(0, stopwatchBaseSeconds + elapsed);

    if (latestRef.current.quantity !== seconds) {
      const next: SessionSet = { ...latestRef.current, quantity: seconds };
      latestRef.current = next;
      setValue(next);
    }
  }, [
    isTimeQuantity,
    readOnly,
    setValue,
    stopwatchBaseSeconds,
    stopwatchRunning,
    stopwatchStartedAtMs,
    stopwatchTick,
  ]);

  useEffect(() => {
    if (!isTimeQuantity || !stopwatchRunning || readOnly) return;

    const syncElapsed = () => {
      const elapsed =
        stopwatchStartedAtMs == null
          ? 0
          : Math.floor((Date.now() - stopwatchStartedAtMs) / 1000);
      const seconds = Math.max(0, stopwatchBaseSeconds + elapsed);

      if (latestRef.current.quantity !== seconds) {
        const next: SessionSet = { ...latestRef.current, quantity: seconds };
        latestRef.current = next;
        setValue(next);
      }
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        syncElapsed();
      }
    });

    return () => subscription.remove();
  }, [
    isTimeQuantity,
    readOnly,
    setValue,
    stopwatchRunning,
    stopwatchStartedAtMs,
    stopwatchBaseSeconds,
  ]);

  useEffect(() => {
    if (isTimeQuantity && !readOnly) return;

    setStopwatchRunning(false);
    setStopwatchStartedAtMs(null);
    setStopwatchBaseSeconds(0);
  }, [isTimeQuantity, readOnly]);

  const ensureRpeDefault = (v: SessionSet): SessionSet => {
    if (v.rpe != null) return v;
    if (readOnly) return v;
    const next: SessionSet = { ...v, rpe: DEFAULT_EFFORT.rpe };
    latestRef.current = next;
    setValue(next);
    return next;
  };

  const commitIfValid = (options?: { allowTimeCommit?: boolean }) => {
    if (readOnly) return;
    if (isTimeQuantity && options?.allowTimeCommit !== true) return;

    const v0 = latestRef.current;
    const v = ensureRpeDefault(v0);

    if (!isValid(v)) return;

    const finalSet = v.isCompleted ? v : { ...v, isCompleted: true };
    const becameCompleted =
      v.isCompleted !== true && finalSet.isCompleted === true;

    const update = isTimeQuantity
      ? null
      : aggregate?.upsertSet(finalSet, getContextForSet(finalSet));

    const nextSet: SessionSet =
      update?.setScore == null
        ? { ...finalSet, e1rm: isTimeQuantity ? null : finalSet.e1rm }
        : {
            ...finalSet,
            e1rm: update.setScore,
            e1rmVersion: aggregate?.version ?? -1,
          };

    if (!v.isCompleted || nextSet !== v0) {
      latestRef.current = nextSet;
      setValue(nextSet);
    }

    if (isTimeQuantity) {
      setStopwatchBaseSeconds(0);
      setStopwatchStartedAtMs(null);
      setStopwatchRunning(false);
    }

    onSetCommit?.(nextSet, { becameCompleted });
  };

  const completeSet = () => {
    if (readOnly) return;

    if (isTimeQuantity && stopwatchRunning) {
      const seconds = getCurrentStopwatchSeconds();
      apply({ quantity: seconds });
      setStopwatchBaseSeconds(seconds);
      setStopwatchStartedAtMs(null);
      setStopwatchRunning(false);
      setTimeout(() => commitIfValid({ allowTimeCommit: true }), 0);
      return;
    }

    if (programTarget != null && latestRef.current.quantity == null) {
      apply({ quantity: programTarget });
    }

    setTimeout(() => commitIfValid({ allowTimeCommit: true }), 0);
  };

  const startStopwatch = () => {
    if (readOnly || !isTimeQuantity || stopwatchRunning) return;

    const baseSeconds = cleanSeconds(latestRef.current.quantity);

    setStopwatchBaseSeconds(baseSeconds);
    setStopwatchStartedAtMs(Date.now());
    setStopwatchRunning(true);
  };

  const pauseStopwatch = () => {
    if (readOnly || !isTimeQuantity || !stopwatchRunning) return;

    const seconds = getCurrentStopwatchSeconds();

    apply({ quantity: seconds });
    setStopwatchBaseSeconds(seconds);
    setStopwatchStartedAtMs(null);
    setStopwatchRunning(false);
    setTimeout(() => commitIfValid({ allowTimeCommit: true }), 0);
  };

  const resetStopwatch = () => {
    if (readOnly || !isTimeQuantity) return;

    setStopwatchBaseSeconds(0);
    setStopwatchStartedAtMs(null);
    setStopwatchRunning(false);
    apply({ quantity: null, isCompleted: false, e1rm: null });
  };

  const onChangeReps = (raw: string) => {
    if (readOnly) return;

    if (stopwatchRunning) {
      setStopwatchRunning(false);
      setStopwatchStartedAtMs(null);
    }

    const cleaned = isTimeQuantity ? raw.replace(/[^\d]/g, "") : raw.trim();
    const num = cleaned === "" ? null : Number(cleaned);
    const quantity = num === null || Number.isNaN(num) ? null : num;

    setStopwatchBaseSeconds(Math.max(0, quantity ?? 0));
    apply({ quantity });
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

    if (!isTimeQuantity) {
      setTimeout(commitIfValid, 0);
    }
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
    if (!isTimeQuantity) {
      setTimeout(commitIfValid, 0);
    }
  };

  const cycleEffort = () => {
    if (readOnly) return;

    const v = latestRef.current;
    const currentRpe = v.rpe ?? DEFAULT_EFFORT.rpe;
    const idx = EFFORT_LEVELS.findIndex((lvl) => lvl.rpe === currentRpe);
    const nextIdx = idx === -1 ? 2 : (idx + 1) % EFFORT_LEVELS.length;
    const nextLvl = EFFORT_LEVELS[nextIdx];

    apply({ rpe: nextLvl.rpe });
    if (!isTimeQuantity) {
      setTimeout(commitIfValid, 0);
    }
  };

  const effort = getEffortFromRpe(value.rpe);
  const isBandUnit = value.loadUnit === "band";
  const loadKeyboardType =
    value.loadUnit === "kg" || value.loadUnit === "lb"
      ? "decimal-pad"
      : "default";
  const selectedBand =
    BAND_OPTIONS.find((b) => b.id === value.loadValue) ?? BAND_OPTIONS[0];
  const hasStopwatchValue = cleanSeconds(value.quantity) > 0;
  const timerButtonIsReset = !stopwatchRunning && hasStopwatchValue;
  const timerButtonColor =
    timerButtonIsReset || readOnly
      ? activeIcon
      : colorScheme === "dark"
        ? "#282A36"
        : "#FFFFFF";
  const handleTimerPress = () => {
    if (stopwatchRunning) {
      pauseStopwatch();
      return;
    }

    if (hasStopwatchValue) {
      resetStopwatch();
      return;
    }

    startStopwatch();
  };

  const handleRestStart = () => {
    if (readOnly || restSeconds <= 0) return;
    onSetCommit?.(latestRef.current, { becameCompleted: false });
    onRestStart?.(latestRef.current);
  };

  const handleChangeRestSeconds = (raw: string) => {
    if (readOnly) return;

    const cleaned = raw.replace(/[^\d]/g, "");
    const nextRestSeconds =
      cleaned === "" ? 0 : Math.max(0, Number.parseInt(cleaned, 10));

    apply({ restSeconds: nextRestSeconds });
  };

  const commitRestSeconds = () => {
    if (readOnly) return;
    onSetCommit?.(latestRef.current, { becameCompleted: false });
  };

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

        <View className="h-12 flex-1 flex-row items-center rounded-xl bg-neutral-50 px-2 dark:bg-neutral-900">
          <TextInput
            ref={repsRef}
            className="min-w-0 flex-1 text-center text-[14px] font-semibold text-neutral-900 dark:text-neutral-50"
            keyboardType={isTimeQuantity ? "number-pad" : "numeric"}
            editable={!readOnly}
            placeholder={quantityPlaceholder}
            placeholderTextColor="#9CA3AF"
            value={quantityValue}
            onChangeText={onChangeReps}
            onEndEditing={() => commitIfValid()}
          />

          {isTimeQuantity ? (
            <>
              <Text className="mx-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                s
              </Text>

              <Pressable
                disabled={readOnly}
                onPress={handleTimerPress}
                hitSlop={6}
                className={`ml-1 h-9 w-8 items-center justify-center rounded-lg ${
                  timerButtonIsReset || readOnly
                    ? "bg-neutral-200 dark:bg-neutral-800"
                    : "bg-neutral-900 dark:bg-[#BD93F9]"
                }`}
              >
                {stopwatchRunning ? (
                  <Pause size={14} color={timerButtonColor} />
                ) : timerButtonIsReset ? (
                  <RotateCcw size={13} color={timerButtonColor} />
                ) : (
                  <Play size={14} color={timerButtonColor} />
                )}
              </Pressable>
            </>
          ) : null}
        </View>

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
              onEndEditing={() => commitIfValid()}
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

      {onRestStart ? (
        <View className="mt-2 flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center">
            <Clock3 size={13} color={activeIcon} />
            <Text
              className="ml-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Rest after set
            </Text>
          </View>

          <View className="h-8 flex-row items-center rounded-xl bg-neutral-50 px-2 dark:bg-neutral-900">
            <TextInput
              value={String(restSeconds)}
              onChangeText={handleChangeRestSeconds}
              onEndEditing={commitRestSeconds}
              keyboardType="number-pad"
              editable={!readOnly}
              placeholder={String(DEFAULT_REST_SECONDS)}
              placeholderTextColor="#9CA3AF"
              selectTextOnFocus
              className="w-12 p-0 text-center text-[13px] font-semibold text-neutral-900 dark:text-neutral-50"
            />
            <Text className="ml-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400">
              s
            </Text>
          </View>

          <Pressable
            disabled={readOnly || restSeconds <= 0}
            onPress={handleRestStart}
            hitSlop={8}
            className={`h-8 flex-row items-center rounded-xl px-2.5 ${
              readOnly || restSeconds <= 0
                ? "bg-neutral-200 dark:bg-neutral-800"
                : "bg-neutral-900 dark:bg-[#BD93F9]"
            }`}
          >
            <Play
              size={12}
              color={
                readOnly || restSeconds <= 0
                  ? activeIcon
                  : colorScheme === "dark"
                    ? "#282A36"
                    : "#FFFFFF"
              }
            />
            <Text
              className={`ml-1 text-[11px] font-semibold ${
                readOnly || restSeconds <= 0
                  ? "text-neutral-700 dark:text-neutral-200"
                  : "text-white dark:text-[#282A36]"
              }`}
            >
              {formatRestDuration(restSeconds)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
