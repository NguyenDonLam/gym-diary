import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Pencil } from "lucide-react-native";
import type { ProgressPoseTrackerViewModel } from "../ui/progress-pose-tracker.mapper";

export type PoseTrackerSelectorProps = {
  trackers: ProgressPoseTrackerViewModel[];
  selectedTrackerId: string | null;
  disabled: boolean;
  isRenaming: boolean;
  renameError: string | null;
  onSelectTracker: (id: string | null) => void;
  onNewPose: () => void;
  onBeginRename: () => void;
  onRenameTracker: (id: string, name: string) => Promise<boolean>;
};

export function PoseTrackerSelector({
  trackers,
  selectedTrackerId,
  disabled,
  isRenaming,
  renameError,

  onBeginRename,
  onRenameTracker,
}: PoseTrackerSelectorProps) {
  const [editing, setEditing] = useState<ProgressPoseTrackerViewModel | null>(
    null,
  );
  const [name, setName] = useState("");
  const selected = trackers.find((tracker) => tracker.id === selectedTrackerId);
  const save = async () => {
    if (!editing?.id || !name.trim() || isRenaming) return;
    if (await onRenameTracker(editing.id, name.trim())) setEditing(null);
  };
  return (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
        {selected?.label ?? "Your poses"}
      </Text>
      {selected ? (
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-xs text-zinc-500 dark:text-zinc-400">
            {selected.photoCount}{" "}
            {selected.photoCount === 1 ? "photo" : "photos"} in this pose
          </Text>
          {selected.id ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Rename ${selected.label}`}
              disabled={disabled}
              onPress={() => {
                onBeginRename();
                setName(selected.label);
                setEditing(selected);
              }}
              className="min-h-11 flex-row items-center gap-1.5 px-2"
            >
              <Pencil size={13} color="#8B5CF6" />
              <Text className="text-xs font-medium text-violet-600 dark:text-violet-300">
                Rename
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Add your first pose to start tracking.
        </Text>
      )}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isRenaming) setEditing(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 items-center justify-center bg-black/50 px-6"
        >
          <View
            accessibilityViewIsModal
            className="w-full max-w-sm rounded-3xl bg-white p-6 dark:bg-[#282A36]"
          >
            <Text className="text-xl font-semibold text-zinc-900 dark:text-white">
              Rename pose
            </Text>
            <Text className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Choose a name like Front, Side, or Back.
            </Text>
            <TextInput
              accessibilityLabel="Pose name"
              autoFocus
              value={name}
              onChangeText={setName}
              maxLength={40}
              editable={!isRenaming}
              returnKeyType="done"
              onSubmitEditing={() => void save()}
              className="mt-5 rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 dark:border-[#6272A4] dark:text-white"
            />
            {!name.trim() ? (
              <Text className="mt-2 text-xs text-red-500">
                Enter a pose name.
              </Text>
            ) : null}
            {renameError ? (
              <Text
                accessibilityRole="alert"
                className="mt-2 text-sm text-red-500"
              >
                {renameError}
              </Text>
            ) : null}
            <View className="mt-5 flex-row justify-end gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={isRenaming}
                onPress={() => setEditing(null)}
                className="min-h-11 justify-center px-4"
              >
                <Text className="font-medium text-zinc-500 dark:text-zinc-300">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!name.trim() || isRenaming}
                onPress={() => void save()}
                style={{ opacity: !name.trim() || isRenaming ? 0.5 : 1 }}
                className="min-h-11 justify-center rounded-xl bg-violet-600 px-5"
              >
                <Text className="font-semibold text-white">
                  {isRenaming ? "Saving…" : "Save name"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
