// @depends-on css/**
/**
 * Regenerates src/tokens/ from css/all.scss: the token module, the Tailwind
 * preset and theme, and the DTCG JSON. Run after changing theme tokens;
 * tests/css/tokens.test.ts fails while any of them is stale.
 *
 *   bun scripts/build-tokens.ts
 */
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { compileAsync } from "sass-embedded";
import {
  renderDtcg,
  renderTailwindCss,
  renderTailwindPreset,
} from "./lib/token-exports";
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

const data = extractTokens(css);
const { js, dts } = renderTokens(data);
const tailwind = renderTailwindPreset(data);

await mkdir("src/tokens", { recursive: true });
await Bun.write("src/tokens/index.js", js);
await Bun.write("src/tokens/index.d.ts", dts);
await Bun.write("src/tokens/tailwind.js", tailwind.js);
await Bun.write("src/tokens/tailwind.d.ts", tailwind.dts);
await Bun.write("src/tokens/tailwind.css", renderTailwindCss(data));
await Bun.write("src/tokens/tokens.json", renderDtcg(data));
await $`bunx biome check --write src/tokens`.quiet();
console.log("[build-tokens] wrote src/tokens/");
