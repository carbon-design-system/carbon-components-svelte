// @vitest-environment node

import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { renderRaw } from "../utils/ssr";

describe("DataTable stacked server render", () => {
  const props = {
    id: "lb",
    headers: [
      { key: "name", value: "Name", primary: true },
      { key: "protocol", value: "Protocol" },
      { key: "actions", value: "Actions", empty: true },
    ] as const,
    rows: [{ id: "a", name: "Ada", protocol: "HTTP" }],
    stacked: "auto" as const,
  };

  it("renders the labels and the container class the stylesheet keys off", () => {
    const html = renderRaw(DataTable, props);

    expect(html).toContain("bx--data-table-container--stacked-md");
    expect(html).toContain('data-label="Protocol"');
    expect(html).toContain('data-stacked="primary"');
    expect(html).toContain('data-stacked="actions"');
    expect(html).toContain('role="table"');
    expect(html).toContain('role="row"');
    expect(html).toContain('role="cell"');
  });

  it("renders nothing of it by default", () => {
    const html = renderRaw(DataTable, { ...props, stacked: undefined });

    expect(html).not.toContain("--stacked");
    expect(html).not.toContain("data-label");
    expect(html).not.toMatch(/role="(table|rowgroup|row|cell)"/);
  });

  it("selects the sort option the table is sorted by", () => {
    const html = renderRaw(DataTable, {
      ...props,
      stacked: "always",
      sortable: true,
      sortKey: "protocol",
      sortDirection: "descending",
    });

    expect(html).toMatch(
      /<option value="1:descending" selected[^>]*>Protocol, descending/,
    );
  });
});
