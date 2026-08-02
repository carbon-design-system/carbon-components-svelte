export type FileRejectionReason = "size" | "duplicate";

export type FileRejection = {
  file: File;
  reason: FileRejectionReason;
};

/** Stable identity key for duplicate detection (name, size, lastModified). */
export function fileIdentityKey(file: File): string;

/**
 * Filter incoming files by max size and duplicate rules.
 *
 * `carryRefs` marks same-reference files from `existingFiles` that should not
 * be treated as duplicates (FileUploader button re-sends existing File objects).
 */
export function filterIncomingFiles(
  incoming: ReadonlyArray<File>,
  options?: {
    maxFileSize?: number;
    preventDuplicate?: boolean;
    existingFiles?: ReadonlyArray<File>;
    carryRefs?: ReadonlySet<File>;
  },
): {
  accepted: File[];
  rejected: FileRejection[];
};
