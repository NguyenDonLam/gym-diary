import type { CameraOrientation } from "react-native-vision-camera";

import type {
  DetectedPose,
  PoseLandmark,
} from "./progress-pose-detector.types";

export const MOVENET_LANDMARK_NAMES = [
  "nose",
  "left_eye",
  "right_eye",
  "left_ear",
  "right_ear",
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const;

export type MoveNetParserOptions = {
  sourceWidth: number;
  sourceHeight: number;
  modelWidth: number;
  modelHeight: number;
  orientation: CameraOrientation;
  isMirrored: boolean;
  timestampMs: number;
  minimumLandmarkConfidence: number;
  minimumOverallConfidence: number;
  minimumVisibleLandmarkCount: number;
};

type NormalizedPoint = {
  x: number;
  y: number;
};

function clampUnit(value: number) {
  "worklet";
  return Math.min(1, Math.max(0, value));
}

function removeContainPadding(
  modelPoint: NormalizedPoint,
  options: MoveNetParserOptions,
): NormalizedPoint | null {
  "worklet";

  const scale = Math.min(
    options.modelWidth / options.sourceWidth,
    options.modelHeight / options.sourceHeight,
  );
  const contentWidth = options.sourceWidth * scale;
  const contentHeight = options.sourceHeight * scale;

  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    contentWidth <= 0 ||
    contentHeight <= 0
  ) {
    return null;
  }

  const paddingX = (options.modelWidth - contentWidth) / 2;
  const paddingY = (options.modelHeight - contentHeight) / 2;

  return {
    x: (modelPoint.x * options.modelWidth - paddingX) / contentWidth,
    y: (modelPoint.y * options.modelHeight - paddingY) / contentHeight,
  };
}

function rotateToUpright(
  point: NormalizedPoint,
  orientation: CameraOrientation,
): NormalizedPoint {
  "worklet";

  switch (orientation) {
    case "right":
      return { x: point.y, y: 1 - point.x };
    case "left":
      return { x: 1 - point.y, y: point.x };
    case "down":
      return { x: 1 - point.x, y: 1 - point.y };
    case "up":
    default:
      return point;
  }
}

function getUprightSourceSize(
  sourceWidth: number,
  sourceHeight: number,
  orientation: CameraOrientation,
) {
  "worklet";

  if (orientation === "left" || orientation === "right") {
    return { width: sourceHeight, height: sourceWidth };
  }

  return { width: sourceWidth, height: sourceHeight };
}

export function parseMoveNetOutput(
  output: ArrayLike<number>,
  options: MoveNetParserOptions,
): DetectedPose | null {
  "worklet";

  const expectedValueCount = MOVENET_LANDMARK_NAMES.length * 3;

  if (
    output.length !== expectedValueCount ||
    !Number.isFinite(options.sourceWidth) ||
    !Number.isFinite(options.sourceHeight) ||
    options.sourceWidth <= 0 ||
    options.sourceHeight <= 0 ||
    !Number.isFinite(options.timestampMs)
  ) {
    return null;
  }

  const landmarks: PoseLandmark[] = [];
  let confidenceSum = 0;
  let visibleLandmarkCount = 0;

  for (let index = 0; index < MOVENET_LANDMARK_NAMES.length; index += 1) {
    const offset = index * 3;
    const modelY = output[offset];
    const modelX = output[offset + 1];
    const confidence = output[offset + 2];

    if (
      !Number.isFinite(modelX) ||
      !Number.isFinite(modelY) ||
      !Number.isFinite(confidence)
    ) {
      return null;
    }

    const unpaddedPoint = removeContainPadding(
      { x: modelX, y: modelY },
      options,
    );
    if (!unpaddedPoint) return null;

    const uprightPoint = rotateToUpright(unpaddedPoint, options.orientation);
    const displayPoint = options.isMirrored
      ? { x: 1 - uprightPoint.x, y: uprightPoint.y }
      : uprightPoint;
    const normalizedConfidence = clampUnit(confidence);

    confidenceSum += normalizedConfidence;
    if (normalizedConfidence >= options.minimumLandmarkConfidence) {
      visibleLandmarkCount += 1;
    }

    landmarks.push({
      name: MOVENET_LANDMARK_NAMES[index],
      x: clampUnit(displayPoint.x),
      y: clampUnit(displayPoint.y),
      confidence: normalizedConfidence,
    });
  }

  const overallConfidence = confidenceSum / MOVENET_LANDMARK_NAMES.length;

  if (
    overallConfidence < options.minimumOverallConfidence ||
    visibleLandmarkCount < options.minimumVisibleLandmarkCount
  ) {
    return null;
  }

  const uprightSize = getUprightSourceSize(
    options.sourceWidth,
    options.sourceHeight,
    options.orientation,
  );

  return {
    landmarks,
    overallConfidence: clampUnit(overallConfidence),
    sourceWidth: uprightSize.width,
    sourceHeight: uprightSize.height,
    timestampMs: options.timestampMs,
  };
}
