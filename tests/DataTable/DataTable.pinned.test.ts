import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import DataTable from "./DataTablePinned.test.svelte";
import { getBodyRows, getCells } from "./helpers";

function rowText(row: HTMLElement) {
  return getCells(row).map((cell) => cell.textContent?.trim());
}

function insets(cells: HTMLElement[]) {
  return cells.map(
    (cell) => cell.style.getPropertyValue("--ccs-pinned-offset") || undefined,
  );
}

describe("DataTable pinned columns", () => {
  it("renders pinned columns at their edge wherever they sit in headers", () => {
    render(DataTable, {
      props: {
        headers: [
          { key: "region", value: "Region" },
          { key: "owner", value: "Owner", columnPinned: "end" },
          { key: "name", value: "Name", columnPinned: "start" },
        ],
        withFooter: true,
      },
    });

    expect(
      screen.getAllByRole("columnheader").map((th) => th.textContent?.trim()),
    ).toEqual(["Name", "Region", "Owner"]);
    expect(rowText(getBodyRows()[0])).toEqual([
      "Load Balancer 3",
      "us-east",
      "ops",
    ]);
    expect(
      [...document.querySelectorAll("tfoot td")].map((td) =>
        td.textContent?.trim(),
      ),
    ).toEqual(["name", "region", "owner"]);
  });

  it("pins header, body and footer cells with offsets from the declared widths", () => {
    render(DataTable, {
      props: {
        headers: [
          { key: "name", value: "Name", columnPinned: "start", width: "8rem" },
          { key: "id", value: "ID", columnPinned: "start", width: "4rem" },
          { key: "region", value: "Region", width: "10rem" },
          { key: "owner", value: "Owner", columnPinned: "end", width: "4rem" },
        ],
        rows: [{ id: "a", name: "A", region: "r", owner: "o" }],
        withFooter: true,
      },
    });

    const head = [...document.querySelectorAll<HTMLElement>("thead th")];
    const body = getCells(getBodyRows()[0]);
    const foot = [...document.querySelectorAll<HTMLElement>("tfoot td")];

    for (const cells of [head, body, foot]) {
      expect(insets(cells)).toEqual(["0px", "8rem", undefined, "0px"]);
      expect(cells[0]).toHaveClass("bx--table-column--pinned-start");
      expect(cells[1]).toHaveClass(
        "bx--table-column--pinned-start",
        "bx--table-column--pinned-start-edge",
      );
      expect(cells[2]).not.toHaveClass("bx--table-column--pinned-start");
      expect(cells[3]).toHaveClass(
        "bx--table-column--pinned-end",
        "bx--table-column--pinned-end-edge",
      );
    }
    expect(document.querySelector("table")).toHaveClass(
      "bx--data-table--pinned-columns",
    );
  });

  it("pins the selection and expand columns with the start group only", () => {
    const { unmount } = render(DataTable, {
      props: { expandable: true, batchSelection: true },
    });

    const [expand, select, name] =
      document.querySelectorAll<HTMLElement>("thead th");
    expect(expand).toHaveClass(
      "bx--table-expand",
      "bx--table-column--pinned-start",
    );
    expect(select).toHaveClass(
      "bx--table-column-checkbox",
      "bx--table-column--pinned-start",
    );
    expect(insets([expand, select, name])).toEqual(["0px", "2.5rem", "5rem"]);
    const bodyCells = getCells(getBodyRows()[0]);
    expect(bodyCells[0]).toHaveClass("bx--table-column--pinned-start");
    expect(bodyCells[1]).toHaveClass("bx--table-column--pinned-start");

    unmount();
    render(DataTable, {
      props: {
        expandable: true,
        batchSelection: true,
        headers: [
          { key: "name", value: "Name", width: "8rem" },
          { key: "owner", value: "Owner", columnPinned: "end", width: "4rem" },
        ],
      },
    });

    for (const cell of document.querySelectorAll("thead th")) {
      if (cell.textContent?.trim() === "Owner") continue;
      expect(cell).not.toHaveClass("bx--table-column--pinned-start");
    }
  });

  it("leaves a table without pins unmarked and unobserved", async () => {
    const observe = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = observe;
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );

    render(DataTable, {
      props: {
        headers: [
          { key: "name", value: "Name", width: "8rem" },
          { key: "region", value: "Region" },
        ],
      },
    });
    await tick();

    expect(document.querySelector("table")).not.toHaveClass(
      "bx--data-table--pinned-columns",
    );
    expect(document.querySelector("[class*='pinned']")).toBeNull();
    // The table's own overflow check observes; no pinned cell does.
    expect(
      observe.mock.calls.filter(([target]) => target.tagName === "TH"),
    ).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it("follows the measured width of a pinned cell over its declared one", async () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        return rect({ width: this.textContent?.trim() === "Name" ? 123.5 : 0 });
      },
    );

    render(DataTable, {
      props: {
        headers: [
          { key: "name", value: "Name", columnPinned: "start", width: "8rem" },
          { key: "id", value: "ID", columnPinned: "start", width: "4rem" },
        ],
      },
    });
    await tick();
    await tick();

    const [, id] = document.querySelectorAll<HTMLElement>("thead th");
    expect(insets([id])).toEqual(["123.5px"]);
    expect(insets(getCells(getBodyRows()[0]))).toEqual(["0px", "123.5px"]);

    vi.restoreAllMocks();
  });

  it("re-pins when headers change", async () => {
    const { rerender } = render(DataTable);
    const headers: {
      key: string;
      value: string;
      width?: string;
      columnPinned?: "start" | "end";
    }[] = [
      { key: "name", value: "Name", width: "8rem" },
      { key: "region", value: "Region", columnPinned: "start", width: "4rem" },
      { key: "owner", value: "Owner" },
    ];

    await rerender({ headers });
    expect(
      screen.getAllByRole("columnheader").map((th) => th.textContent?.trim()),
    ).toEqual(["Region", "Name", "Owner"]);

    await rerender({ headers: headers.slice(0, 1) });
    expect(document.querySelector("[class*='pinned']")).toBeNull();
  });
});
