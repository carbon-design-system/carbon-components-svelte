// @ts-check
// A reader for unified diffs: `git diff`, `git show`, `diff -u` and the
// patches a forge serves. Hunk bodies are read by their counts, so a removed
// line that starts with `-- ` is never taken for a file header.

/**
 * @typedef {Object} PatchLine
 * @property {"context" | "delete" | "insert"} type
 * @property {string} text The line without its leading `+`, `-` or space.
 * @property {boolean} [noNewline] Followed by `\ No newline at end of file`.
 */

/**
 * @typedef {Object} PatchHunk
 * @property {number} oldStart
 * @property {number} oldCount
 * @property {number} newStart
 * @property {number} newCount
 * @property {string} heading The text after the closing `@@`, such as a function name.
 * @property {PatchLine[]} lines
 */

/**
 * @typedef {Object} PatchFile
 * @property {string | null} oldPath `null` for a new file.
 * @property {string | null} newPath `null` for a deleted file.
 * @property {boolean} binary The patch holds no text for this file.
 * @property {PatchHunk[]} hunks
 */

const LINE_BREAK = /\r?\n/;
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@ ?(.*)$/;
const GIT_HEADER = /^diff --git (?:"?a\/(.+?)"?) (?:"?b\/(.+?)"?)$/;
const PATH_PREFIX = /^[ab]\//;
const PATH_TIMESTAMP = /\t.*$/;
const TRAILING_QUOTE = /"$/;

/**
 * @param {string} raw The path after `--- ` or `+++ `.
 * @returns {string | null}
 */
function readPath(raw) {
  let path = raw.replace(PATH_TIMESTAMP, "").trim();
  if (path.startsWith('"')) {
    path = path.slice(1).replace(TRAILING_QUOTE, "");
  }
  if (path === "/dev/null") return null;
  return path.replace(PATH_PREFIX, "");
}

/**
 * Read the files of a unified diff.
 *
 * Understands `diff --git` headers, plain `---`/`+++` pairs, renames, binary
 * markers and `\ No newline at end of file`. Text it cannot read is skipped,
 * so a patch pasted inside an email still yields its hunks.
 *
 * @param {string} patch
 * @returns {PatchFile[]}
 */
export function parseUnifiedDiff(patch) {
  const source = patch.split(LINE_BREAK);
  /** @type {PatchFile[]} */
  const files = [];
  /** @type {PatchFile | null} */
  let file = null;

  /** @returns {PatchFile} */
  const startFile = () => {
    /** @type {PatchFile} */
    const next = { oldPath: null, newPath: null, binary: false, hunks: [] };
    files.push(next);
    return next;
  };

  let index = 0;
  while (index < source.length) {
    const line = source[index];

    const git = GIT_HEADER.exec(line);
    if (git) {
      file = startFile();
      file.oldPath = git[1];
      file.newPath = git[2];
      index++;
      continue;
    }

    if (line.startsWith("--- ") && source[index + 1]?.startsWith("+++ ")) {
      // Git headers come first; a bare `---` pair after hunks starts a new file.
      if (!file || file.hunks.length > 0) file = startFile();
      file.oldPath = readPath(line.slice(4));
      file.newPath = readPath(source[index + 1].slice(4));
      index += 2;
      continue;
    }

    if (file && line.startsWith("rename from ")) {
      file.oldPath = line.slice(12);
    } else if (file && line.startsWith("rename to ")) {
      file.newPath = line.slice(10);
    } else if (
      file &&
      (line.startsWith("Binary files ") || line.startsWith("GIT binary patch"))
    ) {
      file.binary = true;
    }

    const header = HUNK_HEADER.exec(line);
    if (!header) {
      index++;
      continue;
    }

    if (!file) file = startFile();
    /** @type {PatchHunk} */
    const hunk = {
      oldStart: Number(header[1]),
      oldCount: header[2] === undefined ? 1 : Number(header[2]),
      newStart: Number(header[3]),
      newCount: header[4] === undefined ? 1 : Number(header[4]),
      heading: header[5],
      lines: [],
    };
    index++;

    let oldLeft = hunk.oldCount;
    let newLeft = hunk.newCount;
    while (index < source.length) {
      const body = source[index];
      const mark = body[0];
      if (mark === "\\") {
        const last = hunk.lines[hunk.lines.length - 1];
        if (last) last.noNewline = true;
        index++;
        continue;
      }
      if (oldLeft <= 0 && newLeft <= 0) break;
      // A blank line is a context line whose trailing space an editor ate.
      if (mark === " " || (body === "" && oldLeft > 0 && newLeft > 0)) {
        hunk.lines.push({ type: "context", text: body.slice(1) });
        oldLeft--;
        newLeft--;
      } else if (mark === "-" && oldLeft > 0) {
        hunk.lines.push({ type: "delete", text: body.slice(1) });
        oldLeft--;
      } else if (mark === "+" && newLeft > 0) {
        hunk.lines.push({ type: "insert", text: body.slice(1) });
        newLeft--;
      } else {
        break;
      }
      index++;
    }
    file.hunks.push(hunk);
  }

  return files.filter(
    (f) => f.hunks.length > 0 || f.binary || f.oldPath || f.newPath,
  );
}
