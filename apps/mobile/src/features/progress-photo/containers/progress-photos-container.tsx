import React, {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { generateId } from "@/src/lib/id";

import { ProgressPhotoScreen } from "../components/progress-photo-screen";
import { ProgressPhotoAlignmentEditor } from "../components/progress-photo-alignment-editor";
import { reportProgressPhotoDiagnostic } from "../progress-photo-diagnostics";
import type {
  ProgressPhotoAlignment,
  ProgressPhotoAlignmentStatus,
} from "../types";
import type {
  CapturedProgressPhoto,
  ProgressPhotoCameraContainerProps,
} from "./progress-photo-camera.types";
import {
  useCreateProgressPhotoMutation,
  useDeleteProgressPhotoMutation,
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
import {
  formatProgressPhotoElapsedTime,
  getProgressPhotoPairCandidates,
  getProgressPhotoPairNavigation,
  progressPhotoComparisonMapper,
  selectDefaultProgressPhotoPairId,
} from "../ui/progress-photo-comparison.mapper";

const POSE_CAMERA_UNAVAILABLE_MESSAGE =
  "The pose camera could not start. Restart the app and try again. If this continues, rebuild and reinstall the iOS development app.";

export function ProgressPhotosContainer() {
  const photosQuery = useProgressPhotosQuery();
  const createPhotoMutation = useCreateProgressPhotoMutation();
  const deletePhotoMutation = useDeleteProgressPhotoMutation();
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
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [comparisonPhotoId, setComparisonPhotoId] = useState<string | null>(
    null,
  );
  const [alignmentEditorPhotoId, setAlignmentEditorPhotoId] = useState<
    string | null
  >(null);
  const latestPhotoIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getProgressPoseCapability().then((capability) => {
      if (isMounted) {
        setPoseCapability(capability);
        setPoseCapabilityMessage(
          capability.available
            ? null
            : (capability.reason ?? POSE_CAMERA_UNAVAILABLE_MESSAGE),
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
  const selectedPhoto = useMemo(
    () =>
      photos.find((photo) => photo.id === selectedPhotoId) ?? photos[0] ?? null,
    [photos, selectedPhotoId],
  );
  const comparisonPhotos = useMemo(
    () => getProgressPhotoPairCandidates(photos, selectedPhoto?.id ?? null),
    [photos, selectedPhoto?.id],
  );
  const comparisonPhoto = useMemo(
    () =>
      comparisonPhotos.find((photo) => photo.id === comparisonPhotoId) ?? null,
    [comparisonPhotoId, comparisonPhotos],
  );
  const alignmentEditorPhoto =
    photos.find((photo) => photo.id === alignmentEditorPhotoId) ?? null;
  const alignmentEditorReference = alignmentEditorPhoto?.referencePhotoId
    ? (photos.find(
        (photo) => photo.id === alignmentEditorPhoto.referencePhotoId,
      ) ?? null)
    : null;
  const comparisonNavigation = useMemo(
    () =>
      getProgressPhotoPairNavigation(
        photos,
        selectedPhoto?.id ?? null,
        comparisonPhoto?.id ?? null,
      ),
    [comparisonPhoto?.id, photos, selectedPhoto?.id],
  );
  const elapsedTimeLabel =
    selectedPhoto && comparisonPhoto
      ? formatProgressPhotoElapsedTime(
          selectedPhoto.capturedAtMs,
          comparisonPhoto.capturedAtMs,
        )
      : null;

  useEffect(() => {
    const latestPhotoId = photos[0]?.id ?? null;

    if (latestPhotoId !== latestPhotoIdRef.current) {
      latestPhotoIdRef.current = latestPhotoId;
      setSelectedPhotoId(latestPhotoId);
      setComparisonPhotoId(
        selectDefaultProgressPhotoPairId(photos, latestPhotoId),
      );
    }
  }, [photos]);

  useEffect(() => {
    setComparisonPhotoId((currentPhotoId) =>
      comparisonPhotos.some((photo) => photo.id === currentPhotoId)
        ? currentPhotoId
        : selectDefaultProgressPhotoPairId(photos, selectedPhoto?.id ?? null),
    );
  }, [comparisonPhotos, photos, selectedPhoto?.id]);

  useEffect(() => {
    const preloadIds = [
      comparisonPhoto?.id,
      comparisonNavigation.previousPhotoId,
      comparisonNavigation.nextPhotoId,
    ].filter((id): id is string => Boolean(id));
    const preloadUris = preloadIds
      .map((id) => photos.find((photo) => photo.id === id)?.uri)
      .filter((uri): uri is string => Boolean(uri));

    if (preloadUris.length > 0) {
      void ExpoImage.prefetch(preloadUris, {
        cachePolicy: "memory-disk",
      }).catch(() => undefined);
    }
  }, [comparisonNavigation, comparisonPhoto?.id, photos]);

  const selectPhoto = useCallback(
    (photoId: string) => {
      setSelectedPhotoId(photoId);
      setComparisonPhotoId(selectDefaultProgressPhotoPairId(photos, photoId));
    },
    [photos],
  );

  const selectComparisonPhoto = useCallback(
    (photoId: string) => {
      if (comparisonPhotos.some((photo) => photo.id === photoId)) {
        setComparisonPhotoId(photoId);
      }
    },
    [comparisonPhotos],
  );

  const requestDeletePhoto = (photoId: string) => {
    const photo = photos.find((item) => item.id === photoId);
    if (!photo || deletePhotoMutation.isPending || isCameraOpen) return;
    const hasDependents = (photosQuery.data ?? []).some(
      (item) =>
        item.id !== photoId &&
        (item.referencePhotoId === photoId ||
          item.alignment?.referencePhotoId === photoId ||
          item.automaticAlignment?.referencePhotoId === photoId),
    );
    Alert.alert(
      "Delete progress photo?",
      `Delete the photo from ${photo.dateLabel} at ${photo.timeLabel}? This cannot be undone.${hasDependents ? " Other photos will be kept, but alignment using this reference will be removed." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCaptureStatusMessage(null);
            deletePhotoMutation.mutate(photoId, {
              onSuccess: () => {
                setAlignmentEditorPhotoId(null);
                setCaptureStatusMessage("Photo deleted");
              },
            });
          },
        },
      ],
    );
  };

  const errorMessage = deletePhotoMutation.isError
    ? "The photo could not be deleted. Please try again."
    : photosQuery.isError
      ? "Could not load your progress photos."
      : createPhotoMutation.isError
        ? "Your photo was taken, but could not be saved."
        : updateAlignmentMutation.isError
          ? "The alignment could not be saved."
          : null;

  const saveEditedAlignment = useCallback(
    async (
      alignment: ProgressPhotoAlignment | null,
      alignmentStatus: ProgressPhotoAlignmentStatus,
    ) => {
      if (!alignmentEditorPhotoId) return;

      try {
        await updateAlignmentMutation.mutateAsync({
          id: alignmentEditorPhotoId,
          alignment,
          alignmentStatus,
        });
        setAlignmentEditorPhotoId(null);
        setCaptureStatusMessage(
          alignmentStatus === "manual"
            ? "Manual alignment saved"
            : alignmentStatus === "automatic"
              ? "Automatic alignment restored"
              : "Alignment removed",
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        // The mutation exposes a presentation-safe error in the editor.
      }
    },
    [alignmentEditorPhotoId, updateAlignmentMutation],
  );

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
            alignmentStatus: "automatic",
          });
        } catch {
          reportProgressPhotoDiagnostic("reference_alignment_save_failed");
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
    if (
      isCameraOpen ||
      createPhotoMutation.isPending ||
      deletePhotoMutation.isPending
    )
      return;

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
      let fallbackReason = capability.reason ?? POSE_CAMERA_UNAVAILABLE_MESSAGE;
      setPoseCapabilityMessage(capability.available ? null : fallbackReason);

      if (capability.available) {
        try {
          const cameraModule =
            await import("./progress-photo-camera-container");
          setPoseCameraContainer(
            () => cameraModule.ProgressPhotoCameraContainer,
          );
          keepCameraOpen = true;
          return;
        } catch {
          reportProgressPhotoDiagnostic("camera_initialization_failed");
          fallbackReason = POSE_CAMERA_UNAVAILABLE_MESSAGE;
          setPoseCapabilityMessage(fallbackReason);
        }
      }

      const useRegularCamera = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Pose guidance unavailable",
          `${fallbackReason}\n\nRegular photos will not include pose guidance or automatic capture.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Use regular camera", onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        );
      });
      if (!useRegularCamera) return;

      try {
        await launchFallbackCamera();
      } catch {
        reportProgressPhotoDiagnostic("photo_save_failed");
        return;
      }
    } catch {
      reportProgressPhotoDiagnostic("camera_open_failed");
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
    <>
      <ProgressPhotoScreen
        photos={photos}
        selectedPhoto={selectedPhoto}
        comparisonPhotos={comparisonPhotos}
        comparisonPhoto={comparisonPhoto}
        elapsedTimeLabel={elapsedTimeLabel}
        canEditAlignment={Boolean(
          selectedPhoto?.referencePhotoId &&
          photos.some((photo) => photo.id === selectedPhoto.referencePhotoId),
        )}
        canSelectPreviousComparison={
          comparisonNavigation.previousPhotoId !== null
        }
        canSelectNextComparison={comparisonNavigation.nextPhotoId !== null}
        isLoading={photosQuery.isPending}
        isCapturing={isCameraOpen || createPhotoMutation.isPending}
        isDeleting={deletePhotoMutation.isPending}
        onDeletePhoto={requestDeletePhoto}
        errorMessage={errorMessage}
        poseCapabilityMessage={poseCapabilityMessage}
        captureStatusMessage={captureStatusMessage}
        onEditAlignment={() => {
          if (selectedPhoto) {
            updateAlignmentMutation.reset();
            setAlignmentEditorPhotoId(selectedPhoto.id);
          }
        }}
        onSelectPhoto={selectPhoto}
        onSelectComparisonPhoto={selectComparisonPhoto}
        onSelectPreviousComparison={() => {
          if (comparisonNavigation.previousPhotoId) {
            setComparisonPhotoId(comparisonNavigation.previousPhotoId);
          }
        }}
        onSelectNextComparison={() => {
          if (comparisonNavigation.nextPhotoId) {
            setComparisonPhotoId(comparisonNavigation.nextPhotoId);
          }
        }}
        onTakePhoto={() => void takePhoto()}
      />

      {alignmentEditorPhoto && alignmentEditorReference ? (
        <ProgressPhotoAlignmentEditor
          photo={alignmentEditorPhoto}
          referencePhoto={alignmentEditorReference}
          isSaving={updateAlignmentMutation.isPending}
          errorMessage={
            updateAlignmentMutation.isError
              ? "The alignment could not be saved. Please try again."
              : null
          }
          onCancel={() => setAlignmentEditorPhotoId(null)}
          onSave={(alignment, status) =>
            void saveEditedAlignment(alignment, status)
          }
        />
      ) : null}
    </>
  );
}
