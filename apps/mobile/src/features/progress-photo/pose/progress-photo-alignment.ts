import type {
  NormalizedPoseLandmark,
  ProgressPhotoAlignment,
  ProgressPhotoPoseData,
} from "../types";
import { progressPhotoAlignmentConfig as config } from "./progress-photo-alignment.config";

const LANDMARK_WEIGHTS = {
  nose: 0.75,
  left_eye: 0.5,
  right_eye: 0.5,
  left_ear: 0.5,
  right_ear: 0.5,
  left_shoulder: 3,
  right_shoulder: 3,
  left_elbow: 1.5,
  right_elbow: 1.5,
  left_wrist: 0.5,
  right_wrist: 0.5,
  left_hip: 3,
  right_hip: 3,
  left_knee: 1.5,
  right_knee: 1.5,
  left_ankle: 0.5,
  right_ankle: 0.5,
} as const;

type LandmarkName = keyof typeof LANDMARK_WEIGHTS;
type Correspondence = {
  name: LandmarkName;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  weight: number;
};
type SimilarityTransform = {
  translateX: number;
  translateY: number;
  scale: number;
  rotationRadians: number;
};

const LANDMARK_NAMES = Object.keys(LANDMARK_WEIGHTS) as LandmarkName[];
const LANDMARK_NAME_SET = new Set<string>(LANDMARK_NAMES);
const TORSO_LANDMARK_NAMES = new Set<LandmarkName>([
  "left_shoulder",
  "right_shoulder",
  "left_hip",
  "right_hip",
]);
const TOTAL_LANDMARK_WEIGHT = LANDMARK_NAMES.reduce(
  (total, name) => total + LANDMARK_WEIGHTS[name],
  0,
);

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isValidLandmark(landmark: NormalizedPoseLandmark) {
  return (
    typeof landmark.name === "string" &&
    Number.isFinite(landmark.x) &&
    landmark.x >= 0 &&
    landmark.x <= 1 &&
    Number.isFinite(landmark.y) &&
    landmark.y >= 0 &&
    landmark.y <= 1 &&
    Number.isFinite(landmark.confidence) &&
    landmark.confidence >= 0 &&
    landmark.confidence <= 1
  );
}

function toVisibleLandmarkMap(pose: ProgressPhotoPoseData) {
  const seenNames = new Set<string>();
  const result = new Map<LandmarkName, NormalizedPoseLandmark>();

  for (const landmark of pose.landmarks) {
    if (!isValidLandmark(landmark) || seenNames.has(landmark.name)) return null;
    seenNames.add(landmark.name);

    if (
      LANDMARK_NAME_SET.has(landmark.name) &&
      landmark.confidence >= config.minimumLandmarkConfidence
    ) {
      result.set(landmark.name as LandmarkName, landmark);
    }
  }

  return result;
}

function createCorrespondences(
  referencePose: ProgressPhotoPoseData,
  currentPose: ProgressPhotoPoseData,
) {
  const reference = toVisibleLandmarkMap(referencePose);
  const current = toVisibleLandmarkMap(currentPose);
  if (!reference || !current) return null;

  return LANDMARK_NAMES.flatMap((name) => {
    const target = reference.get(name);
    const source = current.get(name);
    if (!target || !source) return [];

    return [
      {
        name,
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y,
        weight:
          LANDMARK_WEIGHTS[name] *
          Math.min(source.confidence, target.confidence),
      },
    ];
  });
}

function fitSimilarityTransform(
  correspondences: readonly Correspondence[],
): SimilarityTransform | null {
  const totalWeight = correspondences.reduce(
    (total, point) => total + point.weight,
    0,
  );
  if (!Number.isFinite(totalWeight) || totalWeight <= Number.EPSILON) {
    return null;
  }

  const sourceCenter = {
    x:
      correspondences.reduce(
        (total, point) => total + point.sourceX * point.weight,
        0,
      ) / totalWeight,
    y:
      correspondences.reduce(
        (total, point) => total + point.sourceY * point.weight,
        0,
      ) / totalWeight,
  };
  const targetCenter = {
    x:
      correspondences.reduce(
        (total, point) => total + point.targetX * point.weight,
        0,
      ) / totalWeight,
    y:
      correspondences.reduce(
        (total, point) => total + point.targetY * point.weight,
        0,
      ) / totalWeight,
  };

  let dot = 0;
  let cross = 0;
  let sourceVariance = 0;

  for (const point of correspondences) {
    const sourceX = point.sourceX - sourceCenter.x;
    const sourceY = point.sourceY - sourceCenter.y;
    const targetX = point.targetX - targetCenter.x;
    const targetY = point.targetY - targetCenter.y;

    dot += point.weight * (sourceX * targetX + sourceY * targetY);
    cross += point.weight * (sourceX * targetY - sourceY * targetX);
    sourceVariance += point.weight * (sourceX ** 2 + sourceY ** 2);
  }

  if (!Number.isFinite(sourceVariance) || sourceVariance <= Number.EPSILON) {
    return null;
  }

  const rawScale = Math.hypot(dot, cross) / sourceVariance;
  const rawRotation = Math.atan2(cross, dot);
  if (!Number.isFinite(rawScale) || !Number.isFinite(rawRotation)) return null;

  const scale = clamp(rawScale, config.minimumScale, config.maximumScale);
  const rotationRadians = clamp(
    rawRotation,
    -config.maximumRotationRadians,
    config.maximumRotationRadians,
  );
  const cosine = Math.cos(rotationRadians);
  const sine = Math.sin(rotationRadians);
  const translateX = clamp(
    targetCenter.x - scale * (sourceCenter.x * cosine - sourceCenter.y * sine),
    -config.maximumTranslation,
    config.maximumTranslation,
  );
  const translateY = clamp(
    targetCenter.y - scale * (sourceCenter.x * sine + sourceCenter.y * cosine),
    -config.maximumTranslation,
    config.maximumTranslation,
  );

  return {
    translateX,
    translateY,
    scale,
    rotationRadians,
  };
}

function residual(point: Correspondence, transform: SimilarityTransform) {
  const cosine = Math.cos(transform.rotationRadians);
  const sine = Math.sin(transform.rotationRadians);
  const transformedX =
    transform.scale * (point.sourceX * cosine - point.sourceY * sine) +
    transform.translateX;
  const transformedY =
    transform.scale * (point.sourceX * sine + point.sourceY * cosine) +
    transform.translateY;

  return Math.hypot(transformedX - point.targetX, transformedY - point.targetY);
}

function median(values: readonly number[]) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function createIdentityProgressPhotoAlignment(
  referencePhotoId: string,
): ProgressPhotoAlignment {
  return {
    referencePhotoId,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotationRadians: 0,
    confidence: 1,
    version: config.version,
  };
}

export function calculateProgressPhotoAlignment(
  referencePhotoId: string,
  referencePose: ProgressPhotoPoseData,
  currentPose: ProgressPhotoPoseData,
): ProgressPhotoAlignment | null {
  if (!referencePhotoId) return null;

  const correspondences = createCorrespondences(referencePose, currentPose);
  if (
    !correspondences ||
    correspondences.length < config.minimumCommonLandmarkCount ||
    correspondences.filter((point) => TORSO_LANDMARK_NAMES.has(point.name))
      .length < config.minimumTorsoLandmarkCount
  ) {
    return null;
  }

  const torsoCorrespondences = correspondences.filter((point) =>
    TORSO_LANDMARK_NAMES.has(point.name),
  );
  const seedTransform = fitSimilarityTransform(torsoCorrespondences);
  if (!seedTransform) return null;

  const seedResiduals = correspondences.map((point) =>
    residual(point, seedTransform),
  );
  const outlierThreshold = Math.max(
    config.minimumOutlierDistance,
    median(seedResiduals) * config.outlierMedianMultiplier,
  );
  const inliers = correspondences.filter(
    (point, index) => seedResiduals[index] <= outlierThreshold,
  );
  if (
    inliers.length < config.minimumCommonLandmarkCount ||
    inliers.filter((point) => TORSO_LANDMARK_NAMES.has(point.name)).length <
      config.minimumTorsoLandmarkCount
  ) {
    return null;
  }

  const transform = fitSimilarityTransform(inliers);
  if (!transform) return null;

  const inlierWeight = inliers.reduce(
    (total, point) => total + point.weight,
    0,
  );
  const commonWeight = correspondences.reduce(
    (total, point) => total + point.weight,
    0,
  );
  const weightedSquaredResidual = inliers.reduce(
    (total, point) => total + point.weight * residual(point, transform) ** 2,
    0,
  );
  const rootMeanSquareResidual = Math.sqrt(
    weightedSquaredResidual / inlierWeight,
  );
  const residualScore = clamp(
    1 - rootMeanSquareResidual / config.residualTolerance,
    0,
    1,
  );
  const inlierRatio = clamp(inlierWeight / commonWeight, 0, 1);
  const coverageScore = clamp(commonWeight / TOTAL_LANDMARK_WEIGHT, 0, 1);
  const confidence = clamp(
    residualScore * 0.45 + inlierRatio * 0.35 + coverageScore * 0.2,
    0,
    1,
  );
  if (confidence < config.minimumConfidence) return null;

  return {
    referencePhotoId,
    ...transform,
    confidence,
    version: config.version,
  };
}
