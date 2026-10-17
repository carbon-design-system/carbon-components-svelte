// @vitest-environment node

import { render } from "svelte/server";
import { stripHydrationMarkers } from "../utils/ssr";
import TableContainerWithTable from "./TableContainerWithTable.test.svelte";

function renderRaw(props: Record<string, unknown>) {
  return stripHydrationMarkers(render(TableContainerWithTable, { props }).body);
}

describe("TableContainer server render", () => {
  const props = { id: "sales", title: "Sales", description: "By region" };

  it("derives the title and description ids from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<div id="sales"');
    expect(html).toContain('<h4 id="sales-title"');
    expect(html).toContain('<p id="sales-description"');
    expect(html).toContain('aria-labelledby="sales-title"');
    expect(html).toContain('aria-describedby="sales-description"');
  });
});
