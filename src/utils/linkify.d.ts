export type LinkifySegment =
  { type: "text"; text: string } | { type: "link"; text: string; href: string };

/** Longest link `linkify` makes. A longer candidate stays text. */
export const MAX_LINK_LENGTH: number;

/**
 * Link URLs and email addresses in `text`, in time linear in its length.
 *
 * Finds `scheme://…` for each scheme in `protocols`, `mailto:` and `tel:`
 * (no slashes), bare `www.` hosts (linked over `https:`) and, unless
 * `emails` is `false`, bare email addresses (linked over `mailto:`). A
 * candidate becomes a link only if `safeUrl` accepts it, so `javascript:`,
 * `data:` and credentials stay text. A bare `example.com` with no `www.` or
 * scheme is not linked.
 *
 * A URL ends at whitespace, an angle bracket or quote, a bidi control, or
 * CJK punctuation. Sentence punctuation and an unmatched closing bracket at
 * its end are left out. A candidate longer than `maxLength` stays text.
 *
 * The segments, joined, give back `text`. Adjacent text is one segment.
 */
export function linkify(
  text: unknown,
  options?: {
    /** Schemes that become links. Default `http`, `https`, `mailto`. */
    protocols?: ReadonlyArray<string>;
    /** Link bare email addresses. Default `true`. */
    emails?: boolean;
    /** Longest link, in characters. Default `2048`. */
    maxLength?: number;
  },
): LinkifySegment[];
