// @vitest-environment node
// @depends-on src/DurationInput/DurationInput.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("../../src/DurationInput/DurationInput.svelte", import.meta.url),
);
let results: HydrateResult[];

beforeAll(async () => {
  results = await hydrateFixtures([
    {
      fixture,
      props: { value: 5_400_000, labelText: "Length", name: "length" },
    },
    {
      fixture,
      props: { mode: "text", value: 5_400_000, labelText: "Length" },
    },
  ]);
}, 120_000);

// The server prints the segments, the unit labels and the hidden input from
// `value` alone, with locale "en", so the markup does not depend on the host.
describe("DurationInput hydration", () => {
  it.each([
    ["segmented", 0],
    ["text", 1],
  ])("keeps the server nodes in %s mode", (_mode, index) => {
    const result = results[index];
    expect(result.hydrateError).toBeUndefined();
    expect(result.identity.pct).toBe(100);
    // Svelte writes each field's `value` as a property, so it drops the
    // server's attribute; the live value stays (`formLoss` below).
    expect(
      result.diffIgnoringIds.filter(
        ({ kind, before }) =>
          !(kind === "attr-removed" && (before ?? "").startsWith("value=")),
      ),
    ).toEqual([]);
    expect(result.formLoss).toEqual([]);
    expect(result.settledDiff).toEqual([]);
    expect(result.brokenRefs.settled).toEqual([]);
  });

  it("prints the hidden input as ISO 8601", () => {
    expect(results[0].serverHtml).toContain('value="PT1H30M"');
  });
});
