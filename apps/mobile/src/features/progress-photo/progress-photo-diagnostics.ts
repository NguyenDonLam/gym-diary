export type ProgressPhotoDiagnosticEvent =
  | "camera_initialization_failed"
  | "camera_open_failed"
  | "photo_save_failed"
  | "reference_alignment_save_failed";

export function reportProgressPhotoDiagnostic(
  event: ProgressPhotoDiagnosticEvent,
) {
  if (__DEV__) {
    // Never include photo URIs, identifiers, landmarks, metadata, or errors.
    console.warn(`[progress-photo] ${event}`);
  }
}
