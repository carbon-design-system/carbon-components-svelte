// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import QueryBuilder from "./QueryBuilder.test.svelte";

// Rows are plain markup with ids from the tree, so the server writes the
// whole builder, not an empty shell the browser fills in.
describe("QueryBuilder server render", () => {
  it("renders every group, row and label", () => {
    const { document } = renderSSR(QueryBuilder, {
      value: {
        operator: "and",
        conditions: [
          { field: "name", operator: "contains", value: "Acme" },
          {
            operator: "or",
            conditions: [{ field: "seats", operator: "gte", value: 5 }],
          },
        ],
      },
      showSummary: true,
    });

    expect(document.querySelectorAll('[role="group"]')).toHaveLength(4);
    expect(
      document
        .querySelector(".bx--query-builder__condition")
        ?.getAttribute("aria-label"),
    ).toBe("Condition 1 of 2: Where Name contains “Acme”");
    expect(
      (document.querySelector("#qb-q1-value") as HTMLInputElement | null)
        ?.value,
    ).toBe("Acme");
    expect(
      document.querySelector(".bx--query-builder__summary-text")?.textContent,
    ).toContain("Seats is at least 5");
  });
});
