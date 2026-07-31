import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, StyleSheet, View } from "react-native";
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
  createProgressPoseDetector,
  type DetectedPose,
  type ProgressPoseDetector,
} from "../pose/progress-pose-detector";
import {
  progressPoseConfig,
  progressPoseFrameOutputConfig,
} from "../pose/progress-pose-config";
import { isDetectedPoseValidForCapture } from "../pose/progress-pose-capture";
import type { ProgressPhotoCameraContainerProps } from "./progress-photo-camera.types";

function toFileUri(path: string) {
  return path.startsWith("file://") ? path : `file://${path}`;
}

export function ProgressPhotoCameraContainer({
  onCancel,
  onCaptured,
}: ProgressPhotoCameraContainerProps) {
  const detectorRef = useRef<ProgressPoseDetector | null>(null);
  const latestValidPoseRef = useRef<DetectedPose | null>(null);
  const previousPoseTimestampRef = useRef<number | null>(null);
  const [detector, setDetector] = useState<ProgressPoseDetector | null>(null);
  const [displayPose, setDisplayPose] = useState<DetectedPose | null>(null);
  const [inferenceRateHz, setInferenceRateHz] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [isAppActive, setIsAppActive] = useState(
    AppState.currentState === "active",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setIsAppActive(state === "active");
    });

    return () => subscription.remove();
  }, []);

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
          setErrorMessage("Pose detection unavailable. Manual capture works.");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setErrorMessage("Pose detection unavailable. Manual capture works.");
        }
      });

    return () => {
      isCancelled = true;
      detectorRef.current?.dispose();
      detectorRef.current = null;
    };
  }, []);

  const receiveDetectedPose = useCallback((pose: DetectedPose) => {
    if (!isDetectedPoseValidForCapture(pose)) return;

    const previousTimestamp = previousPoseTimestampRef.current;
    if (previousTimestamp !== null && pose.timestampMs > previousTimestamp) {
      setInferenceRateHz(1000 / (pose.timestampMs - previousTimestamp));
    }
    previousPoseTimestampRef.current = pose.timestampMs;
    latestValidPoseRef.current = pose;
    setDisplayPose(pose);
  }, []);

  const onFrame = useCallback(
    (frame: Parameters<ProgressPoseDetector["detectFromFrame"]>[0]) => {
      "worklet";

      try {
        const pose = detector?.detectFromFrame(frame) ?? null;
        if (pose) {
          runOnJS(receiveDetectedPose)(pose);
        }
      } finally {
        (
          frame as {
            dispose?: () => void;
          }
        ).dispose?.();
      }
    },
    [detector, receiveDetectedPose],
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

  const capturePhoto = useCallback(async () => {
    if (!isCameraStarted || isCapturing) return;

    setIsCapturing(true);
    setErrorMessage(null);
    const nearestPose = latestValidPoseRef.current;

    try {
      const photo = await photoOutput.capturePhoto({ flashMode: "off" }, {});

      try {
        const temporaryPath = await photo.saveToTemporaryFileAsync();

        await onCaptured({
          sourceUri: toFileUri(temporaryPath),
          capturedAt: new Date(),
          shutterTimestampMs: photo.timestamp * 1000,
          imageWidth: photo.width,
          imageHeight: photo.height,
          pose: nearestPose,
        });
      } finally {
        photo.dispose();
      }
    } catch {
      setErrorMessage("The photo could not be captured. Please try again.");
      setIsCapturing(false);
    }
  }, [isCameraStarted, isCapturing, onCaptured, photoOutput]);

  const statusMessage = detector
    ? displayPose
      ? "Pose detected"
      : "Looking for a clear standing pose"
    : "Starting private pose detection…";

  return (
    <ProgressPhotoCameraScreen
      isCapturing={isCapturing}
      statusMessage={statusMessage}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onCapture={() => void capturePhoto()}
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
