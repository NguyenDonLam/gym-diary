export const progressPhotoAlignmentConfig = {
  version: 1,
  minimumLandmarkConfidence: 0.2,
  minimumCommonLandmarkCount: 4,
  minimumTorsoLandmarkCount: 3,
  minimumScale: 0.67,
  maximumScale: 1.5,
  maximumRotationRadians: (15 * Math.PI) / 180,
  maximumTranslation: 0.5,
  minimumOutlierDistance: 0.025,
  outlierMedianMultiplier: 2.5,
  residualTolerance: 0.05,
  minimumConfidence: 0.55,
} as const;
