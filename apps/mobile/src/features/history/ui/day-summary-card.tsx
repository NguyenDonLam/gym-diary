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

type Props = {
  selectedDateKey: string;
  sessions: SessionWorkout[];
  onSessionPress?: (session: SessionWorkout) => void;
  onSessionDeletePress?: (session: SessionWorkout) => void;

  // optional: lets parent cap the list height
  maxListHeight?: number;
};

export const DaySummaryCard = memo(function DaySummaryCard({
  selectedDateKey,
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
      <View className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
              Selected day
            </Text>
            <Text className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedDateKey}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View className={`h-3 w-3 rounded-full ${chipClass}`} />
            <View className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>

        {primary ? (
          <View className="mt-2">
            <Text className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
              {primary.name ?? "Session"}
            </Text>

            <View className="mt-1 flex-row gap-2">
              <View className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                  {duration}
                </Text>
              </View>

              <View className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Text className="text-[11px] text-emerald-800 dark:text-emerald-200">
                  completed
                </Text>
              </View>

              {sessions.length > 1 && (
                <View className="px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Text className="text-[11px] text-zinc-700 dark:text-zinc-200">
                    +{sessions.length - 1} more
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="mt-2">
            <Text className="text-[13px] text-zinc-700 dark:text-zinc-300">
              No session logged.
            </Text>
          </View>
        )}
      </View>

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
                  onPress={() => onSessionPress?.(s)}
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
