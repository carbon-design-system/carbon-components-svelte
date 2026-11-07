// @ts-check
// One place that decides whether text may become a link. Pure and DOM-free,
// so it gives the same answer on the server and in the browser. Every
// function accepts any value and never throws.

/** URL schemes `safeUrl` accepts when the caller names none. */
const DEFAULT_PROTOCOLS = ["http", "https", "mailto"];

/** Schemes that run code or carry a document. A caller cannot allow them. */
const BLOCKED_PROTOCOLS = new Set(["javascript", "vbscript", "data"]);

/** Longest URL `safeUrl` looks at. Longer input is refused, not cut. */
export const MAX_URL_LENGTH = 8192;

const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/;
const TRAILING_COLON = /:$/;
// Control characters, bidi controls, zero-width characters and the line and
// paragraph separators. None belongs in a URL; a hidden one is an attack.
const HIDDEN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const HIDDEN_ALL = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;
const BIDI = /\p{Bidi_C}/gu;
const LINE_BREAKS = /[\t\n\r]/g;
const ANY_SPACE = /\s/;
const NON_ASCII = /\P{ASCII}/u;
const WORDS = /\s+/;
const CLAIM_LEAD = /^[(<["'“‘]+/;
const PORT = /:\d*$/;
const TLD_TRAIL = /[.,;:!?'")\]>”’]+$/;
const TLD = /^\p{L}[\p{L}\p{N}-]*$/u;
const LEADING_WWW = /^www\./;

/**
 * @param {ReadonlyArray<string> | undefined} protocols
 * @returns {Set<string>}
 */
function protocolSet(protocols) {
  /** @type {Set<string>} */
  const set = new Set();
  for (const protocol of protocols ?? DEFAULT_PROTOCOLS) {
    const name = String(protocol).toLowerCase().replace(TRAILING_COLON, "");
    if (name && !BLOCKED_PROTOCOLS.has(name)) set.add(name);
  }
  return set;
}

/**
 * Strip what a browser strips before it reads a URL: C0 controls and spaces
 * at both ends, and tabs and line breaks anywhere. A loop rather than a
 * pattern, so a long run of spaces costs one pass.
 * @param {string} value
 */
function normalize(value) {
  let start = 0;
  let end = value.length;
  while (start < end && value.charCodeAt(start) <= 0x20) start++;
  while (end > start && value.charCodeAt(end - 1) <= 0x20) end--;
  return value.slice(start, end).replace(LINE_BREAKS, "");
}

/**
 * Return `url` when it is safe to put in an `href`, otherwise `null`.
 *
 * The value is read the way a browser reads it, so `java\tscript:`,
 * `  JavaScript:` and `\x01javascript:` are caught by their scheme. An
 * absolute URL comes back in the parser's normalized form (lower-case scheme
 * and host, punycode host, no backslashes), so what is rendered is what was
 * checked. Refused:
 *
 * - any scheme not in `protocols`, and `javascript:`, `vbscript:` and `data:`
 *   always, even if listed
 * - control, bidi and zero-width characters, and whitespace inside the URL
 * - protocol-relative `//host` and `\\host` (use an absolute URL)
 * - credentials (`https://user:pass@host`), unless `allowCredentials`
 * - input longer than `maxLength`
 * - a relative URL, unless `allowRelative`
 *
 * @param {unknown} url
 * @param {{
 *   protocols?: ReadonlyArray<string>,
 *   allowRelative?: boolean,
 *   allowCredentials?: boolean,
 *   maxLength?: number,
 * }} [options]
 * @returns {string | null}
 */
export function safeUrl(url, options = {}) {
  if (typeof url !== "string") return null;
  const maxLength = options.maxLength ?? MAX_URL_LENGTH;
  // Cheap bound before any scan; the trimmed value is checked again below.
  if (url.length > maxLength + 1024) return null;
  const value = normalize(url);
  if (!value || value.length > maxLength) return null;
  if (HIDDEN.test(value) || ANY_SPACE.test(value)) return null;

  const scheme = SCHEME.exec(value);
  if (!scheme) {
    if (!options.allowRelative) return null;
    // `//host` and `\\host` (and the mixed forms) leave the page's site.
    const a = value[0];
    const b = value[1];
    if ((a === "/" || a === "\\") && (b === "/" || b === "\\")) return null;
    return value;
  }

  const name = scheme[1].toLowerCase();
  if (!protocolSet(options.protocols).has(name)) return null;
  if (typeof URL === "undefined") return null;
  /** @type {URL} */
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== `${name}:`) return null;
  if (!options.allowCredentials && (parsed.username || parsed.password)) {
    return null;
  }
  if (name === "http" || name === "https") {
    if (!parsed.hostname) return null;
  } else if (!parsed.pathname && !parsed.host) {
    return null;
  }
  return parsed.href;
}

/**
 * Remove the bidi override, embedding, isolate and mark characters, which
 * can reorder link text so it reads as a different address.
 * @param {unknown} text
 * @returns {string}
 */
export function stripBidi(text) {
  return typeof text === "string" ? text.replace(BIDI, "") : "";
}

// -- Punycode (RFC 3492), decode only -----------------------------------------

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;

/**
 * @param {number} delta
 * @param {number} count
 * @param {boolean} first
 */
function adapt(delta, count, first) {
  let d = first ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / count);
  let k = 0;
  while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
    d = Math.floor(d / (BASE - T_MIN));
    k += BASE;
  }
  return Math.floor(k + ((BASE - T_MIN + 1) * d) / (d + SKEW));
}

/**
 * @param {string} label The part after `xn--`.
 * @returns {string | null} The Unicode label, or `null` when malformed.
 */
function decodePunycode(label) {
  /** @type {number[]} */
  const output = [];
  const basic = label.lastIndexOf("-");
  for (let i = 0; i < Math.max(basic, 0); i++) {
    const code = label.charCodeAt(i);
    if (code >= 0x80) return null;
    output.push(code);
  }
  let n = 128;
  let bias = 72;
  let i = 0;
  let index = basic > 0 ? basic + 1 : 0;
  while (index < label.length) {
    const old = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (index >= label.length) return null;
      const code = label.charCodeAt(index++);
      const digit =
        code >= 0x30 && code <= 0x39
          ? code - 0x16
          : code >= 0x61 && code <= 0x7a
            ? code - 0x61
            : code >= 0x41 && code <= 0x5a
              ? code - 0x41
              : BASE;
      if (digit >= BASE) return null;
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      if (w > 0x7fffffff) return null;
    }
    const length = output.length + 1;
    bias = adapt(i - old, length, old === 0);
    n += Math.floor(i / length);
    i %= length;
    if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return null;
    output.splice(i++, 0, n);
    if (output.length > 256) return null;
  }
  return String.fromCodePoint(...output);
}

// A label shows as Unicode only when it is one script. Cyrillic, Greek and
// the scripts below hold letters that look like Latin ones, so a label of
// letters in one of them shows as punycode.
const LOOKALIKE_LETTERS =
  /^[\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Armenian}\p{Script=Cherokee}\p{Script=Coptic}\p{Script=Lisu}\p{Script=Vai}\p{Script=Canadian_Aboriginal}\p{N}\p{Pd}]+$/u;
const LETTER = /\p{L}/u;
const NUMBER = /\p{N}/u;
const SCRIPTS = [
  /\p{Script=Latin}/u,
  /\p{Script=Cyrillic}/u,
  /\p{Script=Greek}/u,
  /\p{Script=Han}/u,
  /\p{Script=Hiragana}/u,
  /\p{Script=Katakana}/u,
  /\p{Script=Hangul}/u,
  /\p{Script=Arabic}/u,
  /\p{Script=Hebrew}/u,
  /\p{Script=Thai}/u,
  /\p{Script=Devanagari}/u,
  /\p{Script=Bengali}/u,
  /\p{Script=Tamil}/u,
  /\p{Script=Telugu}/u,
  /\p{Script=Gujarati}/u,
  /\p{Script=Georgian}/u,
  /\p{Script=Armenian}/u,
  /\p{Script=Bopomofo}/u,
];
const LATIN = 0;
const HAN = 3;
const HIRAGANA = 4;
const KATAKANA = 5;
const HANGUL = 6;
const BOPOMOFO = 17;
// Latin letters that are IPA or phonetic extensions, or the dotless i.
const LATIN_LOOKALIKE = new RegExp("[\\u0131\\u0250-\\u02ff\\u1d00-\\u1dbf]");
// Format characters, joiners, fillers and other invisible code points.
const INVISIBLE = /[\p{Cc}\p{Zs}\p{Default_Ignorable_Code_Point}]/u;

/**
 * Whether a Unicode label is safe to show as it is.
 * @param {string} label
 */
function isSafeLabel(label) {
  if (INVISIBLE.test(label) || LATIN_LOOKALIKE.test(label)) return false;
  if (LOOKALIKE_LETTERS.test(label)) return !LETTER.test(label);
  /** @type {Set<number>} */
  const found = new Set();
  for (const char of label) {
    if (char === "-" || NUMBER.test(char)) continue;
    const index = SCRIPTS.findIndex((script) => script.test(char));
    if (index === -1) return false;
    found.add(index);
  }
  if (found.size <= 1) return true;
  // Japanese, Korean and Chinese text mix Han with its own syllabaries.
  const allowed =
    found.has(HAN) || found.has(HIRAGANA) || found.has(KATAKANA)
      ? [HAN, HIRAGANA, KATAKANA, BOPOMOFO]
      : [HANGUL, HAN];
  for (const index of found) if (!allowed.includes(index)) return false;
  return !found.has(LATIN);
}

/**
 * The host as a reader should see it. A host in Unicode (internationalized)
 * form is shown as Unicode only when every label is a single script that
 * does not hold Latin lookalikes; otherwise the `xn--` punycode form is
 * shown, so `аррӏе.com` (Cyrillic) cannot pass for `apple.com`.
 *
 * @param {unknown} host A host or hostname, in Unicode or `xn--` form.
 * @returns {string}
 */
export function displayHost(host) {
  if (typeof host !== "string" || host.length > 1024) return "";
  let ascii = host.toLowerCase();
  if (NON_ASCII.test(ascii)) {
    if (typeof URL === "undefined") return "";
    try {
      ascii = new URL(`http://${ascii}`).host;
    } catch {
      return "";
    }
  }
  /** @type {string[]} */
  const labels = [];
  for (const label of ascii.split(".")) {
    if (label.startsWith("xn--")) {
      const decoded = decodePunycode(label.slice(4));
      labels.push(decoded !== null && isSafeLabel(decoded) ? decoded : label);
    } else {
      labels.push(label);
    }
  }
  return labels.join(".");
}

/** @param {string} value */
function decodeComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * The address a link really goes to, short enough to show beside its text:
 * the host (see `displayHost`), port, path and query for `http` and `https`,
 * the address for `mailto`, the URL for anything else. Cut with an ellipsis
 * at `maxLength`.
 *
 * @param {unknown} href
 * @param {{ maxLength?: number }} [options]
 * @returns {string}
 */
export function displayHref(href, options = {}) {
  if (typeof href !== "string" || typeof URL === "undefined") return "";
  const maxLength = options.maxLength ?? 80;
  /** @type {URL} */
  let url;
  try {
    url = new URL(href);
  } catch {
    return "";
  }
  let shown;
  if (url.protocol === "http:" || url.protocol === "https:") {
    const port = url.port ? `:${url.port}` : "";
    const path = url.pathname === "/" && !url.search ? "" : url.pathname;
    shown = `${displayHost(url.hostname)}${port}${path}${url.search}`;
  } else if (url.protocol === "mailto:") {
    const address = decodeComponent(url.pathname);
    const at = address.lastIndexOf("@");
    shown =
      at === -1
        ? address
        : `${address.slice(0, at)}@${displayHost(address.slice(at + 1))}`;
  } else {
    shown = href;
  }
  shown = shown.replace(HIDDEN_ALL, "");
  return shown.length > maxLength ? `${shown.slice(0, maxLength - 1)}…` : shown;
}

const MAX_CLAIM_LENGTH = 2048;
const MAX_CLAIM_TOKENS = 32;

/**
 * The hostname a word claims, or `""`. A claim is a word that reads as an
 * address: `https://host/...`, `www.host` or `host.tld/...`.
 * @param {string} word
 */
function claimedHost(word) {
  let rest = word.replace(CLAIM_LEAD, "");
  const scheme = rest.indexOf("://");
  const hasScheme = scheme > 0 && scheme <= 12;
  if (hasScheme) rest = rest.slice(scheme + 3);
  let end = 0;
  while (end < rest.length && !"/?#\\".includes(rest[end])) end++;
  let host = rest.slice(0, end);
  const at = host.lastIndexOf("@");
  if (at !== -1) {
    // `https://paypal.com@evil.example` goes to evil.example but reads as
    // paypal.com; an address with a scheme may not carry a host as userinfo.
    if (hasScheme && host.slice(0, at).includes(".")) return "@";
    host = host.slice(at + 1);
  }
  host = host.replace(PORT, "");
  const dot = host.lastIndexOf(".");
  if (dot < 1) return "";
  const tld = host.slice(dot + 1).replace(TLD_TRAIL, "");
  // `e.g.` and `v1.2` are not addresses; a TLD is two or more letters.
  if (tld.length < 2 || !TLD.test(tld)) return "";
  host = host.slice(0, dot + 1) + tld;
  if (typeof URL === "undefined") return "";
  try {
    return new URL(`http://${host}`).hostname.replace(LEADING_WWW, "");
  } catch {
    return "";
  }
}

/**
 * The text a link should show for itself, checked against where it goes.
 *
 * - `text` is the given text without bidi controls and hidden characters.
 * - `display` is the real address (see `displayHref`).
 * - `mismatch` is true when the text names another site (a word in it reads
 *   as an address whose host differs from `href`'s), or names a site in
 *   Unicode that `displayHost` would show as punycode. Show `display`, or
 *   both, when it is true.
 *
 * Only the first 2,048 characters and 32 words of `text` are read.
 *
 * @param {unknown} text
 * @param {unknown} href
 * @returns {{ text: string, display: string, mismatch: boolean }}
 */
export function linkLabel(text, href) {
  const clean = stripBidi(text).replace(HIDDEN_ALL, "");
  const display = displayHref(href);
  if (typeof href !== "string" || typeof URL === "undefined") {
    return { text: clean, display, mismatch: false };
  }
  /** @type {string} */
  let target;
  try {
    const url = new URL(href);
    target =
      url.protocol === "mailto:"
        ? decodeComponent(url.pathname.split("@")[1] ?? "").toLowerCase()
        : url.hostname.replace(LEADING_WWW, "");
  } catch {
    return { text: clean, display, mismatch: false };
  }
  const words = clean.slice(0, MAX_CLAIM_LENGTH).split(WORDS, MAX_CLAIM_TOKENS);
  let mismatch = false;
  for (const word of words) {
    const claimed = claimedHost(word);
    if (!claimed) continue;
    if (
      claimed !== target ||
      (NON_ASCII.test(word) && displayHost(claimed).includes("xn--"))
    ) {
      mismatch = true;
      break;
    }
  }
  return { text: clean, display, mismatch };
}
