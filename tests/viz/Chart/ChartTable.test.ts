import { render, screen, within } from "@testing-library/svelte";
import { buildTableRows } from "../../../src/viz/Chart/table-rows.js";
import { user } from "../../utils/user";
import ChartTable from "./ChartTable.test.svelte";

const download = vi.hoisted(() => ({ calls: [] as unknown[][] }));

vi.mock("../../../src/utils/download-file.js", () => ({
  downloadFile: (...args: unknown[]) => {
    download.calls.push(args);
  },
}));

beforeEach(() => {
  download.calls = [];
});

describe("buildTableRows", () => {
  const group = (key: string, xs: number[], ys: number[], hidden = false) => ({
    key,
    rows: [],
    xs,
    ys,
    color: "",
    hidden,
  });

  test("pivots visible series into one row per x, ascending", () => {
    const table = buildTableRows([
      group("a", [2, 1], [20, 10]),
      group("b", [1], [5]),
      group("h", [1], [9], true),
    ]);

    expect(table.series).toEqual(["a", "b"]);
    expect(table.rows).toEqual([
      { x: 1, values: [10, 5] },
      { x: 2, values: [20, undefined] },
    ]);
  });
});

describe("Chart table view", () => {
  it("shows the chart by default, with no table", () => {
    render(ChartTable);

    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("application", { name: "Revenue" })).toBeVisible();
  });

  it("switches to a table of every value and back, from the toolbar", async () => {
    render(ChartTable);

    await user.click(screen.getByRole("button", { name: "Show as table" }));
    expect(screen.getByTestId("view")).toHaveTextContent("table");
    const region = screen.getByRole("region", { name: "Revenue, data table" });
    expect(region).toHaveAttribute("tabindex", "0");

    const table = within(region).getByRole("table");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["Quarter", "a", "b"]);
    expect(
      within(table)
        .getAllByRole("rowheader")
        .map((cell) => cell.textContent?.trim()),
    ).toEqual(["Q1", "Q2", "Q3"]);
    const cells = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent?.trim()),
      );
    expect(cells).toEqual([
      ["1.2K", "800"],
      ["1.5K", "–"],
      ["–", "–"],
    ]);

    await user.click(screen.getByRole("button", { name: "Show as chart" }));
    expect(screen.getByTestId("view")).toHaveTextContent("chart");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("keeps the plot mounted but hidden behind the table", async () => {
    const { rerender } = render(ChartTable);
    const path = document.querySelector(".bx--viz-line__path");

    await rerender({ view: "table" });
    expect(document.querySelector(".bx--viz-chart__plot")).toHaveAttribute(
      "hidden",
    );
    expect(document.querySelector(".bx--viz-line__path")).toBe(path);
  });

  it("leaves a hidden series out of the table", () => {
    render(ChartTable, { view: "table", hidden: ["b"] });

    expect(
      screen.getAllByRole("columnheader").map((c) => c.textContent?.trim()),
    ).toEqual(["Quarter", "a"]);
  });

  it("downloads the visible series as CSV", async () => {
    render(ChartTable);

    await user.click(screen.getByRole("button", { name: "Download as CSV" }));
    expect(download.calls).toHaveLength(1);
    const [csv, filename, type] = download.calls[0];
    expect(filename).toBe("revenue.csv");
    expect(type).toContain("text/csv");
    expect(csv).toBe(
      "x,series,y\r\nQ1,a,1200\r\nQ2,a,1500\r\nQ1,b,800\r\nQ3,b,\r\n",
    );
  });

  it("can drop the CSV button", () => {
    render(ChartTable, { csv: false });

    expect(
      screen.queryByRole("button", { name: "Download as CSV" }),
    ).toBeNull();
  });

  it("downloads the plot as a standalone SVG with the title and the series", async () => {
    render(ChartTable);

    await user.click(screen.getByRole("button", { name: "Download as image" }));
    await vi.waitFor(() => expect(download.calls).toHaveLength(1));
    const [markup, filename, type] = download.calls[0] as string[];
    expect(filename).toBe("revenue.svg");
    expect(type).toContain("image/svg+xml");
    expect(markup.startsWith("<svg xmlns=")).toBe(true);
    expect(markup).toContain(">Revenue</text>");
    expect(markup).toContain(">a</text>");
    expect(markup).toContain(">b</text>");
    expect(markup).not.toContain("class=");
  });

  it("offers no image of the table view, and can drop the button", () => {
    const { unmount } = render(ChartTable, { view: "table" });
    expect(
      screen.queryByRole("button", { name: "Download as image" }),
    ).toBeNull();
    unmount();

    render(ChartTable, { image: false });
    expect(
      screen.queryByRole("button", { name: "Download as image" }),
    ).toBeNull();
  });

  it("offers fullscreen only where the browser supports it", async () => {
    // jsdom has no Fullscreen API.
    const { unmount } = render(ChartTable);
    expect(
      screen.queryByRole("button", { name: "Show fullscreen" }),
    ).toBeNull();
    unmount();

    Object.defineProperty(document, "fullscreenEnabled", {
      configurable: true,
      value: true,
    });
    const request = vi.fn();
    render(ChartTable);
    const figure = document.querySelector("figure") as HTMLElement;
    figure.requestFullscreen = request;

    await user.click(
      await screen.findByRole("button", { name: "Show fullscreen" }),
    );
    expect(request).toHaveBeenCalledTimes(1);

    // The browser reports the change, and the button flips.
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: figure,
    });
    figure.dispatchEvent(new Event("fullscreenchange"));
    expect(
      await screen.findByRole("button", { name: "Exit fullscreen" }),
    ).toBeInTheDocument();
    expect(figure).toHaveClass("bx--viz-chart--fullscreen");

    Reflect.deleteProperty(document, "fullscreenEnabled");
    Reflect.deleteProperty(document, "fullscreenElement");
  });
});
