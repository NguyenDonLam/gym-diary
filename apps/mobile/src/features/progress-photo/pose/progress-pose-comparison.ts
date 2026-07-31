import { progressPoseComparisonConfig as config } from "./progress-pose-comparison.config";
import type {
  ComparablePose,
  PoseAdjustmentInstruction,
  PoseComparisonLandmark,
  PoseMatchFailureReason,
  PoseMatchResult,
} from "./progress-pose-comparison.types";

export type {
  ComparablePose,
  PoseAdjustmentInstruction,
  PoseComparisonLandmark,
  PoseMatchFailureReason,
  PoseMatchResult,
} from "./progress-pose-comparison.types";

const LANDMARK_WEIGHTS = {
  nose: 0.75,
  left_eye: 0.5,
  right_eye: 0.5,
  left_ear: 0.5,
  right_ear: 0.5,
  left_shoulder: 2,
  right_shoulder: 2,
  left_elbow: 1.25,
  right_elbow: 1.25,
  left_wrist: 0.75,
  right_wrist: 0.75,
  left_hip: 2,
  right_hip: 2,
  left_knee: 1.25,
  right_knee: 1.25,
  left_ankle: 0.75,
  right_ankle: 0.75,
} as const;

type LandmarkName = keyof typeof LANDMARK_WEIGHTS;
type Point = { x: number; y: number };
type NamedPoint = Point & { name: LandmarkName; weight: number };

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

const JOINTS: {
  first: LandmarkName;
  vertex: LandmarkName;
  third: LandmarkName;
  weight: number;
}[] = [
  {
    first: "left_elbow",
    vertex: "left_shoulder",
    third: "left_hip",
    weight: 1.5,
  },
  {
    first: "right_elbow",
    vertex: "right_shoulder",
    third: "right_hip",
    weight: 1.5,
  },
  {
    first: "left_shoulder",
    vertex: "left_elbow",
    third: "left_wrist",
    weight: 1,
  },
  {
    first: "right_shoulder",
    vertex: "right_elbow",
    third: "right_wrist",
    weight: 1,
  },
  {
    first: "left_shoulder",
    vertex: "left_hip",
    third: "left_knee",
    weight: 1.5,
  },
  {
    first: "right_shoulder",
    vertex: "right_hip",
    third: "right_knee",
    weight: 1.5,
  },
  {
    first: "left_hip",
    vertex: "left_knee",
    third: "left_ankle",
    weight: 1,
  },
  {
    first: "right_hip",
    vertex: "right_knee",
    third: "right_ankle",
    weight: 1,
  },
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function isValidLandmark(landmark: PoseComparisonLandmark) {
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

function toVisibleLandmarkMap(
  pose: ComparablePose,
): Map<LandmarkName, PoseComparisonLandmark> | null {
  const seenNames = new Set<string>();
  const visibleLandmarks = new Map<LandmarkName, PoseComparisonLandmark>();

  for (const landmark of pose.landmarks) {
    if (!isValidLandmark(landmark) || seenNames.has(landmark.name)) return null;
    seenNames.add(landmark.name);

    if (
      LANDMARK_NAME_SET.has(landmark.name) &&
      landmark.confidence >= config.minimumLandmarkConfidence
    ) {
      visibleLandmarks.set(landmark.name as LandmarkName, landmark);
    }
  }

  return visibleLandmarks;
}

function weightedCenter(points: readonly NamedPoint[]): Point {
  const totalWeight = points.reduce((total, point) => total + point.weight, 0);

  return {
    x:
      points.reduce((total, point) => total + point.x * point.weight, 0) /
      totalWeight,
    y:
      points.reduce((total, point) => total + point.y * point.weight, 0) /
      totalWeight,
  };
}

function torsoGeometry(
  landmarks: ReadonlyMap<LandmarkName, PoseComparisonLandmark>,
) {
  const torsoPoints = LANDMARK_NAMES.flatMap((name) => {
    const landmark = landmarks.get(name);
    return landmark && TORSO_LANDMARK_NAMES.has(name)
      ? [{ ...landmark, name, weight: LANDMARK_WEIGHTS[name] }]
      : [];
  });
  const center = weightedCenter(torsoPoints);
  const scale = Math.sqrt(
    torsoPoints.reduce(
      (total, point) =>
        total +
        point.weight * ((point.x - center.x) ** 2 + (point.y - center.y) ** 2),
      0,
    ) / torsoPoints.reduce((total, point) => total + point.weight, 0),
  );

  const shoulders = ["left_shoulder", "right_shoulder"].flatMap((name) => {
    const landmark = landmarks.get(name as LandmarkName);
    return landmark ? [landmark] : [];
  });
  const hips = ["left_hip", "right_hip"].flatMap((name) => {
    const landmark = landmarks.get(name as LandmarkName);
    return landmark ? [landmark] : [];
  });
  const shoulderCenter = {
    x:
      shoulders.reduce((total, point) => total + point.x, 0) / shoulders.length,
    y:
      shoulders.reduce((total, point) => total + point.y, 0) / shoulders.length,
  };
  const hipCenter = {
    x: hips.reduce((total, point) => total + point.x, 0) / hips.length,
    y: hips.reduce((total, point) => total + point.y, 0) / hips.length,
  };

  return {
    center,
    scale,
    rotationRadians: Math.atan2(
      hipCenter.x - shoulderCenter.x,
      hipCenter.y - shoulderCenter.y,
    ),
  };
}

function normalizedCommonPoints(
  names: readonly LandmarkName[],
  landmarks: ReadonlyMap<LandmarkName, PoseComparisonLandmark>,
  center: Point,
  scale: number,
): NamedPoint[] {
  return names.map((name) => {
    const landmark = landmarks.get(name)!;
    return {
      name,
      x: (landmark.x - center.x) / scale,
      y: (landmark.y - center.y) / scale,
      weight: LANDMARK_WEIGHTS[name],
    };
  });
}

function relativeLandmarkScore(
  referencePoints: readonly NamedPoint[],
  currentPoints: readonly NamedPoint[],
) {
  let cross = 0;
  let dot = 0;

  for (let index = 0; index < referencePoints.length; index += 1) {
    const reference = referencePoints[index];
    const current = currentPoints[index];
    cross +=
      current.weight * (current.x * reference.y - current.y * reference.x);
    dot += current.weight * (current.x * reference.x + current.y * reference.y);
  }

  const rotation = Math.atan2(cross, dot);
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  let weightedSquaredDistance = 0;
  let totalWeight = 0;

  for (let index = 0; index < referencePoints.length; index += 1) {
    const reference = referencePoints[index];
    const current = currentPoints[index];
    const rotatedX = current.x * cosine - current.y * sine;
    const rotatedY = current.x * sine + current.y * cosine;
    weightedSquaredDistance +=
      current.weight *
      ((rotatedX - reference.x) ** 2 + (rotatedY - reference.y) ** 2);
    totalWeight += current.weight;
  }

  const rootMeanSquareDistance = Math.sqrt(
    weightedSquaredDistance / totalWeight,
  );

  return clamp01(
    1 - rootMeanSquareDistance / config.relativeLandmarkDistanceTolerance,
  );
}

function angleAt(first: Point, vertex: Point, third: Point) {
  const firstVector = { x: first.x - vertex.x, y: first.y - vertex.y };
  const thirdVector = { x: third.x - vertex.x, y: third.y - vertex.y };
  const denominator =
    Math.hypot(firstVector.x, firstVector.y) *
    Math.hypot(thirdVector.x, thirdVector.y);
  if (denominator <= Number.EPSILON) return null;

  return Math.acos(
    Math.min(
      1,
      Math.max(
        -1,
        (firstVector.x * thirdVector.x + firstVector.y * thirdVector.y) /
          denominator,
      ),
    ),
  );
}

function jointAngleScore(
  reference: ReadonlyMap<LandmarkName, PoseComparisonLandmark>,
  current: ReadonlyMap<LandmarkName, PoseComparisonLandmark>,
) {
  let weightedDifference = 0;
  let totalWeight = 0;

  for (const joint of JOINTS) {
    const referenceFirst = reference.get(joint.first);
    const referenceVertex = reference.get(joint.vertex);
    const referenceThird = reference.get(joint.third);
    const currentFirst = current.get(joint.first);
    const currentVertex = current.get(joint.vertex);
    const currentThird = current.get(joint.third);
    if (
      !referenceFirst ||
      !referenceVertex ||
      !referenceThird ||
      !currentFirst ||
      !currentVertex ||
      !currentThird
    ) {
      continue;
    }

    const referenceAngle = angleAt(
      referenceFirst,
      referenceVertex,
      referenceThird,
    );
    const currentAngle = angleAt(currentFirst, currentVertex, currentThird);
    if (referenceAngle === null || currentAngle === null) continue;

    weightedDifference +=
      Math.abs(referenceAngle - currentAngle) * joint.weight;
    totalWeight += joint.weight;
  }

  if (totalWeight === 0) return null;

  return clamp01(
    1 -
      weightedDifference /
        totalWeight /
        config.jointAngleDifferenceToleranceRadians,
  );
}

function shortestAngleDifference(first: number, second: number) {
  return Math.atan2(Math.sin(first - second), Math.cos(first - second));
}

function failureResult(
  failureReason: PoseMatchFailureReason,
  commonLandmarkCount = 0,
  visibilityScore = 0,
): PoseMatchResult {
  return {
    poseScore: 0,
    framingScore: 0,
    visibilityScore: clamp01(visibilityScore),
    stabilityEligible: false,
    overallScore: 0,
    commonLandmarkCount,
    instructions: ["adjust_pose"],
    failureReason,
  };
}

function buildInstructions({
  referenceGeometry,
  currentGeometry,
  poseScore,
  stabilityEligible,
}: {
  referenceGeometry: ReturnType<typeof torsoGeometry>;
  currentGeometry: ReturnType<typeof torsoGeometry>;
  poseScore: number;
  stabilityEligible: boolean;
}): PoseAdjustmentInstruction[] {
  if (stabilityEligible) return ["hold_still"];

  const instructions: PoseAdjustmentInstruction[] = [];
  const deltaX = currentGeometry.center.x - referenceGeometry.center.x;
  const deltaY = currentGeometry.center.y - referenceGeometry.center.y;
  const scaleRatio = currentGeometry.scale / referenceGeometry.scale;
  const rotationDifference = shortestAngleDifference(
    currentGeometry.rotationRadians,
    referenceGeometry.rotationRadians,
  );

  if (deltaX > config.movementInstructionThreshold) {
    instructions.push("move_left");
  } else if (deltaX < -config.movementInstructionThreshold) {
    instructions.push("move_right");
  }

  if (deltaY > config.movementInstructionThreshold) {
    instructions.push("move_up");
  } else if (deltaY < -config.movementInstructionThreshold) {
    instructions.push("move_down");
  }

  if (scaleRatio < 1 / config.scaleInstructionRatioThreshold) {
    instructions.push("move_closer");
  } else if (scaleRatio > config.scaleInstructionRatioThreshold) {
    instructions.push("move_further");
  }

  if (rotationDifference > config.rotationInstructionThresholdRadians) {
    instructions.push("rotate_left");
  } else if (rotationDifference < -config.rotationInstructionThresholdRadians) {
    instructions.push("rotate_right");
  }

  if (poseScore < config.adjustPoseInstructionThreshold) {
    instructions.push("adjust_pose");
  }

  return instructions.length > 0 ? instructions : ["adjust_pose"];
}

export function compareProgressPoses(
  referencePose: ComparablePose,
  currentPose: ComparablePose,
): PoseMatchResult {
  const reference = toVisibleLandmarkMap(referencePose);
  if (!reference) return failureResult("invalid_reference_pose");

  const current = toVisibleLandmarkMap(currentPose);
  if (!current) return failureResult("invalid_current_pose");

  const commonNames = LANDMARK_NAMES.filter(
    (name) => reference.has(name) && current.has(name),
  );
  const commonWeight = commonNames.reduce(
    (total, name) => total + LANDMARK_WEIGHTS[name],
    0,
  );
  const visibilityScore = clamp01(commonWeight / TOTAL_LANDMARK_WEIGHT);

  if (commonNames.length < config.minimumCommonLandmarkCount) {
    return failureResult(
      "insufficient_common_landmarks",
      commonNames.length,
      visibilityScore,
    );
  }

  const commonTorsoLandmarkCount = commonNames.filter((name) =>
    TORSO_LANDMARK_NAMES.has(name),
  ).length;
  if (commonTorsoLandmarkCount < config.minimumCommonTorsoLandmarkCount) {
    return failureResult(
      "insufficient_torso_landmarks",
      commonNames.length,
      visibilityScore,
    );
  }

  const commonReference = new Map(
    commonNames.map((name) => [name, reference.get(name)!]),
  );
  const commonCurrent = new Map(
    commonNames.map((name) => [name, current.get(name)!]),
  );
  const referenceGeometry = torsoGeometry(commonReference);
  const currentGeometry = torsoGeometry(commonCurrent);
  if (
    !Number.isFinite(referenceGeometry.scale) ||
    referenceGeometry.scale <= Number.EPSILON
  ) {
    return failureResult(
      "invalid_reference_pose",
      commonNames.length,
      visibilityScore,
    );
  }
  if (
    !Number.isFinite(currentGeometry.scale) ||
    currentGeometry.scale <= Number.EPSILON
  ) {
    return failureResult(
      "invalid_current_pose",
      commonNames.length,
      visibilityScore,
    );
  }

  const referencePoints = normalizedCommonPoints(
    commonNames,
    reference,
    referenceGeometry.center,
    referenceGeometry.scale,
  );
  const currentPoints = normalizedCommonPoints(
    commonNames,
    current,
    currentGeometry.center,
    currentGeometry.scale,
  );
  const landmarkScore = relativeLandmarkScore(referencePoints, currentPoints);
  const anglesScore = jointAngleScore(reference, current);
  const poseScore =
    anglesScore === null
      ? landmarkScore
      : clamp01(
          landmarkScore * config.scoreWeights.relativeLandmarks +
            anglesScore * config.scoreWeights.jointAngles,
        );

  const positionScore = clamp01(
    1 -
      Math.hypot(
        currentGeometry.center.x - referenceGeometry.center.x,
        currentGeometry.center.y - referenceGeometry.center.y,
      ) /
        config.framingPositionTolerance,
  );
  const scaleScore = clamp01(
    1 -
      Math.abs(Math.log(currentGeometry.scale / referenceGeometry.scale)) /
        Math.log(config.framingScaleRatioTolerance),
  );
  const rotationScore = clamp01(
    1 -
      Math.abs(
        shortestAngleDifference(
          currentGeometry.rotationRadians,
          referenceGeometry.rotationRadians,
        ),
      ) /
        config.framingRotationToleranceRadians,
  );
  const framingScore = clamp01(
    positionScore * config.scoreWeights.framingPosition +
      scaleScore * config.scoreWeights.framingScale +
      rotationScore * config.scoreWeights.framingRotation,
  );
  const overallScore = clamp01(
    poseScore * config.scoreWeights.overallPose +
      framingScore * config.scoreWeights.overallFraming +
      visibilityScore * config.scoreWeights.overallVisibility,
  );
  const stabilityEligible =
    poseScore >= config.stabilityThresholds.pose &&
    framingScore >= config.stabilityThresholds.framing &&
    visibilityScore >= config.stabilityThresholds.visibility &&
    overallScore >= config.stabilityThresholds.overall;

  return {
    poseScore,
    framingScore,
    visibilityScore,
    stabilityEligible,
    overallScore,
    commonLandmarkCount: commonNames.length,
    instructions: buildInstructions({
      referenceGeometry,
      currentGeometry,
      poseScore,
      stabilityEligible,
    }),
  };
}
