/**
 * Split plain `text` into text and link segments, for rendering URLs as
 * links without parsing HTML, such as in a chat message. Only URLs whose
 * scheme is in `schemes` (default `http:`, `https:` and `mailto:`) become
 * links; anything else, such as `javascript:` or `data:`, stays text, and
 * so does a URL with credentials (`https://google.com@evil.example/`) or
 * one longer than 2,048 characters. A bare `www.` host links over
 * `https:`. A link's text is its URL. It ends at whitespace, a quote or
 * angle bracket, a bidi or zero-width character, or CJK punctuation, and
 * punctuation that ends the sentence is left out of it.
 */
export function linkSegments(
  text: string,
  options?: {
    /** URL schemes that become links, with the colon, such as `"tel:"`. */
    schemes?: ReadonlyArray<string>;
  },
): Array<{ text: string; href?: string }>;
