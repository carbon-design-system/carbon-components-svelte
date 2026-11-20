// @vitest-environment node
import { syncSelectionToUrl } from "../../src/utils/sync-selection-to-url.js";
import { renderSSR } from "../utils/ssr";
import ListDetailLayout from "./ListDetailLayout.test.svelte";

describe("ListDetailLayout (server)", () => {
  it("renders both panes and the empty state, for CSS to choose between", () => {
    const { document } = renderSSR(ListDetailLayout);

    expect(
      document.querySelectorAll(".bx--list-detail > .bx--splitter section"),
    ).toHaveLength(2);
    expect(
      document
        .querySelector(".bx--list-detail")
        ?.classList.contains("bx--list-detail--selected"),
    ).toBe(false);
    expect(document.querySelector("h3")?.textContent).toBe("Select a ticket");
    // The Back button is in the markup; CSS shows it below the breakpoint.
    expect(
      document.querySelector(".bx--list-detail__bar button")?.textContent,
    ).toContain("Back to list");
  });

  it("renders the selected details and link from selectedId, with no script", () => {
    const { document } = renderSSR(ListDetailLayout, { selectedId: "102" });

    const root = document.querySelector(".bx--list-detail");
    expect(root?.classList.contains("bx--list-detail--selected")).toBe(true);
    expect(document.querySelector("h2")?.textContent).toBe(
      "Export hangs at 90%",
    );
    const current = document.querySelector('a[aria-current="true"]');
    expect(current?.getAttribute("href")).toBe("?id=102");
    expect(
      document.querySelector("section[aria-label='Export hangs at 90%']"),
    ).not.toBeNull();
    // Every link is a Tab stop until script takes over.
    expect(document.querySelector("a[tabindex]")).toBeNull();
  });

  it("reads and links without a window", () => {
    const url = syncSelectionToUrl({ param: "ticket" });

    expect(url.read()).toBe("");
    expect(url.hrefFor("a b")).toBe("?ticket=a%20b");
    expect(() => {
      url.push("1");
      url.replace("2");
      url.back();
      url.listen(() => {})();
    }).not.toThrow();
  });
});
