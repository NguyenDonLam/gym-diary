// src/features/template-folders/components/folder-row.tsx
import React from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";

type FolderRowProps = {
  folder: TemplateFolder;
  templateCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onRenameFolder: (newName: string) => Promise<void> | void;
  onDeleteFolder: () => void;
  onCreateTemplateInFolder: () => void; // create directly in this folder
};

export default function FolderRow({
  folder,
  templateCount,
  isOpen,
  onToggleOpen,
  onRenameFolder,
  onDeleteFolder,
  onCreateTemplateInFolder,
}: FolderRowProps) {
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(folder.name ?? "");

  React.useEffect(() => {
    setRenameValue(folder.name ?? "");
  }, [folder.id, folder.name]);

  const handleSave = async () => {
    const next = renameValue.trim();
    if (!next) {
      setRenaming(false);
      setRenameValue(folder.name ?? "");
      return;
    }

    try {
      await onRenameFolder(next);
    } finally {
      setRenaming(false);
    }
  };

  const openActions = () => {
    Alert.alert(folder.name || "Folder", undefined, [
      {
        text: "New template here",
        onPress: onCreateTemplateInFolder,
      },
      { text: "Rename", onPress: () => setRenaming(true) },
      {
        text: "Delete",
        style: "destructive",
        onPress: onDeleteFolder,
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View className="mb-2">
      {/* Header */}
      <View className="flex-row items-center justify-between py-2">
        <Pressable className="flex-1 pr-2" onPress={onToggleOpen}>
          <Text
            className="text-[13px] font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Text className="mt-0.5 text-[11px] text-neutral-500">
            {templateCount} template{templateCount === 1 ? "" : "s"}
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Pressable onPress={openActions} hitSlop={8} className="mr-1">
            <Text className="text-[18px] text-neutral-400">⋯</Text>
          </Pressable>
          {isOpen ? (
            <ChevronDown width={16} height={16} color="#6B7280" />
          ) : (
            <ChevronLeft width={16} height={16} color="#6B7280" />
          )}
        </View>
      </View>

      {/* Inline rename row */}
      {renaming && (
        <View className="mb-2 flex-row items-center">
          <TextInput
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] text-neutral-900"
            placeholder="Folder name"
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
          />
          <Pressable
            onPress={() => {
              setRenaming(false);
              setRenameValue(folder.name ?? "");
            }}
            className="ml-2 px-2 py-1"
          >
            <Text className="text-[12px] text-neutral-500">Cancel</Text>
          </Pressable>
          <Pressable onPress={handleSave} className="ml-1 px-2 py-1">
            <Text className="text-[12px] font-semibold text-neutral-900">
              Save
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
