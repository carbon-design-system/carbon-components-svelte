export interface FileEntry {
  /** Absolute path, `/` at the root. It is the entry's id. */
  path: string;
  name: string;
  kind: "file" | "folder";
  /** Bytes. Folders have none. */
  size?: number;
  /** Milliseconds since the epoch. */
  modified?: number;
  owner?: string;
  /** A MIME type, such as `image/png`. */
  type?: string;
  /** Where the content can be fetched, for a preview or a thumbnail. */
  url?: string;
}

export interface FileSystemAdapter {
  list(path: string, options?: { signal?: AbortSignal }): Promise<FileEntry[]>;
  stat(path: string): Promise<FileEntry>;
  mkdir(path: string): Promise<FileEntry>;
  /** `to` is the full new path, so a rename is a move within one folder. */
  move(from: string, to: string): Promise<FileEntry>;
  /** A folder goes with everything in it. */
  remove(path: string): Promise<void>;
  upload(
    file: File,
    path: string,
    options?: {
      onProgress?: (loaded: number, total: number) => void;
      signal?: AbortSignal;
    },
  ): Promise<FileEntry>;
  url?(path: string): string | Promise<string>;
}

export type FileSortKey = "name" | "size" | "modified" | "owner" | "kind";

/** Error with a `code` an adapter can raise and a UI can map to text. */
export class FileSystemError extends Error {
  constructor(
    code: "not-found" | "exists" | "invalid" | "aborted" | "failed",
    message: string,
  );
  code: "not-found" | "exists" | "invalid" | "aborted" | "failed";
}

/** Always starts with `/`, has no trailing `/` and no empty segments. */
export function normalizePath(path: string): string;
export function joinPath(folder: string, name: string): string;
export function parentPath(path: string): string;
export function baseName(path: string): string;

/**
 * Every folder from the root to `path`, for breadcrumbs and for opening the
 * tree down to a folder. The root has an empty name.
 */
export function pathTrail(path: string): Array<{ name: string; path: string }>;

/** Whether `path` is `folder` or inside it. */
export function isInside(path: string, folder: string): boolean;

/** A name that is free in `taken`: `report.pdf` becomes `report (2).pdf`. */
export function uniqueName(
  name: string,
  taken: { has(name: string): boolean },
  options?: { folder?: boolean },
): string;

/** `taken` holds the sibling names, without the entry's own. */
export function validateName(
  name: string,
  taken?: { has(name: string): boolean },
): "empty" | "slash" | "dots" | "exists" | null;

/** Natural order, so `file2` comes before `file10`. */
export function compareNames(a: string, b: string): number;

/**
 * A new array in file browser order: folders first whatever the direction,
 * then `key`, then the name to break ties.
 */
export function sortEntries(
  entries: ReadonlyArray<FileEntry>,
  key?: FileSortKey,
  direction?: "ascending" | "descending" | "none",
): FileEntry[];

export interface MemoryFileSystemOptions {
  /**
   * Files and folders to start with. A parent folder is created when
   * missing. A folder entry is `{ path, kind: "folder" }`.
   */
  entries?: ReadonlyArray<
    Partial<FileEntry> & { path: string; content?: string }
  >;
  /** Milliseconds each call takes. Default 0. */
  latency?: number;
  /** How many progress steps an upload reports. Default 8. */
  uploadChunks?: number;
  /** Owner of an uploaded or created entry. */
  owner?: string;
  /** Return an error to fail a call, for tests and error states. */
  fail?: (
    operation: "list" | "stat" | "mkdir" | "move" | "remove" | "upload",
    path: string,
  ) => Error | undefined;
}

/**
 * An in-memory `FileSystemAdapter`. It holds folders as a map of children,
 * so listing a folder costs the folder's size, not the tree's. Every call is
 * async, takes `latency` ms and honors an `AbortSignal`.
 */
export function createMemoryFileSystem(
  options?: MemoryFileSystemOptions,
): FileSystemAdapter & {
  calls: Array<{ operation: string; path: string }>;
  readonly size: number;
};
