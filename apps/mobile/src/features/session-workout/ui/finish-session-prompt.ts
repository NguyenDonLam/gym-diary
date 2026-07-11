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
      "Save this session as a program?",
      "Create a reusable program from this session, or finish without saving it as a program.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Finish without saving",
          onPress: () => void runFinish(input, "none"),
        },
        {
          text: "Create program",
          onPress: () => void runFinish(input, "save-as-new-program"),
        },
      ],
      { cancelable: true },
    );
    return;
  }

  if (prompt.kind === "program-changed") {
    Alert.alert(
      "Keep added sets?",
      `You added new sets to "${prompt.programName}" during this session. Choose how to save them.`,
      [
        {
          text: "Finish without saving",
          onPress: () => void runFinish(input, "none"),
        },
        {
          text: "Save as new program",
          onPress: () => void runFinish(input, "save-as-new-program"),
        },
        {
          text: "Update current program",
          onPress: () => void runFinish(input, "update-source-program"),
        },
      ],
      { cancelable: true },
    );
    return;
  }

  await runFinish(input, "none");
}
