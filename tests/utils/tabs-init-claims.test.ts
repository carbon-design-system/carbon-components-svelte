// @vitest-environment node
import { get, writable } from "svelte/store";
import { createTabsInitClaims } from "../../src/utils/tabs-init-claims.js";

function setup(selection: {
  selectedId?: string;
  selectedIndex?: number;
  hasContent?: boolean;
}) {
  const selectedTab = writable<string | undefined>(undefined);
  const selectedContent = writable<string | undefined>(undefined);
  const claims = createTabsInitClaims({
    selectedTab,
    selectedContent,
    getSelection: () => ({
      selectedId: selection.selectedId,
      selectedIndex: selection.selectedIndex ?? 0,
      hasContent: selection.hasContent ?? true,
    }),
  });
  return { selectedTab, selectedContent, ...claims };
}

describe("createTabsInitClaims", () => {
  it("selects the tab and panel at selectedIndex", () => {
    const { claimTab, claimPanel, selectedTab, selectedContent } = setup({
      selectedIndex: 1,
    });
    claimTab("a");
    claimTab("b");
    claimPanel("p-a", false);
    expect(claimPanel("p-b", false)).toEqual({ id: "b-panel", tabId: "b" });
    expect(get(selectedTab)).toBe("b");
    expect(get(selectedContent)).toBe("b-panel");
  });

  it("selects the panel paired with the selectedId tab", () => {
    const { claimTab, claimPanel, selectedContent } = setup({
      selectedId: "b",
    });
    claimTab("a");
    claimTab("b");
    claimPanel("p-a", true);
    claimPanel("p-b", true);
    expect(get(selectedContent)).toBe("p-b");
  });

  it("reserves no panel id without content", () => {
    const { claimTab } = setup({ hasContent: false });
    expect(claimTab("a")).toEqual({ panelId: undefined });
  });

  it("ignores claims after close", () => {
    const { claimTab, close, selectedTab } = setup({});
    close();
    expect(claimTab("a")).toBeUndefined();
    expect(get(selectedTab)).toBeUndefined();
  });
});
