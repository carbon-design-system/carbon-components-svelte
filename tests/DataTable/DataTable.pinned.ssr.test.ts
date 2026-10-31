// @vitest-environment node

import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { renderRaw } from "../utils/ssr";

describe("DataTable pinned columns server render", () => {
  const html = renderRaw(DataTable, {
    id: "pins",
    headers: [
      { key: "name", value: "Name", columnPinned: "start", width: "8rem" },
      { key: "id", value: "ID", columnPinned: "start", width: "4rem" },
      { key: "region", value: "Region", width: "10rem" },
      { key: "owner", value: "Owner", columnPinned: "end", width: "4rem" },
    ],
    rows: [{ id: "a", name: "Ada", region: "eu", owner: "ops" }],
    expandable: true,
  });

  it("writes the pin classes and offsets before hydration", () => {
    expect(html).toContain("bx--data-table--pinned-columns");
    expect(html).toContain("--ccs-pinned-offset: 0px");
    expect(html).toContain("--ccs-pinned-offset: 2.5rem");
    expect(html).toContain("--ccs-pinned-offset: 10.5rem");
    expect(html).toContain("bx--table-column--pinned-start-edge");
    expect(html).toContain("bx--table-column--pinned-end-edge");
  });

  it("renders the cells in pinned order", () => {
    const names = [...html.matchAll(/headers="pins-(\w+)"/g)].map(
      (match) => match[1],
    );

    expect(names).toEqual(["expand", "name", "id", "region", "owner"]);
  });
});
