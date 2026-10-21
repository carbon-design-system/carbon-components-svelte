import { render } from "@testing-library/svelte";
import StructuredListSkeleton from "./StructuredListSkeleton.test.svelte";

describe("StructuredListSkeleton", () => {
  it.each([
    ["3 columns by default", {}, 3, 15],
    [
      "the columns prop in both head and body rows",
      { columns: 6, rows: 4 },
      6,
      24,
    ],
  ])("renders %s", (_name, props, headCells, bodyCells) => {
    const { container } = render(StructuredListSkeleton, { props });

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      headCells,
    );
    // rows x columns (5 default rows)
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      bodyCells,
    );
  });
});
