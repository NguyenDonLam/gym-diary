// app/(tabs)/insights/exercise/index.tsx
import React, { useCallback } from "react";
import { router } from "expo-router";

import type { Exercise } from "@packages/exercise/type";
import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";

export default function InsightsExerciseIndexScreen() {
  const openExercise = useCallback((exercise: Exercise) => {
    router.push({
      pathname: "/(tabs)/insights/exercise/[exerciseId]",
      params: { exerciseId: exercise.id },
    });
  }, []);

  return (
    <ExerciseLibraryPicker
      title="Exercise"
      subtitle="Search is ranked by relevance, recency, and usage"
      mode="browse"
      showUsageSummary
      showBrowseAll
      emptyTitle="No exercises"
      emptySubtitle="Log a session first, then come back."
      onPressExercise={openExercise}
    />
  );
}
