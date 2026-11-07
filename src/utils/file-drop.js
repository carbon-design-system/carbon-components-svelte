// @ts-check
// Files from the operating system: a drop (`DataTransfer`) or a
// `webkitdirectory` input, as a flat list of files with their path inside the
// dropped folder.

/**
 * @typedef {Object} DroppedFile
 * @property {File} file
 * @property {string} path - Where the file sits inside what was dropped: `photos/2024/a.png` for a folder, `a.png` for a file. No leading slash.
 */

/**
 * @typedef {Object} DroppedTree
 * @property {DroppedFile[]} files
 * @property {string[]} folders - Every folder that was dropped, empty ones included, outermost first.
 */

/**
 * Whether a drag carries files from outside the page. Reads `types`, the only
 * part of `DataTransfer` every browser exposes while the drag is still
 * moving: `getData` and `items` are empty until the drop.
 * @param {DataTransfer | null | undefined} dataTransfer
 */
export function hasDraggedFiles(dataTransfer) {
  const types = dataTransfer?.types;
  if (!types) return false;
  return Array.from(types).includes("Files");
}

/** @param {FileSystemDirectoryReader} reader */
function readBatch(reader) {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject);
  });
}

/**
 * `readEntries` returns a batch at a time (100 in Chromium), so it is called
 * until it returns an empty one.
 * @param {FileSystemDirectoryEntry} directory
 * @returns {Promise<FileSystemEntry[]>}
 */
async function readAll(directory) {
  const reader = directory.createReader();
  /** @type {FileSystemEntry[]} */
  const all = [];
  while (true) {
    // Each call continues where the last one stopped.
    // biome-ignore lint/performance/noAwaitInLoops: the reader is stateful
    const batch = /** @type {FileSystemEntry[]} */ (await readBatch(reader));
    if (batch.length === 0) return all;
    all.push(...batch);
  }
}

/** @param {FileSystemFileEntry} entry */
function fileOf(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

/**
 * @param {FileSystemEntry} entry
 * @param {string} prefix
 * @param {DroppedTree} out
 */
async function walk(entry, prefix, out) {
  const path = prefix ? `${prefix}/${entry.name}` : entry.name;
  if (entry.isFile) {
    out.files.push({
      file: /** @type {File} */ (
        await fileOf(/** @type {FileSystemFileEntry} */ (entry))
      ),
      path,
    });
    return;
  }
  out.folders.push(path);
  const children = await readAll(
    /** @type {FileSystemDirectoryEntry} */ (entry),
  );
  for (const child of children) {
    // Files keep the order of the folder.
    // biome-ignore lint/performance/noAwaitInLoops: in order
    await walk(child, path, out);
  }
}

/**
 * Every file in a drop, with the folders walked. Call it inside the `drop`
 * handler: the entries are read before the first `await`, because the browser
 * empties `dataTransfer.items` when the handler returns.
 *
 * It uses `webkitGetAsEntry`, which Chromium, Firefox and WebKit all ship.
 * `getAsFileSystemHandle` is Chromium only and adds nothing a drop needs.
 * Where there is no `webkitGetAsEntry`, only the files are returned, since a
 * folder in `dataTransfer.files` cannot be told from a file.
 *
 * @param {DataTransfer} dataTransfer
 * @returns {Promise<DroppedTree>}
 */
export async function readDroppedFiles(dataTransfer) {
  /** @type {DroppedTree} */
  const out = { files: [], folders: [] };
  const items = Array.from(dataTransfer.items ?? []);
  const canWalk = items.some(
    (item) => typeof item.webkitGetAsEntry === "function",
  );
  if (!canWalk) {
    for (const file of Array.from(dataTransfer.files ?? [])) {
      out.files.push({ file, path: file.name });
    }
    return out;
  }
  const roots = items
    .filter((item) => item.kind === "file")
    .map((item) => ({
      entry: item.webkitGetAsEntry(),
      file: item.getAsFile(),
    }));
  for (const { entry, file } of roots) {
    if (!entry) {
      if (file) out.files.push({ file, path: file.name });
      continue;
    }
    try {
      // biome-ignore lint/performance/noAwaitInLoops: in order
      await walk(entry, "", out);
    } catch (error) {
      // WebKit hands out an entry for a file it cannot reopen, such as one a
      // script put in a `DataTransfer`. The `File` itself still reads.
      if (!entry.isFile || !file) throw error;
      out.files.push({ file, path: file.name });
    }
  }
  return out;
}

/**
 * The files of an `<input type="file" webkitdirectory>` or a plain file
 * input, with the folders that hold them.
 * @param {FileList | ReadonlyArray<File>} files
 * @returns {DroppedTree}
 */
export function readInputFiles(files) {
  /** @type {DroppedTree} */
  const out = { files: [], folders: [] };
  const seen = new Set();
  for (const file of Array.from(files)) {
    const path = /** @type {any} */ (file).webkitRelativePath || file.name;
    out.files.push({ file, path });
    const parts = path.split("/");
    for (let end = 1; end < parts.length; end++) {
      const folder = parts.slice(0, end).join("/");
      if (!seen.has(folder)) {
        seen.add(folder);
        out.folders.push(folder);
      }
    }
  }
  return out;
}
