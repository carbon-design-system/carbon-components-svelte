// @vitest-environment node
import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { renderSSR } from "../utils/ssr";

const headers = [
  { key: "name", value: "Name" },
  { key: "value", value: "Value" },
];

const rows = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  name: `Row ${i}`,
  value: `Value ${i}`,
}));

describe("DataTable virtualize server render", () => {
  it("bounds the scroll container of a virtualized table", () => {
    const { document } = renderSSR(DataTable, {
      headers,
      rows,
      virtualize: true,
    });

    const container = document.querySelector(".bx--data-table-container > div");
    expect(container).toHaveStyle({ maxHeight: "480px", overflowY: "auto" });
  });

  it("bounds the scrolling table of a virtualized sticky-header table", () => {
    const { document } = renderSSR(DataTable, {
      headers,
      rows,
      stickyHeader: true,
      virtualize: true,
    });

    const table = document.querySelector("section > table");
    expect(table).toHaveStyle({ maxHeight: "480px", overflowY: "auto" });
  });

  it("keeps `table-layout` next to the scroll style", () => {
    const { document } = renderSSR(DataTable, {
      headers,
      rows,
      stickyHeader: true,
      fixedLayout: true,
      virtualize: { containerHeight: 200 },
    });

    const table = document.querySelector("section > table");
    expect(table).toHaveStyle({
      tableLayout: "fixed",
      maxHeight: "200px",
      overflowY: "auto",
    });
  });
});
