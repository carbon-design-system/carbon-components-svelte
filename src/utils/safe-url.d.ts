/** Longest URL `safeUrl` looks at. Longer input is refused, not cut. */
export const MAX_URL_LENGTH: number;

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
 */
export function safeUrl(
  url: unknown,
  options?: {
    /** Allowed schemes, with or without the colon. Default `http`, `https`, `mailto`. */
    protocols?: ReadonlyArray<string>;
    /** Accept a relative URL such as `/docs` or `#top`. Default `false`. */
    allowRelative?: boolean;
    /** Accept `https://user:pass@host`. Default `false`. */
    allowCredentials?: boolean;
    /** Longest URL accepted. Default `8192`. */
    maxLength?: number;
  },
): string | null;

/**
 * Remove the bidi override, embedding, isolate and mark characters, which
 * can reorder link text so it reads as a different address.
 */
export function stripBidi(text: unknown): string;

/**
 * The host as a reader should see it. A host in Unicode (internationalized)
 * form is shown as Unicode only when every label is a single script that
 * does not hold Latin lookalikes; otherwise the `xn--` punycode form is
 * shown, so `аррӏе.com` (Cyrillic) cannot pass for `apple.com`.
 */
export function displayHost(host: unknown): string;

/**
 * The address a link really goes to, short enough to show beside its text:
 * the host (see `displayHost`), port, path and query for `http` and `https`,
 * the address for `mailto`, the URL for anything else. Cut with an ellipsis
 * at `maxLength` (default 80).
 */
export function displayHref(
  href: unknown,
  options?: { maxLength?: number },
): string;

/**
 * The text a link should show for itself, checked against where it goes.
 *
 * - `text` is the given text without bidi controls and hidden characters.
 * - `display` is the real address (see `displayHref`).
 * - `mismatch` is true when the text names another site, or names a site in
 *   Unicode that `displayHost` would show as punycode. Show `display`, or
 *   both, when it is true.
 */
export function linkLabel(
  text: unknown,
  href: unknown,
): { text: string; display: string; mismatch: boolean };
