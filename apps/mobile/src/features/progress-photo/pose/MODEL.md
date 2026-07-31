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
timestamp. The original photo file is copied unchanged. Automatic capture,
pose comparison, and alignment are intentionally not implemented yet.
