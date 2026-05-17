import { render } from "@testing-library/svelte";
import StructuredListSkeleton from "./StructuredListSkeleton.test.svelte";

describe("StructuredListSkeleton", () => {
  it("renders 3 columns by default", () => {
    const { container } = render(StructuredListSkeleton);

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      3,
    );
    // 5 default rows x 3 columns
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      15,
    );
  });

  it("respects the columns prop in both head and body rows", () => {
    const { container } = render(StructuredListSkeleton, {
      props: { columns: 6, rows: 4 },
    });

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      6,
    );
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      24,
    );
  });
});
