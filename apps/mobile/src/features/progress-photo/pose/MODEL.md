# Progress pose model

## Bundled model

- Model: MoveNet.SinglePose.Lightning
- TensorFlow Hub version: 4
- Format: TensorFlow Lite, float16 weights
- File: `assets/models/movenet-singlepose-lightning-float16-v4.tflite`
- Size: 4,758,512 bytes
- SHA-256: `0FAC2226112D0371903CA86E3853CEC24EF603A0B2F96F589B180F0EBDD135AB`
- Source: <https://tfhub.dev/google/lite-model/movenet/singlepose/lightning/tflite/float16/4?lite-format=tflite>
- Publisher: Google
- License: Apache License 2.0

The model is checked into the application assets and referenced with a static
React Native `require`. It is not downloaded at runtime.

## Tensor contract

- Input: one `uint8` RGB image tensor with shape `[1, 192, 192, 3]`.
- Output: one `float32` tensor with shape `[1, 1, 17, 3]`.
- Output coordinate order per landmark: normalized `y`, normalized `x`,
  confidence score.
- Person count: one.

The 17 landmarks are nose; left/right eye; left/right ear; left/right shoulder;
left/right elbow; left/right wrist; left/right hip; left/right knee; and
left/right ankle.

Tensor parsing, orientation correction, mirroring, thresholds, and inference
rate limiting are implemented in this feature's TypeScript detector adapter.
On supported iOS development builds, the progress-photo camera retains the
latest torso-valid pose and associates it with a manual capture when its native
frame timestamp is no more than 350 milliseconds older than the shutter
timestamp. The original photo file is copied unchanged.

The feature also contains a deterministic, pure TypeScript comparison engine.
It scores normalized body geometry separately from camera framing, weights
torso landmarks more heavily than extremities, ignores landmarks below the
configured confidence threshold, and returns bounded pose, framing, visibility,
and overall scores. On supported iOS development builds, the camera uses this
engine to guide manual capture against a user-selected saved reference. The
guidance applies score smoothing and instruction confirmation, and offers a
reference overlay that can be disabled or displayed at several opacity levels.

Automatic capture is available as an opt-in camera control. Its pure
TypeScript state machine uses pose-frame timestamps, separate entry and
cancellation thresholds, a 750 millisecond continuous hold, duplicate-request
protection, and a post-capture cooldown. The manual shutter remains available.

Guided captures also store a versioned two-dimensional similarity transform
that maps the current photo's normalized landmark coordinates into the selected
reference coordinate system. The weighted least-squares fit prefers torso
landmarks, rejects extreme residual outliers, and bounds translation, uniform
scale, and rotation. Reference photos store an identity transform. These values
remain metadata only, and original image files remain unchanged.

The progress-photo viewer renders those stored transforms inside a fixed 3:4
comparison viewport. It uses the stored reference photo as the coordinate basis
and applies only translation, uniform scale, and rotation to the displayed image.
Photos without alignment data, or whose reference photo is missing, retain their
original framing. Lower-confidence alignment is identified without blocking the
comparison. The full original remains available in a separate untransformed,
uncropped view. Timeline thumbnails use the image cache so nearby photos are
ready when selected; transforms are read from metadata rather than recalculated
during rendering.

Immediate comparison is limited to two photos in the same non-null pose group.
The main timeline selects the default photo, while a second selector and
chronological previous/next controls choose the comparison photo. Both aligned
images stay mounted in the same viewport, crop, and reference coordinate system;
switching changes visibility without an image-position transition. Pressing and
holding shows the comparison until release, and tapping pins or unpins the same
switch for accessibility. The viewer displays both capture dates and their
elapsed time, and preloads the active comparison and its neighbouring dates.

## Physical iOS verification

Use an Expo development build with at least three photos in one pose group and
one photo in a different group:

1. Open the newest grouped photo and confirm the closest earlier photo is chosen
   for comparison.
2. Press and hold the comparison viewport. Confirm the second photo appears
   immediately and the default returns immediately on release.
3. Tap the viewport twice and confirm it pins the comparison, then returns to
   the default.
4. Use Previous and Next and confirm dates move chronologically without offering
   the photo from the other pose group.
5. Confirm both capture dates and the elapsed time are shown, and rapid switching
   does not flash, animate, stretch, or change the viewport crop.
6. Open Full original while each photo is displayed and confirm the uncropped,
   unaligned source opens.
7. Rotate the device where the app supports rotation and confirm the viewport
   retains its 3:4 aspect ratio.

The repository does not currently include a React Native component-rendering
test harness. Pure mapper tests cover pair eligibility, default selection,
chronological navigation, elapsed time, viewport sizing, and transform mapping.

## Manual alignment and metadata

Later photos with an available reference expose an alignment editor. The
reference is rendered as an adjustable-opacity overlay while the current photo
supports simultaneous drag, pinch, and rotation gestures. Translation, uniform
scale, and rotation use the same bounds as automatic alignment. The editor owns
only a temporary draft; persistence remains in `ProgressPhotosContainer`.

Each record stores an `alignmentStatus` of `automatic`, `manual`, or
`unavailable`. `automaticAlignment` preserves the original calculated transform
when a manual transform becomes active, making Reset to automatic lossless.
Reset to no alignment clears the active transform without deleting that
automatic baseline. Legacy records infer `automatic` when a valid transform
exists and `unavailable` otherwise.

## Failure handling

- Camera and photo-library permission failures retain the existing manual flow
  and present English recovery actions.
- Model-load, missing-asset, unsupported-platform, and inference failures disable
  pose matching without disabling manual capture.
- An iOS memory warning disposes the pose detector, disables automatic capture,
  and leaves manual camera capture running.
- Missing image files render an explicit unavailable state. The alignment editor
  disables saving if its current or reference image cannot load.
- Missing reference records and corrupt optional metadata fall back to original
  framing.
- The alignment editor contains no delete action, so a photo cannot be deleted
  accidentally while editing.

The progress screen offers deletion of the displayed photo with a confirmation
showing its date and time. The repository removes only the managed file directly
under the app's `progress-photos` document directory and its metadata record.
Other photos and pose data are preserved; active and automatic alignments using
the deleted reference are cleared. The query layer refreshes the photo list,
camera references, and comparisons. Missing managed files can still be deleted
from the list, and original files outside the managed directory are untouched.

## Privacy and offline boundary

Photos are copied into the app-private document directory. Metadata and
normalised landmarks are stored in AsyncStorage. The feature has no HTTP client,
upload, analytics, notification, social-sharing, or runtime model-download path,
so capture, matching, alignment, editing, and comparison operate in airplane
mode. The bundled MoveNet model is the only inference asset.

Development diagnostics accept only fixed event names. They never include image
URIs, identifiers, landmarks, alignment metadata, caught error objects, or photo
contents, and are compiled out of production behaviour through `__DEV__`.
Progress-photo data is not placed in notification previews or analytics/error
payloads by this feature.

Android application backup is disabled in Expo configuration. On iOS the files
remain inside the application sandbox, but the current TypeScript-only
implementation cannot opt individual document files out of an encrypted device
backup without an additional supported native capability. The app performs no
independent cloud backup or sync.

## Performance measurements

A bounded in-memory development collector records:

- Camera frame rate, sampled across the worklet bridge at most once per second.
- Pose inference rate and average inference duration.
- Automatic-capture request-to-completion latency.
- Comparison visibility-switch latency.

The collector retains at most 120 finite samples per metric, contains no photo
data, performs no network transmission, and is disabled in production. Raw pose
diagnostics remain disabled by `progressPoseConfig.diagnosticsEnabled`.
Automatic-capture thresholds and hold/cooldown timings remain centralised in
`progress-pose-auto-capture.config.ts`.

## Architecture and remaining platform boundary

The progress-photo screen and alignment editor are presentational. The
container owns queries, mutations, pair selection, preloading, and persistence.
Pure mappers prepare reference, alignment, navigation, date, and viewport data.
The repository owns AsyncStorage and filesystem boundaries, and pose/alignment
algorithms remain deterministic TypeScript modules.

iOS development builds provide live pose inference and automatic capture.
Android continues to compile and uses the shared storage, comparison, and manual
alignment UI, but its platform capability intentionally reports automatic pose
matching as unavailable. Future Android inference should implement the existing
`ProgressPoseDetector` and capability boundaries without changing screens,
storage, comparison, or alignment contracts.

Physical-device checks remain required for multi-touch gesture feel,
memory-pressure behaviour, camera frame rate, switch latency, and a full
airplane-mode capture-to-comparison pass.
