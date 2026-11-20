// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import InfiniteList from "./InfiniteList.ssr.test.svelte";

describe("InfiniteList server rendering", () => {
  it("renders the first page, its positions and the button", () => {
    const { document } = renderSSR(InfiniteList);
    const items = [...document.querySelectorAll("li")];

    expect(items.map((item) => item.textContent?.trim())).toEqual([
      "Row 1",
      "Row 2",
      "Row 3",
    ]);
    expect(items[2].getAttribute("aria-posinset")).toBe("3");
    expect(items[2].getAttribute("aria-setsize")).toBe("4000");
    expect(document.querySelector("ul")?.getAttribute("aria-label")).toBe(
      "Results",
    );
    expect(document.body.textContent).toContain("Showing 3 of 4,000");
    expect(document.querySelector("button")?.textContent?.trim()).toBe(
      "Load more",
    );
  });

  it("links the skip link to a target after the list", () => {
    const { document } = renderSSR(InfiniteList);
    const link = document.querySelector<HTMLAnchorElement>(
      ".bx--infinite-list__skip",
    );
    const target = document.querySelector(".bx--infinite-list__after");

    expect(link?.getAttribute("href")).toBe(`#${target?.id}`);
    expect(target?.getAttribute("tabindex")).toBe("-1");
  });

  it("renders a loading message when there is no first page", () => {
    const { document } = renderSSR(InfiniteList, { withInitial: false });
    expect(document.querySelector("ul")).toBeNull();
    expect(document.body.textContent).toContain("Loading results");
    expect(document.body.textContent).not.toContain("No results");
  });

  it("renders with restore and a scroll container", () => {
    const { document } = renderSSR(InfiniteList, {
      restore: true,
      scroll: "container",
    });
    const root = document.querySelector(".bx--infinite-list");
    expect(root?.classList.contains("bx--infinite-list--container")).toBe(true);
    expect(root?.getAttribute("tabindex")).toBe("0");
    expect(document.querySelectorAll("li")).toHaveLength(3);
  });
});
