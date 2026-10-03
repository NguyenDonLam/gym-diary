import Constants, { AppOwnership } from "expo-constants";

import { reportProgressPhotoDiagnostic } from "../progress-photo-diagnostics";
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
      reportProgressPhotoDiagnostic("pose_dependencies_not_ready");
      return {
        available: false,
        reason:
          "Pose-processing dependencies could not be initialized. Rebuild and reinstall the iOS development app, then try again.",
      };
    }

    if (!frameResizer.isResizerAvailable()) {
      reportProgressPhotoDiagnostic("pose_frame_resizer_unavailable");
      return {
        available: false,
        reason:
          "Frame resizing is unavailable on this device. Rebuild and reinstall the iOS development app. If this continues, use regular photos on this device.",
      };
    }

    return { available: true };
  } catch {
    reportProgressPhotoDiagnostic("pose_dependencies_initialization_failed");
    return {
      available: false,
      reason:
        "Pose processing is unavailable. Rebuild and reinstall the iOS development app, then try again.",
    };
  }
}

export const getProgressPoseCapability: ProgressPoseCapabilityProvider =
  async () => {
    if (Constants.appOwnership === AppOwnership.Expo) {
      return {
        available: false,
        reason:
          "Pose matching is unavailable in Expo Go. Install and open the iOS development app to use pose guidance.",
      };
    }

    initialization ??= initializeProgressPoseDependencies();
    return initialization;
  };
