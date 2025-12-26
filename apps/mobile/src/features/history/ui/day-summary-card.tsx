// src/features/history/components/day-summary-card.tsx
import React, { memo, useMemo } from "react";
import { View, Text, ScrollView } from "react-native";

import type { SessionWorkout } from "@/src/features/session-workout/domain/types";
import {
  COLOR_STRIP_MAP,
  type ProgramColor,
} from "@/src/features/program-workout/domain/type";

import { formatDuration, minutesBetween } from "../ui/date";
import { SessionRow } from "../components/session-row";
import { router } from "expo-router";

type Props = {
  selectedDateKey: string;
  sessions: SessionWorkout[];
  onSessionPress?: (session: SessionWorkout) => void;
  onSessionDeletePress?: (session: SessionWorkout) => void;

  // optional: lets parent cap the list height
  maxListHeight?: number;
};

export const DaySummaryCard = memo(function DaySummaryCard({
  sessions,
  onSessionPress,
  onSessionDeletePress,
  maxListHeight = 320,
}: Props) {
  const primary = sessions[0] ?? null;

  const duration = useMemo(() => {
    if (!primary?.endedAt) return "—";
    return formatDuration(minutesBetween(primary.startedAt, primary.endedAt));
  }, [primary]);

  const chipColor = (primary?.sourceProgram?.color ??
    null) as ProgramColor | null;

  const chipClass = chipColor
    ? COLOR_STRIP_MAP[chipColor]
    : "bg-zinc-300 dark:bg-zinc-700";

  return (
    <View>
      {sessions.length > 0 && (
        <View className="mt-1">
          <Text className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Sessions
          </Text>

          <View style={{ maxHeight: maxListHeight }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 0 }}
              nestedScrollEnabled
            >
              {sessions.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onPress={() => router.push(`/session-workout/${s.id}`)}
                  onDeletePress={
                    onSessionDeletePress
                      ? () => onSessionDeletePress(s)
                      : undefined
                  }
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
});
