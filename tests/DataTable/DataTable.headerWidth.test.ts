import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import DataTable from "./DataTable.test.svelte";

describe("DataTable header width", () => {
  const headers = [
    { key: "name", value: "Name", width: "200px" },
    { key: "status", value: "Status" },
  ] as const;

  const rows = [{ id: "a", name: "payments-api", status: "Active" }];

  it("does not force table-layout: fixed when a header sets width", () => {
    const { container } = render(DataTable, { headers, rows });

    expect(screen.getByRole("table")).not.toHaveStyle({
      "table-layout": "fixed",
    });
    expect(container.querySelector("colgroup")).toBeInTheDocument();
  });

  it("emits a col with the matching width for a sized header", () => {
    const { container } = render(DataTable, { headers, rows });

    const cols = container.querySelectorAll("colgroup col");
    expect(cols).toHaveLength(headers.length);
    expectInlineStyle(cols[0], { width: "200px" });
  });

  it("does not emit a colgroup when no header sets a width", () => {
    const { container } = render(DataTable, {
      headers: [{ key: "name", value: "Name" }],
      rows,
    });

    expect(container.querySelector("colgroup")).not.toBeInTheDocument();
  });

  it("applies table-layout: fixed when fixedLayout is set", () => {
    render(DataTable, { headers, rows, fixedLayout: true });

    expectInlineStyle(screen.getByRole("table"), {
      "table-layout": "fixed",
    });
  });
});
