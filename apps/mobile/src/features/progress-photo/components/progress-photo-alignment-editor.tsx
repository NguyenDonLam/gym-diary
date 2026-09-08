/* eslint-disable react-hooks/immutability -- Reanimated shared values are intentionally mutated by UI-thread gesture worklets. */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { Check, RotateCcw, X } from "lucide-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import type {
  ProgressPhotoAlignment,
  ProgressPhotoAlignmentStatus,
} from "../types";
import { progressPhotoAlignmentConfig } from "../pose/progress-photo-alignment.config";
import {
  getProgressPhotoViewportSize,
  type ProgressPhotoComparisonViewModel,
  type ProgressPhotoRenderTransform,
} from "../ui/progress-photo-comparison.mapper";

const AnimatedImage = Animated.createAnimatedComponent(Image);
const overlayOpacities = [0.25, 0.5, 0.75, 1] as const;

type ProgressPhotoAlignmentEditorProps = {
  photo: ProgressPhotoComparisonViewModel;
  referencePhoto: ProgressPhotoComparisonViewModel;
  isSaving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSave: (
    alignment: ProgressPhotoAlignment | null,
    status: ProgressPhotoAlignmentStatus,
  ) => void;
};

function identityTransform(): ProgressPhotoRenderTransform {
  return {
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotationRadians: 0,
  };
}

export function ProgressPhotoAlignmentEditor({
  photo,
  referencePhoto,
  isSaving,
  errorMessage,
  onCancel,
  onSave,
}: ProgressPhotoAlignmentEditorProps) {
  const { width } = useWindowDimensions();
  const viewport = getProgressPhotoViewportSize(width - 32);
  const initialTransform = photo.renderTransform ?? identityTransform();
  const translateX = useSharedValue(initialTransform.translateX);
  const translateY = useSharedValue(initialTransform.translateY);
  const scale = useSharedValue(initialTransform.scale);
  const rotation = useSharedValue(initialTransform.rotationRadians);
  const startTranslateX = useSharedValue(initialTransform.translateX);
  const startTranslateY = useSharedValue(initialTransform.translateY);
  const startScale = useSharedValue(initialTransform.scale);
  const startRotation = useSharedValue(initialTransform.rotationRadians);
  const [draftStatus, setDraftStatus] = useState<ProgressPhotoAlignmentStatus>(
    photo.alignmentStatus,
  );
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [hasImageError, setHasImageError] = useState(false);

  const applyTransform = (
    transform: ProgressPhotoRenderTransform,
    status: ProgressPhotoAlignmentStatus,
  ) => {
    translateX.value = transform.translateX;
    translateY.value = transform.translateY;
    scale.value = transform.scale;
    rotation.value = transform.rotationRadians;
    setDraftStatus(status);
  };

  useEffect(() => {
    applyTransform(initialTransform, photo.alignmentStatus);
    setHasImageError(false);
    // Shared values are stable; photo identity is the reset boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.id]);

  const markManual = useCallback(() => setDraftStatus("manual"), []);
  const gestures = useMemo(() => {
    const pan = Gesture.Pan()
      .onBegin(() => {
        startTranslateX.value = translateX.value;
        startTranslateY.value = translateY.value;
        runOnJS(markManual)();
      })
      .onUpdate((event) => {
        translateX.value = Math.max(
          -progressPhotoAlignmentConfig.maximumTranslation,
          Math.min(
            progressPhotoAlignmentConfig.maximumTranslation,
            startTranslateX.value + event.translationX / viewport.width,
          ),
        );
        translateY.value = Math.max(
          -progressPhotoAlignmentConfig.maximumTranslation,
          Math.min(
            progressPhotoAlignmentConfig.maximumTranslation,
            startTranslateY.value + event.translationY / viewport.height,
          ),
        );
      });
    const pinch = Gesture.Pinch()
      .onBegin(() => {
        startScale.value = scale.value;
        runOnJS(markManual)();
      })
      .onUpdate((event) => {
        scale.value = Math.max(
          progressPhotoAlignmentConfig.minimumScale,
          Math.min(
            progressPhotoAlignmentConfig.maximumScale,
            startScale.value * event.scale,
          ),
        );
      });
    const rotate = Gesture.Rotation()
      .onBegin(() => {
        startRotation.value = rotation.value;
        runOnJS(markManual)();
      })
      .onUpdate((event) => {
        rotation.value = Math.max(
          -progressPhotoAlignmentConfig.maximumRotationRadians,
          Math.min(
            progressPhotoAlignmentConfig.maximumRotationRadians,
            startRotation.value + event.rotation,
          ),
        );
      });

    return Gesture.Simultaneous(pan, pinch, rotate);
  }, [
    rotation,
    scale,
    startRotation,
    startScale,
    startTranslateX,
    startTranslateY,
    translateX,
    translateY,
    viewport.height,
    viewport.width,
    markManual,
  ]);

  const animatedImageStyle = useAnimatedStyle(() => {
    const cosine = Math.cos(rotation.value);
    const sine = Math.sin(rotation.value);
    const centeredTranslateX =
      translateX.value + scale.value * (0.5 * cosine - 0.5 * sine) - 0.5;
    const centeredTranslateY =
      translateY.value + scale.value * (0.5 * sine + 0.5 * cosine) - 0.5;

    return {
      transform: [
        { translateX: centeredTranslateX * viewport.width },
        { translateY: centeredTranslateY * viewport.height },
        { scale: scale.value },
        { rotate: `${rotation.value}rad` },
      ],
    };
  }, [viewport.height, viewport.width]);

  const save = () => {
    if (draftStatus === "unavailable") {
      onSave(null, "unavailable");
      return;
    }

    if (draftStatus === "automatic" && photo.automaticAlignment) {
      onSave({ ...photo.automaticAlignment }, "automatic");
      return;
    }

    onSave(
      {
        referencePhotoId: referencePhoto.id,
        translateX: translateX.value,
        translateY: translateY.value,
        scale: scale.value,
        rotationRadians: rotation.value,
        confidence: 1,
        version: progressPhotoAlignmentConfig.version,
      },
      "manual",
    );
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
      visible
    >
      <View className="flex-1 bg-white dark:bg-[#21222C]">
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-14 dark:border-[#44475A]">
          <View className="mr-4 flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-[#F8F8F2]">
              Adjust alignment
            </Text>
            <Text className="mt-0.5 text-xs text-zinc-500 dark:text-[#A5A8C2]">
              Drag, pinch, or rotate the current photo.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close alignment editor"
            disabled={isSaving}
            onPress={onCancel}
            className="h-11 w-11 items-center justify-center rounded-full bg-neutral-100 dark:bg-[#343746]"
          >
            <X size={21} color="#7C3AED" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            alignItems: "center",
            padding: 16,
            paddingBottom: 36,
          }}
        >
          <GestureDetector gesture={gestures}>
            <View
              className="overflow-hidden rounded-3xl bg-black"
              style={{
                width: viewport.width,
                height: viewport.height,
              }}
            >
              <Image
                source={{ uri: referencePhoto.uri }}
                contentFit="cover"
                cachePolicy="memory-disk"
                onError={() => setHasImageError(true)}
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  opacity: overlayOpacity,
                }}
              />
              <AnimatedImage
                source={{ uri: photo.uri }}
                contentFit="cover"
                cachePolicy="memory-disk"
                onError={() => setHasImageError(true)}
                style={[
                  {
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                  },
                  animatedImageStyle,
                ]}
              />

              <View
                pointerEvents="none"
                className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5"
              >
                <Text className="text-xs font-semibold text-white">
                  {draftStatus === "manual"
                    ? "Manual adjustment"
                    : draftStatus === "automatic"
                      ? "Automatic alignment"
                      : "No alignment"}
                </Text>
              </View>
            </View>
          </GestureDetector>

          {hasImageError ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm font-medium text-red-600 dark:text-[#FF5555]"
            >
              A photo file is unavailable. Alignment cannot be edited.
            </Text>
          ) : null}
          {errorMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-sm font-medium text-red-600 dark:text-[#FF5555]"
            >
              {errorMessage}
            </Text>
          ) : null}

          <View className="mt-4 w-full">
            <Text className="text-xs font-semibold text-zinc-700 dark:text-[#F8F8F2]">
              Reference opacity
            </Text>
            <View className="mt-2 flex-row gap-2">
              {overlayOpacities.map((opacity) => (
                <Pressable
                  key={opacity}
                  accessibilityRole="button"
                  accessibilityLabel={`Set reference opacity to ${opacity * 100} percent`}
                  accessibilityState={{ selected: overlayOpacity === opacity }}
                  onPress={() => setOverlayOpacity(opacity)}
                  className={[
                    "flex-1 items-center rounded-xl px-2 py-2.5",
                    overlayOpacity === opacity
                      ? "bg-neutral-900 dark:bg-[#BD93F9]"
                      : "bg-neutral-100 dark:bg-[#343746]",
                  ].join(" ")}
                >
                  <Text
                    className={[
                      "text-xs font-semibold",
                      overlayOpacity === opacity
                        ? "text-white dark:text-[#282A36]"
                        : "text-zinc-700 dark:text-[#F8F8F2]",
                    ].join(" ")}
                  >
                    {opacity * 100}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="mt-4 w-full flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset to automatic alignment"
              disabled={!photo.automaticRenderTransform || isSaving}
              onPress={() => {
                if (photo.automaticRenderTransform) {
                  applyTransform(photo.automaticRenderTransform, "automatic");
                }
              }}
              className={[
                "flex-1 flex-row items-center justify-center rounded-xl px-3 py-3",
                photo.automaticRenderTransform
                  ? "bg-neutral-100 dark:bg-[#343746]"
                  : "bg-neutral-100/50 dark:bg-[#343746]/50",
              ].join(" ")}
            >
              <RotateCcw size={16} color="#7C3AED" />
              <Text className="ml-2 text-xs font-semibold text-zinc-800 dark:text-[#F8F8F2]">
                Automatic
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset to no alignment"
              disabled={isSaving}
              onPress={() => applyTransform(identityTransform(), "unavailable")}
              className="flex-1 items-center justify-center rounded-xl bg-neutral-100 px-3 py-3 dark:bg-[#343746]"
            >
              <Text className="text-xs font-semibold text-zinc-800 dark:text-[#F8F8F2]">
                No alignment
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save alignment"
            disabled={isSaving || hasImageError}
            onPress={save}
            className={[
              "mt-4 w-full flex-row items-center justify-center rounded-2xl px-4 py-4",
              isSaving || hasImageError
                ? "bg-neutral-400 dark:bg-[#6272A4]"
                : "bg-neutral-900 dark:bg-[#BD93F9]",
            ].join(" ")}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Check size={19} color="#FFFFFF" strokeWidth={2.4} />
            )}
            <Text className="ml-2 text-sm font-semibold text-white dark:text-[#282A36]">
              {isSaving ? "Saving…" : "Save alignment"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
