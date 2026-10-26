// @depends-on css/**
/**
 * Regenerates src/tokens/ from css/all.scss. Run after changing theme tokens;
 * tests/css/tokens.test.ts fails while the committed module is stale.
 *
 *   bun scripts/build-tokens.ts
 */
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { compileAsync } from "sass-embedded";
import { extractTokens, renderTokens } from "./lib/tokens";

const { css } = await compileAsync("css/all.scss", {
  style: "expanded",
  loadPaths: ["css/vendor"],
  quietDeps: true,
  silenceDeprecations: [
    "import",
    "global-builtin",
    "color-functions",
    "if-function",
  ],
  logger: { warn() {}, debug() {} },
});

const { js, dts } = renderTokens(extractTokens(css));

await mkdir("src/tokens", { recursive: true });
await Bun.write("src/tokens/index.js", js);
await Bun.write("src/tokens/index.d.ts", dts);
await $`bun fmt src/tokens && bunx biome check --write src/tokens`.quiet();
console.log("[build-tokens] wrote src/tokens/index.js and index.d.ts");
