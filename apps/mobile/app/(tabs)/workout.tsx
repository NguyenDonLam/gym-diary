// apps/mobile/app/(tabs)/workout.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronLeft,
} from "lucide-react-native";
import DraggableFlatList, {
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";

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

type TemplateWithFolder = {
  id: string;
  name?: string | null;
  color?: TemplateColor | null;
  folderId?: string | null;
};

type Row =
  | { key: string; type: "unassigned-header"; templateCount: number }
  | {
      key: string;
      type: "folder-header";
      folder: TemplateFolder;
      templateCount: number;
    }
  | { key: string; type: "template"; template: TemplateWithFolder };

export default function Workout() {
  const router = useRouter();
  const {
    templates,
    deleteTemplate,
    loading: templatesLoading,
  } = useWorkoutTemplates() as {
    templates: TemplateWithFolder[];
    deleteTemplate: (id: string) => Promise<void>;
    loading?: boolean;
  };

  const [folders, setFolders] = React.useState<TemplateFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = React.useState(true);
  const [foldersError, setFoldersError] = React.useState<Error | null>(null);

  // templates used for layout (order + folder assignment)
  const [layoutTemplates, setLayoutTemplates] = React.useState<
    TemplateWithFolder[]
  >([]);

  // flat list rows
  const [rows, setRows] = React.useState<Row[]>([]);

  // open/closed sections
  const [unassignedOpen, setUnassignedOpen] = React.useState(true);
  const [openFolderIds, setOpenFolderIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setLayoutTemplates(templates);
  }, [templates]);

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

  // keep new folders open by default
  React.useEffect(() => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      folders.forEach((f) => next.add(f.id));
      return Array.from(next);
    });
  }, [folders]);

  const buildRows = React.useCallback(
    (
      templatesSource: TemplateWithFolder[],
      foldersSource: TemplateFolder[]
    ): Row[] => {
      const next: Row[] = [];

      const knownFolderIds = new Set(foldersSource.map((f) => f.id));
      const byFolder: Record<string, TemplateWithFolder[]> = {};
      const unassigned: TemplateWithFolder[] = [];

      for (const tpl of templatesSource) {
        const folderId = tpl.folderId ?? null;
        if (!folderId || !knownFolderIds.has(folderId)) {
          unassigned.push(tpl);
        } else {
          if (!byFolder[folderId]) byFolder[folderId] = [];
          byFolder[folderId].push(tpl);
        }
      }

      // No folder section
      if (unassigned.length > 0) {
        next.push({
          type: "unassigned-header",
          key: "unassigned-header",
          templateCount: unassigned.length,
        });

        if (unassignedOpen) {
          for (const tpl of unassigned) {
            next.push({
              type: "template",
              key: `template:${tpl.id}`,
              template: tpl,
            });
          }
        }
      }

      // Folder sections
      for (const folder of foldersSource) {
        const inFolder = byFolder[folder.id] ?? [];
        const isOpen = openFolderIds.includes(folder.id);

        next.push({
          type: "folder-header",
          key: `folder:${folder.id}`,
          folder,
          templateCount: inFolder.length,
        });

        if (isOpen) {
          for (const tpl of inFolder) {
            next.push({
              type: "template",
              key: `template:${tpl.id}`,
              template: tpl,
            });
          }
        }
      }

      return next;
    },
    [unassignedOpen, openFolderIds]
  );

  React.useEffect(() => {
    setRows(buildRows(layoutTemplates, folders));
  }, [layoutTemplates, folders, buildRows]);

  const handleStartFromTemplate = React.useCallback((id: string) => {
    console.log("start session from template", id);
  }, []);

  const handleEditTemplate = React.useCallback(
    (id: string) => {
      router.push({
        pathname: "/template-workout/[id]",
        params: { id },
      });
    },
    [router]
  );

  const handleCreateTemplate = React.useCallback(() => {
    router.push("/template-workout/new");
  }, [router]);

  const handleCreateTemplateInFolder = React.useCallback(
    (folderId: string) => {
      router.push({
        pathname: "/template-workout/new",
        params: { folderId },
      });
    },
    [router]
  );

  const handleDeleteTemplatePress = React.useCallback(
    (id: string, name?: string | null) => {
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
    },
    [deleteTemplate]
  );

  const handleCreateFolder = React.useCallback(async () => {
    try {
      const folder = await templateFolderRepository.create("New folder");
      setFolders((prev) => [...prev, folder]);
      setOpenFolderIds((prev) => [...prev, folder.id]);
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  }, []);

  const handleRenameFolder = React.useCallback(
    async (folderId: string, newName: string) => {
      try {
        await templateFolderRepository.rename(folderId, newName);
        setFolders((prev) =>
          prev.map((f) => (f.id === folderId ? { ...f, name: newName } : f))
        );
      } catch (err) {
        console.error("Failed to rename folder", err);
      }
    },
    []
  );

  const handleDeleteFolder = React.useCallback(async (folderId: string) => {
    try {
      await templateFolderRepository.delete(folderId);

      // drop folder
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setOpenFolderIds((prev) => prev.filter((id) => id !== folderId));

      // move its templates to "No folder"
      setLayoutTemplates((prev) =>
        prev.map((t) =>
          t.folderId === folderId ? { ...t, folderId: null } : t
        )
      );
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  }, []);

  const toggleUnassignedOpen = React.useCallback(() => {
    setUnassignedOpen((prev) => !prev);
  }, []);

  const toggleFolderOpen = React.useCallback((folderId: string) => {
    setOpenFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  }, []);

  const handleDragEnd = React.useCallback(
    ({ data }: DragEndParams<Row>) => {
      let currentFolderId: string | null = null;
      const moved: TemplateWithFolder[] = [];
      const visibleIds = new Set<string>();

      for (const row of data) {
        if (row.type === "unassigned-header") {
          currentFolderId = null;
        } else if (row.type === "folder-header") {
          currentFolderId = row.folder.id;
        } else if (row.type === "template") {
          visibleIds.add(row.template.id);
          moved.push({
            ...row.template,
            folderId: currentFolderId ?? null,
          });
        }
      }

      const hidden = layoutTemplates.filter((t) => !visibleIds.has(t.id));
      const nextTemplates = [...moved, ...hidden];

      setLayoutTemplates(nextTemplates);

      // Optional: persist updated folderId + ordering here via your repo.
    },
    [layoutTemplates]
  );

  const renderRow = React.useCallback(
    ({ item, drag, isActive }: RenderItemParams<Row>) => {
      if (item.type === "unassigned-header") {
        return (
          <Pressable
            onPress={toggleUnassignedOpen}
            className="mt-2 mb-1 flex-row items-center justify-between"
          >
            <Text className="text-[12px] font-semibold text-neutral-700">
              No folder
            </Text>
            <View className="flex-row items-center">
              <Text className="mr-1 text-[11px] text-neutral-500">
                {item.templateCount} template
                {item.templateCount === 1 ? "" : "s"}
              </Text>
              {unassignedOpen ? (
                <ChevronDown width={14} height={14} color="#9CA3AF" />
              ) : (
                <ChevronLeft width={14} height={14} color="#9CA3AF" />
              )}
            </View>
          </Pressable>
        );
      }

      if (item.type === "folder-header") {
        const isOpen = openFolderIds.includes(item.folder.id);
        return (
          <FolderRow
            folder={item.folder}
            templateCount={item.templateCount}
            isOpen={isOpen}
            onToggleOpen={() => toggleFolderOpen(item.folder.id)}
            onRenameFolder={(name) => handleRenameFolder(item.folder.id, name)}
            onDeleteFolder={() => handleDeleteFolder(item.folder.id)}
            onCreateTemplateInFolder={() =>
              handleCreateTemplateInFolder(item.folder.id)
            }
          />
        );
      }

      // template row – tap = start, long-press = edit, drag handle for move
      const tpl = item.template;
      const color = (tpl.color as TemplateColor) ?? "neutral";
      const stripClass = COLOR_STRIP_MAP[color];

      const inFolder = !!tpl.folderId;

      return (
        <Pressable
          className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 ${
            inFolder ? "ml-4" : ""
          } ${isActive ? "opacity-80" : ""}`}
          onPress={() => handleStartFromTemplate(tpl.id)}
          onLongPress={() => handleEditTemplate(tpl.id)}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              {/* drag handle */}
              <Pressable
                onLongPress={drag}
                delayLongPress={120}
                disabled={isActive}
                hitSlop={8}
                className="mr-2"
              >
                <GripVertical width={16} height={16} color="#9CA3AF" />
              </Pressable>

              {/* color strip */}
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
              onPress={() => handleDeleteTemplatePress(tpl.id, tpl.name)}
              hitSlop={8}
            >
              <Trash2 width={16} height={16} color="#9CA3AF" />
            </Pressable>
          </View>
        </Pressable>
      );
    },
    [
      handleDeleteTemplatePress,
      handleEditTemplate,
      handleRenameFolder,
      handleStartFromTemplate,
      handleDeleteFolder,
      handleCreateTemplateInFolder,
      openFolderIds,
      toggleFolderOpen,
      toggleUnassignedOpen,
      unassignedOpen,
    ]
  );

  if (templatesLoading || foldersLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-3 pb-2">
        <Text className="text-lg font-bold text-neutral-900">
          Session templates
        </Text>
        <Text className="mt-1 text-xs text-neutral-700">
          Tap to start. Long-press to edit. Drag handle to move.
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
            onPress={handleCreateFolder}
          >
            <Text className="text-[13px] font-semibold text-neutral-900">
              New folder
            </Text>
          </Pressable>
        </View>
      </View>

      <DraggableFlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        onDragEnd={handleDragEnd}
        activationDistance={8}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
      />

      {foldersError && (
        <View className="px-4 pb-2">
          <Text className="text-[10px] text-red-500">
            Failed to load folders
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}
