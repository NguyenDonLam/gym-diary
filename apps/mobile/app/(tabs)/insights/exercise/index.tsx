/**
 * Insights exercise selection flow:
 * - Render ExerciseLibraryPicker in browse mode; the picker owns exercise
 *   loading, search ranking, usage summaries, and empty-state display.
 * - Enable browse-all and pass the page's title, subtitle, and empty text.
 * - When an exercise is pressed, take its ID and replace this route with
 *   /(tabs)/insights/exercise/[exerciseId] for its statistics.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
import React, { useCallback } from "react";
import { router } from "expo-router";

import type { Exercise } from "@gym-diary/exercise/type";
import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";

export default function InsightsExerciseIndexScreen() {
  const openExercise = useCallback((exercise: Exercise) => {
    router.replace({
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
