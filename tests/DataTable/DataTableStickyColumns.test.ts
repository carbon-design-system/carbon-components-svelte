import { render } from "@testing-library/svelte";
import { tick } from "svelte";
import DataTable from "./DataTableStickyColumns.test.svelte";

type Header = {
  key: string;
  value: string;
  sticky?: "start" | "end";
};

const headers: Header[] = [
  { key: "name", value: "Name", sticky: "start" },
  { key: "protocol", value: "Protocol", sticky: "start" },
  { key: "port", value: "Port" },
  { key: "rule", value: "Rule", sticky: "end" },
];

const rows = [
  { id: "a", name: "Load Balancer 3", protocol: "HTTP", port: 3000, rule: "R" },
  { id: "b", name: "Load Balancer 1", protocol: "HTTPS", port: 443, rule: "R" },
];

const START = "bx--table-column--sticky-start";
const END = "bx--table-column--sticky-end";

function cellsAt(container: HTMLElement, selector: string, index: number) {
  return Array.from(container.querySelectorAll(selector)).map(
    (row) => row.querySelectorAll("th, td")[index] as HTMLElement,
  );
}

describe("DataTable sticky columns", () => {
  it("applies start and end classes to header and body cells", () => {
    const { container } = render(DataTable, { props: { headers, rows } });

    for (const selector of ["thead tr", "tbody tr"]) {
      const [name, protocol, port, rule] = [0, 1, 2, 3].map(
        (i) => cellsAt(container, selector, i)[0],
      );
      expect(name).toHaveClass(START);
      expect(protocol).toHaveClass(START);
      expect(port).not.toHaveClass(START);
      expect(port).not.toHaveClass(END);
      expect(rule).toHaveClass(END);
    }
  });

  it("sets an inline offset on sticky cells", () => {
    const { container } = render(DataTable, { props: { headers, rows } });

    expect(cellsAt(container, "tbody tr", 0)[0]).toHaveStyle({ left: "0px" });
    expect(cellsAt(container, "tbody tr", 3)[0]).toHaveStyle({ right: "0px" });
    expect(cellsAt(container, "tbody tr", 2)[0].getAttribute("style")).toBe(
      null,
    );
  });

  it("marks only the boundary cells with edge classes", () => {
    const { container } = render(DataTable, { props: { headers, rows } });

    const startEdge = `${START}-edge`;
    const endEdge = `${END}-edge`;

    expect(container.querySelectorAll(`.${startEdge}`)).toHaveLength(
      rows.length + 1,
    );
    expect(container.querySelectorAll(`.${endEdge}`)).toHaveLength(
      rows.length + 1,
    );
    expect(cellsAt(container, "tbody tr", 0)[0]).not.toHaveClass(startEdge);
    expect(cellsAt(container, "tbody tr", 1)[0]).toHaveClass(startEdge);
    expect(cellsAt(container, "tbody tr", 3)[0]).toHaveClass(endEdge);
  });

  it("pins the select and expand cells with the start run", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, selectable: true, expandable: true },
    });

    for (const selector of ["thead tr", "tbody tr"]) {
      expect(cellsAt(container, selector, 0)[0]).toHaveClass(START);
      expect(cellsAt(container, selector, 1)[0]).toHaveClass(START);
    }
  });

  it("does not pin the select and expand cells without a start column", () => {
    const { container } = render(DataTable, {
      props: {
        headers: headers.map(({ sticky, ...header }) => ({
          ...header,
          ...(sticky === "end" ? { sticky } : {}),
        })),
        rows,
        selectable: true,
        expandable: true,
      },
    });

    expect(container.querySelectorAll(`.${START}`)).toHaveLength(0);
    expect(container.querySelectorAll(`.${END}`)).toHaveLength(rows.length + 1);
  });

  it("applies to painted rows when virtualized", () => {
    const largeRows = Array.from({ length: 500 }, (_, i) => ({
      id: String(i),
      name: `Load Balancer ${i + 1}`,
      protocol: "HTTP",
      port: 3000 + i,
      rule: "R",
    }));
    const { container } = render(DataTable, {
      props: { headers, rows: largeRows, virtualize: {} },
    });

    const dataRows = Array.from(container.querySelectorAll("tbody tr")).filter(
      (row) => !row.getAttribute("style")?.includes("height:"),
    );
    expect(dataRows.length).toBeGreaterThan(0);
    for (const row of dataRows) {
      const cells = row.querySelectorAll("td");
      expect(cells[0]).toHaveClass(START);
      expect(cells[3]).toHaveClass(END);
    }
  });

  it("ignores sticky when stickyHeader is set", () => {
    const { container } = render(DataTable, {
      props: { headers, rows, stickyHeader: true },
    });

    expect(
      container.querySelectorAll(`[class*="table-column--sticky"]`),
    ).toHaveLength(0);
  });

  it("ignores a sticky flag that is not contiguous from the edge", () => {
    const { container } = render(DataTable, {
      props: {
        headers: [
          { key: "name", value: "Name" },
          { key: "protocol", value: "Protocol", sticky: "start" },
        ],
        rows,
      },
    });

    expect(container.querySelectorAll(`.${START}`)).toHaveLength(0);
  });

  it("drops the classes when sticky columns are removed", async () => {
    const { container, rerender } = render(DataTable, {
      props: { headers, rows },
    });
    expect(container.querySelectorAll(`.${START}`).length).toBeGreaterThan(0);

    rerender({ headers: headers.map(({ sticky, ...header }) => header) });
    await tick();

    expect(
      container.querySelectorAll(`[class*="table-column--sticky"]`),
    ).toHaveLength(0);
  });

  describe("ResizeObserver", () => {
    const Original = globalThis.ResizeObserver;

    afterEach(() => {
      globalThis.ResizeObserver = Original;
    });

    it("does not construct an observer when no header is sticky", async () => {
      const spy = vi.fn(function (this: unknown) {
        return new Original(() => {});
      });
      globalThis.ResizeObserver = spy as unknown as typeof ResizeObserver;

      render(DataTable, {
        props: {
          headers: headers.map(({ sticky, ...header }) => header),
          rows,
        },
      });
      await tick();

      expect(spy).not.toHaveBeenCalled();
    });

    it("shares one observer across every header cell", async () => {
      const observed: Element[] = [];
      const spy = vi.fn(function (this: unknown) {
        return {
          observe: (el: Element) => observed.push(el),
          unobserve: () => {},
          disconnect: () => {},
        };
      });
      globalThis.ResizeObserver = spy as unknown as typeof ResizeObserver;

      render(DataTable, {
        props: { headers, rows, selectable: true },
      });
      await tick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(observed).toHaveLength(headers.length + 1);
    });
  });
});
