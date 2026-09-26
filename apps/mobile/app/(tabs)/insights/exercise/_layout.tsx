import React from "react";
import { InsightsDetailStack } from "@/src/navigation/insights-navigation";

export default function ExerciseInsightsLayout() {
  return (
    <InsightsDetailStack
      title="Exercises"
      detailName="[exerciseId]"
      detailTitle="Exercise stats"
      listPath="/(tabs)/insights/exercise"
    />
  );
}
