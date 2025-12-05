/**
 * Row shape for `template_folders` table.
 * Matches schema.ts:
 *   id TEXT PRIMARY KEY
 *   name TEXT NOT NULL
 *   sort_index INTEGER NOT NULL DEFAULT 0
 *   created_at INTEGER (timestamp_ms) NOT NULL
 *   updated_at INTEGER (timestamp_ms) NOT NULL
 */
export type TemplateFolderRow = {
  id: string;
  name: string;
  sort_index: number;
  created_at: number; // ms since epoch
  updated_at: number; // ms since epoch
};

/**
 * Factory input + type for creating new rows.
 */
export type TemplateFolderRowFactoryInput = {
  name: string;
  sortIndex?: number | null;
};

export type TemplateFolderRowFactory = (
  input: TemplateFolderRowFactoryInput
) => TemplateFolderRow;
