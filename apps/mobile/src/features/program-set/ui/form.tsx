import React from "react";
import { Text, TextInput, View, Pressable } from "react-native";
import { SetProgramFormData, LoadUnit } from "../domain/type";
import { useColorScheme } from "nativewind";
import { Wind, Gauge, Flame } from "lucide-react-native";

type SetProgramFormProps = {
  formData: SetProgramFormData;
  index: number;
  setFormData: (next: SetProgramFormData) => void;
};

// "kg" | "lb" | "band" | "time" | "custom"
const LOAD_UNITS: LoadUnit[] = ["kg", "lb", "band", "time", "custom"];

const BAND_OPTIONS = [
  {
    id: "green",
    label: "Green",
    baseClass: "bg-emerald-100 dark:bg-emerald-950",
    dotClass: "bg-emerald-500 dark:bg-emerald-300",
  },
  {
    id: "purple",
    label: "Purple",
    baseClass: "bg-violet-100 dark:bg-violet-950",
    dotClass: "bg-violet-500 dark:bg-violet-300",
  },
  {
    id: "black",
    label: "Black",
    baseClass: "bg-neutral-200 dark:bg-neutral-800",
    dotClass: "bg-neutral-900 dark:bg-neutral-50",
  },
  {
    id: "red",
    label: "Red",
    baseClass: "bg-red-100 dark:bg-red-950",
    dotClass: "bg-red-500 dark:bg-red-300",
  },
  {
    id: "yellow",
    label: "Yellow",
    baseClass: "bg-amber-100 dark:bg-amber-950",
    dotClass: "bg-amber-400 dark:bg-amber-300",
  },
];

const INTENSITY_LEVELS = [
  { id: "light", label: "Light", rpe: "5" },
  { id: "medium", label: "Medium", rpe: "7" },
  { id: "intense", label: "Intense", rpe: "10" },
];

export default function SetProgramForm({
  formData,
  index,
  setFormData,
}: SetProgramFormProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const update = (patch: Partial<SetProgramFormData>) =>
    setFormData({ ...formData, ...patch });

  // ensure medium by default
  React.useEffect(() => {
    if (!formData.rpe) {
      update({ rpe: "7" });
    }
  }, [formData.rpe]);

  const cycleUnit = () => {
    const current = formData.loadUnit;
    const idx = LOAD_UNITS.indexOf(current);
    const next =
      idx === -1 || idx === LOAD_UNITS.length - 1
        ? LOAD_UNITS[0]
        : LOAD_UNITS[idx + 1];

    update({ loadUnit: next, loadValue: "" });
  };

  const handleChangeLoadValue = (raw: string) => {
    const unit = formData.loadUnit;

    if (unit === "kg" || unit === "lb") {
      let cleaned = raw.replace(/[^0-9.,]/g, "");
      const firstDot = cleaned.search(/[.,]/);
      if (firstDot !== -1) {
        const head = cleaned.slice(0, firstDot + 1);
        const tail = cleaned.slice(firstDot + 1).replace(/[.,]/g, "");
        cleaned = head + tail;
      }
      update({ loadValue: cleaned });
      return;
    }

    if (unit === "time") {
      const cleaned = raw.replace(/[^0-9:\-]/g, "");
      update({ loadValue: cleaned });
      return;
    }

    if (unit === "custom") {
      update({ loadValue: raw });
      return;
    }
    // band ignores typing
  };

  const cycleBand = () => {
    const currentId = formData.loadValue;
    const idx = BAND_OPTIONS.findIndex((b) => b.id === currentId);
    const next =
      idx === -1 || idx === BAND_OPTIONS.length - 1
        ? BAND_OPTIONS[0]
        : BAND_OPTIONS[idx + 1];

    update({ loadValue: next.id });
  };

  const isBandUnit = formData.loadUnit === "band";
  const isNumericUnit =
    formData.loadUnit === "kg" || formData.loadUnit === "lb";
  const loadKeyboardType: any = isNumericUnit ? "numeric" : "default";

  const selectedBand =
    BAND_OPTIONS.find((b) => b.id === formData.loadValue) ?? BAND_OPTIONS[0];

  const intensityIndex =
    INTENSITY_LEVELS.findIndex((l) => l.rpe === formData.rpe) !== -1
      ? INTENSITY_LEVELS.findIndex((l) => l.rpe === formData.rpe)
      : 1; // medium

  const selectedIntensity = INTENSITY_LEVELS[intensityIndex];

  const cycleIntensity = () => {
    const currentIdx = INTENSITY_LEVELS.findIndex(
      (l) => l.rpe === formData.rpe
    );
    const nextIndex =
      currentIdx === -1
        ? 1 // start at medium
        : (currentIdx + 1) % INTENSITY_LEVELS.length;
    const next = INTENSITY_LEVELS[nextIndex];
    update({ rpe: next.rpe });
  };

  const outerField = "flex-1 px-1 py-1";
  const inputShell =
    "rounded-xl bg-neutral-100/90 dark:bg-neutral-800/90 px-2 py-0.5";

  const renderIntensityIcon = (id: string, active: boolean) => {
    const size = 14;
    const color = active
      ? isDark
        ? "#F9FAFB"
        : "#111827"
      : isDark
        ? "#9CA3AF"
        : "#6B7280";

    if (id === "light") return <Wind size={size} color={color} />;
    if (id === "medium") return <Gauge size={size} color={color} />;
    return <Flame size={size} color={color} />;
  };

  return (
    <View className="mt-1 flex-row items-center gap-2">
      {/* REPS */}
      <View className={outerField}>
        <View className={inputShell}>
          <TextInput
            className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
            keyboardType="number-pad"
            value={formData.reps}
            onChangeText={(v) => update({ reps: v })}
            placeholder="..."
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
          />
        </View>
      </View>

      {/* LOAD */}
      <View className={outerField}>
        <View className="mb-0.5 flex-row justify-end px-1">
          <Pressable onPress={cycleUnit} hitSlop={8}>
            <Text className="text-[9px] text-neutral-600 dark:text-neutral-200">
              {formData.loadUnit}
            </Text>
          </Pressable>
        </View>

        {!isBandUnit && (
          <View className={inputShell}>
            <TextInput
              className="text-center text-[11px] text-neutral-900 dark:text-neutral-50"
              keyboardType={loadKeyboardType}
              value={formData.loadValue}
              onChangeText={handleChangeLoadValue}
              placeholder="..."
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            />
          </View>
        )}

        {isBandUnit && (
          <Pressable
            onPress={cycleBand}
            hitSlop={8}
            className={`${inputShell} flex-row items-center justify-center gap-2 ${selectedBand.baseClass}`}
          >
            <View className={`h-3 w-6 rounded-full ${selectedBand.dotClass}`} />
            <Text className="text-[10px] text-neutral-900 dark:text-neutral-50">
              {selectedBand.label}
            </Text>
          </Pressable>
        )}
      </View>

      {/* INTENSITY (RPE via tap-to-cycle, one option visible) */}
      <View className={outerField}>
        <Pressable
          onPress={cycleIntensity}
          hitSlop={8}
          className={`${inputShell} flex-row items-center justify-center gap-2`}
        >
          {renderIntensityIcon(selectedIntensity.id, true)}
          <Text className="text-[10px] text-neutral-900 dark:text-neutral-50">
            {selectedIntensity.label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
