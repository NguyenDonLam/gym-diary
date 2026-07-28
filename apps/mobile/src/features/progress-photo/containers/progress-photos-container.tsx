import React, { useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { generateId } from "@/src/lib/id";

import { ProgressPhotoScreen } from "../components/progress-photo-screen";
import {
  useCreateProgressPhotoMutation,
  useProgressPhotosQuery,
} from "../hooks/use-progress-photos";
import { progressPhotoViewMapper } from "../ui/progress-photo-view.mapper";

export function ProgressPhotosContainer() {
  const photosQuery = useProgressPhotosQuery();
  const createPhotoMutation = useCreateProgressPhotoMutation();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const photos = useMemo(
    () => progressPhotoViewMapper.fromPhotos(photosQuery.data ?? []),
    [photosQuery.data],
  );

  const errorMessage = photosQuery.isError
    ? "Could not load your progress photos."
    : createPhotoMutation.isError
      ? "Your photo was taken, but could not be saved."
      : null;

  const takePhoto = async () => {
    if (isCameraOpen || createPhotoMutation.isPending) return;

    setIsCameraOpen(true);
    createPhotoMutation.reset();

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Camera access needed",
          "Allow camera access to record a progress photo.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Open settings",
              onPress: () => void Linking.openSettings(),
            },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) return;

      try {
        await createPhotoMutation.mutateAsync({
          id: generateId(),
          sourceUri: result.assets[0].uri,
          capturedAt: new Date(),
        });
      } catch (cause) {
        console.warn("[progress-photos] failed to save photo", cause);
        return;
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      console.warn("[progress-photos] failed to open camera", cause);
      Alert.alert(
        "Camera unavailable",
        "The camera could not be opened. Please try again.",
      );
    } finally {
      setIsCameraOpen(false);
    }
  };

  return (
    <ProgressPhotoScreen
      photos={photos}
      isLoading={photosQuery.isPending}
      isCapturing={isCameraOpen || createPhotoMutation.isPending}
      errorMessage={errorMessage}
      onTakePhoto={() => void takePhoto()}
    />
  );
}
