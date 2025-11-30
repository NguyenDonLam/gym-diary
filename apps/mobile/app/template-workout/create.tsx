import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { TemplateWorkout, TemplateWorkoutFormData } from "@/src/features/template-workout/domain/type";
import TemplateWorkoutForm from "@/src/features/template-workout/ui/form";
import { TemplateSet, TemplateSetFormData } from "@/src/features/template-set/domain/type";
import { TemplateExercise, TemplateExerciseFormData } from "@/src/features/template-exercise/domain/type";
import { Exercise } from "@/src/features/exercise/domain/types";

export default function TemplateWorkoutCreate() {
  const router = useRouter();

  const [formData, setFormData] = useState<TemplateWorkoutFormData>({
    name: "",
    description: "",
    exercises: [],
  });

  const [isSaving, setIsSaving] = useState(false);

  const canSave = formData.name.trim().length > 0 && !isSaving;

  const handleCancel = () => {
    if (isSaving) return;
    router.back();
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const now = new Date();

    //   const template = await formToDomainTemplate(formData, {
    //     exerciseRepo,
    //     idGen: uuidv4, // or whatever you use
    //     now,
    //   });

    //   await workoutTemplateRepository.save(template);

      router.back();
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar */}
      <View className="flex-row items-center justify-between border-b border-neutral-200 px-4 py-3">
        <Pressable onPress={handleCancel} disabled={isSaving}>
          <Text className="text-sm text-neutral-500">Cancel</Text>
        </Pressable>

        <Text className="text-base font-semibold text-neutral-900">
          New template
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-full px-3 py-1.5 ${
            canSave ? "bg-black" : "bg-neutral-300"
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              canSave ? "text-white" : "text-neutral-500"
            }`}
          >
            Save
          </Text>
        </Pressable>
      </View>

      {/* Form body */}
      <TemplateWorkoutForm formData={formData} setFormData={setFormData} />
    </SafeAreaView>
  );
}

function parseNumberOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export async function formToDomainTemplate(
  form: TemplateWorkoutFormData,
  opts: {
    exerciseRepo: any; // TODO: exerciseRepository here
    idGen: () => string;
    now: Date;
  }
): Promise<TemplateWorkout> {
  const { exerciseRepo, idGen, now } = opts;

  const templateId = idGen();

  const exercises: TemplateExercise[] = [];
  for (let exIndex = 0; exIndex < form.exercises.length; exIndex++) {
    const ex: TemplateExerciseFormData = form.exercises[exIndex];

    let canonicalExerciseId = ex.exerciseId;
    if (!canonicalExerciseId) {
      // user typed a new exercise name → create canonical exercise
      const created: Exercise = await exerciseRepo.create({
        name: ex.name.trim(),
      });
      canonicalExerciseId = created.id;
    }

    const templateExerciseId = ex.id || idGen();

    const sets: TemplateSet[] = ex.sets.map(
      (s: TemplateSetFormData, setIndex: number) => ({
        id: s.id || idGen(),
        templateExerciseId,
        orderIndex: setIndex,
        targetReps: parseNumberOrNull(s.reps),
        targetWeight: parseNumberOrNull(s.weight),
        targetRpe: parseNumberOrNull(s.rpe),
        notes: null,
        createdAt: now,
        updatedAt: now,
      })
    );

    exercises.push({
      id: templateExerciseId,
      exerciseId: canonicalExerciseId, // always string now
      orderIndex: exIndex,
      notes: null,
      sets,
    });
  }

  return {
    id: templateId,
    name: form.name.trim(),
    description: form.description.trim() || null,
    createdAt: now,
    updatedAt: now,
    exercises,
  };
}
