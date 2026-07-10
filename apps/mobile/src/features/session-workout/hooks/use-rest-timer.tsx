import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";

import { generateId } from "@/src/lib/id";
import {
  formatRestDuration,
  normalizeRestSeconds,
} from "../../program-set/domain/rest";

const REST_TIMER_KEY = "session:active-rest-timer";
const REST_TIMER_CHANNEL_ID = "rest-timer";

type RestTimerSource = "auto" | "manual";

export type ActiveRestTimer = {
  id: string;
  sessionId: string | null;
  setId: string | null;
  exerciseName: string | null;
  setIndex: number | null;
  durationSeconds: number;
  startedAtMs: number;
  endsAtMs: number;
  notificationId: string | null;
  source: RestTimerSource;
};

export type CompletedRestTimer = ActiveRestTimer & {
  completedAtMs: number;
};

type StartRestTimerInput = {
  sessionId?: string | null;
  setId?: string | null;
  exerciseName?: string | null;
  setIndex?: number | null;
  durationSeconds: number;
  source?: RestTimerSource;
};

type RestTimerContextValue = {
  activeTimer: ActiveRestTimer | null;
  completedTimer: CompletedRestTimer | null;
  remainingSeconds: number;
  label: string;
  startRestTimer: (input: StartRestTimerInput) => Promise<void>;
  cancelRestTimer: () => Promise<void>;
  clearCompletedTimer: () => void;
};

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function parseStoredTimer(raw: string | null): ActiveRestTimer | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ActiveRestTimer>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.durationSeconds !== "number" ||
      typeof parsed.startedAtMs !== "number" ||
      typeof parsed.endsAtMs !== "number"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      sessionId: parsed.sessionId ?? null,
      setId: parsed.setId ?? null,
      exerciseName: parsed.exerciseName ?? null,
      setIndex: parsed.setIndex ?? null,
      durationSeconds: normalizeRestSeconds(parsed.durationSeconds),
      startedAtMs: parsed.startedAtMs,
      endsAtMs: parsed.endsAtMs,
      notificationId: parsed.notificationId ?? null,
      source: parsed.source === "manual" ? "manual" : "auto",
    };
  } catch {
    return null;
  }
}

function getRemainingSeconds(timer: ActiveRestTimer | null, nowMs: number) {
  if (!timer) return 0;
  return Math.max(0, Math.ceil((timer.endsAtMs - nowMs) / 1000));
}

async function ensureRestNotificationsReady() {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REST_TIMER_CHANNEL_ID, {
      name: "Rest timers",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing.status === "granted"
      ? existing.status
      : (await Notifications.requestPermissionsAsync()).status;

  return finalStatus === "granted";
}

async function scheduleRestNotification(input: StartRestTimerInput) {
  try {
    const ready = await ensureRestNotificationsReady();
    if (!ready) return null;

    const exerciseName = input.exerciseName?.trim();
    const body =
      exerciseName && exerciseName.length > 0
        ? `Rest for ${exerciseName} is complete.`
        : "Your rest timer is complete.";

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rest complete",
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, normalizeRestSeconds(input.durationSeconds)),
        channelId: REST_TIMER_CHANNEL_ID,
      },
    });
  } catch (e) {
    console.warn("[rest-timer] failed to schedule notification", e);
    return null;
  }
}

async function cancelScheduledNotification(notificationId: string | null) {
  if (!notificationId || Platform.OS === "web") return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (e) {
    console.warn("[rest-timer] failed to cancel notification", e);
  }
}

export function RestTimerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTimer, setActiveTimer] = useState<ActiveRestTimer | null>(null);
  const [completedTimer, setCompletedTimer] =
    useState<CompletedRestTimer | null>(null);
  const activeTimerRef = useRef<ActiveRestTimer | null>(null);
  const completedTimerIdsRef = useRef<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(() => Date.now());

  const persistTimer = useCallback(async (timer: ActiveRestTimer | null) => {
    activeTimerRef.current = timer;
    setActiveTimer(timer);

    try {
      if (timer) {
        await AsyncStorage.setItem(REST_TIMER_KEY, JSON.stringify(timer));
      } else {
        await AsyncStorage.removeItem(REST_TIMER_KEY);
      }
    } catch (e) {
      console.warn("[rest-timer] failed to persist timer", e);
    }
  }, []);

  const completeTimer = useCallback(
    async (timer: ActiveRestTimer, completedAtMs = Date.now()) => {
      if (completedTimerIdsRef.current.has(timer.id)) return;

      completedTimerIdsRef.current.add(timer.id);
      setCompletedTimer({ ...timer, completedAtMs });
      setNowMs(completedAtMs);
      await persistTimer(null);
    },
    [persistTimer],
  );

  const restoreTimer = useCallback(async () => {
    try {
      const stored = parseStoredTimer(await AsyncStorage.getItem(REST_TIMER_KEY));
      if (!stored) {
        await persistTimer(null);
        return;
      }

      const restoredAtMs = Date.now();
      if (stored.endsAtMs <= restoredAtMs) {
        await completeTimer(stored, restoredAtMs);
        return;
      }

      activeTimerRef.current = stored;
      setActiveTimer(stored);
      setNowMs(restoredAtMs);
    } catch (e) {
      console.warn("[rest-timer] failed to restore timer", e);
    }
  }, [completeTimer, persistTimer]);

  useEffect(() => {
    void restoreTimer();
  }, [restoreTimer]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void restoreTimer();
        return;
      }

      const timer = activeTimerRef.current;
      if (timer) {
        void AsyncStorage.setItem(REST_TIMER_KEY, JSON.stringify(timer));
      }
    });

    return () => subscription.remove();
  }, [restoreTimer]);

  useEffect(() => {
    if (!activeTimer) return;

    const completeActiveTimer = () => {
      const nextNow = Date.now();
      setNowMs(nextNow);

      const current = activeTimerRef.current;
      if (current && current.endsAtMs <= nextNow) {
        void completeTimer(current, nextNow);
      }
    };

    const timeoutId = setTimeout(
      completeActiveTimer,
      Math.max(0, activeTimer.endsAtMs - Date.now()) + 50,
    );

    const intervalId = setInterval(() => {
      completeActiveTimer();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [activeTimer, completeTimer]);

  const startRestTimer = useCallback(
    async (input: StartRestTimerInput) => {
      const durationSeconds = normalizeRestSeconds(input.durationSeconds);
      if (durationSeconds <= 0) return;

      const previous = activeTimerRef.current;
      await cancelScheduledNotification(previous?.notificationId ?? null);

      const startedAtMs = Date.now();
      completedTimerIdsRef.current.clear();
      setCompletedTimer(null);

      const notificationId = await scheduleRestNotification({
        ...input,
        durationSeconds,
      });

      const timer: ActiveRestTimer = {
        id: generateId(),
        sessionId: input.sessionId ?? null,
        setId: input.setId ?? null,
        exerciseName: input.exerciseName?.trim() || null,
        setIndex: input.setIndex ?? null,
        durationSeconds,
        startedAtMs,
        endsAtMs: startedAtMs + durationSeconds * 1000,
        notificationId,
        source: input.source ?? "manual",
      };

      setNowMs(startedAtMs);
      await persistTimer(timer);
    },
    [persistTimer],
  );

  const cancelRestTimer = useCallback(async () => {
    const timer = activeTimerRef.current;
    await cancelScheduledNotification(timer?.notificationId ?? null);
    setCompletedTimer(null);
    await persistTimer(null);
  }, [persistTimer]);

  const clearCompletedTimer = useCallback(() => {
    setCompletedTimer(null);
  }, []);

  const remainingSeconds = getRemainingSeconds(activeTimer, nowMs);

  const value = useMemo<RestTimerContextValue>(
    () => ({
      activeTimer,
      completedTimer,
      remainingSeconds,
      label: formatRestDuration(remainingSeconds),
      startRestTimer,
      cancelRestTimer,
      clearCompletedTimer,
    }),
    [
      activeTimer,
      cancelRestTimer,
      clearCompletedTimer,
      completedTimer,
      remainingSeconds,
      startRestTimer,
    ],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error("useRestTimer must be used within RestTimerProvider");
  }
  return ctx;
}
