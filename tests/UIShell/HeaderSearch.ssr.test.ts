// @vitest-environment node
import HeaderSearch from "carbon-components-svelte/UIShell/HeaderSearch.svelte";
import { render } from "svelte/server";

/** Server output with only Svelte's hydration comments removed. */
function renderRaw(props: Record<string, unknown>) {
  return render(HeaderSearch, { props }).body.replace(/<!--[\s\S]*?-->/g, "");
}

describe("HeaderSearch server render", () => {
  const props = {
    id: "search",
    active: true,
    results: [
      { id: "a", href: "/a", text: "Alpha" },
      { href: "/b", text: "Beta" },
    ],
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(props)).toBe(renderRaw(props));
  });

  it("derives the input, label, menu, and result ids from the id", () => {
    const html = renderRaw(props);

    expect(html).toContain('<div id="search"');
    expect(html).toContain('for="search-input"');
    expect(html).toContain('id="search-label"');
    expect(html).toContain('id="search-input"');
    expect(html).toContain('aria-controls="search-menu"');
    expect(html).toContain('aria-labelledby="search-label"');
    expect(html).toContain('id="search-menu"');
    expect(html).toContain('id="search-menuitem-a"');
    expect(html).toContain('id="search-menuitem-1"');
    expect(html).toContain('aria-activedescendant="search-menuitem-a"');
  });
});
