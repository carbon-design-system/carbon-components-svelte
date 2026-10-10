// @ts-check

/**
 * Stable identity key for duplicate detection (name, size, lastModified).
 * @param {File} file
 * @returns {string}
 */
export function fileIdentityKey(file) {
  return `${file.name}\0${file.size}\0${file.lastModified}`;
}

/**
 * Filter incoming files by min/max size and duplicate rules.
 *
 * @param {ReadonlyArray<File>} incoming
 * @param {{
 *   minFileSize?: number;
 *   maxFileSize?: number;
 *   preventDuplicate?: boolean;
 *   existingFiles?: ReadonlyArray<File>;
 *   carryRefs?: ReadonlySet<File>;
 * }} [options]
 * @returns {{
 *   accepted: File[];
 *   rejected: Array<{ file: File; reason: "size" | "duplicate" }>;
 * }}
 */
export function filterIncomingFiles(incoming, options = {}) {
  const {
    minFileSize,
    maxFileSize,
    preventDuplicate = false,
    existingFiles = [],
    carryRefs,
  } = options;

  /** @type {File[]} */
  let accepted = [...incoming];
  /** @type {Array<{ file: File; reason: "size" | "duplicate" }>} */
  const rejected = [];

  if (minFileSize !== undefined || maxFileSize !== undefined) {
    /** @param {File} file */
    function isOutOfRange(file) {
      return (
        (minFileSize !== undefined && file.size < minFileSize) ||
        (maxFileSize !== undefined && file.size > maxFileSize)
      );
    }
    const outOfRange = accepted.filter(isOutOfRange);
    accepted = accepted.filter((file) => !isOutOfRange(file));
    for (const file of outOfRange) {
      rejected.push({ file, reason: "size" });
    }
  }

  if (preventDuplicate) {
    const existingKeys = new Set(existingFiles.map(fileIdentityKey));
    /** @param {File} file */
    function isDuplicate(file) {
      return (
        !(carryRefs?.has(file) ?? false) &&
        existingKeys.has(fileIdentityKey(file))
      );
    }
    const duplicates = accepted.filter(isDuplicate);
    accepted = accepted.filter((file) => !isDuplicate(file));
    for (const file of duplicates) {
      rejected.push({ file, reason: "duplicate" });
    }
  }

  return { accepted, rejected };
}
