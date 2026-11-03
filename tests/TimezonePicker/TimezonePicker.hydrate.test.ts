// @vitest-environment node
// @depends-on src/TimezonePicker/TimezonePicker.svelte src/IntlPicker/IntlPicker.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixture } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/TimezonePicker/TimezonePicker.svelte", import.meta.url),
);

describe("TimezonePicker hydration", () => {
  // With a value, Svelte 5 drops the input's `value` attribute on hydrate and
  // keeps the property, as for any ComboBox, so the field starts empty here.
  it("hydrates onto the server markup and fills no zone", async () => {
    const result = await hydrateFixture(fixture, {
      id: "zone",
      labelText: "Time zone",
      name: "zone",
    });

    expect(result.serverRenderError).toBeUndefined();
    expect(result.hydrateError).toBeUndefined();
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.identity.pct).toBe(100);
    expect(result.diffIgnoringIds).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
    expect(result.settledHtml).toMatch(/name="zone"[^>]*value=""/);
  });
});
