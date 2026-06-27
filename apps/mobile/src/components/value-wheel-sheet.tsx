import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

export type ValueWheelOption = {
  value: string;
  label: string;
  detail?: string;
  swatchClassName?: string;
};

export type ValueWheelColumn = {
  id: string;
  label?: string;
  options: ValueWheelOption[];
  selectedValue: string;
};

type ValueWheelSheetProps = {
  title: string;
  subtitle?: string;
  columns:
    | ValueWheelColumn[]
    | ((values: Record<string, string>) => ValueWheelColumn[]);
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (values: Record<string, string>) => void;
};

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const CENTER_OFFSET = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

function clampIndex(index: number, max: number) {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(index, max));
}

function WheelColumnView({
  column,
  value,
  onChange,
}: {
  column: ValueWheelColumn;
  value: string;
  onChange: (value: string) => void;
}) {
  const scrollRef = useRef<ScrollView | null>(null);
  const hasInitialScrolledRef = useRef(false);

  const selectedIndex = useMemo(() => {
    const index = column.options.findIndex((option) => option.value === value);
    return index === -1 ? 0 : index;
  }, [column.options, value]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: hasInitialScrolledRef.current,
      });
      hasInitialScrolledRef.current = true;
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedIndex]);

  const selectFromOffset = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = clampIndex(
      Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT),
      column.options.length - 1,
    );
    const next = column.options[nextIndex];
    if (next && next.value !== value) {
      onChange(next.value);
    }
  };

  return (
    <View className="flex-1">
      {column.label ? (
        <Text className="mb-2 text-center text-[10px] font-semibold uppercase text-neutral-400 dark:text-[#6272A4]">
          {column.label}
        </Text>
      ) : null}

      <View style={{ height: WHEEL_HEIGHT }}>
        <View
          pointerEvents="none"
          className="absolute inset-x-0 rounded-2xl bg-neutral-100 dark:bg-[#44475A]"
          style={{ top: CENTER_OFFSET, height: ITEM_HEIGHT }}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingVertical: CENTER_OFFSET,
          }}
          onMomentumScrollEnd={selectFromOffset}
          onScrollEndDrag={selectFromOffset}
        >
          {column.options.map((option, index) => {
            const selected = index === selectedIndex;

            return (
              <Pressable
                key={option.value}
                onPress={() => onChange(option.value)}
                className="flex-row items-center justify-center px-2"
                style={{ height: ITEM_HEIGHT }}
              >
                {option.swatchClassName ? (
                  <View
                    className={`mr-2 h-3.5 w-3.5 rounded-full ${option.swatchClassName}`}
                  />
                ) : null}

                <Text
                  className={`text-center ${
                    selected
                      ? "text-[19px] font-semibold text-neutral-900 dark:text-[#F8F8F2]"
                      : "text-[16px] font-semibold text-neutral-400 dark:text-[#6272A4]"
                  }`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.72}
                >
                  {option.label}
                </Text>

                {option.detail ? (
                  <Text
                    className={`ml-1 text-center ${
                      selected
                        ? "text-[13px] font-medium text-neutral-500 dark:text-[#F8F8F2]"
                        : "text-[12px] font-medium text-neutral-300 dark:text-[#6272A4]"
                    }`}
                    numberOfLines={1}
                  >
                    {option.detail}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function ValueWheelSheet({
  title,
  subtitle,
  columns,
  confirmLabel = "Done",
  onCancel,
  onConfirm,
}: ValueWheelSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const getColumns = (currentValues: Record<string, string>) =>
    typeof columns === "function" ? columns(currentValues) : columns;

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const column of getColumns({})) {
      initial[column.id] = column.selectedValue;
    }
    return initial;
  });

  const resolvedColumns = getColumns(values).map((column) => ({
    ...column,
    selectedValue:
      values[column.id] ?? column.selectedValue ?? column.options[0]?.value,
  }));

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-[#111827]/45">
        <Pressable className="flex-1" onPress={onCancel} />

        <View className="rounded-t-3xl border border-neutral-200 bg-white px-4 pb-5 pt-3 dark:border-[#44475A] dark:bg-[#343746]">
          <View className="mb-3 flex-row items-start justify-between gap-3">
            <Pressable
              onPress={onCancel}
              className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#44475A]"
              hitSlop={8}
            >
              <X size={20} color={isDark ? "#F8F8F2" : "#111827"} />
            </Pressable>

            <View className="flex-1 items-center">
              <Text
                className="text-center text-[17px] font-semibold text-neutral-950 dark:text-[#F8F8F2]"
                numberOfLines={1}
              >
                {title}
              </Text>

              {subtitle ? (
                <Text
                  className="mt-1 text-center text-[11px] text-neutral-500 dark:text-[#6272A4]"
                  numberOfLines={2}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={() => onConfirm(values)}
              className="h-10 min-w-10 items-center justify-center rounded-full bg-neutral-900 px-3 dark:bg-[#BD93F9]"
              hitSlop={8}
              accessibilityLabel={confirmLabel}
            >
              <Check size={20} color={isDark ? "#282A36" : "#FFFFFF"} />
            </Pressable>
          </View>

          <View className="rounded-[28px] bg-neutral-50 px-3 py-4 dark:bg-[#282A36]">
            <View className="flex-row items-start gap-2">
              {resolvedColumns.map((column) => (
                <WheelColumnView
                  key={column.id}
                  column={column}
                  value={column.selectedValue}
                  onChange={(next) =>
                    setValues((prev) => ({ ...prev, [column.id]: next }))
                  }
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
