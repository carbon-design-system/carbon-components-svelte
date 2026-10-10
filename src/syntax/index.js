// Syntax highlighting subpackage: `carbon-components-svelte/syntax`.
// Styles ship separately: `css/syntax-tokens.css` (Carbon's syntax theme
// tokens) and `css/syntax.css` (the `.tok-*` and `::highlight()` rules).
// May import from core; core must never import from here.

export { highlightCode } from "./highlight-code.js";
export { highlight, tokenize } from "./tokenize.js";
