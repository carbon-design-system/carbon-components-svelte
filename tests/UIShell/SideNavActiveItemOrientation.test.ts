import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import SideNavActiveItemOrientationTest from "./SideNavActiveItemOrientation.test.svelte";

describe("SideNav active item orientation", () => {
  it("self-expands a SideNavMenu containing the active item", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "shallow" },
    });
    await tick();

    expect(screen.getByTestId("menu-1")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("leaves a SideNavMenu with no active descendant collapsed", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "none" },
    });
    await tick();

    expect(screen.getByTestId("menu-1")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByTestId("menu-2")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByTestId("nested-menu")).toHaveAttribute(
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
  it("does not call Element.scrollIntoView on mount", async () => {
    render(SideNavActiveItemOrientationTest, {
      props: { activeItem: "nested", activeItemScrollBlock: "center" },
    });
    await tick();
    await tick();

    const scrollIntoView = Element.prototype
      .scrollIntoView as unknown as ReturnType<typeof vi.fn>;
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
