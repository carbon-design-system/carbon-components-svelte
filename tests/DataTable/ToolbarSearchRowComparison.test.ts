import { render } from "@testing-library/svelte";
import { getFilteredIds } from "./helpers";
import ToolbarSearchRowComparison from "./ToolbarSearchRowComparison.test.svelte";

// Regression tests for https://github.com/carbon-design-system/carbon-components-svelte/issues/2143
describe("ToolbarSearch row comparison behavior", () => {
  it("updates when rows array length changes", async () => {
    const { rerender } = render(ToolbarSearchRowComparison, {
      props: {
        rows: [
          { id: 1, name: "Row 1" },
          { id: 2, name: "Row 2" },
        ],
      },
    });

    await rerender({
      rows: [
        { id: 1, name: "Row 1" },
        { id: 2, name: "Row 2" },
        { id: 3, name: "Row 3" },
      ],
    });

    expect(getFilteredIds("filtered-ids")).toEqual([1, 2, 3]);
  });

  it("updates when rows go from empty to populated", async () => {
    const { rerender } = render(ToolbarSearchRowComparison, {
      props: { rows: [] },
    });

    await rerender({ rows: [{ id: 1, name: "Row 1" }] });

    expect(getFilteredIds("filtered-ids")).toEqual([1]);
  });

  it("updates when a row id is swapped and the length stays the same", async () => {
    const { rerender } = render(ToolbarSearchRowComparison, {
      props: {
        rows: [
          { id: 1, name: "Apple" },
          { id: 2, name: "Banana" },
          { id: 3, name: "Cherry" },
        ],
      },
    });

    await rerender({
      rows: [
        { id: 1, name: "Apple" },
        { id: 2, name: "Banana" },
        { id: 4, name: "Date" },
      ],
    });

    expect(getFilteredIds("filtered-ids")).toEqual([1, 2, 4]);
  });
});
