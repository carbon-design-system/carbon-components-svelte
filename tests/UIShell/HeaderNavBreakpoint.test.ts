import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import HeaderNavBreakpoint from "./HeaderNavBreakpoint.test.svelte";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("HeaderNav expansion breakpoint", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it.each([
    { width: 1200, breakpoint: 1400, modifier: "collapsed" },
    { width: 1500, breakpoint: 1400, modifier: "expanded" },
    { width: 1200, breakpoint: undefined, modifier: undefined },
  ])(
    "at $width with breakpoint $breakpoint applies $modifier",
    async ({ width, breakpoint, modifier }) => {
      setViewportWidth(width);
      render(HeaderNavBreakpoint, {
        props: { expansionBreakpoint: breakpoint },
      });
      await tick();

      const headerNav = screen.getByRole("navigation", {
        name: "Header links",
      });
      const sideNavItems = document.querySelector(
        "ul.bx--side-nav__header-navigation",
      );
      expect(sideNavItems).not.toBeNull();

      for (const [el, base] of [
        [headerNav, "bx--header__nav"],
        [sideNavItems, "bx--side-nav__header-navigation"],
      ] as const) {
        expect(el).toHaveClass(base);
        for (const name of ["expanded", "collapsed"]) {
          if (name === modifier) {
            expect(el).toHaveClass(`${base}--${name}`);
          } else {
            expect(el).not.toHaveClass(`${base}--${name}`);
          }
        }
      }
    },
  );

  it("renders HeaderNav without a Header and adds no modifier", () => {
    render(HeaderNavBreakpoint, { props: { standalone: true } });

    const nav = screen.getByRole("navigation", { name: "Standalone" });
    expect(nav).toHaveClass("bx--header__nav");
    expect(nav).not.toHaveClass("bx--header__nav--expanded");
    expect(nav).not.toHaveClass("bx--header__nav--collapsed");
  });
});
