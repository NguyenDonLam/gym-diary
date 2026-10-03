import { progressPoseAutoCaptureConfig as config } from "./progress-pose-auto-capture.config";
import type { PoseMatchResult } from "./progress-pose-comparison.types";

export type AutoCaptureState =
  "searching" | "matching" | "holding" | "capturing" | "cooldown" | "disabled";

export type AutoCaptureMachine = {
  state: AutoCaptureState;
  enabled: boolean;
  holdStartedAtMs: number | null;
  cooldownStartedAtMs: number | null;
  holdProgress: number;
  captureRequested: boolean;
};

export type AutoCaptureEvent =
  | { type: "set_enabled"; enabled: boolean }
  | {
      type: "match";
      timestampMs: number;
      match: PoseMatchResult | null;
    }
  | { type: "capture_completed"; timestampMs: number }
  | { type: "cancel" };

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function meetsThresholds(
  match: PoseMatchResult | null,
  thresholds: {
    pose: number;
    framing: number;
    visibility: number;
    overall: number;
  },
) {
  return (
    match !== null &&
    !match.failureReason &&
    match.poseScore >= thresholds.pose &&
    match.framingScore >= thresholds.framing &&
    match.visibilityScore >= thresholds.visibility &&
    match.overallScore >= thresholds.overall
  );
}

function waitingState(
  enabled: boolean,
  state: "searching" | "matching" = "searching",
): AutoCaptureMachine {
  return {
    state: enabled ? state : "disabled",
    enabled,
    holdStartedAtMs: null,
    cooldownStartedAtMs: null,
    holdProgress: 0,
    captureRequested: false,
  };
}

export function createAutoCaptureMachine(enabled = false): AutoCaptureMachine {
  return waitingState(enabled);
}

export function updateAutoCaptureMachine(
  machine: AutoCaptureMachine,
  event: AutoCaptureEvent,
): AutoCaptureMachine {
  if (event.type === "set_enabled") {
    return waitingState(event.enabled);
  }

  if (event.type === "cancel") {
    return waitingState(machine.enabled);
  }

  if (!machine.enabled) return waitingState(false);

  if (event.type === "capture_completed") {
    if (!Number.isFinite(event.timestampMs)) {
      return waitingState(true);
    }

    return {
      state: "cooldown",
      enabled: true,
      holdStartedAtMs: null,
      cooldownStartedAtMs: event.timestampMs,
      holdProgress: 0,
      captureRequested: false,
    };
  }

  if (!Number.isFinite(event.timestampMs)) {
    return waitingState(true);
  }

  if (machine.state === "capturing") return machine;

  if (machine.state === "cooldown") {
    const cooldownStartedAtMs = machine.cooldownStartedAtMs;
    if (
      cooldownStartedAtMs !== null &&
      event.timestampMs >= cooldownStartedAtMs &&
      event.timestampMs - cooldownStartedAtMs < config.cooldownDurationMs
    ) {
      return machine;
    }

    return updateAutoCaptureMachine(waitingState(true), event);
  }

  const meetsEntryThresholds = meetsThresholds(
    event.match,
    config.entryThresholds,
  );
  const meetsCancellationThresholds = meetsThresholds(
    event.match,
    config.cancellationThresholds,
  );

  if (machine.state === "holding") {
    const holdStartedAtMs = machine.holdStartedAtMs;
    if (
      !meetsCancellationThresholds ||
      holdStartedAtMs === null ||
      event.timestampMs < holdStartedAtMs
    ) {
      return waitingState(
        true,
        meetsCancellationThresholds ? "matching" : "searching",
      );
    }

    const holdProgress = clamp01(
      (event.timestampMs - holdStartedAtMs) / config.holdDurationMs,
    );
    if (holdProgress >= 1) {
      return {
        state: "capturing",
        enabled: true,
        holdStartedAtMs,
        cooldownStartedAtMs: null,
        holdProgress: 1,
        captureRequested: true,
      };
    }

    return {
      ...machine,
      holdProgress,
    };
  }

  if (meetsEntryThresholds) {
    return {
      state: "holding",
      enabled: true,
      holdStartedAtMs: event.timestampMs,
      cooldownStartedAtMs: null,
      holdProgress: 0,
      captureRequested: false,
    };
  }

  return waitingState(
    true,
    meetsCancellationThresholds ? "matching" : "searching",
  );
}
