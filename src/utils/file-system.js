// @ts-check
// The data layer behind `FileManager`: path helpers, the sort a file browser
// expects (folders first), name checks, and `createMemoryFileSystem`, an
// in-memory `FileSystemAdapter` for docs and tests.

/**
 * @typedef {Object} FileEntry
 * @property {string} path - Absolute path, `/` at the root. It is the entry's id.
 * @property {string} name
 * @property {"file" | "folder"} kind
 * @property {number} [size] - Bytes. Folders have none.
 * @property {number} [modified] - Milliseconds since the epoch.
 * @property {string} [owner]
 * @property {string} [type] - A MIME type, such as `image/png`.
 * @property {string} [url] - Where the content can be fetched, for a preview or a thumbnail.
 */

/**
 * @typedef {Object} FileSystemAdapter
 * @property {(path: string, options?: { signal?: AbortSignal }) => Promise<FileEntry[]>} list
 * @property {(path: string) => Promise<FileEntry>} stat
 * @property {(path: string) => Promise<FileEntry>} mkdir
 * @property {(from: string, to: string) => Promise<FileEntry>} move - `to` is the full new path, so a rename is a move within one folder.
 * @property {(path: string) => Promise<void>} remove - A folder goes with everything in it.
 * @property {(file: File, path: string, options?: { onProgress?: (loaded: number, total: number) => void, signal?: AbortSignal }) => Promise<FileEntry>} upload
 * @property {(path: string) => string | Promise<string>} [url]
 */

const ROOT = "/";

/** Error with a `code` an adapter can raise and a UI can map to text. */
export class FileSystemError extends Error {
  /**
   * @param {"not-found" | "exists" | "invalid" | "aborted" | "failed"} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "FileSystemError";
    this.code = code;
  }
}

/**
 * @param {string} path
 * @returns {string} Always starts with `/`, has no trailing `/` and no empty segments.
 */
export function normalizePath(path) {
  const parts = String(path ?? "")
    .split("/")
    .filter(Boolean);
  return parts.length === 0 ? ROOT : `/${parts.join("/")}`;
}

/**
 * @param {string} folder
 * @param {string} name
 * @returns {string}
 */
export function joinPath(folder, name) {
  return normalizePath(`${folder}/${name}`);
}

/** @param {string} path */
export function parentPath(path) {
  const normal = normalizePath(path);
  const cut = normal.lastIndexOf("/");
  return cut <= 0 ? ROOT : normal.slice(0, cut);
}

/** @param {string} path */
export function baseName(path) {
  const normal = normalizePath(path);
  return normal === ROOT ? "" : normal.slice(normal.lastIndexOf("/") + 1);
}

/**
 * Every folder from the root to `path`, for breadcrumbs and for opening the
 * tree down to a folder.
 * @param {string} path
 * @returns {Array<{ name: string, path: string }>} The root has an empty name.
 */
export function pathTrail(path) {
  const trail = [{ name: "", path: ROOT }];
  let current = ROOT;
  for (const name of normalizePath(path).split("/").filter(Boolean)) {
    current = joinPath(current, name);
    trail.push({ name, path: current });
  }
  return trail;
}

/**
 * Whether `path` is `folder` or inside it.
 * @param {string} path
 * @param {string} folder
 */
export function isInside(path, folder) {
  const a = normalizePath(path);
  const b = normalizePath(folder);
  return b === ROOT || a === b || a.startsWith(`${b}/`);
}

/**
 * A name that is free in `taken`: `report.pdf` becomes `report (2).pdf`.
 * @param {string} name
 * @param {{ has(name: string): boolean }} taken
 * @param {{ folder?: boolean }} [options] - A folder has no extension to keep.
 */
export function uniqueName(name, taken, { folder = false } = {}) {
  if (!taken.has(name)) return name;
  const dot = folder ? -1 : name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : "";
  for (let count = 2; ; count++) {
    const candidate = `${stem} (${count})${extension}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * @param {string} name
 * @param {{ has(name: string): boolean }} [taken] - Sibling names. The entry's own name must not be in it.
 * @returns {"empty" | "slash" | "dots" | "exists" | null}
 */
export function validateName(name, taken) {
  const trimmed = name.trim();
  if (trimmed === "") return "empty";
  if (trimmed.includes("/")) return "slash";
  if (trimmed === "." || trimmed === "..") return "dots";
  if (taken?.has(trimmed)) return "exists";
  return null;
}

/** @type {Intl.Collator | undefined} */
let collator;

/**
 * Natural order, so `file2` comes before `file10`. Built once: the collator
 * is the expensive part of a locale-aware compare.
 * @param {string} a
 * @param {string} b
 */
export function compareNames(a, b) {
  collator ??= new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return collator.compare(a, b);
}

/** @typedef {"name" | "size" | "modified" | "owner" | "kind"} FileSortKey */

/**
 * A new array in file browser order: folders first whatever the direction,
 * then `key`, then the name to break ties.
 * @param {ReadonlyArray<FileEntry>} entries
 * @param {FileSortKey} [key]
 * @param {"ascending" | "descending" | "none"} [direction]
 * @returns {FileEntry[]}
 */
export function sortEntries(entries, key = "name", direction = "ascending") {
  const sign = direction === "descending" ? -1 : 1;
  /** @param {FileEntry} entry */
  const columnOf = (entry) => {
    if (key === "name") return undefined;
    if (key === "kind") return entry.type ?? "";
    return entry[key];
  };
  return [...entries].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    if (key !== "name" && direction !== "none") {
      const left = columnOf(a);
      const right = columnOf(b);
      if (left !== right) {
        // An entry with no value sorts last in both directions.
        if (left === undefined || left === "") return 1;
        if (right === undefined || right === "") return -1;
        const order =
          typeof left === "number" && typeof right === "number"
            ? left - right
            : compareNames(String(left), String(right));
        if (order !== 0) return order * sign;
      }
    }
    return compareNames(a.name, b.name) * (key === "name" ? sign : 1);
  });
}

/**
 * @param {number} ms
 * @param {AbortSignal | undefined} signal
 */
function wait(ms, signal) {
  if (signal?.aborted) {
    return Promise.reject(new FileSystemError("aborted", "Aborted"));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve(undefined);
    }, ms);
    function abort() {
      clearTimeout(timer);
      reject(new FileSystemError("aborted", "Aborted"));
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/**
 * @typedef {Object} MemoryFileSystemOptions
 * @property {ReadonlyArray<Partial<FileEntry> & { path: string, content?: string }>} [entries] - Files and folders to start with. A parent folder is created when missing. A folder entry is `{ path, kind: "folder" }`.
 * @property {number} [latency] - Milliseconds each call takes. Default 0.
 * @property {number} [uploadChunks] - How many progress steps an upload reports. Default 8.
 * @property {string} [owner] - Owner of an uploaded or created entry.
 * @property {(operation: "list" | "stat" | "mkdir" | "move" | "remove" | "upload", path: string) => Error | undefined} [fail] - Return an error to fail a call, for tests and error states.
 */

/**
 * An in-memory `FileSystemAdapter`. It holds folders as a map of children,
 * so listing a folder costs the folder's size, not the tree's. Every call is
 * async, takes `latency` ms and honors an `AbortSignal`.
 * @param {MemoryFileSystemOptions} [options]
 * @returns {FileSystemAdapter & { calls: Array<{ operation: string, path: string }>, size: number }}
 */
export function createMemoryFileSystem({
  entries = [],
  latency = 0,
  uploadChunks = 8,
  owner = "You",
  fail,
} = {}) {
  /** @type {Map<string, FileEntry & { content?: string, blob?: Blob, objectUrl?: string }>} */
  const nodes = new Map();
  /** @type {Map<string, Set<string>>} */
  const children = new Map();
  /** @type {Array<{ operation: string, path: string }>} */
  const calls = [];

  nodes.set(ROOT, { path: ROOT, name: "", kind: "folder" });
  children.set(ROOT, new Set());

  /** @param {string} path */
  function ensureFolder(path) {
    const normal = normalizePath(path);
    if (nodes.has(normal)) return;
    ensureFolder(parentPath(normal));
    nodes.set(normal, {
      path: normal,
      name: baseName(normal),
      kind: "folder",
      modified: Date.now(),
      owner,
    });
    children.set(normal, new Set());
    children.get(parentPath(normal))?.add(normal);
  }

  /** @param {Partial<FileEntry> & { path: string, content?: string }} spec */
  function add(spec) {
    const path = normalizePath(spec.path);
    if (spec.kind === "folder") {
      ensureFolder(path);
      return;
    }
    ensureFolder(parentPath(path));
    nodes.set(path, {
      ...spec,
      path,
      name: baseName(path),
      kind: "file",
    });
    children.get(parentPath(path))?.add(path);
  }

  for (const spec of entries) add(spec);

  /**
   * @param {"list" | "stat" | "mkdir" | "move" | "remove" | "upload"} operation
   * @param {string} path
   * @param {AbortSignal} [signal]
   * @param {boolean} [check] - Run `fail` now. An upload runs it after the last progress step.
   */
  async function enter(operation, path, signal, check = true) {
    calls.push({ operation, path });
    if (latency > 0) await wait(latency, signal);
    else if (signal?.aborted) throw new FileSystemError("aborted", "Aborted");
    const error = check ? fail?.(operation, path) : undefined;
    if (error) throw error;
  }

  /** @param {string} path */
  function get(path) {
    const node = nodes.get(normalizePath(path));
    if (!node) throw new FileSystemError("not-found", `${path} does not exist`);
    return node;
  }

  /** @param {FileEntry & { content?: string, blob?: Blob, objectUrl?: string }} node */
  function publicEntry(node) {
    const {
      content: _content,
      blob: _blob,
      objectUrl: _objectUrl,
      ...entry
    } = node;
    return { ...entry };
  }

  /** @param {string} path */
  function removeTree(path) {
    for (const child of children.get(path) ?? []) removeTree(child);
    const node = nodes.get(path);
    if (node?.objectUrl && typeof URL !== "undefined") {
      URL.revokeObjectURL(node.objectUrl);
    }
    nodes.delete(path);
    children.delete(path);
  }

  /** @param {string} from @param {string} to */
  function relocate(from, to) {
    const node = /** @type {NonNullable<ReturnType<typeof nodes.get>>} */ (
      nodes.get(from)
    );
    nodes.delete(from);
    node.path = to;
    node.name = baseName(to);
    node.modified = Date.now();
    nodes.set(to, node);
    const kids = children.get(from);
    if (kids) {
      children.delete(from);
      const moved = new Set();
      for (const child of kids) {
        const next = joinPath(to, baseName(child));
        relocate(child, next);
        moved.add(next);
      }
      children.set(to, moved);
    }
  }

  return {
    calls,
    get size() {
      return nodes.size - 1;
    },

    async list(path, { signal } = {}) {
      await enter("list", path, signal);
      const folder = get(path);
      if (folder.kind !== "folder") {
        throw new FileSystemError("invalid", `${path} is not a folder`);
      }
      const out = [];
      for (const child of children.get(folder.path) ?? []) {
        out.push(publicEntry(/** @type {any} */ (nodes.get(child))));
      }
      return out;
    },

    async stat(path) {
      await enter("stat", path);
      return publicEntry(get(path));
    },

    async mkdir(path) {
      await enter("mkdir", path);
      const normal = normalizePath(path);
      if (nodes.has(normal)) {
        throw new FileSystemError(
          "exists",
          `${baseName(normal)} already exists`,
        );
      }
      if (get(parentPath(normal)).kind !== "folder") {
        throw new FileSystemError("invalid", "The parent is not a folder");
      }
      ensureFolder(normal);
      return publicEntry(get(normal));
    },

    async move(from, to) {
      await enter("move", from);
      const source = normalizePath(from);
      const target = normalizePath(to);
      get(source);
      if (source === ROOT || isInside(target, source)) {
        throw new FileSystemError(
          "invalid",
          "A folder cannot move into itself",
        );
      }
      if (get(parentPath(target)).kind !== "folder") {
        throw new FileSystemError("invalid", "The target is not a folder");
      }
      if (source === target) return publicEntry(get(source));
      if (nodes.has(target)) {
        throw new FileSystemError(
          "exists",
          `${baseName(target)} already exists`,
        );
      }
      children.get(parentPath(source))?.delete(source);
      relocate(source, target);
      children.get(parentPath(target))?.add(target);
      return publicEntry(get(target));
    },

    async remove(path) {
      await enter("remove", path);
      const normal = normalizePath(path);
      get(normal);
      if (normal === ROOT) {
        throw new FileSystemError("invalid", "The root cannot be removed");
      }
      children.get(parentPath(normal))?.delete(normal);
      removeTree(normal);
    },

    async upload(file, path, { onProgress, signal } = {}) {
      await enter("upload", path, signal, false);
      const normal = normalizePath(path);
      ensureFolder(parentPath(normal));
      if (nodes.has(normal)) {
        throw new FileSystemError(
          "exists",
          `${baseName(normal)} already exists`,
        );
      }
      const steps = Math.max(1, uploadChunks);
      for (let step = 1; step <= steps; step++) {
        // biome-ignore lint/performance/noAwaitInLoops: one step after another
        if (latency > 0) await wait(latency, signal);
        else if (signal?.aborted)
          throw new FileSystemError("aborted", "Aborted");
        onProgress?.(Math.round((file.size * step) / steps), file.size);
      }
      const failure = fail?.("upload", normal);
      if (failure) throw failure;
      add({
        path: normal,
        size: file.size,
        type: file.type || undefined,
        modified: file.lastModified || Date.now(),
        owner,
      });
      /** @type {any} */ (nodes.get(normal)).blob = file;
      children.get(parentPath(normal))?.add(normal);
      return publicEntry(get(normal));
    },

    url(path) {
      try {
        const node = get(path);
        if (node.url) return node.url;
        if (node.content !== undefined) {
          return `data:${node.type ?? "text/plain"};charset=utf-8,${encodeURIComponent(node.content)}`;
        }
        if (node.blob && typeof URL !== "undefined") {
          node.objectUrl ??= URL.createObjectURL(node.blob);
          return node.objectUrl;
        }
        throw new FileSystemError("not-found", `${path} has no content`);
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
}
