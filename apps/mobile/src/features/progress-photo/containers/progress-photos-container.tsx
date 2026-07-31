import React, {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { generateId } from "@/src/lib/id";

import { ProgressPhotoScreen } from "../components/progress-photo-screen";
import type {
  CapturedProgressPhoto,
  ProgressPhotoCameraContainerProps,
} from "./progress-photo-camera.types";
import {
  useCreateProgressPhotoMutation,
  useProgressPhotosQuery,
  useUpdateProgressPhotoAlignmentMutation,
} from "../hooks/use-progress-photos";
import {
  calculateProgressPhotoAlignment,
  createIdentityProgressPhotoAlignment,
} from "../pose/progress-photo-alignment";
import { createPoseDataForCapture } from "../pose/progress-pose-capture";
import {
  getProgressPoseCapability,
  type ProgressPoseCapability,
} from "../pose/progress-pose-runtime";
import { progressPhotoCameraReferenceMapper } from "../ui/progress-photo-camera-reference.mapper";
import { progressPhotoComparisonMapper } from "../ui/progress-photo-comparison.mapper";

export function ProgressPhotosContainer() {
  const photosQuery = useProgressPhotosQuery();
  const createPhotoMutation = useCreateProgressPhotoMutation();
  const updateAlignmentMutation = useUpdateProgressPhotoAlignmentMutation();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [poseCapability, setPoseCapability] =
    useState<ProgressPoseCapability | null>(null);
  const [PoseCameraContainer, setPoseCameraContainer] =
    useState<ComponentType<ProgressPhotoCameraContainerProps> | null>(null);
  const [captureStatusMessage, setCaptureStatusMessage] = useState<
    string | null
  >(null);
  const [poseCapabilityMessage, setPoseCapabilityMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    void getProgressPoseCapability().then((capability) => {
      if (isMounted) {
        setPoseCapability(capability);
        setPoseCapabilityMessage(
          capability.available ? null : (capability.reason ?? null),
        );
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const photos = useMemo(
    () => progressPhotoComparisonMapper.fromPhotos(photosQuery.data ?? []),
    [photosQuery.data],
  );
  const cameraReferences = useMemo(
    () => progressPhotoCameraReferenceMapper.fromPhotos(photosQuery.data ?? []),
    [photosQuery.data],
  );

  const errorMessage = photosQuery.isError
    ? "Could not load your progress photos."
    : createPhotoMutation.isError
      ? "Your photo was taken, but could not be saved."
      : null;

  const saveCapturedPhoto = useCallback(
    async (capture: CapturedProgressPhoto) => {
      const photoId = generateId();
      const poseData = createPoseDataForCapture({
        pose: capture.pose,
        shutterTimestampMs: capture.shutterTimestampMs,
        imageWidth: capture.imageWidth,
        imageHeight: capture.imageHeight,
      });
      const selectedReference = capture.referencePhotoId
        ? (photosQuery.data ?? []).find(
            (photo) => photo.id === capture.referencePhotoId,
          )
        : null;
      const alignment = poseData
        ? selectedReference?.poseData
          ? calculateProgressPhotoAlignment(
              selectedReference.id,
              selectedReference.poseData,
              poseData,
            )
          : capture.referencePhotoId === null
            ? createIdentityProgressPhotoAlignment(photoId)
            : null
        : null;

      await createPhotoMutation.mutateAsync({
        id: photoId,
        sourceUri: capture.sourceUri,
        capturedAt: capture.capturedAt,
        poseGroupId: capture.poseGroupId ?? (poseData ? generateId() : null),
        referencePhotoId: capture.referencePhotoId,
        poseData,
        alignment,
      });

      if (selectedReference) {
        try {
          await updateAlignmentMutation.mutateAsync({
            id: selectedReference.id,
            alignment: createIdentityProgressPhotoAlignment(
              selectedReference.id,
            ),
          });
        } catch (cause) {
          console.warn(
            "[progress-photos] failed to store reference alignment",
            cause,
          );
        }
      }

      setCaptureStatusMessage(
        poseData
          ? "Pose reference saved"
          : "Photo saved without pose reference",
      );
      setIsCameraOpen(false);
      setPoseCameraContainer(null);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [createPhotoMutation, photosQuery.data, updateAlignmentMutation],
  );

  const launchFallbackCamera = useCallback(async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    await saveCapturedPhoto({
      sourceUri: result.assets[0].uri,
      capturedAt: new Date(),
      shutterTimestampMs: 0,
      imageWidth: result.assets[0].width,
      imageHeight: result.assets[0].height,
      pose: null,
      poseGroupId: null,
      referencePhotoId: null,
    });
  }, [saveCapturedPhoto]);

  const takePhoto = async () => {
    if (isCameraOpen || createPhotoMutation.isPending) return;

    let keepCameraOpen = false;
    setIsCameraOpen(true);
    createPhotoMutation.reset();
    setCaptureStatusMessage(null);

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

      const capability = poseCapability ?? (await getProgressPoseCapability());
      setPoseCapability(capability);
      setPoseCapabilityMessage(
        capability.available ? null : (capability.reason ?? null),
      );

      if (capability.available) {
        try {
          const cameraModule =
            await import("./progress-photo-camera-container");
          setPoseCameraContainer(
            () => cameraModule.ProgressPhotoCameraContainer,
          );
          keepCameraOpen = true;
          return;
        } catch (cause) {
          console.warn(
            "[progress-photos] failed to initialize pose camera",
            cause,
          );
        }
      }

      try {
        await launchFallbackCamera();
      } catch (cause) {
        console.warn("[progress-photos] failed to save photo", cause);
        return;
      }
    } catch (cause) {
      console.warn("[progress-photos] failed to open camera", cause);
      Alert.alert(
        "Camera unavailable",
        "The camera could not be opened. Please try again.",
      );
    } finally {
      if (!keepCameraOpen) {
        setIsCameraOpen(false);
      }
    }
  };

  if (isCameraOpen && PoseCameraContainer) {
    return (
      <PoseCameraContainer
        references={cameraReferences}
        onCancel={() => {
          setIsCameraOpen(false);
          setPoseCameraContainer(null);
        }}
        onCaptured={saveCapturedPhoto}
      />
    );
  }

  return (
    <ProgressPhotoScreen
      photos={photos}
      isLoading={photosQuery.isPending}
      isCapturing={isCameraOpen || createPhotoMutation.isPending}
      errorMessage={errorMessage}
      poseCapabilityMessage={poseCapabilityMessage}
      captureStatusMessage={captureStatusMessage}
      onTakePhoto={() => void takePhoto()}
    />
  );
}
