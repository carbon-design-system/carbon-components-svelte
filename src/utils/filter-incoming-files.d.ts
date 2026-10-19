export type FileRejectionReason = "type" | "size" | "duplicate";

export type FileRejection = {
  file: File;
  reason: FileRejectionReason;
};

/**
 * Whether a file matches an `accept` list, using the same rules as a file
 * input. An empty list accepts every file.
 */
export function matchesAccept(
  file: File,
  accept: string | ReadonlyArray<string>,
): boolean;

/**
 * Filter incoming files by accepted type, min/max size, and duplicate rules.
 *
 * `carryRefs` marks same-reference files from `existingFiles` that should not
 * be treated as duplicates (FileUploader button re-sends existing File objects).
 */
export function filterIncomingFiles(
  incoming: ReadonlyArray<File>,
  options?: {
    accept?: string | ReadonlyArray<string>;
    minFileSize?: number;
    maxFileSize?: number;
    preventDuplicate?: boolean;
    existingFiles?: ReadonlyArray<File>;
    carryRefs?: ReadonlySet<File>;
  },
): {
  accepted: File[];
  rejected: FileRejection[];
};
