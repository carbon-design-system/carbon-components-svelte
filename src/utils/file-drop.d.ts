export interface DroppedFile {
  file: File;
  /**
   * Where the file sits inside what was dropped: `photos/2024/a.png` for a
   * folder, `a.png` for a file. No leading slash.
   */
  path: string;
}

export interface DroppedTree {
  files: DroppedFile[];
  /** Every folder that was dropped, empty ones included, outermost first. */
  folders: string[];
}

/**
 * Whether a drag carries files from outside the page. Reads `types`, the
 * only part of `DataTransfer` every browser exposes while a drag is moving.
 */
export function hasDraggedFiles(
  dataTransfer: DataTransfer | null | undefined,
): boolean;

/**
 * Every file in a drop, with the folders walked. Call it inside the `drop`
 * handler: the entries are read before the first `await`, because the
 * browser empties `dataTransfer.items` when the handler returns.
 */
export function readDroppedFiles(
  dataTransfer: DataTransfer,
): Promise<DroppedTree>;

/**
 * The files of an `<input type="file" webkitdirectory>` or a plain file
 * input, with the folders that hold them.
 */
export function readInputFiles(
  files: FileList | ReadonlyArray<File>,
): DroppedTree;
