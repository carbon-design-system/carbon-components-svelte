import type { FileEntry } from "../utils/file-system.js";

/** A listing entry as the views read it: `id` is the `path`, which DataTable needs. */
export type FileRow = FileEntry & { id: string };
