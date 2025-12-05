// template-folders/components/folder-row.tsx
import React from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Trash2, ChevronDown, ChevronLeft } from "lucide-react-native";

import { useWorkoutTemplates } from "@/src/features/template-workout/hooks/use-workout-template";
import { TemplateColor } from "@/src/features/template-workout/domain/type";
import { templateFolderRepository } from "@/src/features/template-folder/data/repository";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";

const COLOR_STRIP_MAP: Record<TemplateColor, string> = {
  neutral: "bg-neutral-400",
  red: "bg-red-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
};

type TemplateWithFolder = {
  id: string;
  name?: string | null;
  color?: TemplateColor | null;
  folderId?: string | null;
};

type FolderRowProps = {
  folder: TemplateFolder;
};

export default function FolderRow({ folder }: FolderRowProps) {
  const router = useRouter();
  const { templates, deleteTemplate } = useWorkoutTemplates();

  const [open, setOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(folder.name ?? "");

  React.useEffect(() => {
    setRenameValue(folder.name ?? "");
  }, [folder.id, folder.name]);

  const templatesInFolder = React.useMemo(
    () =>
      templates.filter((tpl) => {
        const withFolder = tpl as typeof tpl & TemplateWithFolder;
        return withFolder.folderId === folder.id;
      }),
    [templates, folder.id]
  );

  const count = templatesInFolder.length;

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleStartFromTemplate = (id: string) => {
    console.log("start session from template", id);
  };

  const handleEditTemplate = (id: string) => {
    router.push({
      pathname: "/template-workout/[id]",
      params: { id },
    });
  };

  const handleDeleteTemplate = (id: string, name?: string | null) => {
    Alert.alert("Delete template", `Delete "${name ?? ""}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTemplate(id).catch((err) => {
            console.error("Failed to delete template", err);
          });
        },
      },
    ]);
  };

  const handleDeleteFolder = () => {
    Alert.alert(
      "Delete folder",
      folder.name ? `Delete folder "${folder.name}"?` : "Delete this folder?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // You need corresponding methods on the repository:
              // await templateFolderRepository.delete(folder.id);
              await templateFolderRepository.delete(folder.id);
            } catch (err) {
              console.error("Failed to delete folder", err);
            }
          },
        },
      ]
    );
  };

  const handleRenameSave = async () => {
    const next = renameValue.trim();
    if (!next) {
      setRenaming(false);
      setRenameValue(folder.name ?? "");
      return;
    }

    try {
        // TODO: use proper method
    //   await templateFolderRepository.rename(folder.id, next);
    } catch (err) {
      console.error("Failed to rename folder", err);
    } finally {
      setRenaming(false);
    }
  };

  const handleFolderActions = () => {
    Alert.alert(folder.name || "Folder", undefined, [
      { text: "Rename", onPress: () => setRenaming(true) },
      { text: "Delete", style: "destructive", onPress: handleDeleteFolder },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderTemplateItem = (tpl: any) => {
    const color = (tpl.color as TemplateColor) ?? "neutral";
    const stripClass = COLOR_STRIP_MAP[color];

    return (
      <Pressable
        key={tpl.id}
        className="mb-2 rounded-xl bg-neutral-50 px-3 py-2"
        onPress={() => handleStartFromTemplate(tpl.id)}
        onLongPress={() => handleEditTemplate(tpl.id)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className={`mr-3 h-7 w-1 rounded-full ${stripClass}`} />
            <View className="shrink">
              <Text className="text-[15px] font-semibold text-neutral-900">
                {tpl.name}
              </Text>
              <Text className="mt-0.5 text-[11px] text-neutral-500">
                Tap to start · long-press to edit
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => handleDeleteTemplate(tpl.id, tpl.name)}
            hitSlop={8}
          >
            <Trash2 width={16} height={16} color="#9CA3AF" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="mb-2">
      {/* Folder header row */}
      <View className="flex-row items-center justify-between py-2">
        <Pressable
          className="flex-row items-center flex-1 pr-2"
          onPress={toggleOpen}
        >
          <Text
            className="text-[13px] font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {folder.name}
          </Text>
        </Pressable>

        <View className="flex-row items-center">
          <Pressable onPress={handleFolderActions} hitSlop={8} className="mr-1">
            <Text className="text-[18px] text-neutral-400">⋯</Text>
          </Pressable>
          {open ? (
            <ChevronDown width={16} height={16} color="#6B7280" />
          ) : (
            <ChevronLeft width={16} height={16} color="#6B7280" />
          )}
        </View>
      </View>

      {/* Inline rename row */}
      {renaming && (
        <View className="mb-2 flex-row items-center pl-2">
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
          <Pressable onPress={handleRenameSave} className="ml-1 px-2 py-1">
            <Text className="text-[12px] font-semibold text-neutral-900">
              Save
            </Text>
          </Pressable>
        </View>
      )}

      {/* Templates list inside folder */}
      {open && (
        <View className="mt-1 pl-2">
          {templatesInFolder.length > 0 ? (
            <ScrollView
              nestedScrollEnabled
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {templatesInFolder.map((tpl) => renderTemplateItem(tpl))}
            </ScrollView>
          ) : (
            <Text className="mt-1 text-[12px] text-neutral-500">
              No templates in this folder.
            </Text>
          )}
          <Text className="mt-0.5 text-[10px] text-neutral-400">
            {count} template{count === 1 ? "" : "s"}
          </Text>
        </View>
      )}
    </View>
  );
}
