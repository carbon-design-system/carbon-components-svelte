/**
 * Writes css/syntax/_carbon-tokens.scss from @carbon/themes' `syntax-*` tokens.
 * Run after upgrading @carbon/themes.
 *
 *   bun run build:syntax-tokens
 */
import { writeFileSync } from "node:fs";
import { SYNTAX_TOKENS_FILE, syntaxTokensScss } from "./lib/syntax-tokens";

writeFileSync(SYNTAX_TOKENS_FILE, syntaxTokensScss());
console.log(`[build-syntax-tokens] wrote ${SYNTAX_TOKENS_FILE}`);
