import { render, screen } from "@testing-library/svelte";
import Table from "./Table.test.svelte";

describe("Table", () => {
  it("renders headers and rows from data", () => {
    render(Table);

    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Engineer")).toBeInTheDocument();
    expect(screen.getByText("Designer")).toBeInTheDocument();
  });

  it("renders the row-header column as a scoped th with row-header styling", () => {
    render(Table);

    const aliceHeader = screen.getByRole("rowheader", { name: "Alice" });
    expect(aliceHeader.tagName).toBe("TH");
    expect(aliceHeader).toHaveAttribute("scope", "row");
    expect(aliceHeader).toHaveClass("bx--type-label-01");
  });

  it("applies center alignment to the configured column", () => {
    render(Table);

    const statusHeader = screen.getByText("Status").closest("th");
    expect(statusHeader).toHaveStyle({ textAlign: "center" });

    const statusCell = screen.getByTestId("status-a");
    expect(statusCell.closest("td")).toHaveStyle({ textAlign: "center" });
  });

  it("renders custom cellHeader and cell slot content", () => {
    render(Table);

    expect(screen.getByTestId("custom-header-name")).toBeInTheDocument();
    expect(screen.getByTestId("status-a")).toHaveTextContent("Active");
  });

  it("applies the size variant", () => {
    render(Table, { props: { size: "compact" } });

    expect(document.querySelector(".bx--simple-table")).toHaveClass(
      "bx--simple-table--compact",
    );
  });

  it("wraps the table in a horizontally scrollable container", () => {
    const { container } = render(Table);

    const scrollContainer = container.querySelector(
      ".bx--simple-table-container",
    );
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer?.querySelector("table")).toBeInTheDocument();
  });

  it("uses table-layout: auto and no explicit column widths by default", () => {
    const { container } = render(Table);

    const table = container.querySelector("table");
    expect(table).not.toHaveStyle({ tableLayout: "fixed" });

    const roleHeader = screen.getByText("Role").closest("th");
    expect(roleHeader).not.toHaveAttribute(
      "style",
      expect.stringContaining("width"),
    );
  });

  it("switches to table-layout: fixed and applies column widths when a header sets width or minWidth", () => {
    const { container } = render(Table, {
      props: {
        headers: [
          { key: "name", value: "Name", rowHeader: true, width: "30%" },
          { key: "role", value: "Role", minWidth: "8rem" },
          { key: "status", value: "Status", columnAlign: "center" },
        ],
      },
    });

    const table = container.querySelector("table");
    expect(table).toHaveStyle({ tableLayout: "fixed" });

    const nameHeader = screen.getByText("Name").closest("th") as HTMLElement;
    expect(nameHeader.style.width).toBe("30%");

    const roleHeader = screen.getByText("Role").closest("th") as HTMLElement;
    expect(roleHeader.style.minWidth).toBe("8rem");
  });
});
