// apps/mobile/app/(tabs)/workout.tsx
import React, { useEffect, useMemo, useState } from "react";
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
import {
  TemplateColor,
  TemplateWorkout,
} from "@/src/features/template-workout/domain/type";
import { templateFolderRepository } from "@/src/features/template-folder/data/repository";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";
import FolderRow from "@/src/features/template-folder/components/folder-row";
import { workoutTemplateRepository } from "@/src/features/template-workout/data/template-workout-repository";

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

type Row =
  | { key: string; type: "unassigned-header"; templateCount: number }
  | {
      key: string;
      type: "folder-header";
      folder: TemplateFolder;
      templateCount: number;
    }
  | { key: string; type: "template"; template: TemplateWorkout };

function groupTemplates(
  templates: TemplateWorkout[],
  folders: TemplateFolder[]
) {
  const knownFolderIds = new Set(folders.map((f) => f.id));
  const byFolder: Record<string, TemplateWorkout[]> = {};
  const unassigned: TemplateWorkout[] = [];

  for (const tpl of templates) {
    const folderId = tpl.folderId ?? null;
    if (!folderId || !knownFolderIds.has(folderId)) {
      unassigned.push(tpl);
    } else {
      if (!byFolder[folderId]) byFolder[folderId] = [];
      byFolder[folderId].push(tpl);
    }
  }

  return { unassigned, byFolder };
}

function buildRows(
  templates: TemplateWorkout[],
  folders: TemplateFolder[],
  unassignedOpen: boolean,
  openFolderIds: string[]
): Row[] {
  const { unassigned, byFolder } = groupTemplates(templates, folders);
  const rows: Row[] = [];

  if (unassigned.length > 0) {
    rows.push({
      type: "unassigned-header",
      key: "unassigned-header",
      templateCount: unassigned.length,
    });

    if (unassignedOpen) {
      for (const tpl of unassigned) {
        rows.push({
          type: "template",
          key: `template:${tpl.id}`,
          template: tpl,
        });
      }
    }
  }

  for (const folder of folders) {
    const inFolder = byFolder[folder.id] ?? [];
    const isOpen = openFolderIds.includes(folder.id);

    rows.push({
      type: "folder-header",
      key: `folder:${folder.id}`,
      folder,
      templateCount: inFolder.length,
    });

    if (isOpen) {
      for (const tpl of inFolder) {
        rows.push({
          type: "template",
          key: `template:${tpl.id}`,
          template: tpl,
        });
      }
    }
  }

  return rows;
}

function applyDragResult(
  data: Row[],
  prevTemplates: TemplateWorkout[]
): TemplateWorkout[] {
  let currentFolderId: string | null = null;
  const moved: TemplateWorkout[] = [];
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

  const hidden = prevTemplates.filter((t) => !visibleIds.has(t.id));
  return [...moved, ...hidden];
}

export default function Workout() {
  const router = useRouter();
  const {
    templates,
    deleteTemplate,
    loading: templatesLoading,
  } = useWorkoutTemplates() as {
    templates: TemplateWorkout[];
    deleteTemplate: (id: string) => Promise<void>;
    loading?: boolean;
  };

  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<Error | null>(null);

  const [layoutTemplates, setLayoutTemplates] = useState<TemplateWorkout[]>([]);

  const [unassignedOpen, setUnassignedOpen] = useState(true);
  const [openFolderIds, setOpenFolderIds] = useState<string[]>([]);

  // keep layout in sync with source templates (initial + external changes)
  useEffect(() => {
    setLayoutTemplates(templates);
  }, [templates]);

  // folders
  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, []);

  // new folders open by default
  useEffect(() => {
    setOpenFolderIds((prev) => {
      const next = new Set(prev);
      folders.forEach((f) => next.add(f.id));
      return Array.from(next);
    });
  }, [folders]);

  const rows = useMemo(
    () => buildRows(layoutTemplates, folders, unassignedOpen, openFolderIds),
    [layoutTemplates, folders, unassignedOpen, openFolderIds]
  );

  const handleCreateTemplate = () => {
    router.push("/template-workout/new");
  };

  const handleCreateTemplateInFolder = (folderId: string) => {
    router.push({
      pathname: "/template-workout/new",
      params: { folderId },
    });
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

  const handleDeleteTemplatePress = (id: string, name?: string | null) => {
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

  const handleCreateFolder = async () => {
    try {
      const folder = await templateFolderRepository.create("New folder");
      setFolders((prev) => [...prev, folder]);
      setOpenFolderIds((prev) => [...prev, folder.id]);
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleUpdateFolder = async (
    folder: TemplateFolder,
    newName: string
  ) => {
    const updated: TemplateFolder = {
      ...folder,
      name: newName,
    };

    try {
      await templateFolderRepository.save(updated);
    } catch (err) {
      console.error("Failed to update folder", err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await templateFolderRepository.delete(folderId);
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      setOpenFolderIds((prev) => prev.filter((id) => id !== folderId));
      setLayoutTemplates((prev) =>
        prev.map((t) =>
          t.folderId === folderId ? { ...t, folderId: null } : t
        )
      );
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  };

  const toggleUnassignedOpen = () => {
    setUnassignedOpen((prev) => !prev);
  };

  const toggleFolderOpen = (folderId: string) => {
    setOpenFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const handleDragEnd = ({ data }: DragEndParams<Row>) => {
    setLayoutTemplates((prev) => {
      const next = applyDragResult(data, prev);

      // persist only folderId changes
      const prevById = new Map(prev.map((t) => [t.id, t]));
      const changed = next.filter((t) => {
        const prevTpl = prevById.get(t.id);
        return prevTpl?.folderId !== t.folderId;
      });

      if (changed.length > 0) {
        // fire-and-forget; handle errors inside
        (async () => {
          try {
            await Promise.all(
              changed.map((tpl) =>
                // adapt cast/object shape to your actual Template type if needed
                workoutTemplateRepository.save(tpl)
              )
            );
          } catch (err) {
            console.error("Failed to persist template layout", err);
          }
        })();
      }

      return next;
    });
  };

  const renderRow = ({ item, drag, isActive }: RenderItemParams<Row>) => {
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
          onRenameFolder={(name) => handleUpdateFolder(item.folder, name)}
          onDeleteFolder={() => handleDeleteFolder(item.folder.id)}
          onCreateTemplateInFolder={() =>
            handleCreateTemplateInFolder(item.folder.id)
          }
        />
      );
    }

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
            <Pressable
              onLongPress={drag}
              delayLongPress={120}
              disabled={isActive}
              hitSlop={8}
              className="mr-2"
            >
              <GripVertical width={16} height={16} color="#9CA3AF" />
            </Pressable>

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
  };

  if (templatesLoading || foldersLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <DraggableFlatList
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        onDragEnd={handleDragEnd}
        activationDistance={8}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
        ListHeaderComponent={
          <View className="mb-2 px-0">
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
        }
        ListFooterComponent={
          foldersError ? (
            <View className="mt-1">
              <Text className="text-[10px] text-red-500">
                Failed to load folders
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
