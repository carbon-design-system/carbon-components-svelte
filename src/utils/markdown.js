// @ts-check

// Adapted from the `Markdown` draft (#5427). Link destinations go through
// `safeUrl` (from the `LinkifiedText` draft, #5575) instead of the draft's
// own scheme check, and a list item can be a task (`- [ ]`, `- [x]`).

import { safeUrl } from "./safe-url.js";

/**
 * A small Markdown parser for text that arrives in pieces, such as a model's
 * reply. It returns data, never HTML: block objects holding flat runs of text
 * with flags, which a component draws as elements. Nothing in the
 * input is ever copied through as markup, so there is no HTML to sanitize and
 * no markup quirk to exploit. Raw HTML in the source is plain text. Images
 * never load: they become links. Only the schemes in `schemes` become links.
 *
 * `createMarkdownParser` keeps the blocks it has finished and parses only the
 * last, open one again when text is appended.
 */

/**
 * @typedef {object} Run
 * @property {string} text
 * @property {true} [strong]
 * @property {true} [em]
 * @property {true} [del]
 * @property {true} [code]
 * @property {true} [br] - A line break; `text` is a newline.
 * @property {string} [href]
 */

/**
 * @typedef {object} ListItem
 * @property {Run[]} runs - The item's first paragraph.
 * @property {boolean} [checked] - A task item (`[ ]` or `[x]`): whether it is checked. Absent for any other item.
 * @property {Block[]} children - Anything after it, such as a nested list.
 */

/**
 * @typedef {"left" | "center" | "right" | null} Align
 */

/**
 * @typedef {{ id: number, type: "paragraph", runs: Run[] }
 *   | { id: number, type: "heading", level: number, runs: Run[] }
 *   | { id: number, type: "code", lang: string, text: string, closed: boolean }
 *   | { id: number, type: "quote", blocks: Block[] }
 *   | { id: number, type: "list", ordered: boolean, start: number, items: ListItem[] }
 *   | { id: number, type: "table", align: Align[], head: Run[][], rows: Run[][][] }
 *   | { id: number, type: "rule" }} Block
 */

/**
 * @typedef {object} MarkdownOptions
 * @property {ReadonlyArray<string>} [schemes] - Link schemes, with the colon. Default `http:`, `https:`, `mailto:`.
 * @property {boolean} [streaming] - Close an unfinished `**`, `*`, `~~` or backtick at the end of the text, so formatting doesn't flicker as it arrives.
 */

/**
 * How `Markdown` draws its blocks.
 * @typedef {object} DrawOptions
 * @property {((code: string, lang: string) => ReadonlyArray<{ type: string | null, text: string }> | undefined) | undefined} highlight
 * @property {boolean} copyable
 * @property {string} copyLabel
 * @property {(lang: string) => string} codeLabel
 * @property {string} tableLabel
 * @property {string} target
 * @property {number} headingLevel
 */

export const DEFAULT_SCHEMES = Object.freeze(["http:", "https:", "mailto:"]);

/** Nesting deeper than this (quotes in lists in quotes...) stays text. */
const MAX_DEPTH = 6;
/** A paragraph longer than this is plain text, which bounds inline work. */
const MAX_INLINE = 12_000;
const MAX_HREF = 2048;
const MAX_LANG = 32;

const PUNCT = /[\p{P}\p{S}]/u;
const SPACE = /\s/u;
const URL_START = /(?:[a-z][a-z0-9+.-]*:\/\/|mailto:|www\.)[^\s<>*`]+/iy;
const EMAIL = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const WWW = /^www\./i;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const ADDRESS_LIKE =
  /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+$|^[\w-]+(?:\.[\w-]+)+(?:\/\S*)?$/i;
const ESCAPED = /\\([!-/:-@[-`{-~])/g;
const ESCAPABLE = /[!-/:-@[-`{-~]/;
const NEWLINES = /\n/g;
const SPACES = /\s/;
const WORD_START = /[\s(["'*_~>]/;
const LETTER = /[A-Za-z]/;
const SENTENCE_END = /[.,!?;:'"]/;
const LEADING_SPACES = /^ +/;
const BLANKS = /[ \t]/;
const LANG = /^[\w+#.-]+/;
const QUOTE_PREFIX = /^ {0,3}> ?/;
const LINK_INNER = /^[a-z][a-z0-9+.-]*:|@/i;

/**
 * Resolve a link destination to a URL that is safe to put in `href`, or
 * `undefined`. `safeUrl` reads it as a browser does, so `java\tscript:` and
 * `JAVASCRIPT:` are caught by their scheme, and returns the normalized form.
 * Relative destinations, credentials, and hidden or bidi characters are
 * dropped.
 *
 * @param {string} raw
 * @param {ReadonlyArray<string>} [schemes]
 * @returns {string | undefined}
 */
export function safeHref(raw, schemes = DEFAULT_SCHEMES) {
  const value = raw.trim();
  if (!value || value.length > MAX_HREF) return undefined;
  return (
    safeUrl(WWW.test(value) ? `https://${value}` : value, {
      protocols: schemes,
    }) ?? undefined
  );
}

/** @param {string} href */
function hostOf(href) {
  try {
    return new URL(href).host.replace(WWW, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Link text that reads as an address must name where the link goes, or a
 * link could say one site and open another.
 * @param {string} text
 * @param {string} href
 */
function claimsOtherHost(text, href) {
  const t = text.trim();
  if (t.length > MAX_HREF) return false;
  if (!ADDRESS_LIKE.test(t)) return false;
  const claimed = hostOf(SCHEME.test(t) ? t : `https://${t}`);
  return claimed !== hostOf(href);
}

// -- Inline ----------------------------------------------------------------

/**
 * @typedef {{ t: "text", s: string }
 *   | { t: "code", s: string }
 *   | { t: "br" }
 *   | { t: "delim", ch: string, n: number, open: boolean, close: boolean, left: number }
 *   | { t: "node", kind: "strong" | "em" | "del", kids: Tok[] }
 *   | { t: "link", href: string, kids: Tok[] }
 *   | { t: "bracket", image: boolean, at: number }} Tok
 */

/** @typedef {Extract<Tok, { t: "delim" }>} Delim */

/**
 * Read the destination of an inline link, starting just after `(`.
 * @param {string} s
 * @param {number} from
 * @returns {{ dest: string, end: number } | undefined} `end` is after `)`
 */
function readDestination(s, from) {
  let i = from;
  while (s[i] === " " || s[i] === "\n") i++;
  let dest = "";
  if (s[i] === "<") {
    const close = s.indexOf(">", i);
    if (close < 0 || s.slice(i, close).includes("\n")) return undefined;
    dest = s.slice(i + 1, close);
    i = close + 1;
  } else {
    let depth = 0;
    const start = i;
    for (; i < s.length; i++) {
      const c = s[i];
      if (c === "\\" && i + 1 < s.length) {
        i++;
      } else if (c === "(") {
        depth++;
      } else if (c === ")") {
        if (depth === 0) break;
        depth--;
      } else if (c === " " || c === "\n") {
        break;
      }
    }
    dest = s.slice(start, i).replace(ESCAPED, "$1");
  }
  while (s[i] === " " || s[i] === "\n") i++;
  // An optional title: dropped, since it would only be a hover hint.
  const quote = s[i];
  if (quote === '"' || quote === "'" || quote === "(") {
    const closer = quote === "(" ? ")" : quote;
    let j = i + 1;
    while (j < s.length && s[j] !== closer) j += s[j] === "\\" ? 2 : 1;
    if (j >= s.length) return undefined;
    i = j + 1;
    while (s[i] === " " || s[i] === "\n") i++;
  }
  if (s[i] !== ")") return undefined;
  return { dest, end: i + 1 };
}

/**
 * Find the opener a closing run pairs with, nearest first.
 * @param {Tok[]} out
 * @param {number[]} stack
 * @param {Delim} closer
 */
function findOpener(out, stack, closer) {
  for (let k = stack.length - 1; k >= 0; k--) {
    const open = /** @type {Delim} */ (out[stack[k]]);
    if (open.ch !== closer.ch || open.n === 0) continue;
    if (closer.ch === "~" && (open.n < 2 || closer.n < 2)) continue;
    // "Rule of 3": when either run can both open and close, their lengths
    // must not add up to a multiple of 3 unless both are.
    if (
      (open.close || closer.open) &&
      (open.left + closer.left) % 3 === 0 &&
      (open.left % 3 !== 0 || closer.left % 3 !== 0)
    )
      continue;
    return k;
  }
  return -1;
}

/**
 * Pair up delimiter runs into strong, em and del nodes (CommonMark's
 * "process emphasis"), over `toks[from..]`, in place. Runs that find no
 * partner stay as delimiter tokens, which draw as text.
 * @param {Tok[]} toks
 * @param {number} from
 */
function resolveEmphasis(toks, from) {
  const items = toks.splice(from);
  /** @type {Tok[]} */
  const out = [];
  /** @type {number[]} */
  const stack = [];
  for (const tok of items) {
    if (tok.t !== "delim") {
      out.push(tok);
      continue;
    }
    while (tok.n > 0 && tok.close) {
      const k = findOpener(out, stack, tok);
      if (k < 0) break;
      const at = stack[k];
      const open = /** @type {Delim} */ (out[at]);
      const use = tok.ch === "~" ? 2 : open.n >= 2 && tok.n >= 2 ? 2 : 1;
      const kind = tok.ch === "~" ? "del" : use === 2 ? "strong" : "em";
      const kids = out.splice(at + 1);
      stack.length = k + 1;
      open.n -= use;
      tok.n -= use;
      /** @type {Tok} */
      const node = { t: "node", kind, kids };
      if (open.n === 0) {
        out.splice(at, 1, node);
        stack.pop();
      } else {
        out.push(node);
      }
    }
    if (tok.n > 0) {
      if (tok.open) stack.push(out.length);
      out.push(tok);
    }
  }
  for (const tok of out) toks.push(tok);
}

/**
 * Close what is still open, for text that is still arriving.
 * @param {Tok[]} toks
 */
function closeOpenEmphasis(toks) {
  for (let i = toks.length - 2; i >= 0; i--) {
    const tok = toks[i];
    if (tok.t !== "delim" || !tok.open || tok.n === 0) continue;
    const kids = toks.splice(i + 1);
    /** @type {Tok} */
    let node = {
      t: "node",
      kind: tok.ch === "~" ? "del" : tok.n >= 2 ? "strong" : "em",
      kids,
    };
    if (tok.ch !== "~" && tok.n === 3) {
      node = { t: "node", kind: "em", kids: [node] };
    }
    toks.splice(i, 1, node);
  }
}

/**
 * @param {Tok[]} toks
 * @param {{ streaming: boolean }} options
 */
function finish(toks, options) {
  resolveEmphasis(toks, 0);
  if (options.streaming) closeOpenEmphasis(toks);
  return toks;
}

/**
 * Drop trailing spaces, in a single pass.
 * @param {string} text
 */
function trimSpaces(text) {
  let end = text.length;
  while (end > 0 && text[end - 1] === " ") end--;
  return text.slice(0, end);
}

/**
 * @param {string} s
 * @param {{ schemes: ReadonlyArray<string>, streaming: boolean }} options
 * @returns {Tok[]}
 */
function tokenizeInline(s, options) {
  /** @type {Tok[]} */
  const toks = [];
  /** @type {number[]} */
  const brackets = [];
  /** Backtick run lengths with no closing run later in the text. */
  const unmatched = new Set();
  let text = "";
  const flush = () => {
    if (text) toks.push({ t: "text", s: text });
    text = "";
  };

  let i = 0;
  while (i < s.length) {
    const c = s[i];

    if (c === "\\") {
      const next = s[i + 1];
      if (next === "\n") {
        flush();
        toks.push({ t: "br" });
        i += 2;
      } else if (next && ESCAPABLE.test(next)) {
        text += next;
        i += 2;
      } else {
        text += c;
        i++;
      }
      continue;
    }

    if (c === "`") {
      let n = 1;
      while (s[i + n] === "`") n++;
      const fence = "`".repeat(n);
      let end = unmatched.has(n) ? -1 : s.indexOf(fence, i + n);
      while (end >= 0 && s[end + n] === "`") {
        // A longer run is not this span's closer.
        let run = n;
        while (s[end + run] === "`") run++;
        end = s.indexOf(fence, end + run);
      }
      if (end < 0) {
        unmatched.add(n);
        if (options.streaming && n === 1) {
          flush();
          const body = s.slice(i + 1);
          if (body) toks.push({ t: "code", s: body.replace(NEWLINES, " ") });
          i = s.length;
        } else {
          text += fence;
          i += n;
        }
        continue;
      }
      flush();
      let body = s.slice(i + n, end).replace(NEWLINES, " ");
      if (
        body.length > 2 &&
        body.startsWith(" ") &&
        body.endsWith(" ") &&
        body.trim()
      ) {
        body = body.slice(1, -1);
      }
      toks.push({ t: "code", s: body });
      i = end + n;
      continue;
    }

    if (c === "*" || c === "_" || c === "~") {
      let n = 1;
      while (s[i + n] === c) n++;
      if (c === "~" && n !== 2) {
        text += c.repeat(n);
        i += n;
        continue;
      }
      const before = i === 0 ? " " : s[i - 1];
      const after = i + n >= s.length ? " " : s[i + n];
      const afterSpace = SPACE.test(after);
      const beforeSpace = SPACE.test(before);
      const afterPunct = PUNCT.test(after);
      const beforePunct = PUNCT.test(before);
      const leftFlank =
        !afterSpace && (!afterPunct || beforeSpace || beforePunct);
      const rightFlank =
        !beforeSpace && (!beforePunct || afterSpace || afterPunct);
      const open =
        c === "_" ? leftFlank && (!rightFlank || beforePunct) : leftFlank;
      const close =
        c === "_" ? rightFlank && (!leftFlank || afterPunct) : rightFlank;
      flush();
      toks.push({ t: "delim", ch: c, n, open, close, left: n });
      i += n;
      continue;
    }

    if (c === "[" || (c === "!" && s[i + 1] === "[")) {
      flush();
      brackets.push(toks.length);
      const image = c === "!";
      toks.push({ t: "bracket", image, at: i });
      i += image ? 2 : 1;
      continue;
    }

    if (c === "]") {
      const open = brackets.pop();
      if (open === undefined) {
        text += c;
        i++;
        continue;
      }
      flush();
      const bracket = /** @type {Extract<Tok, {t: "bracket"}>} */ (toks[open]);
      const link = s[i + 1] === "(" ? readDestination(s, i + 2) : undefined;
      if (
        !link &&
        s[i + 1] === "(" &&
        options.streaming &&
        !s.includes(")", i + 2)
      ) {
        // `[text](https://exa`: the address is still arriving. Show the
        // text on its own rather than a half-written link.
        toks.splice(open, 1);
        brackets.length = 0;
        i = s.length;
        continue;
      }
      const href = link ? safeHref(link.dest, options.schemes) : undefined;
      if (link && href) {
        resolveEmphasis(toks, open + 1);
        const kids = toks.splice(open + 1);
        toks.splice(open, 1);
        const plain = flatten(kids, {})
          .map((run) => run.text)
          .join("");
        // Images never load: the alt text links to the image instead.
        const shown =
          claimsOtherHost(plain, href) || (bracket.image && !plain.trim())
            ? [{ t: /** @type {const} */ ("text"), s: href }]
            : kids;
        toks.push({ t: "link", href, kids: shown });
        i = link.end;
        // Links don't nest: earlier open brackets can't become links.
        for (let k = brackets.length - 1; k >= 0; k--) {
          const b = toks[brackets[k]];
          if (b && b.t === "bracket" && !b.image) brackets.splice(k, 1);
        }
        continue;
      }
      // Not a link: the brackets stay text.
      text += "]";
      i++;
      continue;
    }

    if (c === "<") {
      const close = s.indexOf(">", i);
      const inner = close > i ? s.slice(i + 1, close) : "";
      const href =
        inner && !SPACES.test(inner)
          ? safeHref(
              EMAIL.test(inner) ? `mailto:${inner}` : inner,
              options.schemes,
            )
          : undefined;
      if (href && LINK_INNER.test(inner)) {
        flush();
        toks.push({ t: "link", href, kids: [{ t: "text", s: inner }] });
        i = close + 1;
        continue;
      }
      text += c;
      i++;
      continue;
    }

    // A bare address, at the start of a word, becomes a link.
    if (LETTER.test(c) && (i === 0 || WORD_START.test(s[i - 1]))) {
      URL_START.lastIndex = i;
      const match = URL_START.exec(s);
      if (match) {
        let word = match[0];
        for (;;) {
          const last = word[word.length - 1];
          const open = last === ")" ? "(" : last === "]" ? "[" : "";
          if (last && SENTENCE_END.test(last)) word = word.slice(0, -1);
          else if (open && word.split(last).length > word.split(open).length)
            word = word.slice(0, -1);
          else break;
        }
        const href = word ? safeHref(word, options.schemes) : undefined;
        if (href) {
          flush();
          toks.push({ t: "link", href, kids: [{ t: "text", s: word }] });
          i += word.length;
          continue;
        }
      }
    }

    if (c === "\n") {
      // Two spaces before a line end make a hard break.
      const hard = text.endsWith("  ");
      text = trimSpaces(text);
      if (hard) {
        flush();
        toks.push({ t: "br" });
      } else {
        text += "\n";
      }
      i++;
      while (s[i] === " ") i++;
      continue;
    }

    text += c;
    i++;
  }
  flush();
  return finish(toks, options);
}

/**
 * Turn tokens into flat runs, merging neighbors with the same flags.
 * @param {Tok[]} toks
 * @param {Omit<Run, "text">} flags
 * @param {Run[]} [out]
 * @returns {Run[]}
 */
function flatten(toks, flags, out = []) {
  for (const tok of toks) {
    if (tok.t === "text") push(out, tok.s, flags);
    else if (tok.t === "code") push(out, tok.s, { ...flags, code: true });
    else if (tok.t === "br") out.push({ text: "\n", br: true });
    else if (tok.t === "node") {
      flatten(tok.kids, { ...flags, [tok.kind]: true }, out);
    } else if (tok.t === "link") {
      flatten(tok.kids, { ...flags, href: tok.href }, out);
    } else if (tok.t === "delim") {
      push(out, tok.ch.repeat(tok.n), flags);
    } else if (tok.t === "bracket") {
      push(out, tok.image ? "![" : "[", flags);
    }
  }
  return out;
}

/**
 * @param {Run[]} out
 * @param {string} text
 * @param {Omit<Run, "text">} flags
 */
function push(out, text, flags) {
  if (!text) return;
  const prev = out[out.length - 1];
  if (
    prev &&
    !prev.br &&
    prev.strong === flags.strong &&
    prev.em === flags.em &&
    prev.del === flags.del &&
    prev.code === flags.code &&
    prev.href === flags.href
  ) {
    prev.text += text;
    return;
  }
  /** @type {Run} */
  const run = { text };
  if (flags.strong) run.strong = true;
  if (flags.em) run.em = true;
  if (flags.del) run.del = true;
  if (flags.code) run.code = true;
  if (flags.href) run.href = flags.href;
  out.push(run);
}

/**
 * Parse one block's inline Markdown into flat runs.
 * @param {string} text
 * @param {MarkdownOptions} [options]
 * @returns {Run[]}
 */
export function parseInline(text, options = {}) {
  if (text.length > MAX_INLINE) return text ? [{ text }] : [];
  return flatten(
    tokenizeInline(text, {
      schemes: options.schemes ?? DEFAULT_SCHEMES,
      streaming: options.streaming ?? false,
    }),
    {},
  );
}

// -- Blocks ----------------------------------------------------------------

// Patterns avoid trailing `[ \t]*$` after a lazy group, which backtracks
// quadratically on a long line of spaces; the code trims instead.
const FENCE = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const HEADING = /^ {0,3}(#{1,6})(?:[ \t](.*))?$/;
const RULE = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/;
const QUOTE = /^ {0,3}>/;
// `[ ]` or `[x]` opening an item, then a space or the end.
const TASK = /^\[([ xX])\](?: +|$)/;
const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])(?:( +)(\S.*)?|$)/;
// One cell of a table's delimiter row. It is matched after the row is split
// into trimmed cells, since one pattern for the whole row backtracks
// quadratically on a long run of tabs.
const RULE_CELL = /^:?-+:?$/;

/** @param {string} cell */
const isRuleCell = (cell) => RULE_CELL.test(cell);

/** @param {string} line */
function isBlank(line) {
  return line.trim() === "";
}

/**
 * Drop an ATX heading's closing run of `#`.
 * @param {string} text
 */
function stripClosingHashes(text) {
  const trimmed = text.trim();
  let end = trimmed.length;
  while (trimmed[end - 1] === "#") end--;
  if (end < trimmed.length && (end === 0 || BLANKS.test(trimmed[end - 1]))) {
    return trimmed.slice(0, end).trim();
  }
  return trimmed;
}

/**
 * Split a table row into cells at unescaped pipes.
 * @param {string} line
 */
function splitRow(line) {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  /** @type {string[]} */
  const cells = [];
  let cell = "";
  for (let i = 0; i < row.length; i++) {
    if (row[i] === "\\" && row[i + 1] === "|") {
      cell += "|";
      i++;
    } else if (row[i] === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += row[i];
    }
  }
  cells.push(cell.trim());
  return cells;
}

/**
 * @param {string[]} lines
 * @param {number} at
 */
function startsTable(lines, at) {
  const head = lines[at];
  const rule = lines[at + 1];
  if (head === undefined || rule === undefined) return false;
  if (!head.includes("|") || !rule.includes("-")) return false;
  if (!rule.includes("|") && !head.trim().startsWith("|")) return false;
  // Each cell of the delimiter row is dashes with an optional colon at
  // either end, and there are as many as in the header.
  const cells = splitRow(rule);
  return cells.length === splitRow(head).length && cells.every(isRuleCell);
}

/**
 * Whether a line starts a block that ends a paragraph before it.
 * @param {string[]} lines
 * @param {number} at
 */
function interruptsParagraph(lines, at) {
  const line = lines[at];
  if (
    FENCE.test(line) ||
    HEADING.test(line) ||
    RULE.test(line) ||
    QUOTE.test(line)
  )
    return true;
  const item = ITEM.exec(line);
  if (
    item &&
    item[4] !== undefined &&
    (item[2].length === 1 || item[2] === "1." || item[2] === "1)")
  )
    return true;
  return startsTable(lines, at);
}

/**
 * @param {string[]} lines
 * @param {number} depth
 * @param {{ schemes: ReadonlyArray<string>, streaming: boolean }} options
 * @param {boolean} streamTail - whether the end of `lines` is still arriving
 * @param {number[] | undefined} starts - the offset of each line, for ids
 * @returns {{ block: Block, line: number }[]}
 */
function parseBlocks(lines, depth, options, streamTail, starts) {
  /** @type {{ block: Block, line: number }[]} */
  const out = [];
  let i = 0;
  const n = lines.length;
  // Text ends here: at the last line, or just before a final newline.
  const reachesEnd = (/** @type {number} */ next) =>
    next === n || (next === n - 1 && lines[n - 1] === "");

  /** @param {number} line */
  const idAt = (line) => (starts ? starts[line] : out.length);
  /** @param {string} text @param {boolean} last */
  const inline = (text, last) =>
    parseInline(text, {
      schemes: options.schemes,
      streaming: options.streaming && streamTail && last,
    });

  while (i < n) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    const first = i;

    const fence = FENCE.exec(line);
    if (fence && !(fence[2][0] === "`" && fence[3].includes("`"))) {
      const marker = fence[2];
      const indent = fence[1].length;
      const lang = LANG.exec(fence[3].trim())?.[0].slice(0, MAX_LANG) ?? "";
      /** @type {string[]} */
      const body = [];
      let closed = false;
      i++;
      for (; i < n; i++) {
        const close = FENCE.exec(lines[i]);
        if (
          close &&
          close[3].trim() === "" &&
          close[2][0] === marker[0] &&
          close[2].length >= marker.length
        ) {
          closed = true;
          i++;
          break;
        }
        const code = lines[i];
        let strip = 0;
        while (strip < indent && code[strip] === " ") strip++;
        body.push(code.slice(strip));
      }
      out.push({
        line: first,
        block: {
          id: idAt(first),
          type: "code",
          lang,
          text: body.join("\n"),
          closed,
        },
      });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      out.push({
        line: first,
        block: {
          id: idAt(first),
          type: "heading",
          level: heading[1].length,
          runs: inline(stripClosingHashes(heading[2] ?? ""), reachesEnd(i + 1)),
        },
      });
      i++;
      continue;
    }

    if (RULE.test(line)) {
      out.push({ line: first, block: { id: idAt(first), type: "rule" } });
      i++;
      continue;
    }

    if (QUOTE.test(line) && depth < MAX_DEPTH) {
      /** @type {string[]} */
      const inner = [];
      while (i < n && QUOTE.test(lines[i])) {
        inner.push(lines[i].replace(QUOTE_PREFIX, ""));
        i++;
      }
      out.push({
        line: first,
        block: {
          id: idAt(first),
          type: "quote",
          blocks: parseBlocks(
            inner,
            depth + 1,
            options,
            streamTail && i === n,
            undefined,
          ).map((entry) => entry.block),
        },
      });
      continue;
    }

    const item = ITEM.exec(line);
    if (item && depth < MAX_DEPTH) {
      const ordered = item[2].length > 1;
      const start = ordered ? Number.parseInt(item[2], 10) : 1;
      /** @type {ListItem[]} */
      const items = [];
      while (i < n) {
        const head = ITEM.exec(lines[i]);
        if (!head || head[2].length > 1 !== ordered) break;
        // Content starts after the marker and one to four spaces.
        const spaces = head[3] ?? "";
        const gap = spaces ? Math.min(spaces.length, 4) : 1;
        const contentAt = head[1].length + head[2].length + gap;
        /** @type {string[]} */
        const body = [head[4] === undefined ? "" : spaces.slice(gap) + head[4]];
        const task = TASK.exec(body[0]);
        if (task) body[0] = body[0].slice(task[0].length);
        i++;
        let pendingBlank = 0;
        while (i < n) {
          const next = lines[i];
          if (isBlank(next)) {
            pendingBlank++;
            i++;
            continue;
          }
          let indent = 0;
          while (next[indent] === " ") indent++;
          if (indent >= contentAt) {
            for (let b = 0; b < pendingBlank; b++) body.push("");
            pendingBlank = 0;
            body.push(next.slice(contentAt));
            i++;
          } else if (
            pendingBlank === 0 &&
            !interruptsParagraph(lines, i) &&
            !ITEM.test(next)
          ) {
            body.push(next.trim()); // a lazy continuation line
            i++;
          } else {
            break;
          }
        }
        const blocks = parseBlocks(
          body,
          depth + 1,
          options,
          streamTail && i >= n,
          undefined,
        ).map((entry) => entry.block);
        const [lead, ...rest] = blocks;
        items.push({
          ...(lead && lead.type === "paragraph"
            ? { runs: lead.runs, children: rest }
            : { runs: [], children: blocks }),
          ...(task ? { checked: task[1] !== " " } : {}),
        });
        // Blank lines then another item continue the list; otherwise they end it.
        if (pendingBlank > 0) {
          const peek = i < n ? ITEM.exec(lines[i]) : null;
          if (!(peek && peek[2].length > 1 === ordered)) break;
        }
      }
      out.push({
        line: first,
        block: { id: idAt(first), type: "list", ordered, start, items },
      });
      continue;
    }

    if (startsTable(lines, i)) {
      const head = splitRow(line);
      /** @type {Align[]} */
      const align = splitRow(lines[i + 1]).map((cell) => {
        const left = cell.startsWith(":");
        const right = cell.endsWith(":");
        return left && right
          ? "center"
          : right
            ? "right"
            : left
              ? "left"
              : null;
      });
      i += 2;
      /** @type {string[][]} */
      const body = [];
      while (i < n && !isBlank(lines[i]) && lines[i].includes("|")) {
        body.push(splitRow(lines[i]));
        i++;
      }
      const atEnd = reachesEnd(i);
      out.push({
        line: first,
        block: {
          id: idAt(first),
          type: "table",
          align,
          head: head.slice(0, align.length).map((text) => inline(text, false)),
          rows: body.map((row, r) =>
            align.map((_, c) =>
              inline(
                row[c] ?? "",
                atEnd && r === body.length - 1 && c === align.length - 1,
              ),
            ),
          ),
        },
      });
      continue;
    }

    // A paragraph runs to a blank line or a block that interrupts it. Only
    // leading spaces go, so two trailing spaces still make a hard break.
    /** @type {string[]} */
    const text = [line.replace(LEADING_SPACES, "")];
    i++;
    while (i < n && !isBlank(lines[i]) && !interruptsParagraph(lines, i)) {
      text.push(lines[i].replace(LEADING_SPACES, ""));
      i++;
    }
    out.push({
      line: first,
      block: {
        id: idAt(first),
        type: "paragraph",
        runs: inline(trimSpaces(text.join("\n")), reachesEnd(i)),
      },
    });
  }
  return out;
}

/** @param {string} source */
function splitLines(source) {
  return source
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line));
}

/**
 * Parse a whole document. A top-level block's `id` is the offset where it
 * starts, so it stays the same as text is appended after it.
 *
 * @param {string} source
 * @param {MarkdownOptions} [options]
 * @returns {Block[]}
 */
export function parseMarkdown(source, options = {}) {
  return createMarkdownParser(options).parse(source, options.streaming).blocks;
}

/**
 * A parser that remembers the blocks it has finished. Call `parse` with the
 * whole text each time it grows; only the last block is parsed again, and the
 * blocks before it are the same objects the last call returned, so a keyed
 * list can leave them alone. Text that doesn't extend the last call's text
 * starts over.
 *
 * @param {MarkdownOptions} [defaults]
 * @returns {{
 *   parse: (source: string, streaming?: boolean) => { blocks: Block[], frozen: number },
 *   reset: () => void,
 * }}
 */
export function createMarkdownParser(defaults = {}) {
  /** @type {Block[]} */
  let done = [];
  let tailStart = 0;
  let prefix = "";

  const reset = () => {
    done = [];
    tailStart = 0;
    prefix = "";
  };

  return {
    reset,
    parse(source, streaming = defaults.streaming ?? false) {
      if (tailStart > source.length || !source.startsWith(prefix)) reset();
      const options = {
        schemes: defaults.schemes ?? DEFAULT_SCHEMES,
        streaming,
      };
      const rest = source.slice(tailStart);
      /** @type {number[]} */
      const starts = [];
      let offset = tailStart;
      for (const line of rest.split("\n")) {
        starts.push(offset);
        offset += line.length + 1;
      }
      const lines = splitLines(rest);
      const parsed = parseBlocks(lines, 0, options, true, starts);
      // The last block may still change; the ones before it are final. While
      // the last line is still being written, the block above is open too:
      // a `#` there may become `#tag` and fold back into the paragraph
      // above, and a table's delimiter row may stop being one and give the
      // header back to the paragraph before it.
      let finished = parsed.length - 1;
      if (!rest.endsWith("\n")) finished--;
      if (finished > 0) {
        done = done.concat(
          parsed.slice(0, finished).map((entry) => entry.block),
        );
        tailStart = starts[parsed[finished].line];
        prefix = source.slice(0, tailStart);
      }
      return {
        blocks: done.concat(
          parsed.slice(Math.max(finished, 0)).map((entry) => entry.block),
        ),
        frozen: done.length,
      };
    },
  };
}
