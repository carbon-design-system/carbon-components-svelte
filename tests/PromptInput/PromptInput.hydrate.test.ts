// @vitest-environment node
// @depends-on src/PromptInput/PromptInput.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixture } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/PromptInput/PromptInput.svelte", import.meta.url),
);

describe("PromptInput", () => {
  it("hydrates onto the server markup", async () => {
    const result = await hydrateFixture(fixture, {
      id: "composer",
      maxCount: 100,
      attachments: [{ id: "1", name: "plan.pdf", size: 4096 }],
    });

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    // TextArea's `grow` sets the field's height once it can measure; that
    // is the only change after hydration.
    expect(
      result.settledDiff.map(({ kind, path }) => `${kind} ${path}`),
    ).toEqual(["attr /div[0]/div[1]/div[1]/textarea#composer[0]"]);
    expect(result.brokenRefs.settled).toEqual([]);
  });
});
