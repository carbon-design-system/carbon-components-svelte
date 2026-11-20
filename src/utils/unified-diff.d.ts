/** A reader for unified diffs: `git diff`, `git show`, `diff -u` and forge patches. */

export type PatchLine = {
  type: "context" | "delete" | "insert";
  /** The line without its leading `+`, `-` or space. */
  text: string;
  /** Followed by `\ No newline at end of file`. */
  noNewline?: boolean;
};

export type PatchHunk = {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  /** The text after the closing `@@`, such as a function name. */
  heading: string;
  lines: PatchLine[];
};

export type PatchFile = {
  /** `null` for a new file. */
  oldPath: string | null;
  /** `null` for a deleted file. */
  newPath: string | null;
  /** The patch holds no text for this file. */
  binary: boolean;
  hunks: PatchHunk[];
};

/**
 * Read the files of a unified diff.
 *
 * Understands `diff --git` headers, plain `---`/`+++` pairs, renames, binary
 * markers and `\ No newline at end of file`. Text it cannot read is skipped.
 */
export function parseUnifiedDiff(patch: string): PatchFile[];
