// @ts-check

import { linkify } from "./linkify.js";

/**
 * Split plain `text` into text and link segments, for rendering URLs as
 * links without parsing HTML. Only URLs with an allowed scheme become
 * links; anything else, such as `javascript:` or `data:`, stays text. A
 * link's text is its URL, so it can't claim to go somewhere else.
 *
 * This is `linkify` with its segments in the older `{ text, href? }` shape
 * and bare email addresses left as text.
 *
 * @param {string} text
 * @param {{ schemes?: ReadonlyArray<string> }} [options]
 * @returns {Array<{ text: string, href?: string }>}
 */
export function linkSegments(text, options = {}) {
  return linkify(text, {
    protocols: options.schemes ?? ["http:", "https:", "mailto:"],
    emails: false,
  }).map((segment) =>
    segment.type === "link"
      ? { text: segment.text, href: segment.href }
      : { text: segment.text },
  );
}
