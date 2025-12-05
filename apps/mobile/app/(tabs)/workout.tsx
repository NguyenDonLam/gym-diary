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
  ChevronDown,
  ChevronLeft,
  GripVertical,
} from "lucide-react-native";

import DraggableFlatList, {
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";

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

// One flat list: headers define “zones”, templates are draggable items.
type Row =
  | { key: string; type: "unassigned-header" }
  | { key: string; type: "folder-header"; folder: TemplateFolder }
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

  // local template state for UI ordering + folder assignment
  const [localTemplates, setLocalTemplates] = React.useState<
    TemplateWithFolder[]
  >([]);

  const [rows, setRows] = React.useState<Row[]>([]);

  React.useEffect(() => {
    setLocalTemplates(templates);
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

  // build rows = [No folder header] + unassigned templates + [folder header + templates]...
  const buildRows = React.useCallback(
    (
      templatesSource: TemplateWithFolder[],
      foldersSource: TemplateFolder[]
    ) => {
      const next: Row[] = [];

      const byFolder: Record<string, TemplateWithFolder[]> = {};
      const unassigned: TemplateWithFolder[] = [];

      for (const tpl of templatesSource) {
        const folderId = tpl.folderId ?? null;
        if (!folderId) {
          unassigned.push(tpl);
        } else {
          if (!byFolder[folderId]) byFolder[folderId] = [];
          byFolder[folderId].push(tpl);
        }
      }

      // “No folder” zone
      if (unassigned.length > 0) {
        next.push({ type: "unassigned-header", key: "unassigned-header" });
        for (const tpl of unassigned) {
          next.push({
            type: "template",
            key: `template:${tpl.id}`,
            template: tpl,
          });
        }
      }

      // Each folder zone: header + templates
      for (const folder of foldersSource) {
        next.push({
          type: "folder-header",
          key: `folder:${folder.id}`,
          folder,
        });

        const inFolder = byFolder[folder.id] ?? [];
        for (const tpl of inFolder) {
          next.push({
            type: "template",
            key: `template:${tpl.id}`,
            template: tpl,
          });
        }
      }

      return next;
    },
    []
  );

  React.useEffect(() => {
    setRows(buildRows(localTemplates, folders));
  }, [localTemplates, folders, buildRows]);

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

  const handleCreateFolder = async () => {
    try {
      const folder = await templateFolderRepository.create("New folder");
      setFolders((prev) => [...prev, folder]);
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleDragEnd = (params: DragEndParams<Row>) => {
    const { data } = params;

    let currentFolderId: string | null = null;
    const nextTemplates: TemplateWithFolder[] = [];

    for (const row of data) {
      if (row.type === "unassigned-header") {
        currentFolderId = null;
      } else if (row.type === "folder-header") {
        currentFolderId = row.folder.id;
      } else if (row.type === "template") {
        const tpl = row.template;
        nextTemplates.push({
          ...tpl,
          folderId: currentFolderId ?? null,
        });
      }
    }

    setLocalTemplates(nextTemplates);

    // TODO: persist folder assignments / order here if you want it saved.
    // e.g. batch update templates in your repository.
  };

  const renderRow = ({ item, drag, isActive }: RenderItemParams<Row>) => {
    if (item.type === "unassigned-header") {
      return (
        <View className="mt-2 mb-1">
          <Text className="text-[12px] font-semibold text-neutral-700">
            No folder
          </Text>
        </View>
      );
    }

    if (item.type === "folder-header") {
      return (
        <View className="mt-3 mb-1 flex-row items-center justify-between">
          <Text
            className="text-[13px] font-semibold text-neutral-900"
            numberOfLines={1}
          >
            {item.folder.name}
          </Text>
          <ChevronDown width={14} height={14} color="#9CA3AF" />
        </View>
      );
    }

    // template row – tap = start, long-press = edit, drag handle for move
    const tpl = item.template;
    const color = (tpl.color as TemplateColor) ?? "neutral";
    const stripClass = COLOR_STRIP_MAP[color];

    return (
      <Pressable
        className={`mb-2 rounded-xl bg-neutral-50 px-3 py-2 ${
          isActive ? "opacity-80" : ""
        }`}
        onPress={() => handleStartFromTemplate(tpl.id)}
        onLongPress={() => handleEditTemplate(tpl.id)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            {/* drag handle only */}
            <Pressable
              onLongPress={drag}
              delayLongPress={120}
              disabled={isActive}
              hitSlop={8}
              className="mr-2"
            >
              <GripVertical width={16} height={16} color="#9CA3AF" />
            </Pressable>

            {/* colour strip (purely visual now) */}
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
          Tap to start. Long-press to move between folders.
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
