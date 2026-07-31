export type NormalizedPoseLandmark = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type ProgressPhotoPoseData = {
  model: string;
  modelVersion: number;
  landmarks: NormalizedPoseLandmark[];
  imageWidth: number;
  imageHeight: number;
  overallConfidence: number;
};

export type ProgressPhotoAlignment = {
  referencePhotoId: string;
  translateX: number;
  translateY: number;
  scale: number;
  rotationRadians: number;
  confidence: number;
  version: number;
};

export type ProgressPhoto = {
  id: string;
  uri: string;
  capturedAt: Date;
  poseGroupId: string | null;
  referencePhotoId: string | null;
  poseData: ProgressPhotoPoseData | null;
  alignment: ProgressPhotoAlignment | null;
};

export type CreateProgressPhotoInput = {
  id: string;
  sourceUri: string;
  capturedAt: Date;
  poseGroupId?: string | null;
  referencePhotoId?: string | null;
  poseData?: ProgressPhotoPoseData | null;
};

export type UpdateProgressPhotoPoseMetadataInput = {
  id: string;
  poseGroupId: string | null;
  referencePhotoId: string | null;
  poseData: ProgressPhotoPoseData | null;
};

export type UpdateProgressPhotoAlignmentInput = {
  id: string;
  alignment: ProgressPhotoAlignment | null;
};
