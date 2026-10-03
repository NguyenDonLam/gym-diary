import React from "react";
import { InsightsDetailStack } from "@/src/navigation/insights-navigation";

export default function ProgramInsightsLayout() {
  return (
    <InsightsDetailStack
      title="Programs"
      detailName="[programId]"
      detailTitle="Program stats"
      listPath="/(tabs)/insights/program"
    />
  );
}
