// @vitest-environment node
// @depends-on tests/QueryBuilder/QueryBuilder.test.svelte
import { fileURLToPath } from "node:url";
import { hydrateFixtures, type HydrateResult } from "../utils/hydrate";

const fixture = fileURLToPath(
  new URL("./QueryBuilder.test.svelte", import.meta.url),
);

let result: HydrateResult;

beforeAll(async () => {
  [result] = await hydrateFixtures([
    {
      fixture,
      props: {
        showSummary: true,
        helperText: "Match accounts by any field.",
        value: {
          operator: "and",
          conditions: [
            { field: "name", operator: "contains", value: "Acme" },
            {
              operator: "or",
              conditions: [
                { field: "seats", operator: "gte", value: 5 },
                { field: "renewal", operator: "before", value: "2027-01-01" },
              ],
            },
          ],
        },
      },
    },
  ]);
}, 120_000);

/**
 * Differences that TextInput, NumberInput and DatePicker show on their
 * own, outside a QueryBuilder too: Svelte sets an input's value as a
 * property and drops the attribute, and flatpickr wraps the date input
 * and names its calendar on mount.
 */
function fromChildren(entry: {
  kind: string;
  before?: unknown;
  after?: unknown;
}) {
  const before = String(entry.before ?? "");
  const after = String(entry.after ?? "");
  return (
    (entry.kind === "attr-removed" && before.startsWith("value=")) ||
    (entry.kind === "tag" && before === "INPUT") ||
    (entry.kind === "attr-added" &&
      (after === "role=dialog" || after === "aria-label=Choose a date"))
  );
}

// Node keys, toolbar tab stops and the summary's date spans all come from
// props, so the client keeps the server's nodes and ids.
it("keeps the server nodes, ids and tab stops", () => {
  expect(result.serverHtml).toContain('id="qb-n2-field"');
  expect(result.serverHtml).toContain('role="toolbar"');
  expect(result.hydrateError).toBeUndefined();
  expect(result.diffIgnoringIds.filter((e) => !fromChildren(e))).toEqual([]);
  expect(result.settledDiff.filter((e) => !fromChildren(e))).toEqual([]);
  expect(result.brokenRefs.settled).toEqual([]);
  // Svelte 5 rebuilds every <option> of a native select.
  expect(
    result.identity.replaced.filter((node) => !node.startsWith("option")),
  ).toEqual([]);
});
