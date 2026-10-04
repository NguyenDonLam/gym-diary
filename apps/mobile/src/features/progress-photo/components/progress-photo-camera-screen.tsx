import React, { type ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Camera, X } from "lucide-react-native";

import { progressPoseAutoCaptureConfig } from "../pose/progress-pose-auto-capture.config";
import type { AutoCaptureState } from "../pose/progress-pose-auto-capture";
import { progressPoseGuidanceConfig } from "../pose/progress-pose-guidance.config";
import type { ProgressPhotoCameraReference } from "../ui/progress-photo-camera-reference.mapper";
import type { ProgressPoseGuidanceViewModel } from "../ui/progress-pose-guidance.mapper";

type ProgressPhotoCameraScreenProps = {
  preview: ReactNode;
  errorMessage: string | null;
  references: ProgressPhotoCameraReference[];
  selectedReferenceId: string | null;
  guidance: ProgressPoseGuidanceViewModel;
  isCapturing: boolean;
  isCameraReady: boolean;
  timerSeconds: number;
  countdownSeconds: number | null;
  onTimerSecondsChange: (seconds: number) => void;
  onCancelCountdown: () => void;
  autoCaptureEnabled: boolean;
  autoCaptureState: AutoCaptureState;
  autoCaptureHoldProgress: number;
  isAutoCaptureAvailable: boolean;
  onAutoCaptureEnabledChange: (enabled: boolean) => void;
  onSelectReference: (referenceId: string) => void;
  onCancel: () => void;
  onCapture: () => void;
};

export function ProgressPhotoCameraScreen({
  preview,
  errorMessage,
  references,
  selectedReferenceId,
  guidance,
  isCapturing,
  isCameraReady,
  timerSeconds,
  countdownSeconds,
  onTimerSecondsChange,
  onCancelCountdown,
  autoCaptureEnabled,
  autoCaptureState,
  autoCaptureHoldProgress,
  isAutoCaptureAvailable,
  onAutoCaptureEnabledChange,
  onSelectReference,
  onCancel,
  onCapture,
}: ProgressPhotoCameraScreenProps) {
  const [overlayOpacity, setOverlayOpacity] = useState<number>(
    progressPoseGuidanceConfig.defaultOverlayOpacity,
  );
  const selectedReference =
    references.find((reference) => reference.id === selectedReferenceId) ??
    null;
  const isHolding = autoCaptureState === "holding";
  const isCountingDown = countdownSeconds !== null;
  const holdRemainingSeconds = Math.max(
    0,
    (progressPoseAutoCaptureConfig.holdDurationMs *
      (1 - autoCaptureHoldProgress)) /
      1000,
  );

  return (
    <View className="flex-1 bg-black">
      {preview}

      {selectedReference && overlayOpacity > 0 ? (
        <Image
          pointerEvents="none"
          source={{ uri: selectedReference.uri }}
          contentFit="cover"
          style={{
            position: "absolute",
            inset: 0,
            opacity: overlayOpacity,
          }}
        />
      ) : null}

      <SafeAreaView className="absolute inset-0 justify-between">
        <View className="px-4 pt-2">
          <View className="flex-row items-start justify-between">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close progress photo camera"
              disabled={isCapturing}
              onPress={onCancel}
              className="h-11 w-11 items-center justify-center  bg-black/70"
            >
              <X color="#FFFFFF" size={23} />
            </Pressable>

            {errorMessage ? (
              <View className="ml-3 max-w-72  bg-red-950/90 px-4 py-2">
                <Text className="text-center text-xs font-semibold text-white">
                  {errorMessage}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="mt-3  bg-black/70 p-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-white">
                Pose reference
              </Text>
              {selectedReference ? (
                <Text className="text-xs text-white/70">
                  {selectedReference.dateLabel}
                </Text>
              ) : null}
            </View>

            {references.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingTop: 8 }}
              >
                {references.map((reference) => {
                  const isSelected = reference.id === selectedReferenceId;

                  return (
                    <Pressable
                      key={reference.id}
                      accessibilityRole="button"
                      accessibilityLabel={reference.accessibilityLabel}
                      accessibilityState={{ selected: isSelected }}
                      disabled={isCapturing || isCountingDown}
                      onPress={() => onSelectReference(reference.id)}
                      className={[
                        "overflow-hidden  border-2",
                        isSelected ? "border-white" : "border-transparent",
                      ].join(" ")}
                    >
                      <Image
                        source={{ uri: reference.uri }}
                        contentFit="cover"
                        style={{ width: 44, height: 56 }}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text className="mt-2 text-xs text-white/70">
                No saved pose references yet.
              </Text>
            )}

            {selectedReference ? (
              <View className="mt-3 flex-row items-center">
                <Text className="mr-2 text-xs text-white/70">Overlay</Text>
                {progressPoseGuidanceConfig.overlayOpacities.map((opacity) => (
                  <Pressable
                    key={opacity}
                    accessibilityRole="button"
                    accessibilityLabel={
                      opacity === 0
                        ? "Disable reference overlay"
                        : `Set reference overlay to ${opacity * 100} percent`
                    }
                    accessibilityState={{
                      selected: overlayOpacity === opacity,
                    }}
                    onPress={() => setOverlayOpacity(opacity)}
                    className={[
                      "mr-1  px-2 py-1",
                      overlayOpacity === opacity ? "bg-white" : "bg-white/15",
                    ].join(" ")}
                  >
                    <Text
                      className={[
                        "text-xs font-medium",
                        overlayOpacity === opacity
                          ? "text-black"
                          : "text-white",
                      ].join(" ")}
                    >
                      {opacity === 0 ? "Off" : `${opacity * 100}%`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View className="mt-2  bg-black/75 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                {guidance.overallLabel}
              </Text>
              <Text className="text-sm font-semibold text-emerald-300">
                {guidance.instruction}
              </Text>
            </View>
            <View className="mt-1 flex-row justify-between">
              <Text className="text-xs text-white/75">
                {guidance.poseStatus}
              </Text>
              <Text className="text-xs text-white/75">
                {guidance.framingStatus}
              </Text>
            </View>

            {guidance.rawScores ? (
              <Text className="mt-2 font-mono text-[10px] text-white/60">
                Pose {guidance.rawScores.pose.toFixed(2)} · Framing{" "}
                {guidance.rawScores.framing.toFixed(2)} · Visibility{" "}
                {guidance.rawScores.visibility.toFixed(2)} · Overall{" "}
                {guidance.rawScores.overall.toFixed(2)}
              </Text>
            ) : null}

            <View className="mt-3 flex-row items-center justify-between border-t border-white/15 pt-3">
              <View className="mr-3 flex-1">
                <Text className="text-xs font-semibold text-white">
                  Automatic capture
                </Text>
                <Text className="mt-0.5 text-[11px] text-white/60">
                  {isAutoCaptureAvailable
                    ? autoCaptureEnabled
                      ? autoCaptureState === "searching"
                        ? "Searching for a match"
                        : autoCaptureState === "matching"
                          ? "Almost matched"
                          : autoCaptureState === "holding"
                            ? "Match held"
                            : autoCaptureState === "capturing"
                              ? "Taking photo"
                              : autoCaptureState === "cooldown"
                                ? "Capture cooldown"
                                : "Off"
                      : "Off"
                    : "Select a valid reference"}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Automatic progress photo capture"
                value={autoCaptureEnabled}
                disabled={
                  !isAutoCaptureAvailable || isCapturing || isCountingDown
                }
                onValueChange={onAutoCaptureEnabledChange}
                trackColor={{ false: "#52525B", true: "#10B981" }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isHolding ? (
              <View className="mt-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-emerald-300">
                    Hold still
                  </Text>
                  <Text className="text-xs font-semibold text-white">
                    {holdRemainingSeconds.toFixed(1)}s
                  </Text>
                </View>
                <View className="mt-2 h-2 overflow-hidden  bg-white/20">
                  <View
                    className="h-full  bg-emerald-400"
                    style={{
                      width: `${Math.round(autoCaptureHoldProgress * 100)}%`,
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {isCountingDown ? (
          <View pointerEvents="none" className="items-center">
            <Text
              accessibilityLiveRegion="polite"
              accessibilityLabel={`Photo in ${countdownSeconds} seconds`}
              className=" bg-black/70 px-8 py-2 text-7xl font-bold text-white"
            >
              {countdownSeconds}
            </Text>
          </View>
        ) : null}

        <View className="items-center pb-8">
          <View className="mb-4 flex-row items-center  bg-black/70 p-2">
            <Text className="mx-2 text-xs font-semibold text-white">Timer</Text>
            {[0, 3, 5, 10].map((seconds) => (
              <Pressable
                key={seconds}
                accessibilityRole="button"
                accessibilityLabel={
                  seconds === 0
                    ? "Turn photo timer off"
                    : `Set photo timer to ${seconds} seconds`
                }
                accessibilityState={{ selected: timerSeconds === seconds }}
                disabled={isCapturing || isCountingDown}
                onPress={() => onTimerSecondsChange(seconds)}
                className={`min-h-11 min-w-11 items-center justify-center  px-3 ${timerSeconds === seconds ? "bg-white" : "bg-transparent"}`}
              >
                <Text
                  className={`text-sm font-semibold ${timerSeconds === seconds ? "text-black" : "text-white"}`}
                >
                  {seconds === 0 ? "Off" : `${seconds}s`}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isCountingDown
                ? "Cancel photo countdown"
                : timerSeconds > 0
                  ? `Take progress photo after ${timerSeconds} seconds`
                  : "Take progress photo"
            }
            disabled={isCapturing || !isCameraReady}
            onPress={isCountingDown ? onCancelCountdown : onCapture}
            className={[
              "h-20 w-20 items-center justify-center  border-4 border-white",
              isCapturing ? "bg-white/40" : "bg-white/20",
            ].join(" ")}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : isCountingDown ? (
              <X color="#FFFFFF" size={30} />
            ) : (
              <Camera color="#FFFFFF" size={30} strokeWidth={2.2} />
            )}
          </Pressable>

          <Text className="mt-3 text-xs text-white/80">
            {isCountingDown
              ? "Tap to cancel countdown"
              : timerSeconds > 0
                ? `Tap shutter, then pose · ${timerSeconds}s timer`
                : "Tap shutter to take a photo"}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
