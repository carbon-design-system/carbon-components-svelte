import { render, screen } from "@testing-library/svelte";
import DataTableSkeleton from "../../src/DataTable/DataTableSkeleton.svelte";

describe("DataTableSkeleton", () => {
  it("applies the medium size class", () => {
    render(DataTableSkeleton, { props: { size: "medium" } });

    expect(screen.getByRole("table")).toHaveClass("bx--data-table--md");
  });

  it("applies the compact size class", () => {
    render(DataTableSkeleton, { props: { size: "compact" } });

    expect(screen.getByRole("table")).toHaveClass("bx--data-table--compact");
  });

  it("applies the short size class", () => {
    render(DataTableSkeleton, { props: { size: "short" } });

    expect(screen.getByRole("table")).toHaveClass("bx--data-table--short");
  });

  it("applies the tall size class", () => {
    render(DataTableSkeleton, { props: { size: "tall" } });

    expect(screen.getByRole("table")).toHaveClass("bx--data-table--tall");
  });
});
