import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { Camera, X } from "lucide-react-native";

type ProgressPhotoCameraScreenProps = {
  preview: ReactNode;
  statusMessage: string;
  errorMessage: string | null;
  isCapturing: boolean;
  onCancel: () => void;
  onCapture: () => void;
};

export function ProgressPhotoCameraScreen({
  preview,
  statusMessage,
  errorMessage,
  isCapturing,
  onCancel,
  onCapture,
}: ProgressPhotoCameraScreenProps) {
  return (
    <View className="flex-1 bg-black">
      {preview}

      <SafeAreaView className="absolute inset-0 justify-between">
        <View className="flex-row items-start justify-between px-4 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close progress photo camera"
            disabled={isCapturing}
            onPress={onCancel}
            className="h-11 w-11 items-center justify-center rounded-full bg-black/60"
          >
            <X color="#FFFFFF" size={23} />
          </Pressable>

          <View className="max-w-64 rounded-full bg-black/60 px-4 py-2">
            <Text className="text-center text-xs font-semibold text-white">
              {errorMessage ?? statusMessage}
            </Text>
          </View>
        </View>

        <View className="items-center pb-8">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take progress photo"
            disabled={isCapturing}
            onPress={onCapture}
            className={[
              "h-20 w-20 items-center justify-center rounded-full border-4 border-white",
              isCapturing ? "bg-white/40" : "bg-white/20",
            ].join(" ")}
          >
            {isCapturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Camera color="#FFFFFF" size={30} strokeWidth={2.2} />
            )}
          </Pressable>

          <Text className="mt-3 text-xs text-white/80">
            Manual capture remains available
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
