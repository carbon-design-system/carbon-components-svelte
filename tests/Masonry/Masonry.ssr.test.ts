// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Masonry from "./Masonry.ssr.test.svelte";

describe("Masonry (server)", () => {
  it("renders the items in source order, not yet placed", () => {
    const { document } = renderSSR(Masonry);
    const root = document.querySelector(".bx--masonry");

    expect(root).not.toHaveClass("bx--masonry--placed");
    expect([...(root?.children ?? [])].map((item) => item.textContent)).toEqual(
      ["Item 0", "Item 1", "Item 2"],
    );
    // The script sets each item's column after mount.
    expect(root?.querySelector("[style]")).toBeNull();
  });

  it("marks the items hidden until placed when asked", () => {
    const { document } = renderSSR(Masonry, { hideUntilPlaced: true });

    expect(document.querySelector(".bx--masonry")).toHaveClass(
      "bx--masonry--hide-until-placed",
    );
  });
});
