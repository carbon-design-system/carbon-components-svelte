// @vitest-environment node

import { render } from "svelte/server";
import TableContainerSsr from "./TableContainerSsr.test.svelte";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(TableContainerSsr, { props }).body.replace(
    /<!--[\s\S]*?-->/g,
    "",
  );
}

describe("TableContainer server render", () => {
  const props = { id: "sales", title: "Sales", description: "By region" };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the title and description ids from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<div id="sales"');
    expect(html).toContain('<h4 id="sales-title"');
    expect(html).toContain('<p id="sales-description"');
    expect(html).toContain('aria-labelledby="sales-title"');
    expect(html).toContain('aria-describedby="sales-description"');
  });
});
