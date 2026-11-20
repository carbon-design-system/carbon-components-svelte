// @ts-check
// A small Markdown reader for FilePreview. It returns data, never HTML:
// raw HTML stays text, images become their alt text, and only `http`,
// `https` and `mailto` links link. A fuller reader is the Markdown component
// (#5427); this one covers what a README or a ticket attachment uses, in one
// pass per line with no backtracking.

import { safeLink } from "./file-preview.js";

/**
 * @typedef {{ text: string; strong?: true; em?: true; code?: true; href?: string }} MarkdownRun
 */

/**
 * @typedef {{ runs: MarkdownRun[]; blocks: MarkdownBlock[] }} MarkdownItem
 */

/**
 * @typedef {(
 *   | { type: "paragraph"; runs: MarkdownRun[] }
 *   | { type: "heading"; level: number; runs: MarkdownRun[] }
 *   | { type: "code"; lang: string; text: string }
 *   | { type: "quote"; blocks: MarkdownBlock[] }
 *   | { type: "list"; ordered: boolean; start: number; items: MarkdownItem[] }
 *   | { type: "rule" }
 * )} MarkdownBlock
 */

const MAX_DEPTH = 6;
const WORD_CHARACTER = /[\p{L}\p{N}]/u;

/**
 * @param {string} line
 * @returns {{ marker: string; ordered: boolean; start: number; indent: number } | undefined}
 */
function listMarker(line) {
  let i = 0;
  while (i < line.length && line[i] === " " && i < 4) i++;
  const ch = line[i];
  if ((ch === "-" || ch === "*" || ch === "+") && line[i + 1] === " ") {
    return { marker: ch, ordered: false, start: 1, indent: i + 2 };
  }
  let j = i;
  while (j < line.length && j - i < 9 && line[j] >= "0" && line[j] <= "9") j++;
  if (j > i && (line[j] === "." || line[j] === ")") && line[j + 1] === " ") {
    return {
      marker: line[j],
      ordered: true,
      start: Number(line.slice(i, j)),
      indent: j + 2,
    };
  }
  return undefined;
}

/** @param {string} line */
function isRule(line) {
  const trimmed = line.trim();
  if (trimmed.length < 3) return false;
  const ch = trimmed[0];
  if (ch !== "-" && ch !== "*" && ch !== "_") return false;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] !== ch && trimmed[i] !== " ") return false;
  }
  return true;
}

/** @param {string} line */
function fenceOf(line) {
  let i = 0;
  while (i < line.length && line[i] === " " && i < 3) i++;
  const ch = line[i];
  if (ch !== "`" && ch !== "~") return undefined;
  let j = i;
  while (line[j] === ch) j++;
  if (j - i < 3) return undefined;
  return { ch, size: j - i, info: line.slice(j).trim() };
}

/** @param {string} line */
function headingOf(line) {
  let i = 0;
  while (i < line.length && line[i] === " " && i < 3) i++;
  let level = 0;
  while (line[i + level] === "#") level++;
  if (level < 1 || level > 6) return undefined;
  const rest = line.slice(i + level);
  if (rest !== "" && rest[0] !== " " && rest[0] !== "\t") return undefined;
  let text = rest.trim();
  let end = text.length;
  while (end > 0 && text[end - 1] === "#") end--;
  if (end < text.length && (end === 0 || text[end - 1] === " ")) {
    text = text.slice(0, end).trim();
  }
  return { level, text };
}

/**
 * Parse inline Markdown to runs: `code`, `**strong**`, `*em*`, `_em_`,
 * `[label](url)` and `<https://url>`. A mark that never closes is text.
 * @param {string} text
 * @returns {MarkdownRun[]}
 */
export function parseInline(text) {
  /** @type {MarkdownRun[]} */
  const runs = [];
  let plain = "";
  let strong = false;
  let em = false;
  // Each unclosed `[`, `<` or backtick scans ahead for its partner, so a
  // line of nothing but openers would cost n squared. Past the budget they
  // are text.
  let budget = 1000;

  const flush = () => {
    if (plain === "") return;
    /** @type {MarkdownRun} */
    const run = { text: plain };
    if (strong) run.strong = true;
    if (em) run.em = true;
    runs.push(run);
    plain = "";
  };

  const n = text.length;
  let i = 0;
  while (i < n) {
    const ch = text[i];
    if (
      ch === "\\" &&
      i + 1 < n &&
      "\\`*_{}[]()#+-.!<>|~".includes(text[i + 1])
    ) {
      plain += text[i + 1];
      i += 2;
    } else if (ch === "`") {
      let ticks = 1;
      while (text[i + ticks] === "`") ticks++;
      const close =
        budget-- > 0 ? text.indexOf("`".repeat(ticks), i + ticks) : -1;
      if (close === -1) {
        plain += text.slice(i, i + ticks);
        i += ticks;
      } else {
        flush();
        runs.push({ text: text.slice(i + ticks, close).trim(), code: true });
        i = close + ticks;
      }
    } else if (ch === "*" || ch === "_") {
      const double = text[i + 1] === ch;
      const size = double ? 2 : 1;
      const before = text[i - 1];
      const after = text[i + size];
      // `_` inside a word (snake_case) is not emphasis.
      const wordInside =
        ch === "_" && before !== undefined && WORD_CHARACTER.test(before);
      const open = (double ? strong : em) === false;
      const canOpen = after !== undefined && after !== " " && after !== "\n";
      const canClose =
        before !== undefined && before !== " " && before !== "\n";
      if (!wordInside && (open ? canOpen : canClose)) {
        flush();
        if (double) strong = !strong;
        else em = !em;
        i += size;
      } else {
        plain += ch.repeat(size);
        i += size;
      }
    } else if (ch === "!" && text[i + 1] === "[") {
      // An image is its alt text. Nothing is fetched from an unread file.
      const parsed = budget-- > 0 ? parseLink(text, i + 1) : undefined;
      if (parsed) {
        plain += parsed.label || "image";
        i = parsed.end;
      } else {
        plain += ch;
        i++;
      }
    } else if (ch === "[") {
      const parsed = budget-- > 0 ? parseLink(text, i) : undefined;
      const href = parsed && safeLink(parsed.href);
      if (parsed && href) {
        flush();
        const inner = parseInline(parsed.label);
        for (const run of inner) runs.push({ ...run, href });
        i = parsed.end;
      } else if (parsed) {
        plain += parsed.label;
        i = parsed.end;
      } else {
        plain += ch;
        i++;
      }
    } else if (ch === "<") {
      const close = budget-- > 0 ? text.indexOf(">", i + 1) : -1;
      const href =
        close === -1 ? undefined : safeLink(text.slice(i + 1, close));
      if (href && close !== -1) {
        flush();
        runs.push({ text: text.slice(i + 1, close), href });
        i = close + 1;
      } else {
        plain += ch;
        i++;
      }
    } else {
      plain += ch;
      i++;
    }
  }
  flush();
  return runs;
}

/**
 * `[label](href)` starting at `at` (the `[`).
 * @param {string} text
 * @param {number} at
 * @returns {{ label: string; href: string; end: number } | undefined}
 */
function parseLink(text, at) {
  let depth = 0;
  let i = at;
  const limit = Math.min(text.length, at + 2000);
  for (; i < limit; i++) {
    const ch = text[i];
    if (ch === "\\") i++;
    else if (ch === "[") depth++;
    else if (ch === "]" && --depth === 0) break;
  }
  if (i >= limit || text[i + 1] !== "(") return undefined;
  const label = text.slice(at + 1, i);
  let j = i + 2;
  let parens = 0;
  const end = Math.min(text.length, j + 2100);
  for (; j < end; j++) {
    const ch = text[j];
    if (ch === "\n") return undefined;
    if (ch === "(") parens++;
    else if (ch === ")") {
      if (parens === 0) break;
      parens--;
    }
  }
  if (j >= end) return undefined;
  let href = text.slice(i + 2, j).trim();
  // `[x](url "title")`: drop the title.
  const space = href.indexOf(" ");
  if (space !== -1) href = href.slice(0, space);
  if (href[0] === "<" && href[href.length - 1] === ">")
    href = href.slice(1, -1);
  return { label, href, end: j + 1 };
}

/**
 * Parse Markdown to blocks.
 * @param {string} source
 * @param {number} [depth]
 * @returns {MarkdownBlock[]}
 */
export function parseMarkdown(source, depth = 0) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  return parseLines(lines, depth);
}

/**
 * @param {string[]} lines
 * @param {number} depth
 * @returns {MarkdownBlock[]}
 */
function parseLines(lines, depth) {
  /** @type {MarkdownBlock[]} */
  const blocks = [];
  /** @type {string[]} */
  let paragraph = [];

  const endParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({
      type: "paragraph",
      runs: parseInline(paragraph.map((line) => line.trim()).join("\n")),
    });
    paragraph = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      endParagraph();
      i++;
      continue;
    }

    const fence = fenceOf(line);
    if (fence) {
      endParagraph();
      const body = [];
      i++;
      while (i < lines.length) {
        const closing = fenceOf(lines[i]);
        if (
          closing &&
          closing.ch === fence.ch &&
          closing.size >= fence.size &&
          closing.info === ""
        ) {
          i++;
          break;
        }
        body.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        lang: fence.info.split(" ")[0].toLowerCase(),
        text: body.join("\n"),
      });
      continue;
    }

    const heading = headingOf(line);
    if (heading) {
      endParagraph();
      blocks.push({
        type: "heading",
        level: heading.level,
        runs: parseInline(heading.text),
      });
      i++;
      continue;
    }

    if (isRule(line)) {
      endParagraph();
      blocks.push({ type: "rule" });
      i++;
      continue;
    }

    if (line.trimStart().startsWith(">") && depth < MAX_DEPTH) {
      endParagraph();
      const inner = [];
      while (i < lines.length && lines[i].trimStart().startsWith(">")) {
        const stripped = lines[i].trimStart().slice(1);
        inner.push(stripped[0] === " " ? stripped.slice(1) : stripped);
        i++;
      }
      blocks.push({ type: "quote", blocks: parseLines(inner, depth + 1) });
      continue;
    }

    const first = listMarker(line);
    if (first && depth < MAX_DEPTH) {
      endParagraph();
      /** @type {MarkdownItem[]} */
      const items = [];
      while (i < lines.length) {
        const marker = listMarker(lines[i]);
        if (!marker || marker.ordered !== first.ordered || isRule(lines[i]))
          break;
        /** @type {string[]} */
        const body = [lines[i].slice(marker.indent)];
        i++;
        while (i < lines.length) {
          const next = lines[i];
          if (next.trim() === "") {
            // A blank line continues the item only if an indented line follows.
            const after = lines[i + 1];
            if (
              after !== undefined &&
              after.startsWith(" ".repeat(marker.indent))
            ) {
              body.push("");
              i++;
              continue;
            }
            break;
          }
          if (next.startsWith(" ".repeat(marker.indent))) {
            body.push(next.slice(marker.indent));
            i++;
          } else if (
            !listMarker(next) &&
            !fenceOf(next) &&
            !headingOf(next) &&
            body[body.length - 1] !== ""
          ) {
            body.push(next.trim());
            i++;
          } else {
            break;
          }
        }
        const children = parseLines(body, depth + 1);
        const lead = children[0];
        if (lead && lead.type === "paragraph") {
          items.push({ runs: lead.runs, blocks: children.slice(1) });
        } else {
          items.push({ runs: [], blocks: children });
        }
        while (
          i < lines.length &&
          lines[i].trim() === "" &&
          listMarker(lines[i + 1] ?? "")
        )
          i++;
      }
      blocks.push({
        type: "list",
        ordered: first.ordered,
        start: first.start,
        items,
      });
      continue;
    }

    paragraph.push(line);
    i++;
  }
  endParagraph();
  return blocks;
}
