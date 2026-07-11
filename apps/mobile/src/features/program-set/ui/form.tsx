import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  ChevronsUpDown,
  Clock3,
  Flame,
  Gauge,
  Wind,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import ValueWheelSheet from "@/src/components/value-wheel-sheet";
import { LOAD_UNITS, LoadUnit, QuantityUnit } from "@/db/enums";
import { SetProgramFormData } from "../domain/type";
import { DEFAULT_REST_SECONDS } from "../domain/rest";

type SetProgramFormProps = {
  formData: SetProgramFormData;
  index: number;
  quantityUnit?: QuantityUnit;
  setFormData: (next: SetProgramFormData) => void;
};

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

const INTENSITY_LEVELS = [
  { id: "light", label: "Light", rpe: "5" },
  { id: "medium", label: "Medium", rpe: "7" },
  { id: "intense", label: "Intense", rpe: "10" },
] as const;

const KG_TO_LB = 2.2046226218;
const LB_TO_KG = 0.45359237;

type PickerKind = "loadType" | "effort" | null;

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

function cleanDecimalInput(raw: string) {
  let cleaned = raw.replace(/[^0-9.,]/g, "");
  const firstDot = cleaned.search(/[.,]/);

  if (firstDot !== -1) {
    const head = cleaned.slice(0, firstDot + 1);
    const tail = cleaned.slice(firstDot + 1).replace(/[.,]/g, "");
    cleaned = head + tail;
  }

  return cleaned.replace(",", ".");
}

function isNumericLoadUnit(unit: LoadUnit) {
  return unit === "kg" || unit === "lb";
}

function isLoadUnit(value: string | undefined): value is LoadUnit {
  return LOAD_UNITS.includes(value as LoadUnit);
}

function getLoadUnitLabel(unit: LoadUnit) {
  if (unit === "kg" || unit === "lb") return unit;
  return unit[0].toUpperCase() + unit.slice(1);
}

function getQuantityUnitLabel(unit: QuantityUnit) {
  if (unit === "reps") return "reps";
  return "time";
}

function getSelectedIntensity(rpe: string) {
  const found = INTENSITY_LEVELS.find((level) => level.rpe === rpe);
  return found ?? INTENSITY_LEVELS[2];
}

function getSelectedBand(loadValue: string) {
  return BAND_OPTIONS.find((band) => band.id === loadValue) ?? BAND_OPTIONS[0];
}

function renderIntensityIcon(id: string, color: string) {
  const size = 13;
  if (id === "light") return <Wind size={size} color={color} />;
  if (id === "medium") return <Gauge size={size} color={color} />;
  return <Flame size={size} color={color} />;
}

export default function SetProgramForm({
  formData,
  index,
  quantityUnit = "reps",
  setFormData,
}: SetProgramFormProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [picker, setPicker] = React.useState<PickerKind>(null);

  const rememberedNumericRef = React.useRef<{
    kg: string | null;
    lb: string | null;
  }>({
    kg: null,
    lb: null,
  });

  const update = (patch: Partial<SetProgramFormData>) =>
    setFormData({ ...formData, ...patch });

  React.useEffect(() => {
    if (formData.rpe.trim() !== "") return;
    setFormData({ ...formData, rpe: "10" });
  }, [formData, setFormData]);

  React.useEffect(() => {
    if (!isNumericLoadUnit(formData.loadUnit)) return;

    const parsed = parseNumericLoad(formData.loadValue);
    if (parsed == null) return;

    if (formData.loadUnit === "kg") {
      rememberedNumericRef.current.kg = formatNumericLoad(parsed);
      rememberedNumericRef.current.lb = formatNumericLoad(parsed * KG_TO_LB);
      return;
    }

    rememberedNumericRef.current.lb = formatNumericLoad(parsed);
    rememberedNumericRef.current.kg = formatNumericLoad(parsed * LB_TO_KG);
  }, [formData.loadUnit, formData.loadValue]);

  const getRememberedNumericValue = (targetUnit: "kg" | "lb") => {
    const hit = rememberedNumericRef.current[targetUnit];
    return hit ?? "0";
  };

  const handleChangeTargetQuantity = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    update({
      targetQuantity: cleaned === "" ? null : Number(cleaned),
    });
  };

  const handleChangeRestSeconds = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    update({
      restSeconds:
        cleaned === "" ? 0 : Math.max(0, Number.parseInt(cleaned, 10)),
    });
  };

  const handleChangeLoadValue = (raw: string) => {
    if (formData.loadUnit === "custom") {
      update({ loadValue: raw });
      return;
    }

    if (!isNumericLoadUnit(formData.loadUnit)) return;
    update({ loadValue: cleanDecimalInput(raw) });
  };

  const selectedIntensity = getSelectedIntensity(formData.rpe);
  const selectedBand = getSelectedBand(formData.loadValue);
  const quantityLabel = getQuantityUnitLabel(quantityUnit);
  const restValue =
    Number.isFinite(formData.restSeconds) && formData.restSeconds >= 0
      ? String(formData.restSeconds)
      : String(DEFAULT_REST_SECONDS);

  const isBandUnit = formData.loadUnit === "band";
  const isCustomUnit = formData.loadUnit === "custom";
  const isNumericUnit = isNumericLoadUnit(formData.loadUnit);

  const loadDisplay = (() => {
    if (isBandUnit) return selectedBand.label;
    if (isCustomUnit) return formData.loadValue.trim() || "Custom";
    return formData.loadValue.trim() || "0";
  })();

  const iconColor = isDark ? "#F8F8F2" : "#111827";
  const mutedIconColor = isDark ? "#6272A4" : "#6B7280";
  const placeholderColor = isDark ? "#6272A4" : "#A3A3A3";
  const fieldClass =
    "h-9 justify-center rounded-xl bg-white px-2 dark:bg-[#343746]";

  return (
    <View className="mt-1.5 rounded-2xl bg-neutral-100 px-2 py-1.5 dark:bg-[#21222C]">
      <View className="flex-row items-center gap-2">
        <View className="h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#343746]">
          <Text className="text-[10px] font-semibold text-neutral-600 dark:text-[#F8F8F2]">
            {index + 1}
          </Text>
        </View>

        <View className={fieldClass} style={{ flex: 0.82 }}>
          <TextInput
            value={
              formData.targetQuantity == null
                ? ""
                : String(formData.targetQuantity)
            }
            onChangeText={handleChangeTargetQuantity}
            keyboardType="number-pad"
            placeholder="-"
            placeholderTextColor={placeholderColor}
            selectTextOnFocus
            className="p-0 text-center text-[14px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
          />
        </View>

        <View
          className="h-9 flex-row items-center rounded-xl bg-white dark:bg-[#343746]"
          style={{ flex: 1.55 }}
        >
          {isNumericUnit || isCustomUnit ? (
            <TextInput
              value={formData.loadValue}
              onChangeText={handleChangeLoadValue}
              keyboardType={isCustomUnit ? "default" : "decimal-pad"}
              placeholder={isCustomUnit ? "Load" : "0"}
              placeholderTextColor={placeholderColor}
              selectTextOnFocus
              className="min-w-0 flex-1 px-2 py-0 text-center text-[14px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
              returnKeyType="done"
            />
          ) : (
            <Pressable
              onPress={() => setPicker("loadType")}
              className="min-w-0 flex-1 flex-row items-center justify-center px-2"
              hitSlop={6}
            >
              {isBandUnit ? (
                <View
                  className={`mr-1.5 h-3 w-7 rounded-full ${selectedBand.dotClass}`}
                />
              ) : null}
              <Text
                className="text-center text-[13px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
              >
                {loadDisplay}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setPicker("loadType")}
            className="mr-1 h-7 flex-row items-center rounded-lg border border-neutral-300 bg-neutral-100 px-2 dark:border-[#6272A4] dark:bg-[#282A36]"
            hitSlop={8}
          >
            <Text className="text-[10px] font-bold text-neutral-800 dark:text-[#F8F8F2]">
              {getLoadUnitLabel(formData.loadUnit)}
            </Text>
            <ChevronsUpDown size={11} color={mutedIconColor} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setPicker("effort")}
          className="h-9 w-[70px] flex-row items-center justify-center rounded-xl bg-white px-1 dark:bg-[#343746]"
          hitSlop={6}
        >
          {renderIntensityIcon(selectedIntensity.id, iconColor)}
          <Text
            className="ml-1 text-[10px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {selectedIntensity.label}
          </Text>
        </Pressable>
      </View>

      <View className="mt-1.5 flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Clock3 size={13} color={mutedIconColor} />
          <Text
            className="ml-1.5 text-[11px] font-semibold text-neutral-500 dark:text-[#6272A4]"
            numberOfLines={1}
          >
            Rest after set {index + 1}
          </Text>
        </View>

        <View className="h-8 flex-row items-center rounded-xl bg-white px-2 dark:bg-[#343746]">
          <TextInput
            value={restValue}
            onChangeText={handleChangeRestSeconds}
            keyboardType="number-pad"
            placeholder={String(DEFAULT_REST_SECONDS)}
            placeholderTextColor={placeholderColor}
            selectTextOnFocus
            className="w-11 p-0 text-center text-[13px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
          />
          <Text className="ml-0.5 text-[10px] font-semibold text-neutral-400 dark:text-[#6272A4]">
            s
          </Text>
        </View>
      </View>

      {picker === "loadType" ? (
        <ValueWheelSheet
          title="Load type"
          subtitle={`Set ${index + 1} - ${quantityLabel}`}
          columns={(values) => {
            const activeUnit = isLoadUnit(values.unit)
              ? values.unit
              : formData.loadUnit;

            return [
              {
                id: "unit",
                label: "Unit",
                selectedValue: formData.loadUnit,
                options: LOAD_UNITS.map((unit) => ({
                  value: unit,
                  label: getLoadUnitLabel(unit),
                })),
              },
              ...(activeUnit === "band"
                ? [
                    {
                      id: "band",
                      label: "Band",
                      selectedValue: selectedBand.id,
                      options: BAND_OPTIONS.map((band) => ({
                        value: band.id,
                        label: band.label,
                        swatchClassName: band.dotClass,
                      })),
                    },
                  ]
                : []),
            ];
          }}
          onCancel={() => setPicker(null)}
          onConfirm={(values) => {
            const nextUnit = isLoadUnit(values.unit)
              ? values.unit
              : formData.loadUnit;

            if (nextUnit === "band") {
              update({
                loadUnit: nextUnit,
                loadValue: values.band ?? selectedBand.id,
              });
            } else if (nextUnit === "custom") {
              update({
                loadUnit: nextUnit,
                loadValue:
                  formData.loadUnit === "custom" ? formData.loadValue : "",
              });
            } else {
              update({
                loadUnit: nextUnit,
                loadValue: getRememberedNumericValue(nextUnit),
              });
            }

            setPicker(null);
          }}
        />
      ) : null}

      {picker === "effort" ? (
        <ValueWheelSheet
          title="Effort"
          subtitle={`Set ${index + 1}`}
          columns={[
            {
              id: "rpe",
              label: "RPE",
              selectedValue: selectedIntensity.rpe,
              options: INTENSITY_LEVELS.map((level) => ({
                value: level.rpe,
                label: level.label,
                detail: level.rpe,
              })),
            },
          ]}
          onCancel={() => setPicker(null)}
          onConfirm={(values) => {
            update({ rpe: values.rpe ?? selectedIntensity.rpe });
            setPicker(null);
          }}
        />
      ) : null}
    </View>
  );
}
