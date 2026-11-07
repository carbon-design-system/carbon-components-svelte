// @vitest-environment node
import HeaderSwitcher from "carbon-components-svelte/UIShell/HeaderSwitcher.svelte";
import { renderRaw } from "../utils/ssr";

describe("HeaderSwitcher items server render", () => {
  const props = {
    id: "switcher",
    isOpen: true,
    selectedId: "acme",
    recentIds: ["globex"],
    searchThreshold: 2,
    items: [
      { id: "acme", text: "Acme Corp", group: "Accounts" },
      { id: "globex", text: "Globex", group: "Accounts" },
      { id: "initech", text: "Initech", group: "Accounts" },
    ],
  };

  it("renders identical markup for an explicit id", () => {
    expect(renderRaw(HeaderSwitcher, props)).toBe(
      renderRaw(HeaderSwitcher, props),
    );
  });

  it("derives the ids inside the menu from the id", () => {
    const html = renderRaw(HeaderSwitcher, props);

    expect(html).toContain('id="switcher-menu"');
    expect(html).toContain('id="switcher-menu-search"');
    expect(html).toContain('id="switcher-menu-recent"');
    expect(html).toContain('aria-labelledby="switcher-menu-group-Accounts"');
  });

  it("names the trigger from the selected item and marks it current", () => {
    const html = renderRaw(HeaderSwitcher, props);

    expect(html).toContain('aria-current="true"');
    expect(html).toContain("Acme Corp");
  });
});
