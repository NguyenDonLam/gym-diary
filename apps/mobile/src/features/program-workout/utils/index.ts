// src/features/program-workout/utils/template-layout.ts
import type { TemplateFolder } from "@/src/features/template-folder/domain/types";
import type { WorkoutProgram } from "@/src/features/program-workout/domain/type";

export type Row =
  | { key: string; type: "unassigned-header"; templateCount: number }
  | {
      key: string;
      type: "folder-header";
      folder: TemplateFolder;
      templateCount: number;
    }
  | { key: string; type: "template"; template: WorkoutProgram };

function groupTemplates(
  templates: WorkoutProgram[],
  folders: TemplateFolder[]
) {
  const knownFolderIds = new Set(folders.map((f) => f.id));
  const byFolder: Record<string, WorkoutProgram[]> = {};
  const unassigned: WorkoutProgram[] = [];

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

export function buildRows(
  templates: WorkoutProgram[],
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

export function applyDragResult(
  data: Row[],
  prevTemplates: WorkoutProgram[]
): WorkoutProgram[] {
  let currentFolderId: string | null = null;
  const moved: WorkoutProgram[] = [];
  const visibleIds = new Set<string>();

  for (const row of data) {
    if (row.type === "unassigned-header") {
      currentFolderId = null;
    } else if (row.type === "folder-header") {
      currentFolderId = row.folder.id;
    } else {
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
