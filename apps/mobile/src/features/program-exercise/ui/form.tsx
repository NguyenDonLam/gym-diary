import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View, ScrollView } from "react-native";
import { ExerciseProgramFormData } from "../domain/type";
import { SetProgramFormData } from "../../program-set/domain/type";
import { useExercises } from "../../exercise/hooks/use-exercises";
import SetProgramForm from "@/src/features/program-set/ui/form";
import { Exercise } from "@packages/exercise";
import { GripVertical, X, Plus, Check, Search, ChevronDown, ChevronUp } from "lucide-react-native";
import { useColorScheme } from "nativewind";

type ExerciseProgramFormProps = {
  formData: ExerciseProgramFormData;
  index: number;
  setFormData: (next: ExerciseProgramFormData) => void;
  onRemove: () => void;
  onDrag?: () => void;
};

async function createExercise(name: string): Promise<Exercise> {
  throw new Error("createExercise(name: string) is not implemented yet.");
}

export default function ExerciseProgramForm({
  formData,
  index,
  setFormData,
  onRemove,
  onDrag,
}: ExerciseProgramFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const { options: exerciseOptions } = useExercises();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  // greys — no pure black/white
  const bgCard = isDark ? "bg-neutral-800" : "bg-white";
  const borderCard = isDark ? "border-neutral-700" : "border-neutral-200";

  const bgDropdown = isDark ? "bg-neutral-800" : "bg-neutral-50";
  const borderDropdown = isDark ? "border-neutral-700" : "border-neutral-200";

  const txtMain = isDark ? "text-neutral-100" : "text-neutral-900";
  const txtSoft = isDark ? "text-neutral-400" : "text-neutral-500";

  const btnGrey = isDark ? "bg-neutral-700" : "bg-neutral-100";
  const btnDark = isDark ? "bg-neutral-200" : "bg-neutral-900";
  const btnDarkText = isDark ? "text-neutral-900" : "text-white";

  const update = (patch: Partial<ExerciseProgramFormData>) =>
    setFormData({ ...formData, ...patch });

  const selectedExercise = useMemo(
    () =>
      formData.exerciseId
        ? (exerciseOptions.find((opt) => opt.id === formData.exerciseId) ??
          null)
        : null,
    [exerciseOptions, formData.exerciseId]
  );

  // sets
  const addSet = () => {
    update({
      sets: [
        ...formData.sets,
        {
          id: Math.random().toString(36).slice(2),
          reps: "",
          loadValue: "",
          loadUnit: "kg",
          rpe: "",
        },
      ],
    });
  };

  const applyPreset = (count: number, reps: number) => {
    update({
      sets: Array.from({ length: count }).map(() => ({
        id: Math.random().toString(36).slice(2),
        reps: String(reps),
        loadValue: "",
        loadUnit: "kg",
        rpe: "",
      })),
    });
  };

  const removeSet = (setId: string) => {
    update({
      sets: formData.sets.filter((s) => s.id !== setId),
    });
  };

  const query = pickerSearch.trim().toLowerCase();
  const matches =
    pickerOpen && exerciseOptions.length > 0
      ? exerciseOptions
          .filter((opt) =>
            query ? opt.name.toLowerCase().includes(query) : true
          )
          .slice(0, 100)
      : [];

  const selectExerciseOption = (option: Exercise) => {
    update({ exerciseId: option.id });
    setPickerOpen(false);
    setPickerSearch("");
  };

  const selectorLabel = selectedExercise?.name ?? "Select exercise";

  const getInitial = (opt: Exercise) => {
    const trimmed = opt.name.trim();
    return trimmed ? trimmed[0]!.toUpperCase() : "?";
  };

  return (
    <View
      className={`mb-3 rounded-2xl px-3 py-3 border ${bgCard} ${borderCard}`}
      style={{
        overflow: "visible",
        zIndex: pickerOpen ? 20 : 0,
        elevation: pickerOpen ? 20 : 0,
      }}
    >
      <View className="mb-2 flex-row items-center justify-between">
        {onDrag ? (
          <Pressable
            onLongPress={onDrag}
            delayLongPress={120}
            hitSlop={8}
            className={`mr-2 h-7 w-7 items-center justify-center rounded-full ${btnGrey}`}
          >
            <GripVertical size={16} color={txtSoft} />
          </Pressable>
        ) : (
          <View className="mr-2 h-7 w-7" />
        )}

        <Pressable
          onPress={onRemove}
          className={`h-7 w-7 items-center justify-center rounded-full bg-red-100 dark:bg-red-900`}
        >
          <X size={14} color={isDark ? "#FCA5A5" : "#DC2626"} />
        </Pressable>
      </View>

      {/* Selector */}
      <View className="relative z-10">
        <Pressable
          className={`flex-row items-center justify-between rounded-xl px-3 py-2 border ${borderCard} ${bgCard}`}
          onPress={() => setPickerOpen((prev) => !prev)}
        >
          <Text
            className={`flex-1 text-[12px] ${
              selectedExercise ? txtMain : txtSoft
            }`}
            numberOfLines={1}
          >
            {selectorLabel}
          </Text>
          {!pickerOpen ? (
            <ChevronDown size={14} color={txtSoft} />
          ) : (
            <ChevronUp size={14} color={txtSoft} />
          )}
        </Pressable>

        {pickerOpen && (
          <View

            className={`mt-2 rounded-xl border ${borderDropdown} ${bgDropdown}`}
            style={{ zIndex: 30, elevation: 30 }}
          >
            {/* Search */}
            <View
              className={`flex-row items-center border-b px-2 py-1.5 ${borderDropdown}`}
            >
              <Search size={14} color={txtSoft} />
              <TextInput
                className={`flex-1 ml-2 rounded-lg px-2 py-1.5 text-xs ${txtMain} border ${borderDropdown} ${bgDropdown}`}
                placeholder=""
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                value={pickerSearch}
                onChangeText={setPickerSearch}
              />
            </View>

            {/* List */}
            <View className="max-h-72">
              {matches.length === 0 ? (
                <View className="px-3 py-3">
                  <Text className="text-[11px] text-neutral-500">
                    No exercises found
                  </Text>
                </View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {matches.map((opt) => {
                    const isSelected = opt.id === formData.exerciseId;

                    return (
                      <Pressable
                        key={opt.id}
                        onPress={() => selectExerciseOption(opt)}
                        className={`mx-2 mb-1 flex-row items-center rounded-xl px-2 py-1.5 ${
                          isSelected ? "bg-neutral-900 dark:bg-neutral-700" : ""
                        }`}
                      >
                        <View
                          className={`mr-2 h-7 w-7 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-neutral-800"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                          numberOfLines={1}
                        >
                          <Text
                            className={`text-[11px] font-semibold ${
                              isSelected
                                ? "text-white"
                                : "text-neutral-700 dark:text-neutral-300"
                            }`}
                          >
                            {initial}
                          </Text>
                        </View>

                        <Text
                          className={`flex-1 text-[12px] ${
                            isSelected ? "text-white" : txtMain
                          }`}
                          numberOfLines={1}
                        >
                          {opt.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <View className="h-2" />
                </ScrollView>
              )}
            </View>

            {/* Create new */}
            <View className={`border-t px-2 py-2 ${borderDropdown}`}>
              {!creatingNew ? (
                <Pressable
                  onPress={startCreateNew}
                  className={`h-7 w-7 items-center justify-center rounded-full ${btnDark}`}
                >
                  <Plus size={14} color={btnDarkText} />
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${txtMain} ${borderDropdown} ${bgDropdown}`}
                    placeholder=""
                    placeholderTextColor={txtSoft}
                    value={newExerciseName}
                    onChangeText={setNewExerciseName}
                  />

                  <Pressable
                    onPress={cancelCreateNew}
                    disabled={isCreating}
                    className={`h-7 w-7 items-center justify-center rounded-full ${btnGrey}`}
                  >
                    <X size={12} color={txtSoft} />
                  </Pressable>

                  <Pressable
                    onPress={handleCreateNew}
                    disabled={isCreating || !newExerciseName.trim()}
                    className={`h-7 w-7 items-center justify-center rounded-full ${btnDark}`}
                  >
                    <Check size={14} color={btnDarkText} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Presets */}
      {formData.sets.length === 0 && (
        <View className="mt-3 flex-row flex-wrap gap-2">
          {[1, 2, 3].map((count) => (
            <Pressable
              key={count}
              className="rounded-full px-3 py-1 bg-neutral-900 dark:bg-neutral-200"
              onPress={() =>
                applyPreset(count, count === 1 ? 8 : count === 2 ? 10 : 12)
              }
            >
              <Text className={`text-[11px] font-semibold ${btnDarkText}`}>
                {count}×{count === 1 ? 8 : count === 2 ? 10 : 12}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Sets list */}
      {formData.sets.map((s, setIndex) => (
        <SetProgramForm
          key={s.id}
          formData={s}
          index={setIndex}
          setFormData={(next) =>
            update({
              sets: formData.sets.map((curr) =>
                curr.id === s.id ? next : curr
              ),
            })
          }
          onRemove={() => removeSet(s.id)}
        />
      ))}

      {/* Add Set */}
      <Pressable
        className={`mt-2 h-7 w-7 items-center justify-center self-end rounded-full ${btnDark}`}
        onPress={addSet}
      >
        <Plus size={14} color={btnDarkText} />
      </Pressable>
    </View>
  );
}
