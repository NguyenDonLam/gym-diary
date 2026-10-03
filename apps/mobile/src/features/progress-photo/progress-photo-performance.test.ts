import assert from "node:assert/strict";
import test from "node:test";

import { createProgressPhotoPerformanceTracker } from "./progress-photo-performance";

test("summarises bounded finite performance samples", () => {
  const tracker = createProgressPhotoPerformanceTracker(true);

  tracker.record("comparison_switch_latency_ms", 12);
  tracker.record("comparison_switch_latency_ms", 18);
  tracker.record("comparison_switch_latency_ms", Number.NaN);

  assert.deepEqual(tracker.snapshot().comparison_switch_latency_ms, {
    sampleCount: 2,
    average: 15,
    minimum: 12,
    maximum: 18,
  });
});

test("does not retain samples when diagnostics are disabled", () => {
  const tracker = createProgressPhotoPerformanceTracker(false);

  tracker.record("camera_frame_rate_hz", 60);

  assert.deepEqual(tracker.snapshot(), {});
});
