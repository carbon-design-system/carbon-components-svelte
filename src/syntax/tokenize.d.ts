/**
 * A token type: one of Carbon's `syntax-*` token names. Colored by
 * `--cds-syntax-<type>`, the `.tok-<type>` class, and
 * `::highlight(syntax-<type>)`.
 */
export type TokenType =
  | "angle-bracket"
  | "annotation"
  | "attribute-name"
  | "attribute-value"
  | "bool"
  | "brace"
  | "bracket"
  | "character"
  | "class-name"
  | "color"
  | "comment"
  | "control-keyword"
  | "definition"
  | "definition-keyword"
  | "deleted"
  | "escape"
  | "function"
  | "inserted"
  | "keyword"
  | "meta"
  | "modifier"
  | "module-keyword"
  | "null"
  | "number"
  | "operator"
  | "paren"
  | "property-name"
  | "punctuation"
  | "regexp"
  | "self"
  | "special"
  | "special-string"
  | "string"
  | "tag-name"
  | "type-name"
  | "unit"
  | "variable-name";

/** A run of source text; `type` is `null` for plain text. */
export interface Token {
  type: TokenType | null;
  text: string;
}

/**
 * Tokens for `code` in `lang`, or `undefined` for a language it doesn't know.
 * The tokens' text joins back to `code` exactly. Languages: `js`, `ts`,
 * `jsx`, `tsx`, `svelte` (Svelte 4 and 5), `html`, `xml`, `svg`, `css`,
 * `scss`, `json`, `jsonc`, `sh`, `bash`, `shell`, `zsh`, and `diff`.
 */
export function tokenize(code: string, lang: string): Token[] | undefined;

/**
 * Highlight `code` as HTML spans (`<span class="tok-keyword">`), escaped for
 * `{@html}` and Svelte markup. Returns `undefined` for languages it doesn't
 * know.
 */
export function highlight(code: string, lang: string): string | undefined;
