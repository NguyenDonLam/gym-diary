import Constants, { AppOwnership } from "expo-constants";

import type {
  ProgressPoseCapability,
  ProgressPoseCapabilityProvider,
} from "./progress-pose-capability.types";
import { PROGRESS_POSE_MODEL_ASSET } from "./progress-pose-model";

export type { ProgressPoseCapability };

let initialization: Promise<ProgressPoseCapability> | null = null;

async function initializeProgressPoseDependencies(): Promise<ProgressPoseCapability> {
  try {
    const [visionCamera, tensorflowLite, frameResizer] = await Promise.all([
      import("react-native-vision-camera"),
      import("react-native-fast-tflite"),
      import("react-native-vision-camera-resizer"),
      import("react-native-vision-camera-worklets"),
    ]);

    const dependenciesAreReady =
      typeof visionCamera.VisionCamera === "object" &&
      typeof tensorflowLite.loadTensorflowModel === "function" &&
      typeof frameResizer.isResizerAvailable === "function" &&
      PROGRESS_POSE_MODEL_ASSET > 0;

    if (!dependenciesAreReady) {
      return {
        available: false,
        reason: "Pose-processing dependencies could not be initialized.",
      };
    }

    if (!frameResizer.isResizerAvailable()) {
      return {
        available: false,
        reason: "Frame resizing is unavailable on this device.",
      };
    }

    return { available: true };
  } catch {
    return {
      available: false,
      reason:
        "Pose processing is unavailable. Rebuild the iOS development client.",
    };
  }
}

export const getProgressPoseCapability: ProgressPoseCapabilityProvider =
  async () => {
    if (Constants.appOwnership === AppOwnership.Expo) {
      return {
        available: false,
        reason:
          "Automatic pose matching requires an Expo development build and is not available in Expo Go.",
      };
    }

    initialization ??= initializeProgressPoseDependencies();
    return initialization;
  };
