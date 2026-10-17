// @vitest-environment node

import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
import { render } from "svelte/server";
import { RANDOM_ID, renderSSR } from "../utils/ssr";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(DataTable, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

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
    expect(renderRaw(props).match(RANDOM_ID)).toBeNull();
  });

  it("derives the title, header, cell and selection ids from the id", () => {
    const html = renderRaw(props);

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

  it("names the selection inputs after the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('id="people-select-all"');
    expect(html).toContain('for="people-select-all"');
    expect(html).toContain('name="people-select-all"');
    expect(html).toContain('name="people"');
  });

  it("keeps an explicit inputName", () => {
    const html = renderRaw({ ...props, inputName: "chosen" });

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
