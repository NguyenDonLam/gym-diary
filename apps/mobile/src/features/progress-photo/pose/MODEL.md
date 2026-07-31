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
