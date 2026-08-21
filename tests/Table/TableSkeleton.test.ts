import { render, screen } from "@testing-library/svelte";
import TableSkeleton from "./TableSkeleton.test.svelte";

describe("TableSkeleton", () => {
  it("renders the default 5x5 skeleton grid", () => {
    const { container } = render(TableSkeleton);

    expect(container.querySelectorAll("thead th")).toHaveLength(5);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(container.querySelectorAll("tbody td")).toHaveLength(25);
  });

  it("renders a placeholder span in every body cell", () => {
    const { container } = render(TableSkeleton);

    for (const td of container.querySelectorAll("tbody td")) {
      expect(td.querySelector("span")).toBeInTheDocument();
    }
  });

  it("uses columns and rows to size the grid", () => {
    const { container } = render(TableSkeleton, {
      props: { columns: 3, rows: 2 },
    });

    expect(container.querySelectorAll("thead th")).toHaveLength(3);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("renders string headers as header text and overrides columns", () => {
    render(TableSkeleton, {
      props: { columns: 10, headers: ["Name", "Protocol", "Port"] },
    });

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Protocol")).toBeInTheDocument();
    expect(screen.getByText("Port")).toBeInTheDocument();
    expect(document.querySelectorAll("thead th")).toHaveLength(3);
  });

  it("renders object headers using their value", () => {
    render(TableSkeleton, {
      props: { headers: [{ value: "Name" }, { value: "Protocol" }] },
    });

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Protocol")).toBeInTheDocument();
  });

  it("applies the size variant", () => {
    const { container } = render(TableSkeleton, {
      props: { size: "compact" },
    });

    expect(container.querySelector(".bx--simple-table")).toHaveClass(
      "bx--simple-table--compact",
    );
  });

  it("applies skeleton and table classes", () => {
    const { container } = render(TableSkeleton);

    const table = container.querySelector("table");
    expect(table).toHaveClass("bx--skeleton");
    expect(table).toHaveClass("bx--simple-table");
  });
});
