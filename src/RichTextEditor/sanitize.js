// @ts-check

/**
 * The schema RichTextEditor stores: paragraphs, h2/h3, blockquotes of
 * paragraphs, nested bulleted and numbered lists, and the inline marks
 * strong, em, u, s, code and a[href]. `sanitizeHtml` rebuilds any HTML into
 * it from an allowlist, so the output holds only those tags and escaped text.
 *
 * It tokenizes the string itself rather than parsing it into a DOM, which
 * keeps it identical on the server and in the browser, and means no browser
 * parsing quirk (mutation XSS) can reach the output: nothing in the input is
 * ever copied through, only re-emitted.
 */

const STRONG = 1;
const EM = 2;
const U = 4;
const S = 8;
const CODE = 16;

/** Canonical nesting order, outermost first. */
const MARKS = /** @type {const} */ ([
  ["strong", STRONG],
  ["em", EM],
  ["u", U],
  ["s", S],
  ["code", CODE],
]);

/** Elements dropped together with everything inside them. */
const DROPPED = new Set([
  "script",
  "style",
  "template",
  "noscript",
  "iframe",
  "object",
  "embed",
  "applet",
  "svg",
  "math",
  "head",
  "title",
  "textarea",
  "select",
  "option",
  "audio",
  "video",
  "canvas",
  "xml",
]);

const VOID = new Set([
  "br",
  "hr",
  "img",
  "input",
  "meta",
  "link",
  "wbr",
  "col",
  "area",
  "base",
  "param",
  "source",
  "track",
]);

/** Elements that start a new block of text. */
const BLOCKS = new Set([
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "ul",
  "ol",
  "li",
  "pre",
  "hr",
  "table",
  "tr",
  "td",
  "th",
  "caption",
  "section",
  "article",
  "header",
  "footer",
  "main",
  "nav",
  "aside",
  "figure",
  "figcaption",
  "address",
  "details",
  "summary",
  "dl",
  "dt",
  "dd",
  "center",
  "form",
  "fieldset",
]);

const BOLD_TAGS = new Set(["strong", "b"]);
const ITALIC_TAGS = new Set(["em", "i", "cite", "dfn", "var"]);
const STRIKE_TAGS = new Set(["s", "strike", "del"]);
const CODE_TAGS = new Set(["code", "tt", "kbd", "samp"]);

/** Depth beyond which nested elements are flattened, so recursion stays bounded. */
const MAX_DEPTH = 64;

const ENTITIES = /** @type {Record<string, string>} */ ({
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  trade: "™",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  bull: "•",
  middot: "·",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  deg: "°",
  times: "×",
  divide: "÷",
  laquo: "«",
  raquo: "»",
  sect: "§",
  para: "¶",
  plusmn: "±",
  frac12: "½",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
  ensp: " ",
  emsp: " ",
  thinsp: " ",
});

const ENTITY = /&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const NAME_END = /[\s/>]/;
const SPACE = /\s/;
const ATTRIBUTE_END = /[\s/=>]/;
const UNQUOTED_END = /[\s>]/;
const DIGITS = /^\d+$/;
const SOURCE_WHITESPACE = /[ \t\n\r\f]+/g;
const SOURCE_WHITESPACE_ONLY = /^[ \t\n\r\f]*$/;
const LINE_ENDINGS = /\r\n?/g;
const TRAILING_BREAKS = /\n+$/;
const TRAILING_SPACES = /[ \n]+$/;
const PADDING_ONLY = /^[\u00a0 \n]*$/;
const MONOSPACE = /mono|courier|consolas|menlo/;
const HEADING = /^h[1-6]$/;
const LEVEL = /level(\d+)/;
const ORDERED_MARKER = /^[\s\u00a0]*(?:\d+|[a-z]|[ivxlcdm]+)[.)]/i;
const NON_SPACE = /\S/;
const STRUCTURE_TAG = /<br\s*\/?>|<\/?(?:p|h2|h3|blockquote|ul|ol|li)>/g;
const NBSP_ENTITY = /&nbsp;/g;
const TEXT_BLOCK_TAGS = new Set(["p", "h2", "h3", "li"]);
const SKIPPED_TEXT_TAGS = new Set(["script", "style", "template"]);
const TRAILING_NEWLINE = /\n$/;
const PARAGRAPH_BREAKS = /\n{2,}/;
const EDGE_NEWLINES = /^\n+|\n+$/g;
const MAIL_ADDRESS = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;
const RELATIVE_START = /^[/#?.]/;
const BARE_DOMAIN = /^[^\s/]+\.[^\s/]{2,}(?:[/?#]|$)/;
const ZERO_WIDTH_SPACE = new RegExp(String.fromCharCode(0x200b), "g");

/** @param {string} text */
function decode(text) {
  if (!text.includes("&")) return text;
  return text.replace(ENTITY, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
      if (!code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
        return "�";
      }
      return String.fromCodePoint(code);
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** @param {string} text */
function escapeText(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/ /g, "&nbsp;");
}

/** @param {string} value */
function escapeAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/ /g, "&nbsp;");
}

const DEFAULT_PROTOCOLS = ["http", "https", "mailto", "tel"];

/**
 * Return `href` when it is safe to link to, otherwise `undefined`.
 * Browsers ignore control characters and spaces inside a URL's scheme
 * (`java\tscript:`), so they are removed before the scheme is read.
 *
 * @param {string | undefined} href
 * @param {readonly string[]} [protocols]
 * @returns {string | undefined}
 */
export function safeHref(href, protocols = DEFAULT_PROTOCOLS) {
  if (!href) return undefined;
  const trimmed = href.trim();
  // Browsers ignore control characters and spaces anywhere in a scheme.
  const compact = Array.from(trimmed)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code > 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join("");
  if (!compact) return undefined;
  const scheme = SCHEME.exec(compact);
  if (scheme && !protocols.includes(scheme[1].toLowerCase())) return undefined;
  return trimmed;
}

/**
 * @typedef {{
 *   tag: string,
 *   href?: string,
 *   style?: string,
 *   cls?: string,
 *   kids: Array<Node | string>,
 * }} Node
 */

const ALPHA = /[a-zA-Z]/;

/**
 * Read `html` into a loose element tree. Unknown tags are kept (and unwrapped
 * later), implied end tags are inferred for `p` and `li`, a stray end tag is
 * ignored, and an unterminated tag ends the input, as in a browser.
 *
 * @param {string} html
 * @returns {Node}
 */
function parse(html) {
  /** @type {Node} */
  const root = { tag: "#root", kids: [] };
  /** @type {Node[]} */
  const stack = [root];
  const length = html.length;
  /** @type {string | undefined} */
  let lower;
  let pos = 0;

  /** @param {string} text */
  function addText(text) {
    if (text) stack[stack.length - 1].kids.push(decode(text));
  }

  /** @param {string} tag */
  function closeImplied(tag) {
    if (tag === "li") {
      for (let i = stack.length - 1; i > 0; i--) {
        const name = stack[i].tag;
        if (name === "ul" || name === "ol") return;
        if (name === "li") {
          stack.length = i;
          return;
        }
      }
    } else if (tag === "td" || tag === "th" || tag === "tr") {
      for (let i = stack.length - 1; i > 0; i--) {
        const name = stack[i].tag;
        if (name === "table") return;
        if (name === "td" || name === "th" || (tag === "tr" && name === "tr")) {
          stack.length = i;
          return;
        }
      }
    } else if (BLOCKS.has(tag)) {
      // A block closes an open `p`, unless a list item, quote or cell sits
      // between them.
      for (let i = stack.length - 1; i > 0; i--) {
        const name = stack[i].tag;
        if (name === "p") {
          stack.length = i;
          return;
        }
        if (
          name === "li" ||
          name === "blockquote" ||
          name === "td" ||
          name === "th" ||
          name === "div"
        ) {
          return;
        }
      }
    }
  }

  while (pos < length) {
    const lt = html.indexOf("<", pos);
    if (lt === -1) {
      addText(html.slice(pos));
      break;
    }
    const next = html[lt + 1];

    if (next === "!" || next === "?") {
      addText(html.slice(pos, lt));
      let end;
      if (html.startsWith("<!--", lt)) {
        end = html.indexOf("-->", lt + 4);
        if (end === -1) break;
        pos = end + 3;
      } else {
        end = html.indexOf(">", lt + 2);
        if (end === -1) break;
        pos = end + 1;
      }
      continue;
    }

    const closing = next === "/";
    const nameStart = lt + (closing ? 2 : 1);
    if (!ALPHA.test(html[nameStart] ?? "")) {
      addText(html.slice(pos, lt + 1));
      pos = lt + 1;
      continue;
    }
    addText(html.slice(pos, lt));

    let i = nameStart;
    while (i < length && !NAME_END.test(html[i])) i++;
    const tag = html.slice(nameStart, i).toLowerCase();

    /** @type {string | undefined} */
    let href;
    /** @type {string | undefined} */
    let style;
    /** @type {string | undefined} */
    let cls;
    let selfClosing = false;
    let terminated = false;

    while (i < length) {
      const ch = html[i];
      if (ch === ">") {
        i++;
        terminated = true;
        break;
      }
      if (ch === "/") {
        selfClosing = html[i + 1] === ">";
        i++;
        continue;
      }
      if (SPACE.test(ch)) {
        i++;
        continue;
      }
      const attrStart = i;
      while (i < length && !ATTRIBUTE_END.test(html[i])) i++;
      if (i === attrStart) {
        i++;
        continue;
      }
      const attr = html.slice(attrStart, i).toLowerCase();
      while (i < length && SPACE.test(html[i])) i++;
      let value = "";
      if (html[i] === "=") {
        i++;
        while (i < length && SPACE.test(html[i])) i++;
        const quote = html[i];
        if (quote === '"' || quote === "'") {
          const close = html.indexOf(quote, i + 1);
          if (close === -1) {
            i = length;
            break;
          }
          value = html.slice(i + 1, close);
          i = close + 1;
        } else {
          const valueStart = i;
          while (i < length && !UNQUOTED_END.test(html[i])) i++;
          value = html.slice(valueStart, i);
        }
      }
      if (!closing) {
        if (attr === "href") href = decode(value);
        else if (attr === "style") style = decode(value);
        else if (attr === "class") cls = value;
      }
    }
    if (!terminated) break;
    pos = i;

    if (closing) {
      for (let j = stack.length - 1; j > 0; j--) {
        if (stack[j].tag === tag) {
          stack.length = j;
          break;
        }
      }
      continue;
    }

    if (DROPPED.has(tag)) {
      lower ??= html.toLowerCase();
      const close = lower.indexOf(`</${tag}`, pos);
      if (close === -1) break;
      const end = html.indexOf(">", close);
      if (end === -1) break;
      pos = end + 1;
      continue;
    }

    closeImplied(tag);
    const node = { tag, href, style, cls, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (!VOID.has(tag) && !selfClosing && stack.length < MAX_DEPTH) {
      stack.push(node);
    }
  }

  return root;
}

/**
 * @param {string | undefined} style
 * @returns {Record<string, string>}
 */
function parseStyle(style) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!style) return out;
  for (const part of style.split(";")) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    out[part.slice(0, colon).trim().toLowerCase()] = part
      .slice(colon + 1)
      .trim()
      .toLowerCase();
  }
  return out;
}

/** @param {string} weight */
function isBold(weight) {
  return (
    weight === "bold" ||
    weight === "bolder" ||
    (DIGITS.test(weight) && Number(weight) >= 600)
  );
}

/** @param {string} weight */
function isNormalWeight(weight) {
  return (
    weight === "normal" ||
    weight === "lighter" ||
    (DIGITS.test(weight) && Number(weight) < 600)
  );
}

/**
 * @typedef {{ text: string, marks: number, href?: string }} Run
 * @typedef {{ runs: Run[], lists: ListBlock[] }} Item
 * @typedef {{ kind: "list", tag: "ul" | "ol", items: Item[] }} ListBlock
 * @typedef {{ kind: "text", tag: "p" | "h2" | "h3", runs: Run[] }} TextBlock
 * @typedef {{ kind: "quote", blocks: TextBlock[] }} QuoteBlock
 * @typedef {TextBlock | QuoteBlock | ListBlock} Block
 */

/**
 * Fit a parsed tree to the schema.
 *
 * @param {Node} root
 * @param {readonly string[]} protocols
 * @param {boolean} edges Keep a space at the start and end of a block.
 * @returns {Block[]}
 */
function buildBlocks(root, protocols, edges) {
  /** @type {Block[]} */
  const doc = [];
  /** @type {Array<Block | TextBlock>} */
  const target = doc;
  /** @type {QuoteBlock | null} */
  let quote = null;
  /** @type {{ runs: Run[] } | null} */
  let current = null;
  /** @type {"p" | "h2" | "h3"} */
  let blockTag = "p";
  /** @type {Item | null} */
  let item = null;
  let pre = false;
  /** @type {ListBlock[]} */
  let wordLists = [];
  /** @type {ListBlock | null} */
  let currentList = null;

  /** @param {Run[]} runs */
  function lastChar(runs) {
    for (let i = runs.length - 1; i >= 0; i--) {
      const text = runs[i].text;
      if (text) return text[text.length - 1];
    }
    return "";
  }

  /**
   * @param {string} text
   * @param {number} marks
   * @param {string | undefined} href
   */
  function addInline(text, marks, href) {
    if (!text) return;
    let value = text;
    if (pre) {
      value = value.replace(LINE_ENDINGS, "\n");
    } else {
      value = value.replace(SOURCE_WHITESPACE, " ");
      // Collapsible whitespace at the start of a block or line is dropped.
      const previous = current ? lastChar(current.runs) : "";
      if (
        value[0] === " " &&
        (previous === " " || previous === "\n" || (previous === "" && !edges))
      ) {
        value = value.slice(1);
      }
      if (!value) return;
    }
    if (!current) {
      if (!pre && SOURCE_WHITESPACE_ONLY.test(value)) return;
      startBlock();
    }
    const runs = /** @type {{ runs: Run[] }} */ (current).runs;
    const last = runs[runs.length - 1];
    if (last && last.marks === marks && last.href === href) last.text += value;
    else runs.push({ text: value, marks, href });
  }

  function startBlock() {
    if (item) {
      current = item;
      return;
    }
    /** @type {TextBlock} */
    const block = { kind: "text", tag: quote ? "p" : blockTag, runs: [] };
    (quote ? quote.blocks : target).push(block);
    current = block;
  }

  function endBlock() {
    if (current && !item) finishRuns(current.runs);
    current = item;
  }

  /** @param {Run[]} runs */
  function finishRuns(runs) {
    // Trailing spaces and line breaks render as nothing.
    for (;;) {
      const last = runs[runs.length - 1];
      if (!last) return;
      last.text = last.text.replace(
        edges ? TRAILING_BREAKS : TRAILING_SPACES,
        "",
      );
      if (last.text) break;
      runs.pop();
    }
    // Word pads its spacing paragraphs with a non-breaking space.
    if (runs.length > 0 && runs.every((run) => PADDING_ONLY.test(run.text))) {
      runs.length = 0;
    }
  }

  /**
   * @param {Node} node
   * @param {number} marks
   * @param {string | undefined} href
   */
  function walk(node, marks, href) {
    for (const kid of node.kids) {
      if (typeof kid === "string") {
        addInline(kid, marks, href);
        continue;
      }
      element(kid, marks, href);
    }
  }

  /**
   * @param {Node} node
   * @param {number} marks
   * @param {string | undefined} href
   */
  function element(node, marks, href) {
    const { tag } = node;

    if (tag === "br") {
      if (!current) startBlock();
      const runs = /** @type {{ runs: Run[] }} */ (current).runs;
      const last = runs[runs.length - 1];
      if (last && last.marks === 0 && last.href === undefined) {
        last.text += "\n";
      } else runs.push({ text: "\n", marks: 0 });
      return;
    }
    if (tag === "hr") {
      endBlock();
      return;
    }
    if (VOID.has(tag)) return;

    const style = node.style ? parseStyle(node.style) : undefined;

    // Word's list marker (a bullet or "1.") sits in an element it tells
    // other readers to ignore.
    if (style?.["mso-list"] === "ignore") return;

    let next = marks;
    let nextHref = href;
    if (BOLD_TAGS.has(tag)) next |= STRONG;
    else if (ITALIC_TAGS.has(tag)) next |= EM;
    else if (tag === "u" || tag === "ins") next |= U;
    else if (STRIKE_TAGS.has(tag)) next |= S;
    else if (CODE_TAGS.has(tag)) next |= CODE;
    else if (tag === "a") {
      const safe = safeHref(node.href, protocols);
      if (safe) nextHref = safe;
    }
    if (style) {
      const weight = style["font-weight"];
      if (weight) {
        if (isBold(weight)) next |= STRONG;
        else if (isNormalWeight(weight)) next &= ~STRONG;
      }
      const fontStyle = style["font-style"];
      if (fontStyle === "italic" || fontStyle === "oblique") next |= EM;
      else if (fontStyle === "normal") next &= ~EM;
      const decoration =
        style["text-decoration-line"] ?? style["text-decoration"] ?? "";
      if (decoration.includes("underline")) next |= U;
      if (decoration.includes("line-through")) next |= S;
      if (MONOSPACE.test(style["font-family"] ?? "")) {
        next |= CODE;
      }
    }
    // A link is underlined already.
    if (nextHref) next &= ~U;

    if (!BLOCKS.has(tag)) {
      walk(node, next, nextHref);
      return;
    }

    if (tag === "ul" || tag === "ol") {
      if (quote) {
        endBlock();
        walk(node, next, nextHref);
        endBlock();
        return;
      }
      const parent = item;
      endBlock();
      /** @type {ListBlock} */
      const list = { kind: "list", tag, items: [] };
      if (parent) parent.lists.push(list);
      else target.push(list);
      const saved = item;
      const savedList = currentList;
      const savedWord = wordLists;
      wordLists = [];
      currentList = list;
      walk(node, next, nextHref);
      wordLists = savedWord;
      currentList = savedList;
      item = saved;
      current = item;
      return;
    }

    if (tag === "li") {
      endBlock();
      if (quote) {
        walk(node, next, nextHref);
        endBlock();
        return;
      }
      // A stray `li` outside a list starts one.
      const list = lastList();
      const entry = { runs: [], lists: [] };
      list.items.push(entry);
      const saved = item;
      item = entry;
      current = entry;
      walk(node, next, nextHref);
      finishRuns(entry.runs);
      item = saved;
      current = saved;
      return;
    }

    if (tag === "blockquote") {
      endBlock();
      if (quote || item) {
        walk(node, next, nextHref);
        endBlock();
        return;
      }
      /** @type {QuoteBlock} */
      const block = { kind: "quote", blocks: [] };
      target.push(block);
      quote = block;
      walk(node, next, nextHref);
      endBlock();
      quote = null;
      return;
    }

    // Everything else that is a block of text: p, headings, div, pre, cells.
    if (item) {
      // Blocks inside a list item continue its text on a new line.
      if (current && current.runs.length > 0) {
        const runs = current.runs;
        const last = runs[runs.length - 1];
        if (!last.text.endsWith("\n")) {
          if (last.marks === 0 && last.href === undefined) last.text += "\n";
          else runs.push({ text: "\n", marks: 0 });
        }
      }
      walk(node, next, nextHref);
      return;
    }

    endBlock();
    const mso = style?.["mso-list"];
    if (mso && tag === "p") {
      wordListItem(node, mso, next, nextHref);
      return;
    }
    wordLists = [];

    const savedTag = blockTag;
    const savedPre = pre;
    if (HEADING.test(tag)) blockTag = tag <= "h2" ? "h2" : "h3";
    else if (tag === "p" || tag === "div") blockTag = "p";
    if (tag === "pre") {
      pre = true;
      next |= CODE;
    }
    // An empty paragraph is a blank line, not nothing.
    const hasBreak = node.kids.some(
      (kid) => typeof kid !== "string" && kid.tag === "br",
    );
    walk(node, next, nextHref);
    if (hasBreak && !current) startBlock();
    endBlock();
    blockTag = savedTag;
    pre = savedPre;
  }

  /** The list a `li` belongs to; a stray `li` starts one. */
  function lastList() {
    if (currentList) return currentList;
    /** @type {ListBlock} */
    const list = { kind: "list", tag: "ul", items: [] };
    (item ? item.lists : target).push(list);
    currentList = list;
    return list;
  }

  /**
   * A paragraph Word marks as a list item (`mso-list: l0 level2 lfo1`).
   * @param {Node} node
   * @param {string} mso
   * @param {number} marks
   * @param {string | undefined} href
   */
  function wordListItem(node, mso, marks, href) {
    const level = Math.min(Number(LEVEL.exec(mso)?.[1] ?? 1), 8);
    const ordered = isOrderedMarker(markerText(node));
    while (wordLists.length > level) wordLists.pop();
    while (wordLists.length < level) {
      /** @type {ListBlock} */
      const list = {
        kind: "list",
        tag: ordered && wordLists.length === level - 1 ? "ol" : "ul",
        items: [],
      };
      const parent = wordLists[wordLists.length - 1];
      const owner = parent?.items[parent.items.length - 1];
      if (owner) owner.lists.push(list);
      else target.push(list);
      wordLists.push(list);
    }
    const list = wordLists[level - 1];
    /** @type {Item} */
    const entry = { runs: [], lists: [] };
    list.items.push(entry);
    item = entry;
    current = entry;
    walk(node, marks, href);
    finishRuns(entry.runs);
    item = null;
    current = null;
  }

  /** @param {Node} node */
  function markerText(node) {
    let text = "";
    /** @param {Node} n */
    const visit = (n) => {
      for (const kid of n.kids) {
        if (typeof kid === "string") text += kid;
        else if (parseStyle(kid.style)["mso-list"] === "ignore") {
          text += plain(kid);
        } else visit(kid);
        if (text.trim()) return;
      }
    };
    visit(node);
    return text;
  }

  /**
   * @param {Node} n
   * @returns {string}
   */
  function plain(n) {
    return n.kids
      .map((kid) => (typeof kid === "string" ? kid : plain(kid)))
      .join("");
  }

  walk(root, 0, undefined);
  endBlock();
  return doc;
}

/** @param {string} marker */
function isOrderedMarker(marker) {
  return ORDERED_MARKER.test(marker);
}

/**
 * @param {Run[]} runs
 * @returns {string}
 */
function serializeRuns(runs) {
  if (runs.length === 0 || (runs.length === 1 && runs[0].text === "\n")) {
    return "<br>";
  }
  let out = "";
  /** @type {string[]} */
  let open = [];
  for (const run of runs) {
    /** @type {string[]} */
    const wanted = [];
    if (run.href) wanted.push(`a:${run.href}`);
    for (const [name, bit] of MARKS) {
      if (run.marks & bit) wanted.push(name);
    }
    let common = 0;
    while (
      common < open.length &&
      common < wanted.length &&
      open[common] === wanted[common]
    ) {
      common++;
    }
    for (let i = open.length - 1; i >= common; i--) {
      out += `</${open[i].startsWith("a:") ? "a" : open[i]}>`;
    }
    for (let i = common; i < wanted.length; i++) {
      const name = wanted[i];
      out += name.startsWith("a:")
        ? `<a href="${escapeAttribute(name.slice(2))}">`
        : `<${name}>`;
    }
    open = wanted;
    out += run.text.split("\n").map(escapeText).join("<br>");
  }
  for (let i = open.length - 1; i >= 0; i--) {
    out += `</${open[i].startsWith("a:") ? "a" : open[i]}>`;
  }
  return out;
}

/**
 * @param {Item} item
 * @returns {string}
 */
function serializeItem(item) {
  return `<li>${serializeRuns(item.runs)}${item.lists.map(serializeList).join("")}</li>`;
}

/**
 * @param {ListBlock} list
 * @returns {string}
 */
function serializeList(list) {
  return `<${list.tag}>${list.items.map(serializeItem).join("")}</${list.tag}>`;
}

/**
 * @param {Block} block
 * @returns {string}
 */
function serializeBlock(block) {
  if (block.kind === "list") return serializeList(block);
  if (block.kind === "quote") {
    return `<blockquote>${block.blocks.map(serializeBlock).join("")}</blockquote>`;
  }
  return `<${block.tag}>${serializeRuns(block.runs)}</${block.tag}>`;
}

/**
 * @typedef {Object} SanitizeOptions
 * @property {boolean} [edges] - Keep a space at the start and end of each block, so a fragment pasted into a line keeps the space that separates it from its neighbors. Default `false`.
 * @property {readonly string[]} [protocols] - URL schemes a link may use. Default `["http", "https", "mailto", "tel"]`. Links with no scheme are always kept.
 */

/**
 * Rebuild `html` in the RichTextEditor schema. The result contains only
 * `p`, `h2`, `h3`, `blockquote`, `ul`, `ol`, `li`, `br`, `strong`, `em`, `u`,
 * `s`, `code` and `a[href]`, with every piece of text escaped. A document with
 * no text is `""`.
 *
 * Run it on the server for any value that came from a client: the editor
 * sanitizes what it renders and what it pastes, but a form post does not pass
 * through the editor.
 *
 * @param {string | null | undefined} html
 * @param {SanitizeOptions} [options]
 * @returns {string}
 */
export function sanitizeHtml(html, options = {}) {
  if (!html) return "";
  const protocols = options.protocols ?? DEFAULT_PROTOCOLS;
  const blocks = buildBlocks(
    parse(String(html).replace(ZERO_WIDTH_SPACE, "")),
    protocols.map((p) => p.toLowerCase()),
    options.edges === true,
  );
  const out = blocks.map(serializeBlock).join("");
  return isEmptyHtml(out) ? "" : out;
}

/**
 * Whether `html` has no text, only empty paragraphs.
 *
 * @param {string | null | undefined} html
 * @returns {boolean}
 */
export function isEmptyHtml(html) {
  if (!html) return true;
  return !NON_SPACE.test(
    html.replace(STRUCTURE_TAG, "").replace(NBSP_ENTITY, ""),
  );
}

/**
 * The text of `html`, a line per block. For counting and for the empty check;
 * not a general HTML-to-text converter.
 *
 * @param {string | null | undefined} html
 * @returns {string}
 */
export function htmlToText(html) {
  if (!html) return "";
  // Walk the parsed tree rather than strip tags with a pattern: decoded text
  // never becomes markup, and script and style contents are left out.
  let text = "";
  /** @param {Node} node */
  function walk(node) {
    for (const kid of node.kids) {
      if (typeof kid === "string") {
        text += kid;
      } else if (kid.tag === "br") {
        text += "\n";
      } else if (!SKIPPED_TEXT_TAGS.has(kid.tag)) {
        walk(kid);
        if (TEXT_BLOCK_TAGS.has(kid.tag)) text += "\n";
      }
    }
  }
  walk(parse(html));
  return text.replace(TRAILING_NEWLINE, "");
}

/**
 * Turn plain text into the editor's HTML: blank lines separate paragraphs and
 * single line breaks stay inside them.
 *
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function textToHtml(text) {
  if (!text) return "";
  return text
    .replace(LINE_ENDINGS, "\n")
    .split(PARAGRAPH_BREAKS)
    .filter((paragraph) => paragraph.trim() !== "")
    .map(
      (paragraph) =>
        `<p>${paragraph
          .replace(EDGE_NEWLINES, "")
          .split("\n")
          .map(escapeText)
          .join("<br>")}</p>`,
    )
    .join("");
}

/**
 * Turn what someone typed into the link dialog into an `href`: a bare domain
 * gets `https://`, an email address `mailto:`. Returns `undefined` for
 * anything `safeHref` rejects.
 *
 * @param {string} input
 * @returns {string | undefined}
 */
export function normalizeHref(input) {
  const value = input.trim();
  if (!value || SPACE.test(value)) return undefined;
  if (MAIL_ADDRESS.test(value)) return `mailto:${value}`;
  if (
    !SCHEME.test(value) &&
    !RELATIVE_START.test(value) &&
    BARE_DOMAIN.test(value)
  ) {
    return safeHref(`https://${value}`);
  }
  return safeHref(value);
}
