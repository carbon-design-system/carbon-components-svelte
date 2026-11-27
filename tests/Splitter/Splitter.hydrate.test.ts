// @vitest-environment node
// @depends-on src/Splitter/Splitter.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixture } from "../utils/hydrate";

it("hydrates a pixel size onto the server markup unchanged", async () => {
  const result = await hydrateFixture(
    fileURLToPath(
      new URL("../../src/Splitter/Splitter.svelte", import.meta.url),
    ),
    { size: "240px", max: 50 },
  );

  expect(result.errors).toEqual([]);
  expect(result.serverHtml).toContain("flex-basis: 240px");
  expect(result.identity.pct).toBe(100);
  expect(result.diffIgnoringIds).toEqual([]);
  expect(result.settledDiff).toEqual([]);
}, 120_000);
