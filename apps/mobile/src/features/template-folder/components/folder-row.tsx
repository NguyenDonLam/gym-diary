// src/features/template-folders/components/folder-row.tsx
import React from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";

type FolderRowProps = {
  folder: TemplateFolder;
  templateCount: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  onRenameFolder: (newName: string) => Promise<void> | void;
  onDeleteFolder: () => void;
  onCreateTemplateInFolder: () => void;
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(folder.name ?? "");

  React.useEffect(() => {
    setRenameValue(folder.name ?? "");
  }, [folder.id, folder.name]);

  const cancelRename = () => {
    setRenaming(false);
    setRenameValue(folder.name ?? "");
  };

  const saveRename = async () => {
    const next = renameValue.trim();
    if (!next) return cancelRename();

    try {
      await onRenameFolder(next);
    } finally {
      setRenaming(false);
    }
  };

  const openActions = () => {
    Alert.alert(folder.name || "Folder", undefined, [
      { text: "New template here", onPress: onCreateTemplateInFolder },
      { text: "Rename", onPress: () => setRenaming(true) },
      { text: "Delete", style: "destructive", onPress: onDeleteFolder },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const titleText = isDark ? "text-neutral-50" : "text-neutral-900";
  const subText = isDark ? "text-neutral-400" : "text-neutral-500";
  const inputText = isDark ? "text-neutral-50" : "text-neutral-900";
  const inputBg = isDark ? "bg-neutral-900" : "bg-white";
  const inputBorder = isDark ? "border-neutral-700" : "border-neutral-300";
  const iconColor = isDark ? "#9CA3AF" : "#6B7280";

  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between py-2">
        <Pressable className="flex-1 pr-2" onPress={onToggleOpen}>
          <Text
            className={`text-[13px] font-semibold ${titleText}`}
            numberOfLines={1}
          >
            {folder.name}
          </Text>
          <Text className={`mt-0.5 text-[11px] ${subText}`}>
            {templateCount} template{templateCount === 1 ? "" : "s"}
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Pressable onPress={openActions} hitSlop={8} className="mr-1">
            <Text className={`text-[18px] ${subText}`}>⋯</Text>
          </Pressable>
          {isOpen ? (
            <ChevronDown width={16} height={16} color={iconColor} />
          ) : (
            <ChevronLeft width={16} height={16} color={iconColor} />
          )}
        </View>
      </View>

      {renaming && (
        <View className="mb-2 flex-row items-center">
          <TextInput
            className={`flex-1 rounded-lg border px-3 py-1.5 text-[13px] ${inputText} ${inputBg} ${inputBorder}`}
            placeholder="Folder name"
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            value={renameValue}
            onChangeText={setRenameValue}
            autoFocus
          />

          <Pressable onPress={cancelRename} className="ml-2 px-2 py-1">
            <Text className={`text-[12px] ${subText}`}>Cancel</Text>
          </Pressable>

          <Pressable onPress={saveRename} className="ml-1 px-2 py-1">
            <Text className={`text-[12px] font-semibold ${titleText}`}>
              Save
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
