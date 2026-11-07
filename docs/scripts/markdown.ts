/**
 * Parses the Markdown subset the docs pages use into mdast, as mdsvex did.
 * Unlike mdsvex, a block of Svelte markup ends where its tags close, not at
 * the first blank line. It throws on Markdown the pages don't use, such as
 * block quotes, rather than parse it in a way a reader doesn't expect.
 */

import { parse } from "sveast";

export type Node = {
  type: string;
  value?: string;
  children?: Node[];
  data?: Record<string, unknown>;
  [key: string]: unknown;
};
export type Root = Node & { type: "root"; children: Node[] };

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---(?:\n|$)/;
const BLANK_RE = /^[ \t]*$/;
const FENCE_RE = /^( {0,3})(`{3,}|~{3,})[ \t]*([^\s`]*)[ \t]*(.*?)[ \t]*$/;
const ATX_RE = /^ {0,3}(#{1,6})(?:[ \t]+|$)(.*?)(?:[ \t]+#+)?[ \t]*$/;
const LIST_ITEM_RE = /^( {0,3})([-*+]|(\d{1,9})[.)])([ \t]+|$)(.*)$/;
const TABLE_DELIMITER_RE =
  /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
const SVELTE_BLOCK_RE = /^\s*\{[#:/@]/;
const SVELTE_TAG_RE = /^\s*<([\\/\s])*svelte:/;

// mdsvex's block HTML: the patterns that open a block, and what closes it.
const ATTRIBUTE_NAME = "[a-zA-Z_:][a-zA-Z0-9:._-]*";
const ATTRIBUTE_VALUE = `(?:[^"'=<>\`\\u0000-\\u0020]+|'[^']*'|"[^"]*"|{[\\0-\\uFFFF]*})`;
const ATTRIBUTE = `(?:\\s+${ATTRIBUTE_NAME}(?:\\s*=\\s*${ATTRIBUTE_VALUE})?)`;
const OPEN_TAG = `<[A-Za-z]*[A-Za-z0-9\\.\\-]*${ATTRIBUTE}*\\s*\\/?>`;
const CLOSE_TAG = "<\\/[A-Za-z][A-Za-z0-9\\.\\-]*\\s*>";
const HTML_SEQUENCES: [open: RegExp, close: RegExp, interrupts: boolean][] = [
  [/^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true],
  [/^<!--/, /--!?>/, true],
  [/^<\?/, /\?>/, true],
  [/^<![A-Za-z]/, />/, true],
  [/^<!\[CDATA\[/, /\]\]>/, true],
  [/^<\/?([a-z.]*(\.)?[a-z][a-z0-9.]*)(?=(\s|\/?>|$))/i, /^$/, true],
  [/^<>/, /^$/, true],
  [new RegExp(`^(?:${OPEN_TAG}|${CLOSE_TAG})\\s*$`), /^$/, false],
];

function htmlSequence(line: string) {
  const trimmed = line.replace(/^[ \t]*/, "");
  if (!trimmed.startsWith("<")) return undefined;
  return HTML_SEQUENCES.find(([open]) => open.test(trimmed));
}

function interruptsParagraph(line: string): boolean {
  return (
    ATX_RE.test(line) ||
    FENCE_RE.test(line) ||
    htmlSequence(line)?.[2] === true ||
    LIST_ITEM_RE.test(line)
  );
}

function unsupported(what: string, line: string): never {
  throw new Error(`Unsupported Markdown, ${what}: ${JSON.stringify(line)}`);
}

export function parseMarkdown(source: string): Root {
  const children: Node[] = [];
  let body = source;
  const frontmatter = FRONTMATTER_RE.exec(source);
  if (frontmatter) {
    children.push({ type: "yaml", value: frontmatter[1] });
    body = source.slice(frontmatter[0].length);
  }
  const offset = frontmatter ? frontmatter[0].split("\n").length - 1 : 0;
  children.push(...parseBlocks(body.split("\n"), offset));
  return { type: "root", children };
}

/** Lines are 1-based, `offset` lines in. */
function parseBlocks(lines: string[], offset = 0): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  const push = (node: Node, start: number) => {
    node.position = { start: { line: start + offset + 1 } };
    nodes.push(node);
  };
  while (i < lines.length) {
    const line = lines[i];
    const start = i;
    if (BLANK_RE.test(line)) {
      i++;
      continue;
    }

    const fence = FENCE_RE.exec(line);
    if (fence) {
      const [, indent, marker, lang, meta] = fence;
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const close = lines[i].match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
        if (
          close &&
          close[1][0] === marker[0] &&
          close[1].length >= marker.length
        ) {
          i++;
          break;
        }
        body.push(
          lines[i].slice(Math.min(indent.length, lines[i].search(/\S|$/))),
        );
        i++;
      }
      push(
        {
          type: "code",
          lang: lang || null,
          meta: meta || null,
          value: body.join("\n"),
        },
        start,
      );
      continue;
    }

    const heading = ATX_RE.exec(line);
    if (heading) {
      push(
        {
          type: "heading",
          depth: heading[1].length,
          children: parseInline(heading[2], start + offset + 1),
        },
        start,
      );
      i++;
      continue;
    }

    if (SVELTE_BLOCK_RE.test(line)) {
      const end = svelteBlockEnd(lines, start, start);
      if (end === undefined) unsupported("an unclosed Svelte block", line);
      push(
        { type: "html", value: lines.slice(start, end + 1).join("\n") },
        start,
      );
      i = end + 1;
      continue;
    }
    if (SVELTE_TAG_RE.test(line)) unsupported("a top-level svelte: tag", line);
    if (/^ {0,3}>/.test(line))
      unsupported(
        "a block quote (CONTRIBUTING.md rules out admonitions)",
        line,
      );

    const sequence = htmlSequence(line);
    if (sequence) {
      const [, close] = sequence;
      if (!close.test(line.replace(/^[ \t]*/, ""))) {
        while (i + 1 < lines.length) {
          if (close.test(lines[i + 1])) {
            if (lines[i + 1]) i++;
            break;
          }
          i++;
        }
      }
      i = svelteBlockEnd(lines, start, i) ?? i;
      push(
        { type: "html", value: lines.slice(start, i + 1).join("\n") },
        start,
      );
      i++;
      continue;
    }

    if (line.includes("|") && TABLE_DELIMITER_RE.test(lines[i + 1] ?? "")) {
      const rows: string[] = [line];
      const align = splitRow(lines[i + 1]).map((cell) => {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        return left && right
          ? "center"
          : left
            ? "left"
            : right
              ? "right"
              : null;
      });
      i += 2;
      while (i < lines.length && !BLANK_RE.test(lines[i]))
        rows.push(lines[i++]);
      push(
        {
          type: "table",
          align,
          children: rows.map((row, r) => ({
            type: "tableRow",
            children: splitRow(row).map((cell) => ({
              type: "tableCell",
              // The delimiter row is the source's second line.
              children: parseInline(
                cell,
                start + offset + 1 + (r === 0 ? 0 : r + 1),
              ),
            })),
          })),
        },
        start,
      );
      continue;
    }

    const item = LIST_ITEM_RE.exec(line);
    if (item) {
      const ordered = item[3] !== undefined;
      const list: Node = {
        type: "list",
        ordered,
        start: ordered ? Number(item[3]) : null,
        spread: false,
        children: [],
      };
      while (i < lines.length) {
        const next = LIST_ITEM_RE.exec(lines[i]);
        if (!next || (next[3] !== undefined) !== ordered) break;
        const text = [next[5]];
        const itemLine = i + offset + 1;
        i++;
        while (
          i < lines.length &&
          !BLANK_RE.test(lines[i]) &&
          !LIST_ITEM_RE.test(lines[i]) &&
          !interruptsParagraph(lines[i])
        ) {
          text.push(lines[i++].trim());
        }
        list.children?.push({
          type: "listItem",
          spread: false,
          checked: null,
          children: [
            {
              type: "paragraph",
              children: parseInline(text.join("\n"), itemLine),
            },
          ],
        });
        if (i < lines.length && BLANK_RE.test(lines[i])) {
          if (LIST_ITEM_RE.test(lines[i + 1] ?? ""))
            unsupported("a loose list", line);
          break;
        }
      }
      push(list, start);
      continue;
    }

    const text = [line.replace(/^[ \t]+/, "")];
    i++;
    while (
      i < lines.length &&
      !BLANK_RE.test(lines[i]) &&
      !interruptsParagraph(lines[i])
    ) {
      text.push(lines[i++].replace(/^[ \t]+/, ""));
    }
    push(
      {
        type: "paragraph",
        children: parseInline(text.join("\n"), start + offset + 1),
      },
      start,
    );
  }
  return nodes;
}

/**
 * The first of `end` or a line before a later blank line where every tag
 * and block opened since `start` has closed.
 */
function svelteBlockEnd(
  lines: string[],
  start: number,
  end: number,
): number | undefined {
  let last = end;
  while (last < lines.length) {
    if (parsesAsSvelte(lines.slice(start, last + 1).join("\n"))) return last;
    let next = last + 1;
    while (next < lines.length && BLANK_RE.test(lines[next])) next++;
    while (next + 1 < lines.length && !BLANK_RE.test(lines[next + 1])) next++;
    if (next >= lines.length) return undefined;
    last = next;
  }
  return undefined;
}

function parsesAsSvelte(markup: string): boolean {
  try {
    parse(markup, { css: false });
    return true;
  } catch {
    return false;
  }
}

/** `\|` stays in a cell. */
function splitRow(row: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inCode = false;
  const trimmed = row
    .trim()
    .replace(/^\|/, "")
    .replace(/(?<!\\)\|$/, "");
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (char === "\\" && trimmed[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (char === "`") {
      inCode = !inCode;
      cell += char;
    } else if (char === "|" && !inCode) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

const ESCAPABLE = new Set("\\`*{}[]()#+-.!_>~|");
const INLINE_HTML_RE = new RegExp(
  `^(?:${OPEN_TAG}|${CLOSE_TAG}|<!--[\\s\\S]*?-->)`,
);
const URL_RE = /^(?:https?:\/\/|mailto:)[^\s<]*[^\s<?!.,:*_~)]/;
const ENTITY_RE = /^&(?:#x([0-9a-f]+)|#(\d+)|([a-z][a-z0-9]*));/i;
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  times: "×",
  copy: "©",
  rarr: "→",
  larr: "←",
};

/** Inline nodes; inline HTML gets the line it's on, from `line` for the first. */
export function parseInline(text: string, line?: number): Node[] {
  const nodes: Node[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer) nodes.push({ type: "text", value: buffer });
    buffer = "";
  };
  const push = (node: Node) => {
    flush();
    nodes.push(node);
  };

  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const rest = text.slice(i);

    if (char === "\\" && ESCAPABLE.has(text[i + 1] ?? "")) {
      buffer += text[i + 1];
      i += 2;
      continue;
    }

    if (char === "`") {
      const run = rest.match(/^`+/)?.[0] ?? "`";
      const close = text.indexOf(run, i + run.length);
      let end = close;
      // A longer run doesn't close a shorter one.
      while (end !== -1 && text[end + run.length] === "`") {
        end = text.indexOf(run, end + run.length + 1);
      }
      if (end !== -1) {
        push({
          type: "inlineCode",
          value: text.slice(i + run.length, end).trim(),
        });
        i = end + run.length;
        continue;
      }
      buffer += run;
      i += run.length;
      continue;
    }

    if (char === "<") {
      const html = INLINE_HTML_RE.exec(rest);
      if (html) {
        const node: Node = { type: "html", value: html[0] };
        if (line !== undefined) {
          node.position = {
            start: {
              line: line + (text.slice(0, i).match(/\n/g)?.length ?? 0),
            },
          };
        }
        push(node);
        i += html[0].length;
        continue;
      }
    }

    if (char === "[") {
      const link = parseLink(text, i);
      if (link) {
        push(link.node);
        i = link.end;
        continue;
      }
    }

    if ((char === "*" || char === "_") && !isIntraword(text, i, char)) {
      const strong = rest.startsWith(char + char);
      const marker = strong ? char + char : char;
      const end = findClosing(text, i + marker.length, marker);
      if (end !== -1) {
        push({
          type: strong ? "strong" : "emphasis",
          children: parseInline(text.slice(i + marker.length, end)),
        });
        i = end + marker.length;
        continue;
      }
    }

    if ((char === "h" || char === "m") && /[^\w]$|^$/.test(text[i - 1] ?? "")) {
      const url = URL_RE.exec(rest);
      if (url) {
        push({
          type: "link",
          title: null,
          url: url[0],
          children: [{ type: "text", value: url[0] }],
        });
        i += url[0].length;
        continue;
      }
    }

    if (char === "&") {
      const entity = ENTITY_RE.exec(rest);
      const decoded = entity && decodeEntity(entity);
      if (decoded !== null && decoded !== undefined) {
        buffer += decoded;
        i += entity?.[0].length ?? 1;
        continue;
      }
    }

    buffer += char;
    i++;
  }
  flush();
  return nodes;
}

function decodeEntity(match: RegExpExecArray): string | undefined {
  const [, hex, decimal, name] = match;
  if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
  if (decimal) return String.fromCodePoint(Number(decimal));
  return NAMED_ENTITIES[name];
}

/** `_` inside a word, as in `snake_case`, doesn't start emphasis. */
function isIntraword(text: string, i: number, char: string): boolean {
  if (char !== "_") return false;
  return /\w/.test(text[i - 1] ?? "") && /\w/.test(text[i + 1] ?? "");
}

function findClosing(text: string, from: number, marker: string): number {
  if (/\s/.test(text[from] ?? " ")) return -1;
  let i = from;
  while (i < text.length) {
    if (text[i] === "\\") {
      i += 2;
      continue;
    }
    if (text[i] === "`") {
      const close = text.indexOf("`", i + 1);
      i = close === -1 ? i + 1 : close + 1;
      continue;
    }
    if (
      text.startsWith(marker, i) &&
      !/\s/.test(text[i - 1]) &&
      (marker.length === 2 || text[i + 1] !== marker) &&
      !(marker[0] === "_" && /\w/.test(text[i + marker.length] ?? ""))
    ) {
      return i;
    }
    i++;
  }
  return -1;
}

function parseLink(text: string, start: number) {
  let depth = 0;
  let i = start;
  for (; i < text.length; i++) {
    if (text[i] === "\\") {
      i++;
      continue;
    }
    if (text[i] === "`") {
      const close = text.indexOf("`", i + 1);
      if (close !== -1) i = close;
      continue;
    }
    if (text[i] === "[") depth++;
    else if (text[i] === "]" && --depth === 0) break;
  }
  if (depth !== 0 || text[i + 1] !== "(") return undefined;
  const label = text.slice(start + 1, i);
  const destination =
    /^\(\s*(<[^>]*>|[^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+"([^"]*)")?\s*\)/.exec(
      text.slice(i + 1),
    );
  if (!destination) return undefined;
  const url = destination[1].replace(/^<|>$/g, "");
  return {
    node: {
      type: "link",
      title: destination[2] ?? null,
      url,
      children: parseInline(label),
    } as Node,
    end: i + 1 + destination[0].length,
  };
}
