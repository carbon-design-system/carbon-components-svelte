// @ts-check

// Anything that looks like a URL: a scheme with `//`, `mailto:`, `tel:`,
// or a bare `www.` host. Whether it becomes a link is decided after
// parsing, against the allowed schemes. The scheme is capped so a failed
// attempt reads a bounded number of characters; without the cap, a long
// run such as "a.a.a." is rescanned from every dot, which is quadratic.
const CANDIDATE =
  /(?:\b[a-z][a-z0-9+.-]{0,31}:\/\/|\bmailto:|\btel:|\bwww\.)[^\s<>]+/gi;

const TRAILING = /[.,!?;:'"]$/;
const BARE_HOST = /^www\./i;

/**
 * Drop punctuation that ends the sentence rather than the URL, such as the
 * period in "see example.com/docs.", keeping a closing bracket the URL
 * itself opened, as in "en.wikipedia.org/wiki/Svelte_(software)".
 *
 * @param {string} url
 */
function trimEnd(url) {
  let end = url.length;
  // Brackets are counted once and adjusted as characters are dropped.
  /** @type {Record<string, number>} */
  const count = { "(": 0, ")": 0, "[": 0, "]": 0 };
  for (const char of url) if (char in count) count[char]++;

  while (end > 0) {
    const last = url[end - 1];
    if (!TRAILING.test(last)) {
      const open = last === ")" ? "(" : last === "]" ? "[" : undefined;
      if (!open || count[last] <= count[open]) break;
    }
    if (last in count) count[last]--;
    end--;
  }
  return url.slice(0, end);
}

/**
 * Split plain `text` into text and link segments, for rendering URLs as
 * links without parsing HTML. Only URLs with an allowed scheme become
 * links; anything else, such as `javascript:` or `data:`, stays text. A
 * link's text is its URL, so it can't claim to go somewhere else.
 *
 * @param {string} text
 * @param {{ schemes?: ReadonlyArray<string> }} [options]
 * @returns {Array<{ text: string, href?: string }>}
 */
export function linkSegments(text, options = {}) {
  const schemes = options.schemes ?? ["http:", "https:", "mailto:"];
  /** @type {Array<{ text: string, href?: string }>} */
  const segments = [];
  let plain = "";
  let index = 0;

  for (const match of text.matchAll(CANDIDATE)) {
    const url = trimEnd(match[0]);
    const start = /** @type {number} */ (match.index);
    let href;
    try {
      const parsed = new URL(BARE_HOST.test(url) ? `https://${url}` : url);
      if (schemes.includes(parsed.protocol)) href = parsed.href;
    } catch {
      // Not a URL after all; leave it as text.
    }
    if (!href) continue;
    plain += text.slice(index, start);
    if (plain) segments.push({ text: plain });
    plain = "";
    segments.push({ text: url, href });
    index = start + url.length;
  }

  plain += text.slice(index);
  if (plain) segments.push({ text: plain });
  return segments;
}
