import React from "react";
import { Text, View } from "react-native";

import { progressPoseConfig } from "../pose/progress-pose-config";
import type { DetectedPose } from "../pose/progress-pose-detector.types";

type ProgressPoseDiagnosticOverlayProps = {
  pose: DetectedPose | null;
  inferenceRateHz: number;
  enabled?: boolean;
};

export function ProgressPoseDiagnosticOverlay({
  pose,
  inferenceRateHz,
  enabled = progressPoseConfig.diagnosticsEnabled,
}: ProgressPoseDiagnosticOverlayProps) {
  if (!__DEV__ || !enabled) return null;

  return (
    <View
      pointerEvents="none"
      className="absolute inset-0"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {pose?.landmarks.map((landmark) => (
        <View
          key={landmark.name}
          className="absolute h-2 w-2  bg-[#50FA7B]"
          style={{
            left: `${landmark.x * 100}%`,
            top: `${landmark.y * 100}%`,
            opacity: landmark.confidence,
            transform: [{ translateX: -4 }, { translateY: -4 }],
          }}
        />
      ))}

      <View className="absolute left-3 top-3  bg-black/70 px-2 py-1">
        <Text className="font-mono text-xs text-white">
          Pose {Math.max(0, inferenceRateHz).toFixed(1)} Hz
        </Text>
      </View>
    </View>
  );
}
