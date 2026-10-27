// @vitest-environment node

import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { renderRaw } from "../utils/ssr";

describe("DataTable resizable columns server render", () => {
  const html = renderRaw(DataTable, {
    id: "cols",
    resizable: true,
    expandable: true,
    columnWidths: { name: 200, region: 120 },
    headers: [
      { key: "name", value: "Name" },
      { key: "region", value: "Region", columnResizable: false },
    ],
    rows: [{ id: "a", name: "Ada", region: "eu" }],
  });

  it("renders a saved layout as column and table widths", () => {
    expect(html).toContain('style="width: 200px"');
    expect(html).toContain('style="width: 120px"');
    expect(html).toContain("table-layout: fixed");
    expect(html).toContain("width: calc(2.5rem + 320px)");
  });

  it("renders the handle of a resizable column, named by its header", () => {
    expect(html.match(/role="separator"/g)).toHaveLength(1);
    expect(html).toContain(
      'aria-labelledby="cols-name-resize cols-name-label"',
    );
    expect(html).toContain('aria-valuenow="200"');
    expect(html).toContain('id="cols-name-label"');
  });
});
