// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import ContentSwitcherSelectedId from "./ContentSwitcher.selectedId.test.svelte";
import ContentSwitcher from "./ContentSwitcher.test.svelte";

function selectedStates(document: Document) {
  return [...document.querySelectorAll("[role='tab']")].map((tab) =>
    tab.getAttribute("aria-selected"),
  );
}

describe("ContentSwitcher server render", () => {
  it("renders the first switch as selected by default", () => {
    const { document } = renderSSR(ContentSwitcher);
    expect(selectedStates(document)).toEqual(["true", "false", "false"]);
  });

  it("renders the `selectedId` switch as selected", () => {
    const { document } = renderSSR(ContentSwitcherSelectedId, {
      selectedId: "switch-b",
    });
    expect(selectedStates(document)).toEqual(["false", "true", "false"]);
  });
});
