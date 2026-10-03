/**
 * ExerciseLibraryPicker development page flow:
 * - Keep selected exercise IDs in local state and pass them back as the
 *   picker's initial selection when it renders.
 * - ExerciseLibraryPicker owns its browse/search UI; this page enables
 *   multi-select, exercise creation, usage summaries, and browse-all.
 * - Tapping an exercise logs it without changing the selection here.
 * - Confirming maps selected exercises to IDs, saves those IDs locally,
 *   logs the selection, and displays selected names in an Alert.
 * - Maintenance: Update this docstring with every change to this file;
 *   keep it current with the code.
 */
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
