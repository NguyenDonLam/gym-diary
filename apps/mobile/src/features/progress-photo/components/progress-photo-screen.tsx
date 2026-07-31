import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Camera, Images, LockKeyhole, Maximize2, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import {
  getProgressPhotoViewportSize,
  getProgressPhotoViewportTransform,
  type ProgressPhotoComparisonViewModel,
} from "../ui/progress-photo-comparison.mapper";

type ProgressPhotoScreenProps = {
  photos: ProgressPhotoComparisonViewModel[];
  isLoading: boolean;
  isCapturing: boolean;
  errorMessage: string | null;
  poseCapabilityMessage: string | null;
  captureStatusMessage: string | null;
  onTakePhoto: () => void;
};

export function ProgressPhotoScreen({
  photos,
  isLoading,
  isCapturing,
  errorMessage,
  poseCapabilityMessage,
  captureStatusMessage,
  onTakePhoto,
}: ProgressPhotoScreenProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isFullOriginalOpen, setIsFullOriginalOpen] = useState(false);
  const latestPhotoIdRef = useRef<string | null>(null);

  useEffect(() => {
    const latestPhotoId = photos[0]?.id ?? null;

    if (latestPhotoId !== latestPhotoIdRef.current) {
      latestPhotoIdRef.current = latestPhotoId;
      setSelectedPhotoId(latestPhotoId);
    }
  }, [photos]);

  const selectedPhoto = useMemo(
    () =>
      photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0] ?? null,
    [photos, selectedPhotoId],
  );

  useEffect(() => {
    setIsFullOriginalOpen(false);
  }, [selectedPhoto?.id]);

  useEffect(() => {
    if (!selectedPhoto) return;

    const selectedIndex = photos.findIndex(
      (photo) => photo.id === selectedPhoto.id,
    );
    const neighbouringUris = [
      photos[selectedIndex - 1]?.uri,
      photos[selectedIndex + 1]?.uri,
    ].filter((uri): uri is string => Boolean(uri));

    if (neighbouringUris.length > 0) {
      void Image.prefetch(neighbouringUris, {
        cachePolicy: "memory-disk",
      }).catch(() => undefined);
    }
  }, [photos, selectedPhoto]);

  const { width: previewWidth, height: previewHeight } =
    getProgressPhotoViewportSize(width - 32);
  const viewportTransform = selectedPhoto?.renderTransform
    ? getProgressPhotoViewportTransform(
        selectedPhoto.renderTransform,
        previewWidth,
        previewHeight,
      )
    : null;
  const alignmentNeedsAttention =
    selectedPhoto?.alignmentState === "low_confidence" ||
    selectedPhoto?.alignmentState === "missing_reference";
  const iconColor = isDark ? "#F8F8F2" : "#111827";
  const mutedIconColor = isDark ? "#6272A4" : "#64748B";
  const actionIconColor = isDark ? "#282A36" : "#FFFFFF";

  return (
    <View className="flex-1 bg-white dark:bg-[#2B2D3A]">
      <View className="border-b border-zinc-200 px-4 pb-3 pt-3 dark:border-[#44475A] dark:bg-[#21222C]">
        <Text className="text-xl font-bold text-zinc-900 dark:text-[#F8F8F2]">
          Progress
        </Text>
        <Text className="mt-1 text-xs text-zinc-500 dark:text-[#6272A4]">
          Keep a private visual record of your training.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDark ? "#BD93F9" : "#111827"} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          {selectedPhoto ? (
            <>
              <View
                className="overflow-hidden rounded-3xl bg-neutral-100 dark:bg-[#343746]"
                style={{
                  alignSelf: "center",
                  width: previewWidth,
                  height: previewHeight,
                }}
              >
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={160}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    transform: viewportTransform
                      ? [
                          // React Native composes this array right-to-left.
                          { translateX: viewportTransform.translateX },
                          { translateY: viewportTransform.translateY },
                          { scale: viewportTransform.scale },
                          { rotate: viewportTransform.rotation },
                        ]
                      : undefined,
                  }}
                />

                <View
                  className={[
                    "absolute left-3 top-3 rounded-full px-3 py-1.5",
                    alignmentNeedsAttention ? "bg-amber-500/90" : "bg-black/55",
                  ].join(" ")}
                >
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-xs font-semibold text-white"
                  >
                    {selectedPhoto.alignmentStatusLabel}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open full original photo"
                  onPress={() => setIsFullOriginalOpen(true)}
                  className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/55"
                >
                  <Maximize2 size={18} color="#FFFFFF" strokeWidth={2.2} />
                </Pressable>

                <View className="absolute bottom-0 left-0 right-0 bg-black/45 px-4 py-3">
                  <Text className="text-base font-semibold text-white">
                    {selectedPhoto.dateLabel}
                  </Text>
                  <Text className="mt-0.5 text-xs text-white/75">
                    {selectedPhoto.timeLabel}
                  </Text>
                  {selectedPhoto.alignmentDetailLabel ? (
                    <Text className="mt-1 text-xs text-white/75">
                      {selectedPhoto.alignmentDetailLabel}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View className="mt-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                    Your timeline
                  </Text>
                  <Text className="mt-0.5 text-xs text-zinc-500 dark:text-[#6272A4]">
                    Tap a photo to compare
                  </Text>
                </View>

                <Text className="text-xs font-medium text-zinc-500 dark:text-[#6272A4]">
                  {photos.length} {photos.length === 1 ? "photo" : "photos"}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
              >
                {photos.map((photo) => {
                  const isSelected = photo.id === selectedPhoto.id;

                  return (
                    <Pressable
                      key={photo.id}
                      accessibilityRole="button"
                      accessibilityLabel={photo.accessibilityLabel}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setSelectedPhotoId(photo.id)}
                      className={[
                        "overflow-hidden rounded-2xl border-2",
                        isSelected
                          ? "border-neutral-900 dark:border-[#BD93F9]"
                          : "border-transparent",
                      ].join(" ")}
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={100}
                        style={{ width: 72, height: 92 }}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View className="items-center rounded-3xl bg-neutral-100 px-6 py-12 dark:bg-[#343746]">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-[#2B2D3A]">
                <Images size={34} color={iconColor} strokeWidth={1.8} />
              </View>

              <Text className="mt-5 text-center text-xl font-bold text-zinc-900 dark:text-[#F8F8F2]">
                See the change over time
              </Text>
              <Text className="mt-2 max-w-72 text-center text-sm leading-5 text-zinc-500 dark:text-[#6272A4]">
                Take your first progress photo. Consistent photos make small
                changes easier to notice.
              </Text>

              <View className="mt-6 flex-row items-center">
                <LockKeyhole size={14} color={mutedIconColor} strokeWidth={2} />
                <Text className="ml-1.5 text-xs text-zinc-500 dark:text-[#6272A4]">
                  Stored privately on this device
                </Text>
              </View>
            </View>
          )}

          {errorMessage ? (
            <Text className="mt-3 text-center text-xs text-red-600 dark:text-[#FF5555]">
              {errorMessage}
            </Text>
          ) : null}

          {poseCapabilityMessage ? (
            <Text className="mt-3 text-center text-xs text-zinc-500 dark:text-[#6272A4]">
              {poseCapabilityMessage}
            </Text>
          ) : null}

          {captureStatusMessage ? (
            <Text
              accessibilityLiveRegion="polite"
              className="mt-3 text-center text-xs font-medium text-emerald-700 dark:text-[#50FA7B]"
            >
              {captureStatusMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take a progress photo"
            disabled={isCapturing}
            onPress={onTakePhoto}
            className={[
              "mt-4 flex-row items-center justify-center rounded-2xl px-4 py-4",
              isCapturing
                ? "bg-neutral-400 dark:bg-[#6272A4]"
                : "bg-neutral-900 dark:bg-[#BD93F9]",
            ].join(" ")}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color={actionIconColor} />
            ) : (
              <Camera size={19} color={actionIconColor} strokeWidth={2.3} />
            )}
            <Text className="ml-2 text-sm font-semibold text-white dark:text-[#282A36]">
              {isCapturing ? "Opening camera…" : "Take progress photo"}
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setIsFullOriginalOpen(false)}
        statusBarTranslucent
        visible={isFullOriginalOpen && selectedPhoto !== null}
      >
        <View className="flex-1 bg-black">
          {selectedPhoto ? (
            <Image
              source={{ uri: selectedPhoto.uri }}
              contentFit="contain"
              cachePolicy="memory-disk"
              style={{ flex: 1 }}
            />
          ) : null}

          <View className="absolute left-0 right-0 top-0 flex-row items-center justify-between bg-black/55 px-4 pb-3 pt-14">
            <View className="mr-4 flex-1">
              <Text className="text-base font-semibold text-white">
                Full original
              </Text>
              <Text className="mt-0.5 text-xs text-white/75">
                Uncropped and without alignment
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close full original photo"
              onPress={() => setIsFullOriginalOpen(false)}
              className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
            >
              <X size={22} color="#FFFFFF" strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
