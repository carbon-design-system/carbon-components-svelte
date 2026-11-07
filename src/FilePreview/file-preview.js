// @ts-check
// Pure helpers for FilePreview: type detection, the renderer registry,
// text decoding, and the parsers the built-in renderers share. Nothing here
// touches the DOM, so it runs on the server and is unit-tested directly.

/**
 * @typedef {"image" | "pdf" | "video" | "audio" | "markdown" | "json" | "csv" | "text"} FileKind
 */

/**
 * A renderer component takes `file` and `options` props, whatever else it has.
 * @typedef {import("svelte").ComponentType<import("svelte").SvelteComponent<any>>} RendererComponent
 */

/**
 * @typedef {object} FilePreviewRenderer
 * @property {string} [id] - A name for `load` events and for overriding a built-in.
 * @property {(mime: string, name: string) => boolean} match - Whether this renderer can show the file. `mime` is lowercase with no parameters (empty when unknown); `name` is the file name.
 * @property {RendererComponent} [component] - The renderer component.
 * @property {() => Promise<{ default: RendererComponent }>} [load] - Loads the component on first use, such as `() => import("./Viewer.svelte")`. Takes the place of `component`.
 * @property {number} [maxBytes] - The most this renderer reads. Defaults to 1 MiB.
 * @property {boolean} [partial] - Set to `true` when the renderer can show the start of a file, so a larger file is cut at `maxBytes` instead of falling through to the next renderer.
 * @property {boolean} [stream] - Set to `true` for a renderer that streams from a URL (audio, video). It is never read into memory, so `maxBytes` does not apply and a `src` is used as it is.
 */

/**
 * @typedef {object} PreviewFile
 * What a renderer is given as its `file` prop.
 * @property {Blob} blob - The bytes: the whole file, or its first `maxBytes` when `truncated`. Empty for a streamed `src`.
 * @property {string} url - An object URL for `blob` (or the `src` itself for a streaming renderer). Its type is chosen so opening it never runs the file; revoked when the preview goes.
 * @property {string} name
 * @property {string} mime - Lowercase, no parameters, `""` when unknown.
 * @property {number | undefined} size - The whole file's size in bytes, when known.
 * @property {boolean} truncated - `blob` is only the start of the file.
 */

/**
 * @typedef {object} PreviewTexts
 * @property {string} zoomIn
 * @property {string} zoomOut
 * @property {string} zoomFit
 * @property {string} showMore
 * @property {(shown: number, total: number | undefined, unit: "bytes" | "lines" | "rows") => string} truncated
 * @property {(encoding: string) => string} encoding
 */

/**
 * @typedef {object} PreviewOptions
 * What a renderer is given as its `options` prop.
 * @property {PreviewTexts} texts
 * @property {((code: string, language: string) => ReadonlyArray<{ type: string | null; text: string }> | undefined) | undefined} highlight
 * @property {string | undefined} locale
 */

/** The most characters of a file that get tokens: past it, plain text. */
const HIGHLIGHT_LIMIT = 200_000;

/**
 * Tokens for `code` in `language`, or one plain token when there is no
 * highlighter, no such language, or `code` is long.
 * @param {string} code
 * @param {string | undefined} language
 * @param {PreviewOptions["highlight"]} highlight
 * @returns {ReadonlyArray<{ type: string | null; text: string }>}
 */
export function highlightTokens(code, language, highlight) {
  if (highlight && language && code.length <= HIGHLIGHT_LIMIT) {
    try {
      const tokens = highlight(code, language);
      if (tokens) return tokens;
    } catch {
      // A highlighter that throws leaves the code plain.
    }
  }
  return [{ type: null, text: code }];
}

const KIB = 1024;
const MIB = 1024 * KIB;

/** Extensions by kind. A file's own MIME type wins unless it is generic. */
const EXTENSION_KINDS = /** @type {Record<string, FileKind>} */ ({
  png: "image",
  apng: "image",
  jpg: "image",
  jpeg: "image",
  jfif: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  ico: "image",
  svg: "image",
  pdf: "pdf",
  mp4: "video",
  m4v: "video",
  webm: "video",
  ogv: "video",
  mov: "video",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  oga: "audio",
  ogg: "audio",
  opus: "audio",
  flac: "audio",
  aac: "audio",
  md: "markdown",
  markdown: "markdown",
  json: "json",
  csv: "csv",
  tsv: "csv",
  tab: "csv",
});

/** Plain-text extensions that are not otherwise a kind, with their highlight language. */
const TEXT_LANGUAGES = /** @type {Record<string, string | null>} */ ({
  txt: null,
  log: null,
  text: null,
  yml: null,
  yaml: null,
  toml: null,
  ini: null,
  cfg: null,
  conf: null,
  env: null,
  py: null,
  rb: null,
  go: null,
  rs: null,
  java: null,
  kt: null,
  c: null,
  h: null,
  cc: null,
  cpp: null,
  hpp: null,
  cs: null,
  php: null,
  sql: null,
  js: "js",
  mjs: "js",
  cjs: "js",
  jsx: "jsx",
  ts: "ts",
  mts: "ts",
  cts: "ts",
  tsx: "tsx",
  svelte: "svelte",
  html: "html",
  htm: "html",
  xml: "xml",
  xsl: "xml",
  xsd: "xml",
  plist: "xml",
  css: "css",
  scss: "scss",
  jsonc: "jsonc",
  jsonl: "json",
  ndjson: "json",
  sh: "sh",
  bash: "sh",
  zsh: "sh",
  diff: "diff",
  patch: "diff",
});

/**
 * MIME types that say little: the browser had no idea, or a server or OS
 * mapped the extension to something wrong (`.csv` is `application/vnd.ms-excel`
 * on Windows, and `.ts` is `video/mp2t`). The extension decides for these.
 */
const UNRELIABLE_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "application/x-binary",
  "application/download",
  "text/plain",
  "application/vnd.ms-excel",
  "video/mp2t",
]);

const IMAGE_TYPES = new Set([
  "image/png",
  "image/apng",
  "image/jpeg",
  "image/pjpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/svg+xml",
]);

const TEXT_APPLICATION_TYPES = new Set([
  "application/xml",
  "application/javascript",
  "application/x-javascript",
  "application/typescript",
  "application/x-sh",
  "application/x-shellscript",
  "application/yaml",
  "application/x-yaml",
  "application/toml",
  "application/sql",
  "application/x-httpd-php",
  "application/x-ndjson",
  "application/x-diff",
]);

/**
 * Lowercase a MIME type and drop its parameters (`text/plain; charset=utf-8`).
 * @param {string | null | undefined} type
 * @returns {string}
 */
export function normalizeMime(type) {
  if (!type) return "";
  const end = type.indexOf(";");
  return (end === -1 ? type : type.slice(0, end)).trim().toLowerCase();
}

/**
 * The lowercase extension of a file name, without the dot, or `""`.
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function extensionOf(name) {
  if (!name) return "";
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

/**
 * @param {string} mime
 * @returns {FileKind | undefined}
 */
function kindOfMime(mime) {
  if (!mime) return undefined;
  if (IMAGE_TYPES.has(mime)) return "image";
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "text/markdown" || mime === "text/x-markdown") return "markdown";
  if (
    mime === "application/json" ||
    mime === "text/json" ||
    (mime.startsWith("application/") && mime.endsWith("+json"))
  ) {
    return "json";
  }
  if (mime === "text/csv" || mime === "text/tab-separated-values") {
    return "csv";
  }
  if (
    mime.startsWith("text/") ||
    TEXT_APPLICATION_TYPES.has(mime) ||
    (mime.startsWith("application/") && mime.endsWith("+xml"))
  ) {
    return "text";
  }
  return undefined;
}

/**
 * What kind of file this is, from its MIME type and name. The MIME type wins,
 * except where it is generic or known to be wrong, where the extension does.
 * A file whose declared type and extension disagree is shown as its declared
 * type, so a `.png` that says `text/html` is source text, never an image.
 * @param {string | null | undefined} mime
 * @param {string | null | undefined} name
 * @returns {FileKind | undefined}
 */
export function fileKind(mime, name) {
  const type = normalizeMime(mime);
  const ext = extensionOf(name);
  const byExtension =
    EXTENSION_KINDS[ext] ?? (ext in TEXT_LANGUAGES ? "text" : undefined);
  if (UNRELIABLE_TYPES.has(type)) {
    return byExtension ?? kindOfMime(type);
  }
  return kindOfMime(type) ?? byExtension;
}

/**
 * The language to highlight a text file in (a `tokenize` language), or
 * `undefined` for plain text.
 * @param {string | null | undefined} mime
 * @param {string | null | undefined} name
 * @returns {string | undefined}
 */
export function languageOf(mime, name) {
  const fromExtension = TEXT_LANGUAGES[extensionOf(name)];
  if (fromExtension) return fromExtension;
  const type = normalizeMime(mime);
  if (type === "text/html" || type === "application/xhtml+xml") return "html";
  if (type.endsWith("javascript")) return "js";
  if (type === "text/css") return "css";
  if (type === "application/xml" || type === "text/xml") return "xml";
  if (type.endsWith("json")) return "json";
  return undefined;
}

/**
 * The renderer registry, built-ins only. Each `match` goes through
 * `fileKind`. App renderers come first in the list FilePreview searches, so
 * they win; a built-in is replaced by listing one with the same `id`.
 * @type {ReadonlyArray<FilePreviewRenderer>}
 */
export const defaultRenderers = [
  {
    id: "image",
    match: (mime, name) => fileKind(mime, name) === "image",
    load: () => import("./renderers/FilePreviewImage.svelte"),
    maxBytes: 20 * MIB,
  },
  {
    id: "pdf",
    match: (mime, name) => fileKind(mime, name) === "pdf",
    load: () => import("./renderers/FilePreviewPdf.svelte"),
    maxBytes: 25 * MIB,
  },
  {
    id: "video",
    match: (mime, name) => fileKind(mime, name) === "video",
    load: () => import("./renderers/FilePreviewMedia.svelte"),
    stream: true,
  },
  {
    id: "audio",
    match: (mime, name) => fileKind(mime, name) === "audio",
    load: () => import("./renderers/FilePreviewMedia.svelte"),
    stream: true,
  },
  {
    id: "markdown",
    match: (mime, name) => fileKind(mime, name) === "markdown",
    load: () => import("./renderers/FilePreviewMarkdown.svelte"),
    maxBytes: 512 * KIB,
    partial: true,
  },
  {
    id: "json",
    match: (mime, name) => fileKind(mime, name) === "json",
    load: () => import("./renderers/FilePreviewJson.svelte"),
    maxBytes: 2 * MIB,
  },
  {
    id: "csv",
    match: (mime, name) => fileKind(mime, name) === "csv",
    load: () => import("./renderers/FilePreviewCsv.svelte"),
    maxBytes: 2 * MIB,
    partial: true,
  },
  {
    id: "text",
    match: (mime, name) => {
      const kind = fileKind(mime, name);
      // JSON and Markdown fall through to here when they are too large.
      return kind === "text" || kind === "json" || kind === "markdown";
    },
    load: () => import("./renderers/FilePreviewText.svelte"),
    maxBytes: MIB,
    partial: true,
  },
];

export const DEFAULT_MAX_BYTES = MIB;

/**
 * Merge app renderers with the built-ins. An app renderer with the `id` of a
 * built-in replaces it in place; the rest go first.
 * @param {ReadonlyArray<FilePreviewRenderer> | undefined} custom
 * @returns {ReadonlyArray<FilePreviewRenderer>}
 */
export function mergeRenderers(custom) {
  if (!custom || custom.length === 0) return defaultRenderers;
  const ids = new Set(custom.map((renderer) => renderer.id).filter(Boolean));
  return [
    ...custom,
    ...defaultRenderers.filter((renderer) => !ids.has(renderer.id)),
  ];
}

/**
 * Whether two renderer lists hold the same renderer objects, so a consumer
 * that rebuilds an equal array does not reload the file.
 * @param {ReadonlyArray<unknown> | undefined} a
 * @param {ReadonlyArray<unknown> | undefined} b
 */
export function sameRenderers(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * The first renderer that matches and can take a file of `size` bytes: within
 * its `maxBytes`, or `partial`, or `stream`. A size of `undefined` is unknown,
 * which any renderer accepts (the read is capped instead).
 * @param {ReadonlyArray<FilePreviewRenderer>} renderers
 * @param {string} mime
 * @param {string} name
 * @param {number | undefined} size
 * @returns {{ renderer?: FilePreviewRenderer; reason?: "unsupported" | "too-large" }}
 */
export function pickRenderer(renderers, mime, name, size) {
  let matched = false;
  for (const renderer of renderers) {
    let ok = false;
    try {
      ok = renderer.match(mime, name);
    } catch {
      ok = false;
    }
    if (!ok) continue;
    matched = true;
    if (
      size === undefined ||
      renderer.partial ||
      renderer.stream ||
      size <= (renderer.maxBytes ?? DEFAULT_MAX_BYTES)
    ) {
      return { renderer };
    }
  }
  return { reason: matched ? "too-large" : "unsupported" };
}

// A byte in a text file that is almost never there on purpose: NUL and the
// C0 controls other than tab, line feed, form feed, carriage return, escape.
/** @param {number} byte */
function isControl(byte) {
  return (
    byte < 32 &&
    byte !== 9 &&
    byte !== 10 &&
    byte !== 12 &&
    byte !== 13 &&
    byte !== 27
  );
}

/**
 * Whether bytes are probably not text: a NUL byte, many other control bytes,
 * or the signature of a common binary format. Reads the first 8 KiB only.
 * @param {Uint8Array} bytes
 * @returns {boolean}
 */
export function looksBinary(bytes) {
  const n = Math.min(bytes.length, 8 * KIB);
  if (n === 0) return false;
  // PNG, GIF, JPEG, PDF, ZIP (and so Office files), gzip, ELF.
  const b0 = bytes[0];
  const b1 = bytes[1];
  if (
    (b0 === 0x89 && b1 === 0x50) ||
    (b0 === 0x47 && b1 === 0x49 && bytes[2] === 0x46) ||
    (b0 === 0xff && b1 === 0xd8) ||
    (b0 === 0x25 && b1 === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) ||
    (b0 === 0x50 && b1 === 0x4b && bytes[2] === 3) ||
    (b0 === 0x1f && b1 === 0x8b) ||
    (b0 === 0x7f && b1 === 0x45 && bytes[2] === 0x4c)
  ) {
    return true;
  }
  let controls = 0;
  for (let i = 0; i < n; i++) {
    const byte = bytes[i];
    if (byte === 0) return true;
    if (isControl(byte)) controls++;
  }
  return controls / n > 0.1;
}

/**
 * @typedef {object} DecodedText
 * @property {string} text
 * @property {string} encoding - `utf-8`, `utf-16le`, `utf-16be` or `windows-1252`.
 * @property {boolean} binary - The bytes do not look like text; `text` is empty.
 */

/**
 * Decode bytes as text. A byte order mark picks UTF-8, UTF-16LE or UTF-16BE.
 * Otherwise strict UTF-8 is tried, and a file it rejects is read as
 * Windows-1252, which maps every byte, so legacy Western text shows up
 * instead of a wall of replacement characters. Pass `truncated` for bytes cut
 * from a longer file, so a multi-byte character cut at the end is dropped
 * rather than counted as invalid.
 * @param {Uint8Array} bytes
 * @param {boolean} [truncated]
 * @returns {DecodedText}
 */
export function decodeText(bytes, truncated = false) {
  /** @type {string} */
  let encoding = "utf-8";
  let start = 0;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    start = 3;
  } else if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    encoding = "utf-16le";
    start = 2;
  } else if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    encoding = "utf-16be";
    start = 2;
  } else if (looksBinary(bytes)) {
    return { text: "", encoding, binary: true };
  }
  const body = start ? bytes.subarray(start) : bytes;
  if (encoding !== "utf-8") {
    return {
      text: new TextDecoder(encoding).decode(body, { stream: truncated }),
      encoding,
      binary: false,
    };
  }
  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(body, {
        stream: truncated,
      }),
      encoding,
      binary: false,
    };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(body),
      encoding: "windows-1252",
      binary: false,
    };
  }
}

/**
 * Read a blob's bytes. `Blob#arrayBuffer` where it exists, `FileReader`
 * where it does not (older engines, jsdom).
 * @param {Blob} blob
 * @returns {Promise<Uint8Array>}
 */
export function readBytes(blob) {
  if (typeof blob.arrayBuffer === "function") {
    return blob.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(new Uint8Array(/** @type {ArrayBuffer} */ (reader.result)));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

// U+202A to U+202E and U+2066 to U+2069: the bidirectional overrides and
// isolates that make source read in a different order than it runs
// ("Trojan Source"). They are shown as <U+XXXX> in code.
const BIDI_CONTROLS = new Set([
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
]);

/**
 * Replace bidirectional control characters with a visible `<U+202E>`, so
 * untrusted source cannot reorder what the reader sees.
 * @param {string} text
 * @returns {string}
 */
export function revealBidi(text) {
  let out = "";
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x202a || code > 0x2069 || !BIDI_CONTROLS.has(code)) continue;
    out += `${text.slice(from, i)}<U+${code.toString(16).toUpperCase()}>`;
    from = i + 1;
  }
  return from === 0 ? text : out + text.slice(from);
}

/**
 * The end of the next piece of `text` to show from `from`: at most
 * `maxLines` lines and `maxChars` characters, cut at a line end when it can.
 * @param {string} text
 * @param {number} from
 * @param {number} [maxLines]
 * @param {number} [maxChars]
 * @returns {number}
 */
export function chunkEnd(text, from, maxLines = 400, maxChars = 48 * KIB) {
  let limit = Math.min(text.length, from + maxChars);
  let i = from;
  let lines = 0;
  while (i < limit) {
    const newline = text.indexOf("\n", i);
    if (newline === -1 || newline >= limit) break;
    i = newline + 1;
    lines++;
    if (lines >= maxLines) return i;
  }
  if (limit < text.length) {
    const high = text.charCodeAt(limit - 1);
    if (high >= 0xd800 && high <= 0xdbff) limit--;
  }
  return limit;
}

const WHITESPACE = /\s/;

/**
 * Re-indent JSON text without parsing it into values, so numbers keep every
 * digit and keys keep their order and duplicates. Returns `null` when the
 * text is not valid JSON.
 * @param {string} text
 * @param {number} [indent]
 * @returns {string | null}
 */
export function prettyJson(text, indent = 2) {
  try {
    JSON.parse(text);
  } catch {
    return null;
  }
  const pad = " ".repeat(indent);
  let out = "";
  let depth = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < n && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j + 1;
    } else if (ch === "{" || ch === "[") {
      let j = i + 1;
      while (j < n && WHITESPACE.test(text[j])) j++;
      if (text[j] === (ch === "{" ? "}" : "]")) {
        out += ch + text[j];
        i = j + 1;
      } else {
        depth++;
        out += `${ch}\n${pad.repeat(depth)}`;
        i++;
      }
    } else if (ch === "}" || ch === "]") {
      depth--;
      out += `\n${pad.repeat(depth)}${ch}`;
      i++;
    } else if (ch === ",") {
      out += `,\n${pad.repeat(depth)}`;
      i++;
    } else if (ch === ":") {
      out += ": ";
      i++;
    } else if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      i++;
    } else {
      let j = i;
      while (j < n && !",:]} \n\r\t".includes(text[j])) j++;
      out += text.slice(i, j);
      i = j;
    }
  }
  return out;
}

/**
 * @typedef {object} ParsedCsv
 * @property {string[][]} rows
 * @property {boolean} more - There were more rows than `maxRows`.
 * @property {string} delimiter
 * @property {number} columns - The widest row, capped at `maxColumns`.
 */

/**
 * Read the delimiter off the first line: the comma, tab, semicolon or pipe
 * that appears most outside quotes.
 * @param {string} text
 * @returns {string}
 */
export function sniffDelimiter(text) {
  const counts = { ",": 0, "\t": 0, ";": 0, "|": 0 };
  let quoted = false;
  const end = Math.min(text.length, 4096);
  for (let i = 0; i < end; i++) {
    const ch = text[i];
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === "\n" || ch === "\r")) break;
    else if (!quoted && ch in counts) {
      counts[/** @type {keyof typeof counts} */ (ch)]++;
    }
  }
  let best = ",";
  let bestCount = counts[","];
  for (const key of /** @type {const} */ (["\t", ";", "|"])) {
    if (counts[key] > bestCount) {
      best = key;
      bestCount = counts[key];
    }
  }
  return best;
}

/**
 * Parse CSV or TSV (RFC 4180: quoted fields, doubled quotes, newlines in
 * quotes) in one pass. Stops after `maxRows` rows, caps a cell at
 * `maxCell` characters and a row at `maxColumns` cells, so a hostile file
 * cannot build a huge table.
 * @param {string} text
 * @param {{ delimiter?: string; maxRows?: number; maxColumns?: number; maxCell?: number }} [options]
 * @returns {ParsedCsv}
 */
export function parseCsv(text, options = {}) {
  const delimiter = options.delimiter ?? sniffDelimiter(text);
  const maxRows = options.maxRows ?? 10000;
  const maxColumns = options.maxColumns ?? 100;
  const maxCell = options.maxCell ?? 1000;
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let cell = "";
  let quoted = false;
  let widest = 0;
  let more = false;
  const n = text.length;
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;

  const endCell = () => {
    if (row.length < maxColumns) row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    if (row.length > widest) widest = row.length;
    rows.push(row);
    row = [];
  };

  for (; i < n; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          if (cell.length < maxCell) cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else if (cell.length < maxCell) {
        cell += ch;
      }
    } else if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === delimiter) {
      endCell();
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      if (rows.length >= maxRows) {
        more = i + 1 < n;
        return { rows, more, delimiter, columns: widest };
      }
    } else if (cell.length < maxCell) {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) endRow();
  return { rows, more, delimiter, columns: widest };
}

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/**
 * A link target that is safe to put in an `href`: an absolute `http`,
 * `https` or `mailto` URL with no credentials. Returns the parsed form
 * (`URL#href`), so what is rendered is what was checked, or `undefined`.
 * @param {string} href
 * @returns {string | undefined}
 */
export function safeLink(href) {
  if (href.length > 2048) return undefined;
  for (let i = 0; i < href.length; i++) {
    const code = href.charCodeAt(i);
    // Controls, and the space and DEL a browser would trim or strip.
    if (code <= 32 || code === 127) return undefined;
  }
  try {
    const url = new URL(href);
    if (!SAFE_LINK_PROTOCOLS.has(url.protocol)) return undefined;
    if (url.username || url.password) return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

/**
 * A URL `fetch` may load for a `src`: `http`, `https`, `blob` or `data`,
 * resolved against `base`. Returns `undefined` for `javascript:` and the
 * rest.
 * @param {string} src
 * @param {string} [base]
 * @returns {string | undefined}
 */
export function safeSource(src, base) {
  try {
    const url = new URL(src, base);
    return ["http:", "https:", "blob:", "data:"].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The last path segment of a URL, decoded, as a file name.
 * @param {string} src
 * @returns {string}
 */
export function nameFromUrl(src) {
  try {
    const { pathname, protocol } = new URL(src, "http://localhost");
    if (protocol === "data:") return "";
    const last = pathname.slice(pathname.lastIndexOf("/") + 1);
    return decodeURIComponent(last);
  } catch {
    return "";
  }
}

/**
 * Types a document can run script from when navigated to or framed. The
 * object URL given to a renderer other than the image renderer, and the one
 * behind the download link, never carries one of these.
 */
const ACTIVE_TYPES = new Set([
  "text/html",
  "application/xhtml+xml",
  "image/svg+xml",
  "text/xml",
  "application/xml",
  "text/xsl",
  "text/javascript",
  "application/javascript",
  "application/x-javascript",
  "text/css",
  "application/pdf",
]);

/**
 * The type for an object URL, so that opening it can never run the file.
 * Only the image renderer keeps `image/svg+xml` (an `<img>` runs no script),
 * and only the PDF renderer keeps `application/pdf`.
 * @param {string} mime
 * @param {string | undefined} rendererId
 * @returns {string}
 */
export function safeBlobType(mime, rendererId) {
  if (rendererId === "image" && mime.startsWith("image/")) return mime;
  if (rendererId === "pdf") return "application/pdf";
  if (!mime || ACTIVE_TYPES.has(mime) || mime.endsWith("+xml")) {
    return "application/octet-stream";
  }
  return mime;
}

/**
 * Read at most `cap` bytes of a response body, then stop the download, so a
 * file of any size costs `cap` bytes of memory and traffic at most.
 * @param {Response} response
 * @param {number} cap
 * @returns {Promise<{ blob: Blob; truncated: boolean }>}
 */
export async function readCapped(response, cap) {
  const reader = response.body?.getReader();
  if (!reader) {
    // No stream (an old engine): the body is read whole, then cut.
    const whole = await response.blob();
    return whole.size > cap
      ? { blob: whole.slice(0, cap), truncated: true }
      : { blob: whole, truncated: false };
  }
  /** @type {BlobPart[]} */
  const chunks = [];
  let total = 0;
  let truncated = false;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop -- each chunk waits for the last
    const { done, value } = await reader.read();
    if (done) break;
    if (total + value.length > cap) {
      chunks.push(/** @type {BlobPart} */ (value.subarray(0, cap - total)));
      total = cap;
      truncated = true;
      // eslint-disable-next-line no-await-in-loop -- the loop ends here
      await reader.cancel();
      break;
    }
    chunks.push(/** @type {BlobPart} */ (value));
    total += value.length;
  }
  return { blob: new Blob(chunks), truncated };
}
