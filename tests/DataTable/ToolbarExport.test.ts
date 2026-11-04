import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarExportTest from "./ToolbarExport.test.svelte";

function readBlob(blob: Blob) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

describe("ToolbarExport", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock-url");
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function exportAs(label: string) {
    await user.click(screen.getByRole("button", { name: "Export" }));
    await user.click(screen.getByRole("menuitem", { name: label }));
  }

  /** The names exported, in order, from the one file downloaded. */
  async function exportedNames() {
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const csv = await readBlob(createObjectURL.mock.calls[0][0]);
    return csv
      .split("\r\n")
      .slice(1)
      .map((line) => line.split(",")[0]);
  }

  it("downloads the table's rows in the order it shows them", async () => {
    render(ToolbarExportTest);

    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual([
      "Apple",
      "Banana",
      "Cherry",
      "Date",
    ]);
    expect(clickSpy.mock.instances[0].download).toBe("fruit.csv");
  });

  it("leaves out hidden columns", async () => {
    render(ToolbarExportTest);

    await exportAs("Export CSV");

    const csv = await readBlob(createObjectURL.mock.calls[0][0]);
    expect(csv.split("\r\n")[0]).toBe("Name,Port");
  });

  it("writes the columns in the order the header shows them", async () => {
    render(ToolbarExportTest);

    await exportAs("Export CSV");

    const csv = await readBlob(createObjectURL.mock.calls[0][0]);
    const shown = [...document.querySelectorAll("thead th[data-header]")]
      .map((th) => th.textContent?.trim())
      .filter(Boolean);
    expect(csv.split("\r\n")[0]).toBe(shown.join(","));
  });

  it("exports the rows the search matches", async () => {
    render(ToolbarExportTest);

    await user.type(screen.getByRole("searchbox"), "an");
    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual(["Banana"]);
  });

  it("exports the rows the search matches in hide mode", async () => {
    render(ToolbarExportTest, { props: { filterMode: "hide" } });

    await user.type(screen.getByRole("searchbox"), "an");
    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual(["Banana"]);
  });

  it("exports only the current page with rowScope page", async () => {
    render(ToolbarExportTest, {
      props: { rowScope: "page", pageSize: 2, page: 2 },
    });

    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual(["Cherry", "Date"]);
  });

  it("exports the selected rows in the table's order with rowScope selected", async () => {
    render(ToolbarExportTest, {
      props: { rowScope: "selected", selectedRowIds: ["c", "a"] },
    });

    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual(["Banana", "Cherry"]);
  });

  it("leaves out selected rows the search hides", async () => {
    render(ToolbarExportTest, {
      props: { rowScope: "selected", selectedRowIds: ["a", "c"] },
    });

    await user.type(screen.getByRole("searchbox"), "an");
    await exportAs("Export CSV");

    expect(await exportedNames()).toEqual(["Banana"]);
  });

  it("skips serializing and downloading when export is canceled", async () => {
    const onexport = vi.fn((event: CustomEvent) => event.preventDefault());
    render(ToolbarExportTest, {
      props: { rowScope: "page", pageSize: 3, onexport },
    });

    await exportAs("Export JSON");

    expect(onexport.mock.calls[0][0].detail).toMatchObject({
      format: "json",
      filename: "fruit.json",
      rowScope: "page",
    });
    expect(onexport.mock.calls[0][0].detail.rows).toHaveLength(3);
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it("disables every item when there are no rows to export", async () => {
    render(ToolbarExportTest, {
      props: { rowScope: "selected", selectedRowIds: [] },
    });

    await user.click(screen.getByRole("button", { name: "Export" }));

    for (const item of screen.getAllByRole("menuitem")) {
      expect(item).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("exports given rows and headers outside a DataTable", async () => {
    render(ToolbarExportTest, {
      props: { standalone: true, formats: ["json", "tsv"] },
    });

    await exportAs("Export JSON");

    const json = await readBlob(createObjectURL.mock.calls[0][0]);
    expect(JSON.parse(json)).toHaveLength(4);
    expect(clickSpy.mock.instances[0].download).toBe("people.json");
  });
});
