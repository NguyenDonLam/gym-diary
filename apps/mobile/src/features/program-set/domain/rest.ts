export const DEFAULT_REST_SECONDS = 120;

export function normalizeRestSeconds(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function formatRestDuration(value: number | null | undefined) {
  const totalSeconds = normalizeRestSeconds(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  if (seconds === 0) return `${minutes}m`;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
