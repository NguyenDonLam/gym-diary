export { PROGRESS_POSE_MODEL } from "./progress-pose-model-metadata";

// Metro requires a static CommonJS asset reference to include binary model files.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const PROGRESS_POSE_MODEL_ASSET: number = require("../../../../assets/models/movenet-singlepose-lightning-float16-v4.tflite");
