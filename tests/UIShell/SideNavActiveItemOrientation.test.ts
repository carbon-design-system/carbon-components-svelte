import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import type * as ScrollModule from "../../src/utils/scroll-into-view-within.js";
import SideNavActiveItemOrientationTest from "./SideNavActiveItemOrientation.test.svelte";

const scrollCalls: unknown[][] = [];

// Wrap (not replace) the real helper so only the call arguments are recorded.
vi.mock(
  "../../src/utils/scroll-into-view-within.js",
  async (importOriginal) => {
    const mod = await importOriginal<typeof ScrollModule>();
    return {
      ...mod,
      scrollIntoViewWithin: (
        ...args: Parameters<typeof mod.scrollIntoViewWithin>
      ) => {
        scrollCalls.push(args);
        return mod.scrollIntoViewWithin(...args);
      },
    };
  },
);

describe("SideNav active item orientation", () => {
  beforeEach(() => {
    scrollCalls.length = 0;
  });

  it("self-expands a SideNavMenu containing the active item", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "shallow" },
    });
    await tick();

    expect(screen.getByTestId("menu-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("menu-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("expands every ancestor SideNavMenu of a nested active item", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "nested" },
    });
    await tick();

    expect(screen.getByTestId("menu-2")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByTestId("nested-menu")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  // Element.scrollIntoView moves Chromium's sequential focus starting point,
  // so the first Tab would skip the skip link. The nav scrolls its own list
  // instead (alignment is covered by e2e/side-nav-active-item-scroll.test.ts).
  it("scrolls the active item within the nav list on mount", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "nested", activeItemScrollBlock: "center" },
    });
    await tick();
    await tick();

    const scrollIntoView = Element.prototype
      .scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollCalls).toEqual([
      [screen.getByTestId("nested-item"), ".bx--side-nav__items", "center"],
    ]);
  });
});
