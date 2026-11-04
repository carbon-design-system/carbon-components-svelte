// @ts-check
// The body of a comment: plain text with mentions and links, plus a small
// Markdown subset. It is parsed to a tree of runs and rendered as elements,
// never as HTML, so there is nothing to sanitize: a `<script>` in a body is
// the text "<script>". Pure and DOM-free, so the same parse runs on the
// server and in tests.

/**
 * @typedef {{ type: "text"; text: string; strong?: boolean; em?: boolean }
 *   | { type: "code"; text: string }
 *   | { type: "link"; text: string; href: string }
 *   | { type: "mention"; text: string; id: string; trigger: string }
 *   | { type: "br" }} ActivityBodyRun
 *
 * @typedef {{ type: "paragraph"; runs: ActivityBodyRun[] }
 *   | { type: "quote"; runs: ActivityBodyRun[] }
 *   | { type: "list"; items: ActivityBodyRun[][] }
 *   | { type: "code"; text: string }} ActivityBodyBlock
 */

/** Longer bodies are cut here, so parsing stays linear on hostile input. */
export const MAX_BODY_LENGTH = 20_000;

const MENTION_START = "";
const MENTION_END = "";
const PRIVATE_USE = /[]/g;
const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const PUNCTUATION = /[!-/:-@[-`{-~]/;
const WORD = /[\p{L}\p{N}]/u;
const URL_END = /[\s<>"]/;
const TRAILING = /[.,;:!?'"*_~]/;
const MENTION_TOKEN = /@\[((?:[^\]\\]|\\.)*)\]\(((?:[^)\\\r\n]|\\.)*)\)/g;
const CONTROL_OR_SPACE = /[\p{Cc}\s]/u;
const EDGE_SPACE = /^\s|\s$/;
const HTTP_START = /^https?:\/\//i;
const LINE_BREAK = /\r\n?|\n/;
const COLLAPSIBLE_SPACE = /\s+/g;
const UNESCAPE = /\\(.)/g;

/**
 * Whether a link target may be rendered as `href`: absolute `http`, `https`
 * and `mailto` only. `javascript:` and `data:` are refused.
 * @param {string} url
 * @returns {string | undefined} The normalized URL, or `undefined`.
 */
export function safeUrl(url) {
  const trimmed = url.trim();
  if (!trimmed || CONTROL_OR_SPACE.test(trimmed)) return undefined;
  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

/**
 * @param {string} text
 * @returns {{ text: string; mentions: { text: string; id: string }[] }}
 */
function extractMentions(text) {
  /** @type {{ text: string; id: string }[]} */
  const mentions = [];
  const replaced = text.replace(MENTION_TOKEN, (_, label, id) => {
    mentions.push({
      text: label.replace(UNESCAPE, "$1"),
      id: id.replace(UNESCAPE, "$1"),
    });
    return `${MENTION_START}${mentions.length - 1}${MENTION_END}`;
  });
  return { text: replaced, mentions };
}

/**
 * @param {string} text
 * @param {number} from
 * @param {string} marker
 * @returns {number} Index of the closing `marker`, or -1.
 */
function findClose(text, from, marker) {
  return text.indexOf(marker, from);
}

/**
 * @param {string} text
 * @param {{ text: string; id: string }[]} mentions
 * @param {{ strong?: boolean; em?: boolean }} flags
 * @param {number} depth
 * @returns {ActivityBodyRun[]}
 */
function parseInline(text, mentions, flags, depth) {
  /** @type {ActivityBodyRun[]} */
  const runs = [];
  let buffer = "";
  const lastBracket = text.lastIndexOf("]");

  function flush() {
    if (!buffer) return;
    /** @type {ActivityBodyRun} */
    const run = { type: "text", text: buffer };
    if (flags.strong) run.strong = true;
    if (flags.em) run.em = true;
    runs.push(run);
    buffer = "";
  }

  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : "";

    if (ch === "\\" && i + 1 < text.length && PUNCTUATION.test(text[i + 1])) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === MENTION_START) {
      const end = text.indexOf(MENTION_END, i);
      const mention = mentions[Number(text.slice(i + 1, end))];
      if (end > i && mention) {
        flush();
        runs.push({ type: "mention", trigger: "@", ...mention });
        i = end + 1;
        continue;
      }
    }

    if (ch === "`") {
      const close = findClose(text, i + 1, "`");
      if (close > i + 1) {
        flush();
        runs.push({ type: "code", text: text.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }

    if (
      depth < 3 &&
      (ch === "*" || ch === "_") &&
      !(ch === "_" && WORD.test(prev))
    ) {
      const double = text[i + 1] === ch;
      const marker = double ? ch + ch : ch;
      const start = i + marker.length;
      const close = findClose(text, start, marker);
      const inner = close > start ? text.slice(start, close) : "";
      if (
        inner &&
        !EDGE_SPACE.test(inner) &&
        !(ch === "_" && WORD.test(text[close + marker.length] ?? ""))
      ) {
        flush();
        const next = double
          ? { ...flags, strong: true }
          : { ...flags, em: true };
        runs.push(...parseInline(inner, mentions, next, depth + 1));
        i = close + marker.length;
        continue;
      }
    }

    if (ch === "[" && i < lastBracket) {
      const label = text.indexOf("](", i + 1);
      const close = label > i ? text.indexOf(")", label + 2) : -1;
      if (label > i + 1 && close > label) {
        const href = safeUrl(text.slice(label + 2, close));
        if (href) {
          flush();
          runs.push({
            type: "link",
            text: text.slice(i + 1, label).replace(UNESCAPE, "$1"),
            href,
          });
          i = close + 1;
          continue;
        }
      }
    }

    if (
      (ch === "h" || ch === "H") &&
      !WORD.test(prev) &&
      HTTP_START.test(text.slice(i, i + 8))
    ) {
      let end = i;
      while (end < text.length && !URL_END.test(text[end])) end++;
      while (end > i && TRAILING.test(text[end - 1])) end--;
      const raw = text.slice(i, end);
      // A closing bracket belongs to the sentence unless the URL opens one.
      let url = raw;
      while (url.endsWith(")") && !url.includes("(")) url = url.slice(0, -1);
      const href = safeUrl(url);
      if (href && url.length > 8) {
        flush();
        runs.push({ type: "link", text: url, href });
        i += url.length;
        continue;
      }
    }

    if (ch === "\n") {
      flush();
      runs.push({ type: "br" });
      i++;
      continue;
    }

    buffer += ch;
    i++;
  }
  flush();
  return runs;
}

const BULLET = /^\s{0,3}[-*+]\s+(.*)$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const FENCE = /^\s{0,3}```/;

/**
 * Parse a comment body into blocks of runs.
 *
 * Supported: paragraphs (a blank line splits them; a single newline is a
 * line break), `**bold**`, `*italic*` and `_italic_`, `` `code` ``, fenced
 * code, `> quotes`, `- bullets`, `[text](https://…)`, bare `http(s)` URLs and
 * `@[Name](id)` mention tokens. Everything else, including HTML, is text.
 *
 * @param {string} body
 * @returns {ActivityBodyBlock[]}
 */
export function parseActivityBody(body) {
  const source = String(body ?? "")
    .slice(0, MAX_BODY_LENGTH)
    .replace(PRIVATE_USE, "");
  const { text, mentions } = extractMentions(source);
  const lines = text.split(LINE_BREAK);

  /** @type {ActivityBodyBlock[]} */
  const blocks = [];
  /** @type {string[]} */
  let paragraph = [];
  /** @type {string[]} */
  let quote = [];
  /** @type {string[]} */
  let list = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({
        type: "paragraph",
        runs: parseInline(paragraph.join("\n"), mentions, {}, 0),
      });
    }
    paragraph = [];
  }
  function flushQuote() {
    if (quote.length) {
      blocks.push({
        type: "quote",
        runs: parseInline(quote.join("\n"), mentions, {}, 0),
      });
    }
    quote = [];
  }
  function flushList() {
    if (list.length) {
      blocks.push({
        type: "list",
        items: list.map((item) => parseInline(item, mentions, {}, 0)),
      });
    }
    list = [];
  }
  function flushAll() {
    flushParagraph();
    flushQuote();
    flushList();
  }

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (FENCE.test(line)) {
      flushAll();
      /** @type {string[]} */
      const code = [];
      n++;
      while (n < lines.length && !FENCE.test(lines[n])) code.push(lines[n++]);
      blocks.push({ type: "code", text: code.join("\n") });
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    const quoted = QUOTE.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      list.push(bullet[1]);
      continue;
    }
    flushQuote();
    flushList();
    paragraph.push(line);
  }
  flushAll();
  return blocks;
}

/**
 * The text a reader gets from a body, for announcements and search:
 * mention tokens become `@Name`, Markdown marks are dropped.
 * @param {string} body
 * @returns {string}
 */
export function activityBodyToText(body) {
  /** @param {ActivityBodyRun[]} runs */
  const flat = (runs) =>
    runs
      .map((run) =>
        run.type === "br"
          ? " "
          : run.type === "mention"
            ? `${run.trigger}${run.text}`
            : run.text,
      )
      .join("");
  return parseActivityBody(body)
    .map((block) =>
      block.type === "list"
        ? block.items.map(flat).join(" ")
        : block.type === "code"
          ? block.text
          : flat(block.runs),
    )
    .join(" ")
    .replace(COLLAPSIBLE_SPACE, " ")
    .trim();
}
