// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import SidePanel from "./SidePanelSlots.test.svelte";

describe("SidePanel (server)", () => {
  it("renders an open panel, named and described, with the AI surface", () => {
    const { document } = renderSSR(SidePanel, { includeOverlay: true });

    const panel = document.querySelector(".bx--side-panel");
    expect(panel?.getAttribute("role")).toBe("dialog");
    expect(panel?.getAttribute("aria-modal")).toBe("true");
    expect(panel?.getAttribute("aria-labelledby")).toBe(
      document.querySelector("h4")?.id,
    );
    expect(panel?.getAttribute("aria-describedby")).toBe(
      document.querySelector(".bx--side-panel__subtitle")?.id,
    );
    expect(panel?.classList).toContain("bx--side-panel--ai-label");
    expect(document.querySelector(".bx--side-panel__overlay")).not.toBeNull();
    expect(
      document.querySelector(".bx--side-panel__actions .bx--btn--primary"),
    ).not.toBeNull();
  });

  it("renders nothing while closed", () => {
    const { document } = renderSSR(SidePanel, { open: false });
    expect(document.querySelector(".bx--side-panel")).toBeNull();
  });
});
