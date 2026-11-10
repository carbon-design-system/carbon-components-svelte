// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import IndexedList from "./IndexedList.test.svelte";

describe("IndexedList (server)", () => {
  it("renders the first window and the rail with no DOM", () => {
    const { document } = renderSSR(IndexedList, {});

    expect(
      [...document.querySelectorAll('[role="heading"]')].map((node) =>
        node.textContent?.trim(),
      ),
    ).toEqual(["A (1)", "M (1)", "Z (1)", "Ä (1)", "Ö (1)", "# (1)"]);
    expect(
      document.querySelectorAll(".bx--indexed-list__index-button"),
    ).toHaveLength(30);
    expect(
      document
        .querySelector('[aria-label="Jump to M, 1 item"]')
        ?.getAttribute("aria-disabled"),
    ).toBeNull();
    expect(
      document
        .querySelector('[aria-label="Jump to B, 0 items"]')
        ?.getAttribute("aria-disabled"),
    ).toBe("true");
    // The first window's spacing is in the markup.
    const list = document.querySelector<HTMLElement>(".bx--indexed-list__list");
    expect(list?.style.paddingBlockStart).toBe("0px");
  });
});
