import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";

type Folder = {
  id: string;
  name: string;
};

type Template = {
  id: string;
  name: string;
  duration: string;
  tag?: string;
  folderId: string | null; // null = uncategorised
};

export default function Workout() {
  const [folders] = useState<Folder[]>([
    { id: "f1", name: "Upper / Push" },
    { id: "f2", name: "Lower" },
    { id: "f3", name: "Full body" },
  ]);

  const [templates] = useState<Template[]>([
    {
      id: "upper_a",
      name: "Upper A",
      duration: "55 min",
      tag: "Push",
      folderId: "f1",
    },
    {
      id: "upper_b",
      name: "Upper B",
      duration: "50 min",
      tag: "Push",
      folderId: "f1",
    },
    {
      id: "lower_a",
      name: "Lower A",
      duration: "45 min",
      tag: "Strength",
      folderId: "f2",
    },
    {
      id: "full_a",
      name: "Full Body A",
      duration: "60 min",
      tag: "Full",
      folderId: "f3",
    },
  ]);

  const [activeFolderId, setActiveFolderId] = useState<string | "all">("all");

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      const key = t.folderId || "uncategorised";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    if (activeFolderId === "all") return templates;
    return templates.filter((t) => t.folderId === activeFolderId);
  }, [templates, activeFolderId]);

  const activeFolderName =
    activeFolderId === "all"
      ? "All folders"
      : folders.find((f) => f.id === activeFolderId)?.name || "Folder";

  const handleStartFromTemplate = (id: string) => {
    console.log("start session from template", id);
  };

  const handleEditTemplate = (id: string) => {
    console.log("edit template", id);
  };

  const handleCreateTemplate = () => {
    console.log("create new template in", activeFolderId);
  };

  const handleCreateFolder = () => {
    console.log("create new folder");
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        {/* TOP: title + folder grid in the grey space */}
        <View style={styles.topInfo}>
          <Text style={styles.topTitle}>Session templates</Text>
          <Text style={styles.topSubtitle}>
            Tap template to start. Long-press to edit.
          </Text>
          <Text style={styles.topMeta}>
            Total: {templates.length} · {activeFolderName}
          </Text>

          <Text style={styles.foldersLabel}>Folders</Text>
          <View style={styles.folderGrid}>
            {/* "All" pseudo-folder */}
            <Pressable
              style={[
                styles.folderCard,
                activeFolderId === "all" && styles.folderCardActive,
              ]}
              onPress={() => setActiveFolderId("all")}
            >
              <Text style={styles.folderName} numberOfLines={1}>
                All
              </Text>
              <Text style={styles.folderCount}>{templates.length}</Text>
            </Pressable>

            {folders.map((folder) => {
              const active = folder.id === activeFolderId;
              const count = folderCounts[folder.id] || 0;
              return (
                <Pressable
                  key={folder.id}
                  style={[styles.folderCard, active && styles.folderCardActive]}
                  onPress={() => setActiveFolderId(folder.id)}
                >
                  <Text style={styles.folderName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={styles.folderCount}>{count}</Text>
                </Pressable>
              );
            })}

            {/* New folder card */}
            <Pressable style={styles.folderCard} onPress={handleCreateFolder}>
              <Text style={styles.folderPlus}>＋</Text>
              <Text style={styles.folderName} numberOfLines={1}>
                New folder
              </Text>
            </Pressable>
          </View>
        </View>

        {/* BOTTOM SHEET: templates list + single "New template" button */}
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Templates</Text>
            <Pressable style={styles.newButton} onPress={handleCreateTemplate}>
              <Text style={styles.newButtonText}>New template</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visibleTemplates.length > 0 ? (
              visibleTemplates.map((tpl) => (
                <Pressable
                  key={tpl.id}
                  style={styles.row}
                  onPress={() => handleStartFromTemplate(tpl.id)}
                  onLongPress={() => handleEditTemplate(tpl.id)}
                >
                  <View style={styles.rowTextBlock}>
                    <Text style={styles.rowName}>{tpl.name}</Text>
                    <View style={styles.rowMetaLine}>
                      {tpl.tag ? (
                        <Text style={styles.rowMetaItem}>{tpl.tag}</Text>
                      ) : null}
                      <Text style={styles.rowMetaItem}>{tpl.duration}</Text>
                    </View>
                    <Text style={styles.rowHint}>
                      Tap to start · long-press to edit
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No templates here</Text>
                <Text style={styles.emptySubtitle}>
                  Use “New template” above to add one.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  // top grey area
  topInfo: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  topSubtitle: {
    marginTop: 4,
    fontSize: 12,
  },
  topMeta: {
    marginTop: 2,
    fontSize: 12,
  },

  foldersLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  folderGrid: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  folderCard: {
    width: "30%", // rough 3 per row, tweak if needed
    minWidth: 90,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  folderCardActive: {
    borderWidth: 1,
  },
  folderName: {
    fontSize: 12,
  },
  folderCount: {
    marginTop: 2,
    fontSize: 11,
  },
  folderPlus: {
    fontSize: 16,
    marginBottom: 2,
  },

  // bottom sheet
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "32%", // adjust to your taste
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    overflow: "hidden",
    backgroundColor: "white",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  newButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTextBlock: { flexShrink: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowMetaLine: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  rowMetaItem: {
    marginRight: 8,
    fontSize: 12,
  },
  rowHint: {
    marginTop: 2,
    fontSize: 11,
  },

  emptyState: {
    paddingTop: 24,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    textAlign: "center",
  },
});
