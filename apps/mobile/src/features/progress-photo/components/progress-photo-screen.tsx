import React, { useEffect, useRef, useState } from "react";
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
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Images,
  LockKeyhole,
  Maximize2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import {
  getProgressPhotoViewportSize,
  getProgressPhotoViewportTransform,
  type ProgressPhotoComparisonViewModel,
} from "../ui/progress-photo-comparison.mapper";
import { progressPhotoPerformance } from "../progress-photo-performance";
import {
  PoseTrackerSelector,
  type PoseTrackerSelectorProps,
} from "./pose-tracker-selector";

type ProgressPhotoScreenProps = Omit<PoseTrackerSelectorProps, "disabled"> & {
  selectedTrackerId: string | null;
  onSelectTracker: (id: string | null) => void;
  onNewPose: () => void;
  photos: ProgressPhotoComparisonViewModel[];
  selectedPhoto: ProgressPhotoComparisonViewModel | null;
  comparisonPhotos: ProgressPhotoComparisonViewModel[];
  comparisonPhoto: ProgressPhotoComparisonViewModel | null;
  elapsedTimeLabel: string | null;
  canEditAlignment: boolean;
  canSelectPreviousComparison: boolean;
  canSelectNextComparison: boolean;
  isLoading: boolean;
  isCapturing: boolean;
  isDeleting: boolean;
  onDeletePhoto: (photoId: string) => void;
  errorMessage: string | null;
  poseCapabilityMessage: string | null;
  captureStatusMessage: string | null;
  onEditAlignment: () => void;
  onSelectPhoto: (photoId: string) => void;
  onSelectComparisonPhoto: (photoId: string) => void;
  onSelectPreviousComparison: () => void;
  onSelectNextComparison: () => void;
  onTakePhoto: () => void;
};

type ViewportImageProps = {
  photo: ProgressPhotoComparisonViewModel;
  viewportWidth: number;
  viewportHeight: number;
  isVisible: boolean;
  onError: () => void;
};

function ProgressPhotoViewportImage({
  photo,
  viewportWidth,
  viewportHeight,
  isVisible,
  onError,
}: ViewportImageProps) {
  const viewportTransform = photo.renderTransform
    ? getProgressPhotoViewportTransform(
        photo.renderTransform,
        viewportWidth,
        viewportHeight,
      )
    : null;

  return (
    <Image
      source={{ uri: photo.uri }}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={photo.id}
      onError={onError}
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity: isVisible ? 1 : 0,
        transform: viewportTransform
          ? [
              // React Native composes this array right-to-left.
              { translateX: viewportTransform.translateX },
              { translateY: viewportTransform.translateY },
              { scale: viewportTransform.scale },
              { rotate: viewportTransform.rotation },
            ]
          : // Keep the reset value iterable for React Native's transform validator.
            [],
      }}
    />
  );
}

export function ProgressPhotoScreen({
  trackers,
  isRenaming,
  renameError,
  onBeginRename,
  onRenameTracker,
  selectedTrackerId,
  onSelectTracker,
  onNewPose,
  photos,
  selectedPhoto,
  comparisonPhotos,
  comparisonPhoto,
  elapsedTimeLabel,
  canEditAlignment,
  canSelectPreviousComparison,
  canSelectNextComparison,
  isLoading,
  isCapturing,
  isDeleting,
  onDeletePhoto,
  errorMessage,
  poseCapabilityMessage,
  captureStatusMessage,
  onEditAlignment,
  onSelectPhoto,
  onSelectComparisonPhoto,
  onSelectPreviousComparison,
  onSelectNextComparison,
  onTakePhoto,
}: ProgressPhotoScreenProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();
  const [isHoldingComparison, setIsHoldingComparison] = useState(false);
  const [isComparisonPinned, setIsComparisonPinned] = useState(false);
  const [fullOriginalPhoto, setFullOriginalPhoto] =
    useState<ProgressPhotoComparisonViewModel | null>(null);
  const [unavailablePhotoIds, setUnavailablePhotoIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const didLongPressRef = useRef(false);
  const comparisonSwitchStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setIsHoldingComparison(false);
    setIsComparisonPinned(false);
    setFullOriginalPhoto(null);
  }, [comparisonPhoto?.id, selectedPhoto?.id]);

  const isDisplayingComparison =
    comparisonPhoto !== null && (isHoldingComparison || isComparisonPinned);
  const displayedPhoto =
    isDisplayingComparison && comparisonPhoto ? comparisonPhoto : selectedPhoto;
  const alignmentNeedsAttention =
    displayedPhoto?.alignmentState === "low_confidence" ||
    displayedPhoto?.alignmentState === "missing_reference";
  const displayedPhotoIsUnavailable = displayedPhoto
    ? unavailablePhotoIds.has(displayedPhoto.id)
    : false;

  useEffect(() => {
    const startedAt = comparisonSwitchStartedAtRef.current;
    if (startedAt === null) return;

    const frame = requestAnimationFrame(() => {
      progressPhotoPerformance.record(
        "comparison_switch_latency_ms",
        performance.now() - startedAt,
      );
      comparisonSwitchStartedAtRef.current = null;
    });

    return () => cancelAnimationFrame(frame);
  }, [isDisplayingComparison]);

  const showComparisonWhilePressed = () => {
    if (!comparisonPhoto) return;
    didLongPressRef.current = false;
    comparisonSwitchStartedAtRef.current = performance.now();
    setIsHoldingComparison(true);
  };

  const releaseComparison = () => {
    comparisonSwitchStartedAtRef.current = performance.now();
    setIsHoldingComparison(false);
  };

  const toggleComparison = () => {
    if (!comparisonPhoto || didLongPressRef.current) return;
    comparisonSwitchStartedAtRef.current = performance.now();
    setIsComparisonPinned((isPinned) => !isPinned);
  };

  const markPhotoUnavailable = (photoId: string) => {
    setUnavailablePhotoIds((current) => new Set(current).add(photoId));
  };

  const { width: previewWidth, height: previewHeight } =
    getProgressPhotoViewportSize(width - 32);
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
          <PoseTrackerSelector
            trackers={trackers}
            selectedTrackerId={selectedTrackerId}
            onSelectTracker={onSelectTracker}
            onNewPose={onNewPose}
            disabled={isCapturing || isDeleting}
            isRenaming={isRenaming}
            renameError={renameError}
            onBeginRename={onBeginRename}
            onRenameTracker={onRenameTracker}
          />
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
                <ProgressPhotoViewportImage
                  photo={selectedPhoto}
                  viewportWidth={previewWidth}
                  viewportHeight={previewHeight}
                  isVisible={!isDisplayingComparison}
                  onError={() => markPhotoUnavailable(selectedPhoto.id)}
                />

                {comparisonPhoto ? (
                  <ProgressPhotoViewportImage
                    photo={comparisonPhoto}
                    viewportWidth={previewWidth}
                    viewportHeight={previewHeight}
                    isVisible={isDisplayingComparison}
                    onError={() => markPhotoUnavailable(comparisonPhoto.id)}
                  />
                ) : null}

                {displayedPhotoIsUnavailable ? (
                  <View
                    pointerEvents="none"
                    className="absolute inset-0 items-center justify-center bg-neutral-900 px-6"
                  >
                    <Images size={28} color="#FFFFFF" strokeWidth={1.8} />
                    <Text className="mt-3 text-center text-sm font-semibold text-white">
                      This photo file is unavailable.
                    </Text>
                  </View>
                ) : null}

                {comparisonPhoto ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Switch between default and comparison photo"
                    accessibilityHint="Press and hold to show the comparison photo, or tap to keep switching between both photos."
                    delayLongPress={350}
                    onLongPress={() => {
                      didLongPressRef.current = true;
                    }}
                    onPress={toggleComparison}
                    onPressIn={showComparisonWhilePressed}
                    onPressOut={releaseComparison}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                    }}
                  />
                ) : null}

                <View
                  pointerEvents="none"
                  className={[
                    "absolute left-3 top-3 rounded-full px-3 py-1.5",
                    alignmentNeedsAttention ? "bg-amber-500/90" : "bg-black/55",
                  ].join(" ")}
                >
                  <Text
                    accessibilityLiveRegion="polite"
                    className="text-xs font-semibold text-white"
                  >
                    {isDisplayingComparison ? "Comparison" : "Default"}
                    {" · "}
                    {displayedPhoto?.alignmentStatusLabel}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open full original photo"
                  onPress={() => {
                    if (displayedPhoto) {
                      setFullOriginalPhoto(displayedPhoto);
                    }
                  }}
                  className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full bg-black/55"
                >
                  <Maximize2 size={18} color="#FFFFFF" strokeWidth={2.2} />
                </Pressable>

                <View
                  pointerEvents="none"
                  className="absolute bottom-0 left-0 right-0 bg-black/45 px-4 py-3"
                >
                  <Text className="text-base font-semibold text-white">
                    {displayedPhoto?.dateLabel}
                  </Text>
                  <Text className="mt-0.5 text-xs text-white/75">
                    {displayedPhoto?.timeLabel}
                  </Text>
                  {displayedPhoto?.alignmentDetailLabel ? (
                    <Text className="mt-1 text-xs text-white/75">
                      {displayedPhoto.alignmentDetailLabel}
                    </Text>
                  ) : null}
                </View>
              </View>

              {canEditAlignment ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Adjust photo alignment"
                  disabled={isDeleting}
                  onPress={onEditAlignment}
                  className="mt-3 flex-row items-center justify-center rounded-xl bg-neutral-100 px-4 py-3 dark:bg-[#343746]"
                >
                  <SlidersHorizontal
                    size={17}
                    color={iconColor}
                    strokeWidth={2.2}
                  />
                  <Text className="ml-2 text-xs font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                    Adjust alignment
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete displayed photo"
                disabled={isDeleting || isCapturing}
                onPress={() =>
                  displayedPhoto && onDeletePhoto(displayedPhoto.id)
                }
                className="mt-3 flex-row items-center justify-center rounded-xl bg-red-50 px-4 py-3 dark:bg-red-950/40"
              >
                {isDeleting ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <Trash2 size={17} color="#DC2626" />
                )}
                <Text className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
                  {isDeleting ? "Deleting photo…" : "Delete displayed photo"}
                </Text>
              </Pressable>

              {comparisonPhoto ? (
                <View className="mt-3 rounded-2xl bg-neutral-100 p-4 dark:bg-[#343746]">
                  <View className="flex-row items-start justify-between">
                    <View className="mr-4 flex-1">
                      <Text className="text-sm font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                        Immediate comparison
                      </Text>
                      <Text className="mt-1 text-xs leading-4 text-zinc-500 dark:text-[#A5A8C2]">
                        Hold the photo to compare. Tap it to keep switching.
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-zinc-600 dark:text-[#BD93F9]">
                      {elapsedTimeLabel}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row gap-2">
                    <View className="flex-1 rounded-xl bg-white px-3 py-2 dark:bg-[#2B2D3A]">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-[#6272A4]">
                        Default
                      </Text>
                      <Text className="mt-1 text-xs font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                        {selectedPhoto.dateLabel}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-zinc-500 dark:text-[#A5A8C2]">
                        {selectedPhoto.timeLabel}
                      </Text>
                    </View>
                    <View className="flex-1 rounded-xl bg-white px-3 py-2 dark:bg-[#2B2D3A]">
                      <Text className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-[#6272A4]">
                        Comparison
                      </Text>
                      <Text className="mt-1 text-xs font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                        {comparisonPhoto.dateLabel}
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-zinc-500 dark:text-[#A5A8C2]">
                        {comparisonPhoto.timeLabel}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous comparison photo"
                      disabled={!canSelectPreviousComparison}
                      onPress={onSelectPreviousComparison}
                      className={[
                        "flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5",
                        canSelectPreviousComparison
                          ? "bg-white dark:bg-[#2B2D3A]"
                          : "bg-white/50 dark:bg-[#2B2D3A]/50",
                      ].join(" ")}
                    >
                      <ChevronLeft
                        size={17}
                        color={
                          canSelectPreviousComparison
                            ? iconColor
                            : mutedIconColor
                        }
                        strokeWidth={2.2}
                      />
                      <Text
                        className={[
                          "ml-1 text-xs font-semibold",
                          canSelectPreviousComparison
                            ? "text-zinc-900 dark:text-[#F8F8F2]"
                            : "text-zinc-400 dark:text-[#6272A4]",
                        ].join(" ")}
                      >
                        Previous
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next comparison photo"
                      disabled={!canSelectNextComparison}
                      onPress={onSelectNextComparison}
                      className={[
                        "flex-1 flex-row items-center justify-center rounded-xl px-3 py-2.5",
                        canSelectNextComparison
                          ? "bg-white dark:bg-[#2B2D3A]"
                          : "bg-white/50 dark:bg-[#2B2D3A]/50",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "mr-1 text-xs font-semibold",
                          canSelectNextComparison
                            ? "text-zinc-900 dark:text-[#F8F8F2]"
                            : "text-zinc-400 dark:text-[#6272A4]",
                        ].join(" ")}
                      >
                        Next
                      </Text>
                      <ChevronRight
                        size={17}
                        color={
                          canSelectNextComparison ? iconColor : mutedIconColor
                        }
                        strokeWidth={2.2}
                      />
                    </Pressable>
                  </View>

                  {comparisonPhotos.length > 1 ? (
                    <>
                      <Text className="mt-4 text-xs font-semibold text-zinc-700 dark:text-[#F8F8F2]">
                        Compare with
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                          gap: 8,
                          paddingTop: 8,
                        }}
                      >
                        {comparisonPhotos.map((photo) => {
                          const isSelected = photo.id === comparisonPhoto.id;

                          return (
                            <Pressable
                              key={photo.id}
                              accessibilityRole="button"
                              accessibilityLabel={`Compare with photo from ${photo.dateLabel}`}
                              accessibilityState={{ selected: isSelected }}
                              onPress={() => onSelectComparisonPhoto(photo.id)}
                              className={[
                                "overflow-hidden rounded-xl border-2",
                                isSelected
                                  ? "border-neutral-900 dark:border-[#BD93F9]"
                                  : "border-transparent",
                              ].join(" ")}
                            >
                              <Image
                                source={{ uri: photo.uri }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                                style={{ width: 58, height: 74 }}
                              />
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </>
                  ) : null}
                </View>
              ) : null}

              <View className="mt-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-[#F8F8F2]">
                    Your timeline
                  </Text>
                  <Text className="mt-0.5 text-xs text-zinc-500 dark:text-[#6272A4]">
                    Tap a photo to make it the default
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
                      onPress={() => onSelectPhoto(photo.id)}
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
            <View
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950"
            >
              <Text className="text-sm font-bold text-amber-900 dark:text-amber-100">
                Pose guidance unavailable
              </Text>
              <Text className="mt-1 text-sm leading-5 text-amber-900 dark:text-amber-100">
                {poseCapabilityMessage}
              </Text>
              <Text className="mt-2 text-sm leading-5 text-amber-900 dark:text-amber-100">
                You can still take a regular photo, but pose guidance and
                automatic capture will be unavailable.
              </Text>
            </View>
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
            disabled={isCapturing || isDeleting}
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
        onRequestClose={() => setFullOriginalPhoto(null)}
        statusBarTranslucent
        visible={fullOriginalPhoto !== null}
      >
        <View className="flex-1 bg-black">
          {fullOriginalPhoto ? (
            <Image
              source={{ uri: fullOriginalPhoto.uri }}
              contentFit="contain"
              cachePolicy="memory-disk"
              onError={() => markPhotoUnavailable(fullOriginalPhoto.id)}
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
              onPress={() => setFullOriginalPhoto(null)}
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
