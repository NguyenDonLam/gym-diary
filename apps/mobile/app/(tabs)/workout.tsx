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
import { useColorScheme } from "nativewind";
import DraggableFlatList, {
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";

import { useWorkoutPrograms } from "@/src/features/program-workout/hooks/use-workout-programs";
import { WorkoutProgram } from "@/src/features/program-workout/domain/type";
import { templateFolderRepository } from "@/src/features/template-folder/data/repository";
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";
import FolderRow from "@/src/features/template-folder/components/folder-row";
import { workoutProgramRepository } from "@/src/features/program-workout/data/workout-program-repository";
import { useOngoingSession } from "@/src/features/session-workout/hooks/use-ongoing-session";
import type { FinishProgramDraftRoute } from "@/src/features/session-workout/hooks/use-ongoing-session";
import { confirmFinishSession } from "@/src/features/session-workout/ui/finish-session-prompt";
import { ProgramRow } from "@/src/features/program-workout/ui/template-row";
import { UnassignedHeaderRow } from "@/src/components/unassigned-header-row";
import { useSessionTimer } from "@/src/features/program-workout/hooks/use-session-timer";
import {
  applyDragResult,
  buildRows,
  Row,
} from "@/src/features/program-workout/utils";
import {
  CheckCircle2,
  ChevronRight,
  FolderPlus,
  Play,
  Plus,
  Timer,
} from "lucide-react-native";

export default function Workout() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { programs, deleteProgram, isLoading } = useWorkoutPrograms();

  const [folders, setFolders] = useState<TemplateFolder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<Error | null>(null);

  const [templateProgram, setTemplateProgram] = useState<WorkoutProgram[]>([]);

  const [unassignedOpen, setUnassignedOpen] = useState(true);
  const [openFolderIds, setOpenFolderIds] = useState<string[]>([]);

  const {
    ongoingSession,
    startSession,
    endSession,
    getFinishProgramSavePrompt,
    createFinishProgramDraft,
    discardSession,
  } = useOngoingSession();

  const activeSessionStartMs = useMemo(() => {
    if (!ongoingSession) return null;

    const ms = new Date(ongoingSession.startedAt).getTime();
    return Number.isNaN(ms) ? null : ms;
  }, [ongoingSession]);

  const { label: activeSessionTime } = useSessionTimer(activeSessionStartMs);
  const activeSessionName = ongoingSession?.name ?? "Session in progress";

  // keep layout in sync with source templates (initial + external changes)
  useEffect(() => {
    setTemplateProgram(programs);
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
          e instanceof Error ? e : new Error("Failed to load folders"),
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
    () => buildRows(templateProgram, folders, unassignedOpen, openFolderIds),
    [templateProgram, folders, unassignedOpen, openFolderIds],
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

  const handleOpenOngoingSession = () => {
    if (!ongoingSession) return;

    router.push({
      pathname: "/session-workout/[id]",
      params: { id: ongoingSession.id },
    });
  };

  const openProgramDraft = (draft: FinishProgramDraftRoute) => {
    if (draft.kind === "edit") {
      router.push({
        pathname: "/program-workout/[id]",
        params: { id: draft.programId, draftKey: draft.draftKey },
      });
      return;
    }

    router.push({
      pathname: "/program-workout/new",
      params: { draftKey: draft.draftKey },
    });
  };

  const handleFinishOngoingSession = () => {
    if (!ongoingSession) return;

    void confirmFinishSession({
      getPrompt: getFinishProgramSavePrompt,
      createProgramDraft: createFinishProgramDraft,
      finish: endSession,
      onFinished: ({ draft }) => {
        if (draft) openProgramDraft(draft);
      },
      onError: (err) => {
        console.warn("[workout] failed to finish current session", err);
      },
    });
  };

  async function handleStartSession(program?: WorkoutProgram) {
    const startNewSession = async () => {
      await startSession(program?.id);

      router.push({
        pathname: "/session-workout/ongoing",
      });
    };

    if (ongoingSession) {
      const sessionName = ongoingSession.name ?? "Current session";

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
                params: { id: ongoingSession.id },
              });
            },
          },
          {
            text: "Finish",
            onPress: () => {
              void confirmFinishSession({
                getPrompt: getFinishProgramSavePrompt,
                createProgramDraft: createFinishProgramDraft,
                finish: endSession,
                onFinished: async ({ draft }) => {
                  if (draft) {
                    openProgramDraft(draft);
                    return;
                  }

                  await startNewSession();
                },
                onError: (err) => {
                  console.warn(
                    "[workout] failed to finish ongoing session",
                    err,
                  );
                },
              });
            },
          },
          {
            text: "Discard",
            style: "destructive",
            onPress: async () => {
              try {
                await discardSession();
                await startNewSession();
              } catch (err) {
                console.warn(
                  "[workout] failed to discard ongoing session",
                  err,
                );
              }
            },
          },
        ],
        { cancelable: true },
      );

      return;
    }

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
    newName: string,
  ) => {
    const updated: TemplateFolder = { ...folder, name: newName };

    try {
      const saved = await templateFolderRepository.save(updated);

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
      setTemplateProgram((prev) =>
        prev.map((t) =>
          t.folderId === folderId ? { ...t, folderId: null } : t,
        ),
      );
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  };

  const toggleUnassignedOpen = () => setUnassignedOpen((prev) => !prev);

  const toggleFolderOpen = (folderId: string) => {
    setOpenFolderIds((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId],
    );
  };

  const handleDragEnd = ({ data }: DragEndParams<Row>) => {
    setTemplateProgram((prev) => {
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
              changed.map((tpl) => workoutProgramRepository.save(tpl)),
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
          programCount={item.templateCount}
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
          programCount={item.templateCount}
          isOpen={isOpen}
          onToggleOpen={() => toggleFolderOpen(item.folder.id)}
          onRenameFolder={(name) => handleUpdateFolder(item.folder, name)}
          onDeleteFolder={() => handleDeleteFolder(item.folder.id)}
          onCreateProgramInFolder={() =>
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
        onPress={() => handleStartSession(tpl)}
        onLongPress={() => handleEditTemplate(tpl.id)}
        onDeletePress={() => handleDeleteTemplatePress(tpl.id, tpl.name)}
      />
    );
  };

  if (isLoading || foldersLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#282A36]">
        <ActivityIndicator size="large" color="#BD93F9" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#282A36]">
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
          <View className="mb-3 px-0">
            <Text className="text-lg font-bold text-neutral-900 dark:text-[#F8F8F2]">
              Programs
            </Text>

            <Text className="mt-1 text-xs text-neutral-700 dark:text-[#6272A4]">
              Tap to start. Long-press to edit. Drag handle to move.
            </Text>

            <Text className="mt-0.5 text-xs text-neutral-500 dark:text-[#6272A4]">
              Total: {programs.length}
            </Text>

            {ongoingSession ? (
              <View className="mt-3 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10">
                <View className="flex-row items-stretch">
                  <Pressable
                    onPress={handleOpenOngoingSession}
                    android_ripple={{
                      color: isDark
                        ? "rgba(16,185,129,0.18)"
                        : "rgba(16,185,129,0.12)",
                    }}
                    className="flex-1"
                  >
                    {({ pressed }) => (
                      <View
                        className={`flex-row items-center justify-between px-4 py-4 ${
                          pressed ? "opacity-80" : "opacity-100"
                        }`}
                      >
                        <View className="flex-row items-center flex-1 pr-3">
                          <View className="mr-3 rounded-full bg-emerald-500/15 p-2 dark:bg-emerald-400/20">
                            <Timer
                              size={17}
                              color={isDark ? "#34D399" : "#047857"}
                            />
                          </View>

                          <View className="flex-1">
                            <Text className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                              Current session
                            </Text>
                            <Text
                              numberOfLines={1}
                              className="mt-1 text-sm font-semibold text-neutral-950 dark:text-[#F8F8F2]"
                            >
                              {activeSessionName}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center">
                          <Text className="mr-2 font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {activeSessionTime}
                          </Text>
                          <ChevronRight
                            size={18}
                            color={isDark ? "#34D399" : "#047857"}
                          />
                        </View>
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleFinishOngoingSession}
                    accessibilityRole="button"
                    accessibilityLabel="End current session"
                    android_ripple={{
                      color: isDark
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(255,255,255,0.2)",
                    }}
                    className="w-24 items-center justify-center bg-emerald-600 px-3 dark:bg-emerald-500"
                  >
                    {({ pressed }) => (
                      <View
                        className={`items-center justify-center ${
                          pressed ? "opacity-80" : "opacity-100"
                        }`}
                      >
                        <CheckCircle2 size={18} color="#ffffff" />
                        <Text className="mt-1 text-xs font-bold text-white">
                          End
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => handleStartSession()}
                android_ripple={{ color: "rgba(255,255,255,0.08)" }}
                className="mt-3 overflow-hidden rounded-2xl border border-neutral-300 bg-white dark:border-[#6272A4] dark:bg-[#21222C]"
              >
                {({ pressed }) => (
                  <View
                    className={`flex-row items-center justify-between px-4 py-4 ${
                      pressed ? "opacity-80" : "opacity-100"
                    }`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="mr-3 rounded-full bg-neutral-900/10 p-2 dark:bg-[#BD93F9]/20">
                        <Play
                          size={16}
                          color={isDark ? "#BD93F9" : "#111827"}
                          fill={isDark ? "#BD93F9" : "#111827"}
                        />
                      </View>

                      <View className="flex-1 pr-3">
                        <Text className="text-sm font-semibold text-neutral-900 dark:text-[#F8F8F2]">
                          Start one-off session
                        </Text>
                        <Text className="mt-1 text-xs text-neutral-600 dark:text-[#6272A4]">
                          Start a workout without using a saved program
                        </Text>
                      </View>
                    </View>

                    <ChevronRight
                      size={18}
                      color={isDark ? "#6272A4" : "#6b7280"}
                    />
                  </View>
                )}
              </Pressable>
            )}

            <View className="mt-3 flex-row gap-2">
              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-lg bg-neutral-900 px-3 py-2.5 dark:bg-[#BD93F9]"
                onPress={handleCreateTemplate}
              >
                <Plus
                  size={15}
                  color={isDark ? "#282A36" : "#ffffff"}
                  strokeWidth={2.5}
                />
                <Text className="ml-1.5 text-[13px] font-semibold text-white dark:text-[#282A36]">
                  New program
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 flex-row items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2.5 dark:border-[#6272A4] dark:bg-[#21222C]"
                onPress={handleCreateFolder}
              >
                <FolderPlus
                  size={15}
                  color={isDark ? "#F8F8F2" : "#111827"}
                  strokeWidth={2.3}
                />
                <Text className="ml-1.5 text-[13px] font-semibold text-neutral-900 dark:text-[#F8F8F2]">
                  New folder
                </Text>
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          foldersError ? (
            <View className="mt-1">
              <Text className="text-[10px] text-red-500 dark:text-[#FF5555]">
                Failed to load folders
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
