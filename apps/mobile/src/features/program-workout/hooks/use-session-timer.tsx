// src/features/program-workout/hooks/use-session-timer.ts
import { useEffect, useState } from "react";

function formatElapsed(totalSeconds: number): string {
  if (totalSeconds < 0 || Number.isNaN(totalSeconds)) return "00:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = seconds.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * startMs: session.startedAt in ms.
 * If null/undefined, label is "00:00". Interval always runs.
 */
export function useSessionTimer(startMs: number | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  // interval independent of startMs
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (!startMs) {
    return {
      seconds: 0,
      label: "00:00",
    };
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - startMs) / 1000));
  return {
    seconds: elapsedSeconds,
    label: formatElapsed(elapsedSeconds),
  };
}
