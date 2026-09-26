import type { TfliteModel } from "react-native-fast-tflite";
import type { CameraOrientation, Frame } from "react-native-vision-camera";
import type { Resizer } from "react-native-vision-camera-resizer";
import { createSynchronizable } from "react-native-worklets";

import { parseMoveNetOutputResult } from "./movenet-output-parser";
import { getProgressPoseCapability } from "./progress-pose-capability";
import { progressPoseConfig } from "./progress-pose-config";
import type {
  ProgressPoseDetectionStatus,
  ProgressPoseDetector,
  ProgressPoseDetectorFactory,
} from "./progress-pose-detector.types";
import {
  PROGRESS_POSE_MODEL,
  PROGRESS_POSE_MODEL_ASSET,
} from "./progress-pose-model";

export type {
  DetectedPose,
  PoseLandmark,
  ProgressPoseDetectionStatus,
  ProgressPoseDetector,
} from "./progress-pose-detector.types";

const CAMERA_ORIENTATIONS = ["up", "down", "left", "right"] as const;

function isCameraOrientation(value: unknown): value is CameraOrientation {
  "worklet";
  return CAMERA_ORIENTATIONS.some((orientation) => orientation === value);
}

function isUsableFrame(value: unknown): value is Frame {
  "worklet";

  if (!value || typeof value !== "object") return false;

  const frame = value as Partial<Frame>;

  return (
    frame.isValid === true &&
    typeof frame.width === "number" &&
    Number.isFinite(frame.width) &&
    frame.width > 0 &&
    typeof frame.height === "number" &&
    Number.isFinite(frame.height) &&
    frame.height > 0 &&
    typeof frame.timestamp === "number" &&
    Number.isFinite(frame.timestamp) &&
    isCameraOrientation(frame.orientation) &&
    typeof frame.isMirrored === "boolean"
  );
}

function hasExpectedTensorContract(model: TfliteModel) {
  const input = model.inputs[0];
  const output = model.outputs[0];

  return (
    model.inputs.length === 1 &&
    model.outputs.length === 1 &&
    input?.dataType === "uint8" &&
    input.shape.join(",") ===
      `1,${PROGRESS_POSE_MODEL.inputHeight},${PROGRESS_POSE_MODEL.inputWidth},3` &&
    output?.dataType === "float32" &&
    output.shape.join(",") === `1,1,${PROGRESS_POSE_MODEL.landmarkCount},3`
  );
}

function createDetector(
  model: TfliteModel,
  resizer: Resizer,
): ProgressPoseDetector {
  const sharedState = createSynchronizable({
    lastInferenceTimestampMs: Number.NEGATIVE_INFINITY,
    lastDetectionStatus: "skipped" as ProgressPoseDetectionStatus,
    disposed: false,
  });

  return {
    detectFromFrame(frameValue: unknown) {
      "worklet";

      // Serialize inference and disposal so native resources cannot be freed
      // while the camera runtime is using them.
      sharedState.lock();
      const state = { ...sharedState.getBlocking() };
      try {
        if (state.disposed || !isUsableFrame(frameValue)) {
          state.lastDetectionStatus = "invalid";
          return null;
        }

        const timestampMs = frameValue.timestamp * 1000;
        const elapsedSinceLastInference =
          timestampMs - state.lastInferenceTimestampMs;
        if (
          elapsedSinceLastInference >= 0 &&
          elapsedSinceLastInference < progressPoseConfig.inferenceIntervalMs
        ) {
          state.lastDetectionStatus = "skipped";
          return null;
        }
        state.lastInferenceTimestampMs = timestampMs;

        const resizedFrame = resizer.resize(frameValue);

        try {
          const inputBuffer = resizedFrame.getPixelBuffer();
          const expectedInputBytes =
            PROGRESS_POSE_MODEL.inputWidth *
            PROGRESS_POSE_MODEL.inputHeight *
            3;

          if (inputBuffer.byteLength !== expectedInputBytes) {
            state.lastDetectionStatus = "invalid";
            return null;
          }

          const outputs = model.runSync([inputBuffer]);
          const output = outputs[0];
          if (!output) {
            state.lastDetectionStatus = "invalid";
            return null;
          }

          const result = parseMoveNetOutputResult(new Float32Array(output), {
            sourceWidth: frameValue.width,
            sourceHeight: frameValue.height,
            modelWidth: PROGRESS_POSE_MODEL.inputWidth,
            modelHeight: PROGRESS_POSE_MODEL.inputHeight,
            orientation: frameValue.orientation,
            isMirrored: frameValue.isMirrored,
            timestampMs,
            minimumLandmarkConfidence:
              progressPoseConfig.minimumLandmarkConfidence,
            minimumOverallConfidence:
              progressPoseConfig.minimumOverallConfidence,
            minimumVisibleLandmarkCount:
              progressPoseConfig.minimumVisibleLandmarkCount,
            noPersonOverallConfidenceMaximum:
              progressPoseConfig.noPersonOverallConfidenceMaximum,
          });
          state.lastDetectionStatus = result.status;
          return result.pose;
        } finally {
          resizedFrame.dispose();
        }
      } finally {
        try {
          sharedState.setBlocking(state);
        } finally {
          sharedState.unlock();
        }
      }
    },

    getLastDetectionStatus() {
      "worklet";
      return sharedState.getBlocking().lastDetectionStatus;
    },

    dispose() {
      sharedState.lock();
      try {
        const state = sharedState.getBlocking();
        if (state.disposed) return;
        sharedState.setBlocking({ ...state, disposed: true });
        try {
          resizer.dispose();
        } finally {
          model.dispose();
        }
      } finally {
        sharedState.unlock();
      }
    },
  };
}

export const createProgressPoseDetector: ProgressPoseDetectorFactory =
  async () => {
    const capability = await getProgressPoseCapability();
    if (!capability.available) return null;

    const [{ loadTensorflowModel }, { createResizer }] = await Promise.all([
      import("react-native-fast-tflite"),
      import("react-native-vision-camera-resizer"),
    ]);
    const [model, resizer] = await Promise.all([
      loadTensorflowModel(PROGRESS_POSE_MODEL_ASSET, []),
      createResizer({
        width: PROGRESS_POSE_MODEL.inputWidth,
        height: PROGRESS_POSE_MODEL.inputHeight,
        channelOrder: "rgb",
        dataType: "uint8",
        scaleMode: "contain",
        pixelLayout: "interleaved",
      }),
    ]);

    if (!hasExpectedTensorContract(model)) {
      resizer.dispose();
      model.dispose();
      return null;
    }

    return createDetector(model, resizer);
  };
