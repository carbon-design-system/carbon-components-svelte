// @ts-check

/**
 * Stable identity key for duplicate detection (relative path, name, size,
 * lastModified). The relative path keeps same-named files from different
 * folders of a folder selection distinct.
 * @param {File} file
 * @returns {string}
 */
function fileIdentityKey(file) {
  return `${file.webkitRelativePath ?? ""}\0${file.name}\0${file.size}\0${file.lastModified}`;
}

/**
 * Whether a file matches an `accept` list, using the same rules as a file
 * input: `.ext` matches the name's extension, `type/*` the MIME type's
 * major part, and `type/subtype` the whole MIME type, all case-insensitively.
 * An empty list accepts every file.
 *
 * @param {File} file
 * @param {string | ReadonlyArray<string>} accept
 * @returns {boolean}
 */
export function matchesAccept(file, accept) {
  const tokens = (typeof accept === "string" ? accept.split(",") : accept)
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

/**
 * Filter incoming files by accepted type, min/max size, and duplicate rules.
 *
 * @param {ReadonlyArray<File>} incoming
 * @param {{
 *   accept?: string | ReadonlyArray<string>;
 *   minFileSize?: number;
 *   maxFileSize?: number;
 *   preventDuplicate?: boolean;
 *   existingFiles?: ReadonlyArray<File>;
 *   carryRefs?: ReadonlySet<File>;
 * }} [options]
 * @returns {{
 *   accepted: File[];
 *   rejected: Array<{ file: File; reason: "type" | "size" | "duplicate" }>;
 * }}
 */
export function filterIncomingFiles(incoming, options = {}) {
  const {
    accept = [],
    minFileSize,
    maxFileSize,
    preventDuplicate = false,
    existingFiles = [],
    carryRefs,
  } = options;

  /** @type {File[]} */
  let accepted = [...incoming];
  /** @type {Array<{ file: File; reason: "type" | "size" | "duplicate" }>} */
  const rejected = [];

  for (const file of accepted) {
    if (!matchesAccept(file, accept)) rejected.push({ file, reason: "type" });
  }
  accepted = accepted.filter((file) => matchesAccept(file, accept));

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
