export type ProgressPhoto = {
  id: string;
  uri: string;
  capturedAt: Date;
};

export type CreateProgressPhotoInput = {
  id: string;
  sourceUri: string;
  capturedAt: Date;
};
