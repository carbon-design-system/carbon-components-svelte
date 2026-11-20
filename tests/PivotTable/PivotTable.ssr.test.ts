// @vitest-environment node

import PivotTable from "carbon-components-svelte/PivotTable/PivotTable.svelte";
import { RANDOM_ID, renderRaw, renderSSR } from "../utils/ssr";

/** The server HTML, parsed. */
function parse(props: Record<string, unknown>) {
  return { container: renderSSR(PivotTable, props).document.body };
}

describe("PivotTable server render", () => {
  const props = {
    id: "sales",
    labelText: "Sales",
    records: [
      { region: "EMEA", country: "France", year: 2023, amount: 1234.5 },
      { region: "EMEA", country: "Spain", year: 2024, amount: 20 },
      { region: "APAC", country: "Japan", year: 2023, amount: 40 },
    ],
    config: {
      rows: ["region", "country"],
      columns: ["year"],
      values: [{ field: "amount", format: { maximumFractionDigits: 0 } }],
    },
  };

  it("derives every id from the id", () => {
    expect(renderRaw(PivotTable, props).match(RANDOM_ID)).toBeNull();
  });

  it("renders the collapsed pivot with its totals", () => {
    const { container } = parse(props);
    const table = container.querySelector("[role=treegrid]");
    expect(table?.getAttribute("aria-labelledby")).toBe("sales-label");
    expect(
      [...container.querySelectorAll("[role=rowheader]")].map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(["APAC", "EMEA", "Grand total"]);
    const emea = container.querySelectorAll("tbody tr")[1];
    expect(emea.getAttribute("aria-expanded")).toBe("false");
    expect(emea.getAttribute("aria-level")).toBe("1");
    expect(
      [...emea.querySelectorAll("[role=gridcell]")].map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(["1,235", "20", "1,255"]);
  });

  it("puts the one tab stop on the first body cell", () => {
    const { container } = parse(props);
    const stops = container.querySelectorAll("[role=treegrid] [tabindex='0']");
    expect(stops).toHaveLength(1);
    expect(stops[0].textContent?.trim()).toBe("APAC");
  });

  it("formats in the locale prop, not the server's", () => {
    const { container } = parse({ ...props, locale: "de" });
    const cells = [...container.querySelectorAll("[role=gridcell]")].map((el) =>
      el.textContent?.trim(),
    );
    expect(cells).toContain("1.235");
  });

  it("renders a group open from expandedRowIds", () => {
    const { container } = parse({
      ...props,
      expandedRowIds: ["␟EMEA"],
    });
    expect(
      [...container.querySelectorAll("[role=rowheader]")].map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(["APAC", "EMEA", "France", "Spain", "Grand total"]);
  });

  it("renders the empty text and the error message", () => {
    expect(renderRaw(PivotTable, { ...props, records: [] })).toContain(
      "No records to pivot.",
    );
    expect(renderRaw(PivotTable, { ...props, maxCells: 2 })).toContain(
      'role="alert"',
    );
  });
});
