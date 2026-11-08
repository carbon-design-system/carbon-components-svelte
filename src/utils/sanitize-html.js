// @ts-check
// Reduce untrusted HTML to an allowlist, without a DOM.
//
// It reads the string with its own tokenizer and writes new markup from the
// allowlist: nothing in the input is copied through, only re-emitted, so a
// parsing quirk of the browser (mutation XSS) has nothing to act on. Text is
// decoded and escaped again, and the only tags written are allowed, balanced
// ones with allowed attributes. It runs the same on the server and in the
// browser, never throws, and is linear in the input.

import { safeUrl } from "./safe-url.js";

/** Tags kept when the caller names none. */
const DEFAULT_TAGS = [
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "del",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "ins",
  "kbd",
  "li",
  "mark",
  "ol",
  "p",
  "pre",
  "q",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
];

/** Attributes kept per tag when the caller names none. `*` is every tag. */
const DEFAULT_ATTRIBUTES =
  /** @type {Record<string, ReadonlyArray<string>>} */ ({
    a: ["href", "title"],
    abbr: ["title"],
    q: ["cite"],
    blockquote: ["cite"],
  });

/** Tags no `allow` can bring back: they run code, load documents or style. */
const NEVER_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "frame",
  "frameset",
  "object",
  "embed",
  "applet",
  "svg",
  "math",
  "template",
  "base",
  "link",
  "meta",
  "noscript",
  "noembed",
  "noframes",
  "xmp",
  "plaintext",
  "textarea",
  "title",
  "head",
  "html",
  "body",
  "select",
  "option",
]);

/** Tags whose content is text the browser does not parse as markup. */
const RAW_TEXT = new Set([
  "script",
  "style",
  "textarea",
  "title",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
  "plaintext",
]);

/** Tags dropped with everything inside them. */
const DROP_CONTENT = new Set([
  "template",
  "svg",
  "math",
  "object",
  "applet",
  "frameset",
  "head",
  "select",
]);

const VOID = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

/** Tags that set their content apart by a blank line in `htmlToText`. */
const PARAGRAPH = new Set([
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "ol",
  "p",
  "pre",
  "table",
  "ul",
]);

/** Tags that start a new line in `htmlToText`. */
const BLOCK = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "br",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tr",
  "ul",
]);

/** Attributes that hold a URL. */
const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "cite",
  "action",
  "formaction",
  "poster",
  "background",
  "data",
  "srcset",
  "xlink:href",
]);

/** Attributes no `allow` can bring back. */
const NEVER_ATTRIBUTES = new Set(["style", "srcdoc", "srcset", "is"]);

/** The deepest nesting kept; tags past it are unwrapped. */
export const MAX_DEPTH = 64;
/** The most input read; the rest is dropped. */
export const MAX_HTML_LENGTH = 1_000_000;
const MAX_ATTRIBUTES = 32;

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
  laquo: "«",
  raquo: "»",
  deg: "°",
  times: "×",
  euro: "€",
  pound: "£",
  yen: "¥",
  cent: "¢",
  sect: "§",
  para: "¶",
  plusmn: "±",
  larr: "←",
  rarr: "→",
  uarr: "↑",
  darr: "↓",
});

const HEX_DIGITS = /^[0-9a-f]+$/i;
const DECIMAL_DIGITS = /^[0-9]+$/;
const BLOCK_SPACE = /[\t\n\f\r ]+/g;

/** @param {number} code */
function isSpace(code) {
  return code === 32 || code === 9 || code === 10 || code === 12 || code === 13;
}

/** @param {number} code */
function isAlpha(code) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * Decode the character references the sanitizer knows (numeric ones and a
 * short list of named ones). Any other `&name;` stays as the literal text.
 * @param {string} text
 * @returns {string}
 */
function decode(text) {
  let amp = text.indexOf("&");
  if (amp === -1) return text;
  let out = "";
  let last = 0;
  while (amp !== -1) {
    // A reference is short; look at no more than 12 characters after `&`,
    // so a run of `&` with no `;` costs one step each.
    let semi = -1;
    for (let k = amp + 1; k < text.length && k - amp <= 12; k++) {
      if (text.charCodeAt(k) === 59) {
        semi = k;
        break;
      }
    }
    if (semi !== -1) {
      const body = text.slice(amp + 1, semi);
      let value;
      if (body.charCodeAt(0) === 35) {
        const hex = body.charCodeAt(1) === 120 || body.charCodeAt(1) === 88;
        const digits = body.slice(hex ? 2 : 1);
        if (digits && (hex ? HEX_DIGITS : DECIMAL_DIGITS).test(digits)) {
          const code = Number.parseInt(digits, hex ? 16 : 10);
          value =
            !code || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)
              ? "�"
              : String.fromCodePoint(code);
        }
      } else if (Object.prototype.hasOwnProperty.call(ENTITIES, body)) {
        value = ENTITIES[body];
      }
      if (value !== undefined) {
        out += text.slice(last, amp) + value;
        last = semi + 1;
        amp = text.indexOf("&", last);
        continue;
      }
    }
    amp = text.indexOf("&", amp + 1);
  }
  return out + text.slice(last);
}

const ESCAPES = /** @type {Record<string, string>} */ ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
});
const ESCAPABLE = /[&<>"'`]/g;

/** @param {string} text */
function escape(text) {
  return text.replace(ESCAPABLE, (char) => ESCAPES[char]);
}

/**
 * @typedef {{
 *   text(text: string): void,
 *   start(name: string, attributes: Array<[string, string]>, selfClosing: boolean): void,
 *   end(name: string): void,
 * }} Handlers
 */

/**
 * Read `input` as HTML and call `handlers` for the text, start tags and end
 * tags that are left once comments, doctypes, processing instructions, raw
 * text elements (`script`, `style`...) and dropped elements (`svg`...) with
 * their contents are removed. Text arrives decoded; attribute values arrive
 * decoded; names arrive lower-case.
 *
 * @param {string} input
 * @param {Handlers} handlers
 */
function tokenize(input, handlers) {
  const length = input.length;
  let pos = 0;
  /** The name of a dropped element whose content is being skipped. */
  let skipping = "";
  let skipDepth = 0;

  while (pos < length) {
    const lt = input.indexOf("<", pos);
    if (lt === -1) {
      if (!skipping) handlers.text(decode(input.slice(pos)));
      return;
    }
    if (lt > pos && !skipping) handlers.text(decode(input.slice(pos, lt)));
    const next = input.charCodeAt(lt + 1);

    if (next === 33 /* ! */) {
      if (input.startsWith("<!--", lt)) {
        const close = input.indexOf("-->", lt + 4);
        if (close === -1) return;
        pos = close + 3;
      } else {
        const close = input.indexOf(">", lt + 2);
        if (close === -1) return;
        pos = close + 1;
      }
      continue;
    }
    if (next === 63 /* ? */) {
      const close = input.indexOf(">", lt + 2);
      if (close === -1) return;
      pos = close + 1;
      continue;
    }

    const closing = next === 47; /* / */
    const nameStart = lt + (closing ? 2 : 1);
    if (!isAlpha(input.charCodeAt(nameStart))) {
      // A `<` that opens nothing is text. `</` followed by a non-letter is
      // a bogus comment in HTML; dropping up to `>` is the safe reading.
      if (closing) {
        const close = input.indexOf(">", lt + 2);
        if (close === -1) return;
        pos = close + 1;
      } else {
        if (!skipping) handlers.text("<");
        pos = lt + 1;
      }
      continue;
    }

    let i = nameStart;
    while (i < length) {
      const code = input.charCodeAt(i);
      if (isSpace(code) || code === 47 || code === 62) break;
      i++;
    }
    const name = input.slice(nameStart, i).toLowerCase();

    /** @type {Array<[string, string]>} */
    const attributes = [];
    let selfClosing = false;
    let terminated = false;
    while (i < length) {
      while (
        i < length &&
        (isSpace(input.charCodeAt(i)) || input.charCodeAt(i) === 47)
      ) {
        selfClosing = input.charCodeAt(i) === 47;
        i++;
      }
      if (i >= length) break;
      if (input.charCodeAt(i) === 62) {
        terminated = true;
        i++;
        break;
      }
      selfClosing = false;
      const attrStart = i;
      i++;
      while (i < length) {
        const code = input.charCodeAt(i);
        if (isSpace(code) || code === 47 || code === 61 || code === 62) break;
        i++;
      }
      const attrName = input.slice(attrStart, i).toLowerCase();
      while (i < length && isSpace(input.charCodeAt(i))) i++;
      let value = "";
      if (input.charCodeAt(i) === 61 /* = */) {
        i++;
        while (i < length && isSpace(input.charCodeAt(i))) i++;
        const quote = input.charCodeAt(i);
        if (quote === 34 || quote === 39) {
          const close = input.indexOf(quote === 34 ? '"' : "'", i + 1);
          if (close === -1) {
            i = length;
            break;
          }
          value = input.slice(i + 1, close);
          i = close + 1;
        } else {
          const valueStart = i;
          while (
            i < length &&
            !isSpace(input.charCodeAt(i)) &&
            input.charCodeAt(i) !== 62
          ) {
            i++;
          }
          value = input.slice(valueStart, i);
        }
      }
      if (attributes.length < MAX_ATTRIBUTES) {
        attributes.push([attrName, decode(value)]);
      }
    }
    // An unterminated tag runs to the end of the input and is dropped.
    if (!terminated) return;
    pos = i;

    if (skipping) {
      if (name === skipping && !selfClosing) {
        skipDepth += closing ? -1 : 1;
        if (skipDepth <= 0) skipping = "";
      }
      continue;
    }
    if (closing) {
      handlers.end(name);
      continue;
    }
    if (RAW_TEXT.has(name)) {
      if (name === "plaintext") return;
      // Skip to the matching end tag. Compare names without lower-casing
      // the rest of the input, which could change its length.
      let search = pos;
      for (;;) {
        const end = input.indexOf("</", search);
        if (end === -1) return;
        if (
          input.slice(end + 2, end + 2 + name.length).toLowerCase() === name
        ) {
          const close = input.indexOf(">", end);
          if (close === -1) return;
          pos = close + 1;
          break;
        }
        search = end + 2;
      }
      continue;
    }
    if (DROP_CONTENT.has(name) && !selfClosing) {
      skipping = name;
      skipDepth = 1;
      continue;
    }
    handlers.start(name, attributes, selfClosing);
  }
}

/**
 * @typedef {{
 *   tags?: ReadonlyArray<string>,
 *   attributes?: Readonly<Record<string, ReadonlyArray<string>>>,
 *   protocols?: ReadonlyArray<string>,
 *   allowRelative?: boolean,
 *   maxLength?: number,
 * }} SanitizeHtmlAllow
 */

/**
 * Return `html` reduced to the tags and attributes in `allow`.
 *
 * Kept: text, and the allowed tags with their allowed attributes, closed
 * and nested as the input nests them. Everything else is removed: comments,
 * doctypes, `script`, `style`, `iframe`, `svg`, `math`, `template`,
 * `object` and `embed` with their content, event handler attributes
 * (`on*`), `style` and `srcdoc` attributes, and unknown tags (their text
 * stays). Those cannot be allowed back. A link whose `href` fails `safeUrl`
 * loses its tag and keeps its text; every kept link gets
 * `rel="noopener noreferrer nofollow"`.
 *
 * `allow.tags` and `allow.attributes` replace the defaults (a short list of
 * text, list, heading and link tags). `*` in `attributes` names attributes
 * allowed on every tag. `allow.protocols` and `allow.allowRelative` set what
 * a URL attribute may hold (default `http`, `https`, `mailto` and relative).
 * Input past `allow.maxLength` (1,000,000) is dropped.
 *
 * @param {unknown} html
 * @param {{ allow?: SanitizeHtmlAllow }} [options]
 * @returns {string}
 */
export function sanitizeHtml(html, options = {}) {
  const allow = options.allow ?? {};
  const tags = new Set(
    (allow.tags ?? DEFAULT_TAGS).map((tag) => String(tag).toLowerCase()),
  );
  const attributes = allow.attributes ?? DEFAULT_ATTRIBUTES;
  const urlOptions = {
    protocols: allow.protocols,
    allowRelative: allow.allowRelative ?? true,
  };
  const source = clip(html, allow.maxLength);

  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  const open = [];

  tokenize(source, {
    text(text) {
      out.push(escape(text));
    },
    start(name, attrs, selfClosing) {
      if (NEVER_TAGS.has(name) || !tags.has(name)) return;
      const named = attributes[name] ?? [];
      const global = attributes["*"] ?? [];
      /** @type {Set<string>} */
      const seen = new Set();
      let rendered = "";
      let hasHref = false;
      for (const [attr, value] of attrs) {
        if (seen.has(attr)) continue;
        seen.add(attr);
        if (
          attr.startsWith("on") ||
          NEVER_ATTRIBUTES.has(attr) ||
          !(named.includes(attr) || global.includes(attr))
        ) {
          continue;
        }
        let kept = value;
        if (URL_ATTRIBUTES.has(attr)) {
          const safe = safeUrl(value, urlOptions);
          if (safe === null) continue;
          kept = safe;
          if (attr === "href") hasHref = true;
        }
        rendered += ` ${attr}="${escape(kept)}"`;
      }
      if (name === "a") {
        if (!hasHref) return;
        rendered += ' rel="noopener noreferrer nofollow"';
      }
      const isVoid = VOID.has(name);
      if (!isVoid && open.length >= MAX_DEPTH) return;
      out.push(`<${name}${rendered}>`);
      if (!isVoid) {
        if (selfClosing) out.push(`</${name}>`);
        else open.push(name);
      }
    },
    end(name) {
      const index = open.lastIndexOf(name);
      if (index === -1) return;
      while (open.length > index) out.push(`</${open.pop()}>`);
    },
  });

  while (open.length) out.push(`</${open.pop()}>`);
  return out.join("");
}

/**
 * @param {unknown} html
 * @param {number} [maxLength]
 */
function clip(html, maxLength = MAX_HTML_LENGTH) {
  const text = typeof html === "string" ? html : String(html ?? "");
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

/**
 * The text of `html`: markup removed, entities decoded, `script` and
 * `style` content dropped, and a line break at each block element. Safe to
 * render as text. This is a parse, not a pattern that strips `<...>`, so
 * `<scr<script>ipt>` leaves no tag behind.
 *
 * @param {unknown} html
 * @param {{ maxLength?: number }} [options]
 * @returns {string}
 */
export function htmlToText(html, options = {}) {
  let text = "";

  /** @param {string} name */
  function breakAt(name) {
    const wanted = PARAGRAPH.has(name) ? 2 : BLOCK.has(name) ? 1 : 0;
    let have = 0;
    while (have < wanted && text.charCodeAt(text.length - 1 - have) === 10) {
      have++;
    }
    if (text && have < wanted) text += "\n".repeat(wanted - have);
  }

  tokenize(clip(html, options.maxLength), {
    text(chunk) {
      text += chunk.replace(BLOCK_SPACE, " ");
    },
    start: breakAt,
    end: breakAt,
  });
  // One pass over the lines: trim each, and keep at most one blank line.
  /** @type {string[]} */
  const lines = [];
  let blank = false;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      blank = lines.length > 0;
      continue;
    }
    if (blank) lines.push("");
    lines.push(trimmed);
    blank = false;
  }
  return lines.join("\n");
}
