// @ts-check
import Document from "../icons/Document.svelte";
import Folder from "../icons/Folder.svelte";
import Image from "../icons/Image.svelte";

const PDF_EXTENSION = /\.pdf$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;
const TEXT_EXTENSIONS =
  /\.(txt|md|json|csv|log|ya?ml|xml|html?|css|[cm]?[jt]sx?|svelte|py|rb|go|rs|sh)$/i;

/** @typedef {import("../utils/file-system.js").FileEntry} FileEntry */

/** @param {FileEntry} entry */
export function isImage(entry) {
  return (
    entry.kind === "file" &&
    (entry.type?.startsWith("image/") === true ||
      IMAGE_EXTENSIONS.test(entry.name))
  );
}

/** @param {FileEntry} entry */
export function isPdf(entry) {
  return (
    entry.kind === "file" &&
    (entry.type === "application/pdf" || PDF_EXTENSION.test(entry.name))
  );
}

/** @param {FileEntry} entry */
export function isText(entry) {
  return (
    entry.kind === "file" &&
    (entry.type?.startsWith("text/") === true ||
      entry.type === "application/json" ||
      TEXT_EXTENSIONS.test(entry.name))
  );
}

/**
 * @param {FileEntry} entry
 * @returns {"folder" | "image" | "pdf" | "text" | "file"}
 */
export function kindOf(entry) {
  if (entry.kind === "folder") return "folder";
  if (isImage(entry)) return "image";
  if (isPdf(entry)) return "pdf";
  if (isText(entry)) return "text";
  return "file";
}

/**
 * The icon for an entry when the app supplies none.
 * @param {FileEntry} entry
 */
export function defaultIcon(entry) {
  const kind = kindOf(entry);
  if (kind === "folder") return Folder;
  if (kind === "image") return Image;
  return Document;
}
