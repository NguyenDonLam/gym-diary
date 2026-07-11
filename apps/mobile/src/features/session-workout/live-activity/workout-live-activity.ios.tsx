import {
  createLiveActivity,
  type LiveActivity,
  type LiveActivityEnvironment,
} from "expo-widgets";
import { Platform } from "react-native";
import {
  HStack,
  Image,
  ProgressView,
  Spacer,
  Text,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  activityBackgroundTint,
  background,
  clipShape,
  clipped,
  font,
  foregroundStyle,
  frame,
  labelsHidden,
  lineLimit,
  minimumScaleFactor,
  monospacedDigit,
  opacity,
  padding,
  strokeBorder,
  tint,
} from "@expo/ui/swift-ui/modifiers";

import {
  WORKOUT_LIVE_ACTIVITY_NAME,
  type WorkoutLiveActivityProps,
  type WorkoutOngoingActivityProps,
} from "./workout-ongoing-activity.types";

export { WORKOUT_LIVE_ACTIVITY_NAME };
export type { WorkoutLiveActivityProps, WorkoutOngoingActivityProps };

type WorkoutLiveActivityEnvironment = LiveActivityEnvironment & {
  isStale?: boolean;
};

if (__DEV__) {
  console.log("[LiveActivity] iOS module loaded");
}

const workoutLiveActivity = createLiveActivity<WorkoutLiveActivityProps>(
  WORKOUT_LIVE_ACTIVITY_NAME,
  (
    props: WorkoutLiveActivityProps,
    environment: WorkoutLiveActivityEnvironment,
  ) => {
    "widget";

    const colors = {
      background: "#282A36",
      elevatedSurface: "#44475A",
      primaryText: "#F8F8F2",
      secondaryText: "#BFBFC9",
      mutedText: "#6272A4",
      purple: "#BD93F9",
      cyan: "#8BE9FD",
      green: "#50FA7B",
      orange: "#FFB86C",
    };

    const dayMs = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const sessionStartedAtMs =
      typeof props.sessionStartedAtMs === "number" &&
        Number.isFinite(props.sessionStartedAtMs)
        ? props.sessionStartedAtMs
        : nowMs;

    const restStartedAtMs =
      typeof props.restStartedAtMs === "number" &&
        Number.isFinite(props.restStartedAtMs)
        ? props.restStartedAtMs
        : null;

    const restEndsAtMs =
      typeof props.restEndsAtMs === "number" &&
        Number.isFinite(props.restEndsAtMs)
        ? props.restEndsAtMs
        : null;

    const hasRestWindow =
      restStartedAtMs !== null &&
      restEndsAtMs !== null &&
      restEndsAtMs > restStartedAtMs;
    const restTimerFinished =
      props.restTimerFinished === true ||
      environment.isStale === true ||
      (hasRestWindow && restEndsAtMs <= nowMs);
    const hasActiveRest =
      hasRestWindow && !restTimerFinished && restEndsAtMs > nowMs;
    const showRestComplete = hasRestWindow && restTimerFinished;

    const sessionStartedAt = new Date(sessionStartedAtMs);
    const sessionTimerEndsAt = new Date(sessionStartedAtMs + dayMs);
    const restStartedAt = new Date(restStartedAtMs ?? nowMs);
    const restEndsAt = new Date(restEndsAtMs ?? nowMs);
    const sessionName = props.sessionName?.trim() || "Workout";
    const nextExerciseName =
      props.nextExerciseName?.trim() ||
      props.restExerciseName?.trim() ||
      "Next exercise";
    const nextSetQuantityText =
      props.nextSetQuantity != null ? `${props.nextSetQuantity}`.trim() : null;
    const nextSetQuantityLabel = nextSetQuantityText
      ? props.nextSetQuantityUnit === "time"
        ? `${nextSetQuantityText}s`
        : `${nextSetQuantityText} reps`
      : null;
    const nextSetLoadText =
      props.nextSetLoadValue != null ? `${props.nextSetLoadValue}`.trim() : null;
    const nextSetLoadUnit = props.nextSetLoadUnit?.trim() || "kg";
    const nextSetLoadLabel = nextSetLoadText
      ? `${nextSetLoadText} ${nextSetLoadUnit}`
      : null;
    const nextSetResult =
      nextSetQuantityLabel && nextSetLoadLabel
        ? `${nextSetQuantityLabel} x ${nextSetLoadLabel}`
        : nextSetQuantityLabel || nextSetLoadLabel || "Next set";
    const nextSetLabel =
      props.nextSetIndex != null && props.nextSetTotalCount != null
        ? `Set ${props.nextSetIndex} of ${props.nextSetTotalCount}`
        : props.nextSetIndex != null
          ? `Set ${props.nextSetIndex}`
          : "Next set";
    const completedSetCount =
      typeof props.completedSetCount === "number" &&
        Number.isFinite(props.completedSetCount)
        ? props.completedSetCount
        : null;
    const sessionTotalSetCount =
      typeof props.sessionTotalSetCount === "number" &&
        Number.isFinite(props.sessionTotalSetCount)
        ? props.sessionTotalSetCount
        : null;
    const setProgressLabel =
      completedSetCount !== null &&
        sessionTotalSetCount !== null &&
        sessionTotalSetCount > 0
        ? `${completedSetCount}/${sessionTotalSetCount}`
        : null;
    const nextSetMetaLabel = setProgressLabel
      ? `${nextSetLabel} - ${setProgressLabel}`
      : nextSetLabel;
    const restAccent = showRestComplete ? colors.green : colors.orange;

    const workoutElapsedTimer = (
      <Text
        timerInterval={{ lower: sessionStartedAt, upper: sessionTimerEndsAt }}
        countsDown={false}
        modifiers={[
          font({ size: 14, weight: "semibold", design: "monospaced" }),
          monospacedDigit(),
          foregroundStyle(colors.cyan),
          lineLimit(1),
          minimumScaleFactor(0.75),
        ]}
      />
    );

    const restCountdownTimer = (
      <Text
        timerInterval={{ lower: restStartedAt, upper: restEndsAt }}
        countsDown
        modifiers={[
          font({ size: 28, weight: "bold", design: "monospaced" }),
          monospacedDigit(),
          foregroundStyle(colors.orange),
          lineLimit(1),
          minimumScaleFactor(0.55),
        ]}
      />
    );

    const compactRestTimer = (
      <Text
        date={restEndsAt}
        dateStyle="timer"
        modifiers={[
          font({ size: 13, weight: "semibold", design: "monospaced" }),
          monospacedDigit(),
          foregroundStyle(colors.orange),
          lineLimit(1),
          minimumScaleFactor(0.65),
          frame({ width: 34, alignment: "leading" }),
          clipped(),
        ]}
      />
    );

    const expandedRestCenter = showRestComplete ? (
      <HStack spacing={6} modifiers={[padding({ vertical: 4 })]}>
        <Image
          systemName="checkmark.circle.fill"
          modifiers={[
            foregroundStyle(colors.green),
            font({ size: 16, weight: "bold" }),
          ]}
        />
        <Text
          modifiers={[
            font({ size: 16, weight: "bold" }),
            foregroundStyle(colors.green),
            lineLimit(1),
          ]}
        >
          READY
        </Text>
      </HStack>
    ) : hasActiveRest ? (
      <VStack
        alignment="center"
        spacing={0}
        modifiers={[padding({ vertical: 2 })]}
      >
        <Text
          modifiers={[
            font({ size: 10, weight: "bold" }),
            foregroundStyle(colors.mutedText),
            lineLimit(1),
          ]}
        >
          REST
        </Text>
        <Text
          date={restEndsAt}
          dateStyle="timer"
          modifiers={[
            font({ size: 20, weight: "bold", design: "monospaced" }),
            monospacedDigit(),
            foregroundStyle(colors.orange),
            lineLimit(1),
            minimumScaleFactor(0.65),
            frame({ width: 58, alignment: "leading" }),
            clipped(),
          ]}
        />
      </VStack>
    ) : (
      <Text
        modifiers={[
          font({ size: 16, weight: "bold" }),
          foregroundStyle(colors.green),
          lineLimit(1),
        ]}
      >
        READY
      </Text>
    );

    const compactLeading = setProgressLabel ? (
      <Text
        modifiers={[
          font({ size: 12, weight: "bold", design: "monospaced" }),
          monospacedDigit(),
          foregroundStyle(colors.purple),
          // padding({ trailing: 2 }),
          lineLimit(1),
          minimumScaleFactor(0.7),
        ]}
      >
        {setProgressLabel}
      </Text>
    ) : (
      <Image
        systemName="dumbbell.fill"
        modifiers={[
          foregroundStyle(colors.purple),
          font({ size: 14, weight: "semibold" }),
          // padding({ trailing: 2 }),
        ]}
      />
    );

    const compactTrailing = hasActiveRest ? (
      compactRestTimer
    ) : (
      <Text
        modifiers={[
          font({ size: 13, weight: "bold" }),
          foregroundStyle(colors.green),
          padding({ trailing: 2 }),
          lineLimit(1),
          minimumScaleFactor(0.7),
        ]}
      >
        GO
      </Text>
    );

    const minimal = hasActiveRest ? (
      <ZStack
        alignment="center"
        modifiers={[
          frame({ width: 20, height: 20 }),
          strokeBorder({
            color: colors.orange,
            style: { lineWidth: 2, lineCap: "round" },
            shape: "circle",
          }),
        ]}
      >
        <Image
          systemName="dumbbell.fill"
          modifiers={[
            foregroundStyle(colors.purple),
            font({ size: 8, weight: "bold" }),
            opacity(0.9),
          ]}
        />
      </ZStack>
    ) : (
      <Image
        systemName="checkmark.circle.fill"
        modifiers={[
          foregroundStyle(colors.green),
          font({ size: 14, weight: "bold" }),
        ]}
      />
    );

    return {
      banner: (
        <VStack
          alignment="leading"
          spacing={0}
          modifiers={[
            background(colors.background),
            clipShape("roundedRectangle", 16),
            activityBackgroundTint(colors.background),
          ]}
        >
          <HStack
            spacing={10}
            modifiers={[padding({ horizontal: 14, top: 12, bottom: 8 })]}
          >
            <Image
              systemName="dumbbell.fill"
              modifiers={[
                foregroundStyle(colors.purple),
                font({ size: 16, weight: "semibold" }),
              ]}
            />

            <VStack alignment="leading" spacing={1}>
              <Text
                modifiers={[
                  font({ size: 10, weight: "bold" }),
                  foregroundStyle(colors.mutedText),
                  lineLimit(1),
                ]}
              >
                GYM DIARY
              </Text>
              <Text
                modifiers={[
                  font({ size: 15, weight: "semibold" }),
                  foregroundStyle(colors.primaryText),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                ]}
              >
                {sessionName}
              </Text>
            </VStack>

            <Spacer />

            {workoutElapsedTimer}
          </HStack>

          <VStack
            alignment="leading"
            spacing={6}
            modifiers={[padding({ horizontal: 14, vertical: 6 })]}
          >
            <HStack spacing={8} alignment="center">
              {showRestComplete ? (
                <>
                  <Image
                    systemName="checkmark.circle.fill"
                    modifiers={[
                      foregroundStyle(colors.green),
                      font({ size: 18, weight: "bold" }),
                    ]}
                  />
                  <VStack alignment="leading" spacing={0}>
                    <Text
                      modifiers={[
                        font({ size: 10, weight: "bold" }),
                        foregroundStyle(colors.mutedText),
                        lineLimit(1),
                      ]}
                    >
                      REST COMPLETE
                    </Text>
                    <Text
                      modifiers={[
                        font({ size: 16, weight: "bold" }),
                        foregroundStyle(colors.green),
                        lineLimit(1),
                      ]}
                    >
                      NEXT SET READY
                    </Text>
                  </VStack>
                </>
              ) : hasActiveRest ? (
                <VStack alignment="leading" spacing={0}>
                  <Text
                    modifiers={[
                      font({ size: 10, weight: "bold" }),
                      foregroundStyle(colors.mutedText),
                      lineLimit(1),
                    ]}
                  >
                    REST
                  </Text>
                  {restCountdownTimer}
                </VStack>
              ) : (
                <VStack alignment="leading" spacing={0}>
                  <Text
                    modifiers={[
                      font({ size: 10, weight: "bold" }),
                      foregroundStyle(colors.mutedText),
                      lineLimit(1),
                    ]}
                  >
                    NEXT SET
                  </Text>
                  <Text
                    modifiers={[
                      font({ size: 16, weight: "bold" }),
                      foregroundStyle(colors.green),
                      lineLimit(1),
                    ]}
                  >
                    READY
                  </Text>
                </VStack>
              )}
              <Spacer />
            </HStack>

            {hasActiveRest ? (
              <ProgressView
                timerInterval={{ lower: restStartedAt, upper: restEndsAt }}
                modifiers={[
                  tint(restAccent),
                  labelsHidden(),
                  frame({ height: 6 }),
                  padding({ top: 6 }),
                ]}
              />
            ) : (
              <ProgressView
                value={showRestComplete ? 1 : 0}
                modifiers={[
                  tint(restAccent),
                  labelsHidden(),
                  frame({ height: 6 }),
                  padding({ top: 6 }),
                ]}
              />
            )}
          </VStack>

          <HStack modifiers={[padding({ horizontal: 14, top: 8, bottom: 12 })]}>
            <Spacer />
            <VStack
              alignment="leading"
              spacing={2}
              modifiers={[
                padding({ horizontal: 12, vertical: 8 }),
                background(colors.elevatedSurface),
                clipShape("roundedRectangle", 12),
                strokeBorder({
                  color: colors.purple,
                  style: { lineWidth: showRestComplete ? 1.5 : 1 },
                  shape: "roundedRectangle",
                  cornerRadius: 12,
                }),
              ]}
            >
              <Text
                modifiers={[
                  font({ size: 10, weight: "bold" }),
                  foregroundStyle(colors.purple),
                  lineLimit(1),
                ]}
              >
                NEXT SET
              </Text>
              <Text
                modifiers={[
                  font({ size: 14, weight: "semibold" }),
                  foregroundStyle(colors.primaryText),
                  lineLimit(1),
                  minimumScaleFactor(0.75),
                ]}
              >
                {nextExerciseName}
              </Text>
              <Text
                modifiers={[
                  font({
                    size: showRestComplete ? 16 : 15,
                    weight: "bold",
                    design: "monospaced",
                  }),
                  monospacedDigit(),
                  foregroundStyle(colors.primaryText),
                  lineLimit(1),
                  minimumScaleFactor(0.65),
                ]}
              >
                {nextSetResult}
              </Text>
              <Text
                modifiers={[
                  font({ size: 10, weight: "medium" }),
                  foregroundStyle(colors.secondaryText),
                  lineLimit(1),
                  minimumScaleFactor(0.8),
                ]}
              >
                {nextSetMetaLabel}
              </Text>
            </VStack>
            <Spacer />
          </HStack>
        </VStack>
      ),
      compactLeading,
      compactTrailing,
      minimal,
      expandedLeading: (
        <HStack spacing={6} modifiers={[padding({ leading: 4 })]}>
          <Image
            systemName="dumbbell.fill"
            modifiers={[
              foregroundStyle(colors.purple),
              font({ size: 16, weight: "semibold" }),
            ]}
          />
          <Text
            modifiers={[
              font({ size: 12, weight: "bold" }),
              foregroundStyle(colors.purple),
              lineLimit(1),
            ]}
          >
            Gym Diary
          </Text>
        </HStack>
      ),
      expandedTrailing: (
        <HStack modifiers={[padding({ trailing: 1 })]}>
          {workoutElapsedTimer}
        </HStack>
      ),
      expandedCenter: expandedRestCenter,
      expandedBottom: (
        <VStack
          alignment="leading"
          spacing={4}
          modifiers={[padding({ horizontal: 4, top: 2 })]}
        >
          <HStack spacing={8}>
            <Text
              modifiers={[
                font({ size: 10, weight: "bold" }),
                foregroundStyle(colors.purple),
                frame({ width: 40, alignment: "leading" }),
                lineLimit(1),
              ]}
            >
              NEXT
            </Text>
            <Text
              modifiers={[
                font({ size: 13, weight: "semibold" }),
                foregroundStyle(colors.primaryText),
                lineLimit(1),
                minimumScaleFactor(0.75),
              ]}
            >
              {nextExerciseName} - {nextSetResult}
            </Text>
            <Spacer />
          </HStack>

          <HStack spacing={8}>
            <Text
              modifiers={[
                font({ size: 10, weight: "bold" }),
                foregroundStyle(colors.mutedText),
                frame({ width: 40, alignment: "leading" }),
                lineLimit(1),
              ]}
            >
              SET
            </Text>
            <Text
              modifiers={[
                font({ size: 12, weight: "medium" }),
                foregroundStyle(colors.secondaryText),
                lineLimit(1),
                minimumScaleFactor(0.8),
              ]}
            >
              {nextSetMetaLabel}
            </Text>
            <Spacer />
          </HStack>
        </VStack>
      ),
    };
  },
);

let currentActivity: LiveActivity<WorkoutLiveActivityProps> | null = null;
let liveActivityQueue = Promise.resolve();

function runLiveActivityTask(task: () => Promise<void>) {
  liveActivityQueue = liveActivityQueue.then(task).catch((error) => {
    console.warn("[workout-live-activity] task failed", error);
  });

  return liveActivityQueue;
}

function canUseLiveActivities() {
  return Platform.OS === "ios";
}

function getLiveActivityUrl() {
  return "mobile://session-workout/ongoing";
}

export function syncWorkoutLiveActivity(props: WorkoutLiveActivityProps) {
  if (__DEV__) {
    console.log("[LiveActivity] syncWorkoutLiveActivity()");
  }

  if (!canUseLiveActivities()) return Promise.resolve();

  return runLiveActivityTask(async () => {
    const instances = workoutLiveActivity.getInstances();

    if (instances.length > 0) {
      currentActivity = instances[0] ?? null;
      await Promise.all(instances.map((activity) => activity.update(props)));
      return;
    }

    currentActivity = workoutLiveActivity.start(props, getLiveActivityUrl());
  });
}

export function endWorkoutLiveActivity(finalProps?: WorkoutLiveActivityProps) {
  if (!canUseLiveActivities()) return Promise.resolve();

  return runLiveActivityTask(async () => {
    const instances = currentActivity
      ? [currentActivity]
      : workoutLiveActivity.getInstances();

    await Promise.all(
      instances.map((activity) =>
        activity.end("immediate", finalProps, new Date()).catch((error) => {
          console.warn("[workout-live-activity] failed to end activity", error);
        }),
      ),
    );

    currentActivity = null;
  });
}

export const syncWorkoutLiveUpdate = syncWorkoutLiveActivity;
export const endWorkoutLiveUpdate = endWorkoutLiveActivity;
export const syncWorkoutOngoingActivity = syncWorkoutLiveActivity;
export const endWorkoutOngoingActivity = endWorkoutLiveActivity;
