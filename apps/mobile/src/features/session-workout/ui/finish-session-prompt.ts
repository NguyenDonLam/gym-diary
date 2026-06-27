import { Alert } from "react-native";

import type {
  EndSessionProgramAction,
  FinishProgramDraftRoute,
  FinishProgramSavePrompt,
} from "../hooks/use-ongoing-session";

export type FinishSessionResult = {
  action: EndSessionProgramAction;
  draft: FinishProgramDraftRoute | null;
};

type ConfirmFinishSessionInput = {
  getPrompt: () => Promise<FinishProgramSavePrompt>;
  createProgramDraft?: (
    action: Exclude<EndSessionProgramAction, "none">,
  ) => Promise<FinishProgramDraftRoute | null>;
  finish: () => Promise<void>;
  onFinished?: (result: FinishSessionResult) => void | Promise<void>;
  onError?: (error: unknown) => void;
};

async function runFinish(
  input: ConfirmFinishSessionInput,
  action: EndSessionProgramAction,
) {
  try {
    const draft =
      action === "none"
        ? null
        : (await input.createProgramDraft?.(action)) ?? null;

    await input.finish();
    await input.onFinished?.({ action, draft });
  } catch (error) {
    input.onError?.(error);
  }
}

export async function confirmFinishSession(input: ConfirmFinishSessionInput) {
  const prompt = await input.getPrompt();

  if (prompt.kind === "one-off") {
    Alert.alert(
      "Save as a program?",
      "Turn this one-off session into a recurring program you can run again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Finish only",
          onPress: () => void runFinish(input, "none"),
        },
        {
          text: "Review program",
          onPress: () => void runFinish(input, "save-as-new-program"),
        },
      ],
      { cancelable: true },
    );
    return;
  }

  if (prompt.kind === "program-changed") {
    Alert.alert(
      "Save program changes?",
      `"${prompt.programName}" changed during this session. Open the program form with those changes prefilled.`,
      [
        {
          text: "Finish only",
          onPress: () => void runFinish(input, "none"),
        },
        {
          text: "Review new",
          onPress: () => void runFinish(input, "save-as-new-program"),
        },
        {
          text: "Review update",
          onPress: () => void runFinish(input, "update-source-program"),
        },
      ],
      { cancelable: true },
    );
    return;
  }

  await runFinish(input, "none");
}
