// src/features/session-workout/hooks/use-ongoing-session.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SessionWorkout } from "../domain/types";

const STORAGE_KEY = "ongoing_session";

type OngoingSessionState = {
  ongoing: SessionWorkout | null;
  setOngoing: (session: SessionWorkout) => Promise<void>;
  clearOngoing: () => Promise<void>;
};

const OngoingSessionContext = createContext<OngoingSessionState | null>(null);

export function OngoingSessionProvider({ children }: { children: ReactNode }) {
  const [ongoing, setOngoingState] = useState<SessionWorkout | null>(null);

  // initial load
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (!cancelled) setOngoingState(null);
          return;
        }

        const parsed = JSON.parse(raw) as SessionWorkout;
        if (!cancelled) setOngoingState(parsed);
      } catch (e) {
        console.warn("[ongoing-session] load failed", e);
        if (!cancelled) setOngoingState(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setOngoing = async (session: SessionWorkout) => {
    setOngoingState(session);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn("[ongoing-session] persist failed", e);
    }
  };

  const clearOngoing = async () => {
    setOngoingState(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("[ongoing-session] clear failed", e);
    }
  };

  return (
    <OngoingSessionContext.Provider
      value={{
        ongoing,
        setOngoing,
        clearOngoing,
      }}
    >
      {children}
    </OngoingSessionContext.Provider>
  );
}

export function useOngoingSession() {
  const ctx = useContext(OngoingSessionContext);
  if (!ctx) {
    throw new Error(
      "useOngoingSession must be used within OngoingSessionProvider"
    );
  }
  return ctx;
}
