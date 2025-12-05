import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Trash2, ChevronDown, ChevronLeft } from "lucide-react-native";

import { useWorkoutTemplates } from "@/src/features/template-workout/hooks/use-workout-template";
import { TemplateColor } from "@/src/features/template-workout/domain/type";
import { templateFolderRepository } from "@/src/features/template-folder/data/repository";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";
import FolderRow from "@/src/features/template-folder/components/folder-row";


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

export default function Workout() {
  const router = useRouter();
  const { templates, deleteTemplate } = useWorkoutTemplates();

  const [folders, setFolders] = React.useState<TemplateFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = React.useState(true);
  const [foldersError, setFoldersError] = React.useState<Error | null>(null);

  // only used for "All templates"
  const [openSections, setOpenSections] = React.useState<string[]>(["all"]);

  // create-folder UI state
  const [creatingFolder, setCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");

  const isOpen = React.useCallback(
    (key: string) => openSections.includes(key),
    [openSections]
  );

  const toggleSection = React.useCallback((key: string) => {
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const loadFolders = React.useCallback(async () => {
    setFoldersLoading(true);
    setFoldersError(null);
    try {
      const all = await templateFolderRepository.getAll();
      setFolders(all);
    } catch (e) {
      setFoldersError(
        e instanceof Error ? e : new Error("Failed to load folders")
      );
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleStartFromTemplate = (id: string) => {
    console.log("start session from template", id);
  };

  const handleEditTemplate = (id: string) => {
    router.push({
      pathname: "/template-workout/[id]",
      params: { id },
    });
  };

  const handleCreateTemplate = () => {
    router.push("/template-workout/new");
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert("Delete template", `Delete "${name}"?`, [
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

  // ask for folder name inline, then persist via repository.create
  const startCreateFolder = () => {
    setCreatingFolder(true);
    setNewFolderName("");
  };

  const confirmCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setCreatingFolder(false);
      setNewFolderName("");
      return;
    }

    try {
      const folder = await templateFolderRepository.create(name);
      setFolders((prev) => [...prev, folder]);
    } catch (err) {
      console.error("Failed to create folder", err);
    } finally {
      setCreatingFolder(false);
      setNewFolderName("");
    }
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
            onPress={() => handleDeleteTemplate(tpl.id, tpl.name ?? "")}
            hitSlop={8}
          >
            <Trash2 width={16} height={16} color="#9CA3AF" />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-3 pb-1">
          <Text className="text-lg font-bold text-neutral-900">
            Session templates
          </Text>
          <Text className="mt-1 text-xs text-neutral-700">
            Tap template to start. Long-press to edit.
          </Text>
          <Text className="mt-0.5 text-xs text-neutral-500">
            Total: {templates.length}
          </Text>

          <View className="mt-2 flex-row justify-between">
            <Pressable
              className="rounded-full px-3 py-1.5 bg-neutral-900"
              onPress={handleCreateTemplate}
            >
              <Text className="text-[13px] font-semibold text-white">
                New template
              </Text>
            </Pressable>

            <Pressable
              className="rounded-full px-3 py-1.5 bg-neutral-100"
              onPress={startCreateFolder}
            >
              <Text className="text-[13px] font-semibold text-neutral-900">
                New folder
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Collapsible sections – "All" here, folders handled by FolderRow */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* All templates section */}
          <View className="mb-3">
            <Pressable
              className="flex-row items-center justify-between py-2"
              onPress={() => toggleSection("all")}
            >
              <View>
                <Text className="text-[13px] font-semibold text-neutral-900">
                  All templates
                </Text>
              </View>
              {isOpen("all") ? (
                <ChevronDown width={16} height={16} color="#6B7280" />
              ) : (
                <ChevronLeft width={16} height={16} color="#6B7280" />
              )}
            </Pressable>

            {isOpen("all") && (
              <View className="mt-1">
                {templates.length > 0 ? (
                  templates.map((tpl) => renderTemplateItem(tpl))
                ) : (
                  <Text className="mt-1 text-[12px] text-neutral-500">
                    No templates yet.
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Folders label */}
          <Text className="mb-1 mt-2 text-xs font-semibold text-neutral-700">
            Folders
          </Text>

          {/* Inline create-folder row */}
          {creatingFolder && (
            <View className="mb-2 flex-row items-center">
              <TextInput
                className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] text-neutral-900"
                placeholder="Folder name"
                value={newFolderName}
                onChangeText={setNewFolderName}
                autoFocus
              />
              <Pressable
                onPress={() => {
                  setCreatingFolder(false);
                  setNewFolderName("");
                }}
                className="ml-2 px-2 py-1"
              >
                <Text className="text-[12px] text-neutral-500">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmCreateFolder}
                className="ml-1 px-2 py-1"
              >
                <Text className="text-[12px] font-semibold text-neutral-900">
                  Save
                </Text>
              </Pressable>
            </View>
          )}

          {foldersLoading ? (
            <Text className="text-[11px] text-neutral-500">
              Loading folders…
            </Text>
          ) : folders.length === 0 ? (
            <Text className="text-[11px] text-neutral-500">
              No folders created. Use &quot;New folder&quot; above to group
              templates.
            </Text>
          ) : (
            folders.map((folder) => (
              <FolderRow key={folder.id} folder={folder} />
            ))
          )}

          {foldersError && (
            <Text className="mt-1 text-[10px] text-red-500">
              Failed to load folders
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
