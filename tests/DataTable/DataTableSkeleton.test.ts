import { render, screen, within } from "@testing-library/svelte";
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

  it("wraps the table in a scrollable container", () => {
    render(DataTableSkeleton);

    expect(screen.getByRole("table").parentElement).toHaveClass(
      "bx--data-table-content",
    );
  });

  it("renders rows by columns cells", () => {
    const { container } = render(DataTableSkeleton, {
      props: { rows: 2, columns: 3 },
    });

    expect(container.querySelectorAll("thead th")).toHaveLength(3);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(container.querySelectorAll("tbody td")).toHaveLength(6);
  });

  it("labels columns from headers and ignores columns", () => {
    const { container } = render(DataTableSkeleton, {
      props: { columns: 7, rows: 1, headers: ["Name", { value: "Port" }] },
    });

    expect(
      [...container.querySelectorAll("thead th")].map((th) => th.textContent),
    ).toEqual(["Name", "Port"]);
    expect(container.querySelectorAll("tbody td")).toHaveLength(2);
  });

  it("renders a blank header cell for an empty header", () => {
    const { container } = render(DataTableSkeleton, {
      props: { headers: ["Name", { empty: true }] },
    });

    // Truly empty, so Carbon's `th:empty` cap keeps the column narrow.
    expect(container.querySelectorAll("thead th")[1]?.matches(":empty")).toBe(
      true,
    );
  });

  it("names an empty header with its value, visually hidden", () => {
    const { container } = render(DataTableSkeleton, {
      props: { headers: ["Name", { empty: true, value: "Actions" }] },
    });

    const header = container.querySelectorAll("thead th")[1];
    assert(header instanceof HTMLElement);
    expect(within(header).getByText("Actions")).toHaveClass(
      "bx--visually-hidden",
    );
  });
});
