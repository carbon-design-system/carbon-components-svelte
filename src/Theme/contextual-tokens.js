// @ts-check

/**
 * Each contextual token and the first-layer token it holds outside a `Layer`.
 * Matches `$ccs-layer-sets` in the stylesheet, where the first token of a set
 * is the one `:root` and `.bx--layer-one` use.
 */
const FIRST_LAYER_TOKENS = {
  "layer-01": "layer",
  "layer-active-01": "layer-active",
  "layer-background-01": "layer-background",
  "layer-hover-01": "layer-hover",
  "layer-selected-01": "layer-selected",
  "layer-selected-hover-01": "layer-selected-hover",
  "layer-accent-01": "layer-accent",
  "layer-accent-hover-01": "layer-accent-hover",
  "layer-accent-active-01": "layer-accent-active",
  "field-01": "field",
  "field-hover-01": "field-hover",
  "border-subtle-00": "border-subtle",
  "border-subtle-selected-01": "border-subtle-selected",
  "border-strong-01": "border-strong",
  "border-tile-01": "border-tile",
};

/**
 * The tokens to set for a `tokens` override. Components read the contextual
 * tokens (`layer`, `field`, `border-subtle`, ...), and `all.css` gives each
 * theme a literal value for them, so overriding `layer-01` alone restyles
 * only what sits in a `Layer`. The contextual token follows its first-layer
 * token here, unless it is set too.
 * @param {Record<string, string>} tokens
 * @returns {Record<string, string>}
 */
export function withContextualTokens(tokens) {
  /** @type {Record<string, string>} */
  const resolved = {};
  for (const [token, value] of Object.entries(tokens)) {
    const contextual =
      FIRST_LAYER_TOKENS[
        /** @type {keyof typeof FIRST_LAYER_TOKENS} */ (token)
      ];
    if (contextual && !(contextual in tokens)) resolved[contextual] = value;
  }
  return { ...resolved, ...tokens };
}
