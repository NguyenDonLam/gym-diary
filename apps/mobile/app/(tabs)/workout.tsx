// apps/mobile/app/(tabs)/workout.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import DraggableFlatList, {
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";

import { useWorkoutPrograms } from "@/src/features/program-workout/hooks/use-workout-programs";
import {
  ProgramColor,
  WorkoutProgram,
} from "@/src/features/program-workout/domain/type";
import { templateFolderRepository } from "@/src/features/template-folder/data/repository";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";
import FolderRow from "@/src/features/template-folder/components/folder-row";
import { sessionWorkoutRepository } from "@/src/features/session-workout/data/repository";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import { ProgramRow } from "@/src/features/program-workout/ui/template-row";
import { UnassignedHeaderRow } from "@/src/components/unassigned-header-row";
import { applyDragResult, buildRows, Row } from "@/src/features/program-workout/utils";

const COLOR_STRIP_MAP: Record<ProgramColor, string> = {
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
  const { programs, deleteProgram, isLoading } = useWorkoutPrograms();

  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<Error | null>(null);

  const [layoutTemplates, setLayoutTemplates] = useState<WorkoutProgram[]>([]);

  const [unassignedOpen, setUnassignedOpen] = useState(true);
  const [openFolderIds, setOpenFolderIds] = useState<string[]>([]);
  const { ongoing, setOngoing, clearOngoing } = useOngoingSession();
  const [checkedOngoing, setCheckedOngoing] = useState(false);


  // keep layout in sync with source templates (initial + external changes)
  useEffect(() => {
    setLayoutTemplates(programs);
  }, [programs]);

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
    router.push("/program-workout/new");
  };

  const handleCreateTemplateInFolder = (folderId: string) => {
    router.push({
      pathname: "/program-workout/new",
      params: { folderId },
    });
  };

  async function handleStartFromTemplate(template: WorkoutProgram) {
    const startNewSession = async () => {
      const fullProgram = await workoutProgramRepository.get(template.id);
      if (!fullProgram) {
        console.log("error when fetching full program");
        return;
      }

      const session =
        await sessionWorkoutRepository.createFromTemplate(fullProgram);
      await setOngoing(session);

      router.push({
        pathname: "/session-workout/[id]",
        params: { id: session.id },
      });
    };

    // If there is an ongoing session, gate the action
    if (ongoing) {
      const sessionName = ongoing.name ?? "Current session";

      Alert.alert(
        "Session in progress",
        `You already have an ongoing session: "${sessionName}".`,
        [
          {
            text: "Keep going",
            style: "default",
            onPress: () => {
              router.push({
                pathname: "/session-workout/[id]",
                params: { id: ongoing.id },
              });
            },
          },
          {
            text: "Finish",
            onPress: async () => {
              try {
                await sessionWorkoutRepository.finish(ongoing.id);
                await clearOngoing();
                await startNewSession();
              } catch (err) {
                console.warn("[workout] failed to finish ongoing session", err);
              }
            },
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              try {
                await sessionWorkoutRepository.discard(ongoing.id);
                await clearOngoing();
                await startNewSession();
              } catch (err) {
                console.warn(
                  "[workout] failed to discard ongoing session",
                  err
                );
              }
            },
          },
        ],
        { cancelable: true }
      );

      return;
    }

    // No ongoing session: just start new
    await startNewSession();
  }


  const handleEditTemplate = (id: string) => {
    router.push({
      pathname: "/program-workout/[id]",
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
          deleteProgram(id).catch((err) => {
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
    const updated: TemplateFolder = { ...folder, name: newName };

    try {
      const saved = await templateFolderRepository.save(updated);

      // sync React state
      setFolders((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
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

      const prevById = new Map(prev.map((t) => [t.id, t]));
      const changed = next.filter((t) => {
        const prevTpl = prevById.get(t.id);
        return prevTpl?.folderId !== t.folderId;
      });

      if (changed.length > 0) {
        (async () => {
          try {
            await Promise.all(
              changed.map((tpl) => workoutProgramRepository.save(tpl))
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
        <UnassignedHeaderRow
          templateCount={item.templateCount}
          open={unassignedOpen}
          onToggle={toggleUnassignedOpen}
        />
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
    const inFolder = !!tpl.folderId;

    return (
      <ProgramRow
        template={tpl}
        inFolder={inFolder}
        isActive={isActive}
        onDragHandleLongPress={drag}
        onPress={() => handleStartFromTemplate(tpl)}
        onLongPress={() => handleEditTemplate(tpl.id)}
        onDeletePress={() => handleDeleteTemplatePress(tpl.id, tpl.name)}
      />
    );
  };


  if (isLoading || foldersLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-slate-950">
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
            <Text className="text-lg font-bold text-neutral-900 dark:text-slate-50">
              Session templates
            </Text>
            <Text className="mt-1 text-xs text-neutral-700 dark:text-neutral-300">
              Tap to start. Long-press to edit. Drag handle to move.
            </Text>
            <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Total: {programs.length}
            </Text>

            <View className="mt-2 flex-row justify-between">
              <Pressable
                className="rounded-full px-3 py-1.5 bg-neutral-900 dark:bg-slate-50"
                onPress={handleCreateTemplate}
              >
                <Text className="text-[13px] font-semibold text-white dark:text-slate-900">
                  New template
                </Text>
              </Pressable>

              <Pressable
                className="rounded-full px-3 py-1.5 bg-neutral-100 dark:bg-slate-800"
                onPress={handleCreateFolder}
              >
                <Text className="text-[13px] font-semibold text-neutral-900 dark:text-slate-50">
                  New folder
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          foldersError ? (
            <View className="mt-1">
              <Text className="text-[10px] text-red-500 dark:text-red-400">
                Failed to load folders
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
