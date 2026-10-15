// @ts-check

// Anything that looks like a URL: a scheme with `//`, `mailto:`, `tel:`,
// or a bare `www.` host. Whether it becomes a link is decided after
// parsing, against the allowed schemes.
const CANDIDATE =
  /(?:\b[a-z][a-z0-9+.-]*:\/\/|\bmailto:|\btel:|\bwww\.)[^\s<>]+/gi;

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
  let end = url;
  for (;;) {
    if (TRAILING.test(end)) {
      end = end.slice(0, -1);
      continue;
    }
    const last = end[end.length - 1];
    const open = last === ")" ? "(" : last === "]" ? "[" : undefined;
    if (open && end.split(last).length > end.split(open).length) {
      end = end.slice(0, -1);
      continue;
    }
    return end;
  }
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
