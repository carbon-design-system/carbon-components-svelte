// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import DockLayout from "./DockLayout.test.svelte";

describe("DockLayout server render", () => {
  it("renders a restored layout, sizes and active tabs included", () => {
    const { document } = renderSSR(DockLayout, {
      layout: {
        type: "column",
        children: [
          { type: "group", id: "top", tabs: ["c"] },
          {
            type: "row",
            children: [
              { type: "group", id: "left", tabs: ["a", "b"], activeId: "b" },
              { type: "group", id: "right", tabs: ["gone"] },
            ],
            sizes: [50, 50],
          },
        ],
        sizes: [30, 70],
      },
    });

    // The layout that is stored holds a tab with no document, and its group
    // is gone: no shift when the client takes over.
    const regions = [...document.querySelectorAll("[role='region']")];
    expect(regions.map((region) => region.getAttribute("aria-label"))).toEqual([
      "Group 1 of 2, Charlie",
      "Group 2 of 2, Bravo",
    ]);
    const separator = document.querySelector("[role='separator']");
    expect(separator).toHaveAttribute("aria-valuenow", "30");
    expect(
      document
        .querySelector("[data-dock-group='left'] [aria-selected='true']")
        ?.textContent?.trim(),
    ).toContain("Bravo");
    expect(
      document.querySelector(
        "[data-dock-group='left'] [role='tabpanel']:not([hidden])",
      )?.textContent,
    ).toContain("Bravo content");
  });
});
