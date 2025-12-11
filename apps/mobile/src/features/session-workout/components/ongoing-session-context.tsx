// src/features/session-workout/context/ongoing-session.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ongoing";

type OngoingSessionContextValue = {
  ongoingId: string | null;
  setOngoingId: (id: string | null) => Promise<void>;
};

const OngoingSessionContext = createContext<OngoingSessionContextValue | null>(
  null
);

export function OngoingSessionProvider({ children }: { children: React.ReactNode }) {
  const [ongoingId, setOngoingIdState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(KEY);
        if (!cancelled) setOngoingIdState(stored ?? null);
      } catch (e) {
        console.warn("[ongoing-session] failed to load", e);
        if (!cancelled) setOngoingIdState(null);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const setOngoingId = async (id: string | null) => {
    setOngoingIdState(id);
    try {
      if (id) {
        await AsyncStorage.setItem(KEY, id);
      } else {
        await AsyncStorage.removeItem(KEY);
      }
    } catch (e) {
      console.warn("[ongoing-session] failed to persist", e);
    }
  };

  return (
    <OngoingSessionContext.Provider value={{ ongoingId, setOngoingId }}>
      {children}
    </OngoingSessionContext.Provider>
  );
}

export function useOngoingSession() {
  const ctx = useContext(OngoingSessionContext);
  if (!ctx) throw new Error("useOngoingSession must be used within OngoingSessionProvider");
  return ctx;
}
