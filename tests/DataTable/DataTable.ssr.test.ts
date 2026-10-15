// @vitest-environment node

import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { RANDOM_ID, renderRaw, renderSSR } from "../utils/ssr";
import TableContainerWithTable from "./TableContainerWithTable.test.svelte";

describe("DataTable server render", () => {
  const props = {
    id: "people",
    title: "People",
    description: "Everyone",
    headers: [
      { key: "name", value: "Name" },
      { key: "role", value: "Role" },
    ],
    rows: [
      { id: "a", name: "Ada", role: "Engineer" },
      { id: "b", name: "Bob", role: "Designer" },
    ],
    expandable: true,
    selectable: true,
    batchSelection: true,
  };

  it("derives every id from an explicit id, with no random id left over", () => {
    expect(renderRaw(DataTable, props).match(RANDOM_ID)).toBeNull();
  });

  it("derives the title, header, cell and selection ids from the id", () => {
    const html = renderRaw(DataTable, props);

    expect(html).toContain('<div id="people"');
    expect(html).toContain('<h4 id="people-title"');
    expect(html).toContain('id="people-description"');
    expect(html).toContain('aria-labelledby="people-title"');
    expect(html).toContain('aria-describedby="people-description"');
    expect(html).toContain('id="people-name"');
    expect(html).toContain('headers="people-name"');
    expect(html).toContain('id="people-role"');
    expect(html).toContain('headers="people-role"');
    expect(html).toContain('id="people-a"');
    expect(html).toContain('id="people-expandable-row-a"');
    expect(html).toContain('aria-controls="people-expandable-row-a"');
  });

  it.each(["aria-label", "aria-labelledby"])(
    "sets %s on the table, not its container",
    (attribute) => {
      const html = renderRaw(DataTable, {
        id: "query",
        headers: props.headers,
        rows: props.rows,
        [attribute]: "results",
      });

      expect(html).toMatch(new RegExp(`<table[^>]*${attribute}="results"`));
      expect(html).not.toMatch(new RegExp(`<div[^>]*${attribute}="results"`));
    },
  );

  it("names the selection inputs after the id", () => {
    const html = renderRaw(DataTable, props);

    expect(html).toContain('id="people-select-all"');
    expect(html).toContain('for="people-select-all"');
    expect(html).toContain('name="people-select-all"');
    expect(html).toContain('name="people"');
  });

  it("keeps an explicit inputName", () => {
    const html = renderRaw(DataTable, { ...props, inputName: "chosen" });

    expect(html).toContain('name="chosen"');
    expect(html).not.toContain('name="people"');
  });

  // `indeterminate` is a DOM property with no attribute, so the select-all
  // label carries the mixed state until hydration sets it.
  it("marks select all as mixed when some rows are selected", () => {
    const { document } = renderSSR(DataTable, {
      ...props,
      selectedRowIds: ["a"],
    });

    expect(
      document.querySelector('label[for="people-select-all"]'),
    ).toHaveAttribute("data-contained-checkbox-state", "mixed");
  });
});

describe("DataTable virtualize server render", () => {
  const headers = [
    { key: "name", value: "Name" },
    { key: "value", value: "Value" },
  ];

  const rows = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    name: `Row ${i}`,
    value: `Value ${i}`,
  }));

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

describe("TableContainer server render", () => {
  const props = { id: "sales", title: "Sales", description: "By region" };

  it("derives the title and description ids from the id", () => {
    const html = renderRaw(TableContainerWithTable, props);

    expect(html).toContain('<div id="sales"');
    expect(html).toContain('<h4 id="sales-title"');
    expect(html).toContain('<p id="sales-description"');
    expect(html).toContain('aria-labelledby="sales-title"');
    expect(html).toContain('aria-describedby="sales-description"');
  });
});
