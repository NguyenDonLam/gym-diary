import React, { useState } from "react";
import { Alert, SafeAreaView, Text, View } from "react-native";

import ExerciseLibraryPicker from "@/src/features/exercise/components/exercise-library-picker";

export default function TestExerciseLibraryPickerPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
      <ExerciseLibraryPicker
        mode="multi-select"
        initialSelectedIds={selectedIds}
        confirmLabel="Confirm selection"
        allowCreate
        showUsageSummary
        showBrowseAll
        onPressExercise={(exercise) => {
          console.log("Pressed exercise:", exercise);
        }}
        onConfirmSelection={(selected) => {
          const ids = selected.map((item) => item.id);
          setSelectedIds(ids);

          console.log("Confirmed selection:", selected);

          Alert.alert(
            "Selected exercises",
            selected.length > 0
              ? selected.map((item) => item.name).join(", ")
              : "None selected",
          );
        }}
      />
  );
}
