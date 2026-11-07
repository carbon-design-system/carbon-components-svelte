// @ts-check
// Find URLs and email addresses in plain text. One forward pass: each
// character is read once, a candidate is measured by a bounded scan, and a
// candidate that fails never makes the scanner go back. There is no pattern
// that can backtrack, so cost is linear in the text (a 1 MB input takes
// milliseconds). Pure and DOM-free.

import { safeUrl } from "./safe-url.js";

/**
 * @typedef {{ type: "text", text: string } | { type: "link", text: string, href: string }} LinkifySegment
 */

const DEFAULT_PROTOCOLS = ["http", "https", "mailto"];
/** Schemes written without `//`. */
const NO_AUTHORITY = new Set(["mailto", "tel", "sms"]);
const TRAILING_COLON = /:$/;

/** Longest link `linkify` makes. A longer candidate stays text. */
export const MAX_LINK_LENGTH = 2048;
const MAX_LOCAL_LENGTH = 64;
const MAX_DOMAIN_LENGTH = 255;
const MAX_SCHEME_LENGTH = 16;

const SPACE = 32;

/** @param {number} code */
function isAlnum(code) {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122)
  );
}

/** @param {number} code */
function isLetter(code) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

/**
 * Characters that end a URL: whitespace, controls, angle brackets, quotes
 * and backticks (never valid in one), bidi and zero-width characters, and
 * CJK and fullwidth punctuation, so a URL typed before a Chinese or Japanese
 * sentence stops where the sentence starts.
 * @param {number} code
 */
function endsUrl(code) {
  if (code <= SPACE || code === 0x7f) return true;
  switch (code) {
    case 0x3c: // <
    case 0x3e: // >
    case 0x22: // "
    case 0x60: // `
    case 0x5c: // \
    case 0x7b: // {
    case 0x7d: // }
    case 0x7c: // |
    case 0x5e: // ^
      return true;
    default:
  }
  if (code < 0x80) return false;
  return (
    (code >= 0x80 && code <= 0xa0) ||
    code === 0x61c ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202f) ||
    (code >= 0x2060 && code <= 0x206f) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xff00 && code <= 0xffef && code !== 0xff0d) ||
    code === 0xfeff
  );
}

/**
 * Cut the punctuation that ends a sentence off the end of a URL, and a
 * closing bracket the URL did not open: `(see https://x.org/a)` leaves the
 * `)`, `https://en.wikipedia.org/wiki/Svelte_(software)` keeps its own.
 * Counts brackets once, then walks back, so it is linear.
 *
 * @param {string} text
 * @param {number} start
 * @param {number} end
 * @returns {number} The new end.
 */
function trimEnd(text, start, end) {
  let parens = 0;
  let squares = 0;
  for (let i = start; i < end; i++) {
    const code = text.charCodeAt(i);
    if (code === 0x28) parens++;
    else if (code === 0x29) parens--;
    else if (code === 0x5b) squares++;
    else if (code === 0x5d) squares--;
  }
  let stop = end;
  while (stop > start) {
    const code = text.charCodeAt(stop - 1);
    if (
      code === 0x2e || // .
      code === 0x2c || // ,
      code === 0x3b || // ;
      code === 0x3a || // :
      code === 0x21 || // !
      code === 0x3f || // ?
      code === 0x27 // '
    ) {
      stop--;
    } else if (code === 0x29 && parens < 0) {
      parens++;
      stop--;
    } else if (code === 0x5d && squares < 0) {
      squares++;
      stop--;
    } else {
      break;
    }
  }
  return stop;
}

/**
 * Where the URL that starts at `from` stops (before trimming), or `-1` when
 * it is longer than `max`. Never reads more than `max + 1` characters.
 * @param {string} text
 * @param {number} from
 * @param {number} max
 */
function scanUrl(text, from, max) {
  const limit = Math.min(text.length, from + max + 1);
  let i = from;
  while (i < limit && !endsUrl(text.charCodeAt(i))) i++;
  return i - from > max ? -1 : i;
}

/**
 * Skip to the end of the word that is too long to link.
 * @param {string} text
 * @param {number} from
 */
function skipWord(text, from) {
  let i = from;
  while (i < text.length && !endsUrl(text.charCodeAt(i))) i++;
  return i;
}

/**
 * Whether `host` (everything before the first `/`, `?` or `#`) can be a
 * `www.` host: two or more labels and a TLD of two or more letters.
 * @param {string} host
 */
function isWwwHost(host) {
  const dot = host.lastIndexOf(".");
  if (dot < 4) return false;
  let tld = 0;
  for (let i = dot + 1; i < host.length; i++) {
    const code = host.charCodeAt(i);
    if (code === 0x3a) break; // port
    if (code < 0x80 && !isLetter(code)) return false;
    tld++;
  }
  return tld >= 2;
}

/**
 * @param {number} code
 * @returns {boolean} Whether `code` may be in an email local part.
 */
function isLocalChar(code) {
  if (isAlnum(code)) return true;
  switch (code) {
    case 0x2e: // .
    case 0x5f: // _
    case 0x2d: // -
    case 0x2b: // +
    case 0x25: // %
    case 0x26: // &
    case 0x27: // '
    case 0x2a: // *
    case 0x3d: // =
    case 0x3f: // ?
    case 0x5e: // ^
    case 0x7b: // {
    case 0x7d: // }
    case 0x7e: // ~
    case 0x21: // !
    case 0x23: // #
    case 0x24: // $
    case 0x2f: // /
    case 0x60: // `
    case 0x7c: // |
      return true;
    default:
      return code >= 0x80 && !endsUrl(code);
  }
}

/**
 * Link URLs and email addresses in `text`.
 *
 * Finds `scheme://…` for each scheme in `protocols`, `mailto:` and `tel:`
 * (no slashes), bare `www.` hosts (linked over `https:`) and, unless
 * `emails` is `false`, bare email addresses (linked over `mailto:`). A
 * candidate becomes a link only if `safeUrl` accepts it, so `javascript:`,
 * `data:` and credentials stay text. Not found: a bare `example.com` with no
 * `www.` or scheme, since only a list of TLDs can tell it from a file name.
 *
 * A URL ends at whitespace, an angle bracket or quote, a bidi control, or
 * CJK punctuation. Sentence punctuation and an unmatched closing bracket at
 * its end are left out. A candidate longer than `maxLength` stays text.
 *
 * The segments, joined, give back `text`. Adjacent text is one segment.
 *
 * @param {unknown} text
 * @param {{
 *   protocols?: ReadonlyArray<string>,
 *   emails?: boolean,
 *   maxLength?: number,
 * }} [options]
 * @returns {LinkifySegment[]}
 */
export function linkify(text, options = {}) {
  const source = typeof text === "string" ? text : String(text ?? "");
  const protocols = new Set(
    (options.protocols ?? DEFAULT_PROTOCOLS).map((protocol) =>
      String(protocol).toLowerCase().replace(TRAILING_COLON, ""),
    ),
  );
  const emails = options.emails !== false && protocols.has("mailto");
  const maxLength = options.maxLength ?? MAX_LINK_LENGTH;
  const length = source.length;

  /** @type {LinkifySegment[]} */
  const segments = [];
  // The text from `textStart` up to the next link has not been emitted yet.
  let textStart = 0;
  // A candidate may not reach back before this: the end of the last link.
  let floor = 0;

  /**
   * @param {number} start
   * @param {number} end
   * @param {string} href
   */
  function emit(start, end, href) {
    if (start > textStart) {
      segments.push({ type: "text", text: source.slice(textStart, start) });
    }
    segments.push({ type: "link", text: source.slice(start, end), href });
    textStart = end;
    floor = end;
  }

  let i = 0;
  while (i < length) {
    const code = source.charCodeAt(i);

    if (code === 0x3a /* : */) {
      // Read the scheme backwards, at most `MAX_SCHEME_LENGTH` characters.
      let start = i;
      while (
        start > floor &&
        i - start < MAX_SCHEME_LENGTH &&
        (isAlnum(source.charCodeAt(start - 1)) ||
          source[start - 1] === "+" ||
          source[start - 1] === "." ||
          source[start - 1] === "-")
      ) {
        start--;
      }
      const name = source.slice(start, i).toLowerCase();
      const slashes =
        source.charCodeAt(i + 1) === 0x2f && source.charCodeAt(i + 2) === 0x2f;
      const preceding = start > 0 ? source.charCodeAt(start - 1) : SPACE;
      if (
        protocols.has(name) &&
        isLetter(source.charCodeAt(start)) &&
        !isAlnum(preceding) &&
        (NO_AUTHORITY.has(name) ? !slashes : slashes)
      ) {
        const bodyStart = i + 1;
        const stop = scanUrl(source, bodyStart, maxLength);
        if (stop === -1) {
          i = skipWord(source, bodyStart);
          continue;
        }
        const end = trimEnd(source, start, stop);
        const href =
          end > bodyStart + (slashes ? 2 : 0)
            ? safeUrl(source.slice(start, end), {
                protocols: [name],
                maxLength,
              })
            : null;
        if (href) {
          emit(start, end, href);
          i = end;
          continue;
        }
        // Not a link; the scan already measured it, so move past it.
        i = Math.max(stop, i + 1);
        continue;
      }
      i++;
      continue;
    }

    if (
      (code === 0x77 || code === 0x57) /* w */ &&
      (source.charCodeAt(i + 1) | 0x20) === 0x77 &&
      (source.charCodeAt(i + 2) | 0x20) === 0x77 &&
      source.charCodeAt(i + 3) === 0x2e &&
      protocols.has("https")
    ) {
      const preceding = i > 0 ? source.charCodeAt(i - 1) : SPACE;
      if (
        i >= floor &&
        !isAlnum(preceding) &&
        preceding !== 0x2e &&
        preceding !== 0x40 &&
        preceding !== 0x2f &&
        preceding !== 0x2d &&
        preceding !== 0x5f
      ) {
        const stop = scanUrl(source, i, maxLength);
        if (stop === -1) {
          i = skipWord(source, i);
          continue;
        }
        const end = trimEnd(source, i, stop);
        let hostEnd = i;
        while (
          hostEnd < end &&
          source[hostEnd] !== "/" &&
          source[hostEnd] !== "?" &&
          source[hostEnd] !== "#"
        ) {
          hostEnd++;
        }
        const href = isWwwHost(source.slice(i, hostEnd))
          ? safeUrl(`https://${source.slice(i, end)}`, {
              protocols: ["https"],
              maxLength,
            })
          : null;
        if (href) {
          emit(i, end, href);
          i = end;
          continue;
        }
        i = Math.max(stop, i + 1);
        continue;
      }
      i++;
      continue;
    }

    if (code === 0x40 /* @ */ && emails && i > floor) {
      // Local part, backwards.
      let start = i;
      while (
        start > floor &&
        i - start < MAX_LOCAL_LENGTH + 1 &&
        isLocalChar(source.charCodeAt(start - 1))
      ) {
        start--;
      }
      // Domain, forwards: labels of letters, digits and hyphens.
      let end = i + 1;
      let dots = 0;
      let labelStart = end;
      while (end < length && end - i <= MAX_DOMAIN_LENGTH) {
        const c = source.charCodeAt(end);
        if (c === 0x2e) {
          // A label needs a character and may not start or end with `-`.
          if (end === labelStart || source[end - 1] === "-") break;
          // A dot that ends the sentence belongs to the sentence.
          if (
            end + 1 >= length ||
            !isEmailDomainChar(source.charCodeAt(end + 1))
          ) {
            break;
          }
          dots++;
          labelStart = end + 1;
        } else if (!isEmailDomainChar(c)) {
          break;
        } else if (c === 0x2d && end === labelStart) {
          break;
        }
        end++;
      }
      const local = source.slice(start, i);
      const domain = source.slice(i + 1, end);
      if (
        local &&
        i - start <= MAX_LOCAL_LENGTH &&
        local[0] !== "." &&
        local[local.length - 1] !== "." &&
        !local.includes("..") &&
        dots > 0 &&
        source[end - 1] !== "-" &&
        isTld(domain)
      ) {
        const href = safeUrl(`mailto:${local}@${domain}`, {
          protocols: ["mailto"],
        });
        if (href) {
          emit(start, end, href);
          i = end;
          continue;
        }
      }
      i++;
      continue;
    }

    i++;
  }

  if (textStart < length) {
    segments.push({ type: "text", text: source.slice(textStart) });
  }
  return segments;
}

/** @param {number} code */
function isEmailDomainChar(code) {
  return isAlnum(code) || code === 0x2d || (code >= 0x80 && !endsUrl(code));
}

/**
 * Whether the last label of `domain` is two or more letters.
 * @param {string} domain
 */
function isTld(domain) {
  const dot = domain.lastIndexOf(".");
  const tld = domain.slice(dot + 1);
  if (tld.length < 2) return false;
  for (let i = 0; i < tld.length; i++) {
    const code = tld.charCodeAt(i);
    if (code < 0x80 && !isLetter(code)) return false;
  }
  return true;
}
