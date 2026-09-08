export type ProgressPhotoPerformanceMetric =
  | "camera_frame_rate_hz"
  | "pose_inference_rate_hz"
  | "pose_inference_duration_ms"
  | "automatic_capture_latency_ms"
  | "comparison_switch_latency_ms";

export type ProgressPhotoPerformanceSummary = {
  sampleCount: number;
  average: number;
  minimum: number;
  maximum: number;
};

const maximumSamplesPerMetric = 120;

export function createProgressPhotoPerformanceTracker(enabled: boolean) {
  const samples = new Map<ProgressPhotoPerformanceMetric, number[]>();

  return {
    record(metric: ProgressPhotoPerformanceMetric, value: number) {
      if (!enabled || !Number.isFinite(value) || value < 0) return;

      const values = samples.get(metric) ?? [];
      values.push(value);
      if (values.length > maximumSamplesPerMetric) {
        values.splice(0, values.length - maximumSamplesPerMetric);
      }
      samples.set(metric, values);
    },

    snapshot(): Partial<
      Record<ProgressPhotoPerformanceMetric, ProgressPhotoPerformanceSummary>
    > {
      const result: Partial<
        Record<ProgressPhotoPerformanceMetric, ProgressPhotoPerformanceSummary>
      > = {};

      for (const [metric, values] of samples) {
        const total = values.reduce((sum, value) => sum + value, 0);
        result[metric] = {
          sampleCount: values.length,
          average: total / values.length,
          minimum: Math.min(...values),
          maximum: Math.max(...values),
        };
      }

      return result;
    },
  };
}

export const progressPhotoPerformance = createProgressPhotoPerformanceTracker(
  typeof __DEV__ !== "undefined" && __DEV__,
);
