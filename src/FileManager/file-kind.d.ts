import type { FileEntry } from "../utils/file-system.js";

export function isImage(entry: FileEntry): boolean;
export function isPdf(entry: FileEntry): boolean;
export function isText(entry: FileEntry): boolean;
export function kindOf(
  entry: FileEntry,
): "folder" | "image" | "pdf" | "text" | "file";
export function defaultIcon(
  entry: FileEntry,
): typeof import("../icons/Folder.svelte").default;
