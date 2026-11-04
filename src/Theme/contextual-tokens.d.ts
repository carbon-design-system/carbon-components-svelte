/**
 * The tokens to set for a `tokens` override. Components read the contextual
 * tokens (`layer`, `field`, `border-subtle`, ...), and `all.css` gives each
 * theme a literal value for them, so overriding `layer-01` alone restyles
 * only what sits in a `Layer`. The contextual token follows its first-layer
 * token here, unless it is set too.
 */
export declare function withContextualTokens(
  tokens: Record<string, string>,
): Record<string, string>;
