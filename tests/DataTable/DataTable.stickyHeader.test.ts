import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import DataTable from "./DataTable.test.svelte";

describe("DataTable stickyHeader", () => {
  const headers = [
    { key: "name", value: "Name", width: "200px" },
    { key: "status", value: "Status" },
  ] as const;

  const rows = [{ id: "a", name: "api-gateway", status: "Active" }];

  it("renders the sticky wrapper section", () => {
    const { container } = render(DataTable, {
      headers,
      rows,
      stickyHeader: true,
    });

    expect(
      container.querySelector("section.bx--data-table_inner-container"),
    ).toBeInTheDocument();
  });

  it("does not render the sticky wrapper section by default", () => {
    const { container } = render(DataTable, { headers, rows });

    expect(
      container.querySelector("section.bx--data-table_inner-container"),
    ).not.toBeInTheDocument();
  });

  it("applies a header width as a style when sticky", () => {
    render(DataTable, { headers, rows, stickyHeader: true });

    expectInlineStyle(screen.getByRole("columnheader", { name: "Name" }), {
      width: "200px",
    });
  });
});
