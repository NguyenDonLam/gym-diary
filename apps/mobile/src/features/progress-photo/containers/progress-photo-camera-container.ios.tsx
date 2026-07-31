import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import {
  Camera,
  CommonResolutions,
  useFrameOutput,
  usePhotoOutput,
} from "react-native-vision-camera";
import { runOnJS } from "react-native-worklets";

import { ProgressPhotoCameraScreen } from "../components/progress-photo-camera-screen";
import { ProgressPoseDiagnosticOverlay } from "../components/progress-pose-diagnostic-overlay";
import {
  createAutoCaptureMachine,
  updateAutoCaptureMachine,
  type AutoCaptureEvent,
} from "../pose/progress-pose-auto-capture";
import {
  createProgressPoseDetector,
  type DetectedPose,
  type ProgressPoseDetectionStatus,
  type ProgressPoseDetector,
} from "../pose/progress-pose-detector";
import { compareProgressPoses } from "../pose/progress-pose-comparison";
import type { PoseMatchResult } from "../pose/progress-pose-comparison.types";
import {
  progressPoseConfig,
  progressPoseFrameOutputConfig,
} from "../pose/progress-pose-config";
import { isDetectedPoseValidForCapture } from "../pose/progress-pose-capture";
import {
  updateSmoothedPoseMatch,
  type SmoothedPoseMatchState,
} from "../pose/progress-pose-match-smoother";
import { selectDefaultProgressPhotoCameraReferenceId } from "../ui/progress-photo-camera-reference.mapper";
import { progressPoseGuidanceMapper } from "../ui/progress-pose-guidance.mapper";
import type { ProgressPhotoCameraContainerProps } from "./progress-photo-camera.types";

function toFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}

export function ProgressPhotoCameraContainer({
  references,
  onCancel,
  onCaptured,
}: ProgressPhotoCameraContainerProps) {
  const detectorRef = useRef<ProgressPoseDetector | null>(null);
  const latestValidPoseRef = useRef<DetectedPose | null>(null);
  const previousPoseTimestampRef = useRef<number | null>(null);
  const lastFrameTimestampRef = useRef(0);
  const smoothedMatchRef = useRef<SmoothedPoseMatchState | null>(null);
  const autoCaptureMachineRef = useRef(createAutoCaptureMachine());
  const automaticCaptureInFlightRef = useRef(false);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(
    selectDefaultProgressPhotoCameraReferenceId(references),
  );
  const [detector, setDetector] = useState<ProgressPoseDetector | null>(null);
  const [displayPose, setDisplayPose] = useState<DetectedPose | null>(null);
  const [matchResult, setMatchResult] = useState<PoseMatchResult | null>(null);
  const [autoCaptureMachine, setAutoCaptureMachine] = useState(
    createAutoCaptureMachine,
  );
  const [detectionStatus, setDetectionStatus] = useState<
    ProgressPoseDetectionStatus | "starting"
  >("starting");
  const [inferenceRateHz, setInferenceRateHz] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedReference = useMemo(
    () =>
      references.find((reference) => reference.id === selectedReferenceId) ??
      null,
    [references, selectedReferenceId],
  );
  const applyAutoCaptureEvent = useCallback((event: AutoCaptureEvent) => {
    const previous = autoCaptureMachineRef.current;
    const next = updateAutoCaptureMachine(previous, event);
    autoCaptureMachineRef.current = next;
    setAutoCaptureMachine(next);

    if (previous.state !== "holding" && next.state === "holding") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  useEffect(() => {
    if (
      selectedReferenceId &&
      references.some((reference) => reference.id === selectedReferenceId)
    ) {
      return;
    }

    setSelectedReferenceId(
      selectDefaultProgressPhotoCameraReferenceId(references),
    );
  }, [references, selectedReferenceId]);

  useEffect(() => {
    smoothedMatchRef.current = null;
    setMatchResult(null);
    applyAutoCaptureEvent({ type: "cancel" });
    if (!selectedReference?.poseData) {
      applyAutoCaptureEvent({ type: "set_enabled", enabled: false });
    }
  }, [applyAutoCaptureEvent, selectedReference, selectedReferenceId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      const isActive = state === "active";
      setIsAppActive(isActive);
      if (!isActive) {
        applyAutoCaptureEvent({ type: "cancel" });
      }
    });

    return () => subscription.remove();
  }, [applyAutoCaptureEvent]);

  useEffect(() => {
    let isCancelled = false;

    void createProgressPoseDetector()
      .then((createdDetector) => {
        if (isCancelled) {
          createdDetector?.dispose();
          return;
        }

        detectorRef.current = createdDetector;
        setDetector(createdDetector);
        if (!createdDetector) {
          applyAutoCaptureEvent({ type: "set_enabled", enabled: false });
          setDetectionStatus("invalid");
          setErrorMessage("Pose detection unavailable. Manual capture works.");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          applyAutoCaptureEvent({ type: "set_enabled", enabled: false });
          setDetectionStatus("invalid");
          setErrorMessage("Pose detection unavailable. Manual capture works.");
        }
      });

    return () => {
      isCancelled = true;
      detectorRef.current?.dispose();
      detectorRef.current = null;
      autoCaptureMachineRef.current = updateAutoCaptureMachine(
        autoCaptureMachineRef.current,
        { type: "cancel" },
      );
    };
  }, [applyAutoCaptureEvent]);

  const receiveDetection = useCallback(
    (
      pose: DetectedPose | null,
      status: ProgressPoseDetectionStatus,
      frameTimestampMs: number,
    ) => {
      lastFrameTimestampRef.current = frameTimestampMs;
      setDetectionStatus(status);

      if (status !== "detected" || !pose) {
        applyAutoCaptureEvent({
          type: "match",
          timestampMs: frameTimestampMs,
          match: null,
        });
        setDisplayPose(null);
        setMatchResult(null);
        smoothedMatchRef.current = null;
        return;
      }

      const previousTimestamp = previousPoseTimestampRef.current;
      if (previousTimestamp !== null && pose.timestampMs > previousTimestamp) {
        setInferenceRateHz(1000 / (pose.timestampMs - previousTimestamp));
      }
      previousPoseTimestampRef.current = pose.timestampMs;
      setDisplayPose(pose);

      if (isDetectedPoseValidForCapture(pose)) {
        latestValidPoseRef.current = pose;
      }

      if (!selectedReference?.poseData) {
        applyAutoCaptureEvent({
          type: "match",
          timestampMs: frameTimestampMs,
          match: null,
        });
        setMatchResult(null);
        smoothedMatchRef.current = null;
        return;
      }

      const nextMatch = compareProgressPoses(selectedReference.poseData, pose);
      if (nextMatch.failureReason) {
        applyAutoCaptureEvent({
          type: "match",
          timestampMs: frameTimestampMs,
          match: null,
        });
        setDetectionStatus("low_confidence");
        setMatchResult(null);
        smoothedMatchRef.current = null;
        return;
      }

      const smoothedMatch = updateSmoothedPoseMatch(
        smoothedMatchRef.current,
        nextMatch,
      );
      smoothedMatchRef.current = smoothedMatch;
      setMatchResult(smoothedMatch.result);
      applyAutoCaptureEvent({
        type: "match",
        timestampMs: frameTimestampMs,
        match: smoothedMatch.result,
      });
    },
    [applyAutoCaptureEvent, selectedReference],
  );

  const onFrame = useCallback(
    (frame: Parameters<ProgressPoseDetector["detectFromFrame"]>[0]) => {
      "worklet";

      try {
        const pose = detector?.detectFromFrame(frame) ?? null;
        const status = detector?.getLastDetectionStatus() ?? "invalid";
        if (status !== "skipped") {
          const timestampMs =
            ((frame as { timestamp?: number }).timestamp ?? 0) * 1000;
          runOnJS(receiveDetection)(pose, status, timestampMs);
        }
      } finally {
        (
          frame as {
            dispose?: () => void;
          }
        ).dispose?.();
      }
    },
    [detector, receiveDetection],
  );

  const frameOutput = useFrameOutput({
    ...progressPoseFrameOutputConfig,
    onFrame: detector ? onFrame : undefined,
  });
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.UHD_4_3,
    containerFormat: "jpeg",
    quality: 0.9,
    qualityPrioritization: "balanced",
  });
  const outputs = useMemo(
    () => (detector ? [photoOutput, frameOutput] : [photoOutput]),
    [detector, frameOutput, photoOutput],
  );

  const capturePhoto = useCallback(
    async (source: "manual" | "automatic") => {
      if (!isCameraStarted || isCapturing) return;

      if (source === "manual") {
        applyAutoCaptureEvent({ type: "cancel" });
      }
      setIsCapturing(true);
      setErrorMessage(null);
      const nearestPose = latestValidPoseRef.current;

      try {
        const photo = await photoOutput.capturePhoto({ flashMode: "off" }, {});

        try {
          if (source === "automatic") {
            applyAutoCaptureEvent({
              type: "capture_completed",
              timestampMs: photo.timestamp * 1000,
            });
          }
          const temporaryPath = await photo.saveToTemporaryFileAsync();

          await onCaptured({
            sourceUri: toFileUri(temporaryPath),
            capturedAt: new Date(),
            shutterTimestampMs: photo.timestamp * 1000,
            imageWidth: photo.width,
            imageHeight: photo.height,
            pose: nearestPose,
            poseGroupId: selectedReference?.poseGroupId ?? null,
            referencePhotoId: selectedReference?.id ?? null,
          });
        } finally {
          photo.dispose();
        }
      } catch {
        if (source === "automatic") {
          applyAutoCaptureEvent({ type: "cancel" });
        }
        setErrorMessage("The photo could not be captured. Please try again.");
        setIsCapturing(false);
      }
    },
    [
      applyAutoCaptureEvent,
      isCameraStarted,
      isCapturing,
      onCaptured,
      photoOutput,
      selectedReference,
    ],
  );

  useEffect(() => {
    if (
      !autoCaptureMachine.captureRequested ||
      automaticCaptureInFlightRef.current ||
      isCapturing ||
      !isAppActive
    ) {
      return;
    }

    automaticCaptureInFlightRef.current = true;
    void capturePhoto("automatic").finally(() => {
      automaticCaptureInFlightRef.current = false;
    });
  }, [
    autoCaptureMachine.captureRequested,
    capturePhoto,
    isAppActive,
    isCapturing,
  ]);

  const referenceState = selectedReference
    ? selectedReference.poseData
      ? ("ready" as const)
      : ("missing" as const)
    : ("none" as const);
  const guidance = useMemo(
    () =>
      progressPoseGuidanceMapper.fromState({
        referenceState,
        detectionStatus,
        match: matchResult,
        includeRawScores: __DEV__,
      }),
    [detectionStatus, matchResult, referenceState],
  );
  const isAutoCaptureAvailable =
    detector !== null && referenceState === "ready" && errorMessage === null;

  return (
    <ProgressPhotoCameraScreen
      isCapturing={isCapturing || autoCaptureMachine.state === "capturing"}
      errorMessage={errorMessage}
      references={references}
      selectedReferenceId={selectedReferenceId}
      guidance={guidance}
      autoCaptureEnabled={autoCaptureMachine.enabled}
      autoCaptureState={autoCaptureMachine.state}
      autoCaptureHoldProgress={autoCaptureMachine.holdProgress}
      isAutoCaptureAvailable={isAutoCaptureAvailable}
      onAutoCaptureEnabledChange={(enabled) =>
        applyAutoCaptureEvent({ type: "set_enabled", enabled })
      }
      onSelectReference={setSelectedReferenceId}
      onCancel={onCancel}
      onCapture={() => void capturePhoto("manual")}
      preview={
        <View style={StyleSheet.absoluteFill}>
          <Camera
            style={StyleSheet.absoluteFill}
            device="front"
            outputs={outputs}
            isActive={isAppActive}
            mirrorMode="auto"
            orientationSource="device"
            onStarted={() => setIsCameraStarted(true)}
            onStopped={() => setIsCameraStarted(false)}
            onError={() => {
              applyAutoCaptureEvent({
                type: "set_enabled",
                enabled: false,
              });
              setDetectionStatus("invalid");
              setErrorMessage("The camera is unavailable.");
              setIsCameraStarted(false);
            }}
          />
          <ProgressPoseDiagnosticOverlay
            enabled={progressPoseConfig.diagnosticsEnabled}
            pose={displayPose}
            inferenceRateHz={inferenceRateHz}
          />
        </View>
      }
    />
  );
}
