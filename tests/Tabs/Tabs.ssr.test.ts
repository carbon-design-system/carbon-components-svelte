// @vitest-environment node
import { render } from "svelte/server";
import { renderSSR } from "../utils/ssr";
import TabsSsr from "./TabsSsr.test.svelte";
import TabsOwnPanelId from "./TabsSsrOwnPanelId.test.svelte";
import TabsTall from "./TabsTall.test.svelte";

function getParts(document: Document) {
  return {
    tabs: [...document.querySelectorAll("[role='tab']")],
    panels: [...document.querySelectorAll("[role='tabpanel']")],
  };
}

function expectSelected(document: Document, selectedIndex: number) {
  const { tabs, panels } = getParts(document);

  expect(tabs).toHaveLength(3);
  expect(panels).toHaveLength(3);

  tabs.forEach((tab, index) => {
    const selected = index === selectedIndex;
    expect(tab).toHaveAttribute("aria-selected", String(selected));
    expect(tab).toHaveAttribute("tabindex", selected ? "0" : "-1");
  });

  panels.forEach((panel, index) => {
    if (index === selectedIndex) {
      expect(panel).not.toHaveAttribute("hidden");
    } else {
      expect(panel).toHaveAttribute("hidden");
    }
  });
}

describe("Tabs server render", () => {
  it("renders the first tab and panel as selected by default", () => {
    const { document } = renderSSR(TabsSsr);

    expectSelected(document, 0);
  });

  it("renders the tab and panel at `selected`", () => {
    const { document } = renderSSR(TabsSsr, { selected: 1 });

    expectSelected(document, 1);
    expect(document.body).toHaveTextContent("Content 2");
  });

  it("renders the tab and panel matching `selectedId`", () => {
    const { document } = renderSSR(TabsSsr, { selectedId: "tab-c" });

    expectSelected(document, 2);
  });

  it("pairs each tab with its panel", () => {
    const { document } = renderSSR(TabsSsr, { selected: 1 });
    const { tabs, panels } = getParts(document);

    tabs.forEach((tab, index) => {
      const panel = panels[index];
      expect(panel.id).not.toBe("");
      expect(tab).toHaveAttribute("aria-controls", panel.id);
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    });
  });

  // A panel with its own `id` keeps it, but its tab renders first and has
  // already pointed `aria-controls` at the id reserved for that position.
  // Registration corrects it after mount (see Tabs.test.ts).
  it("keeps a panel's own id, so aria-controls is stale until mount", () => {
    const { document } = renderSSR(TabsOwnPanelId);
    const { tabs, panels } = getParts(document);

    expect(panels[1]).toHaveAttribute("id", "own-panel");
    expect(tabs[0]).toHaveAttribute("aria-controls", panels[0].id);
    expect(tabs[1]).not.toHaveAttribute("aria-controls", "own-panel");
    expect(panels[1]).toHaveAttribute("aria-labelledby", tabs[1].id);
  });

  it("renders identical markup when every tab has an id", () => {
    const renderRaw = () => render(TabsSsr, { props: {} }).body;

    expect(renderRaw()).toBe(renderRaw());
  });

  it("derives each panel id from its tab id", () => {
    const { document } = renderSSR(TabsSsr);
    const { tabs, panels } = getParts(document);

    expect(panels.map((panel) => panel.id)).toEqual([
      "tab-a-panel",
      "tab-b-panel",
      "tab-c-panel",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-controls", "tab-a-panel");
  });
});

describe("Tabs server render with `tall`", () => {
  // Tabs learn a tab has a secondary label once it registers, after
  // their own markup is written; `tall` says so up front.
  it("lays out every container tab for secondary labels", () => {
    const { document } = renderSSR(TabsTall);

    expect(document.querySelector(".bx--tabs")).toHaveClass("bx--tabs--tall");
    expect(
      document.querySelectorAll(".bx--tabs__nav-item-label-wrapper"),
    ).toHaveLength(2);
    expect(
      document.querySelectorAll(".bx--tabs__nav-item-secondary-label"),
    ).toHaveLength(2);
  });

  it("renders one-line tabs without `tall`", () => {
    const { document } = renderSSR(TabsTall, { tall: false });

    expect(document.querySelector(".bx--tabs")).not.toHaveClass(
      "bx--tabs--tall",
    );
  });

  it("ignores `tall` on line tabs", () => {
    const { document } = renderSSR(TabsTall, { type: "default" });

    expect(document.querySelector(".bx--tabs")).not.toHaveClass(
      "bx--tabs--tall",
    );
    expect(
      document.querySelector(".bx--tabs__nav-item-label-wrapper"),
    ).toBeNull();
  });
});
