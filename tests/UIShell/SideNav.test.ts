import { render, screen } from "@testing-library/svelte";
import axe from "axe-core";
import { tick } from "svelte";
import { get } from "svelte/store";
import SideNav from "../../src/UIShell/SideNav.svelte";
import {
  hamburgerMenuRef,
  isSideNavMobile,
  shouldRenderHamburgerMenu,
  sideNavWidth,
} from "../../src/UIShell/nav-store.js";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import SideNavDividerTest from "./SideNavDivider.test.svelte";
import SideNavMobileFocusTrapTest from "./SideNavMobileFocusTrap.test.svelte";
import SideNavUnmountTest from "./SideNavUnmount.test.svelte";
import UiShell from "./UIShell.test.svelte";

describe("SideNav mobile focus trap", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it.each([
    { start: "Third", keys: "{Tab}", end: "First" },
    { start: "First", keys: "{Shift>}{Tab}{/Shift}", end: "Third" },
  ])(
    "wraps $keys from $start to $end when open on mobile",
    async ({ start, keys, end }) => {
      setViewportWidth(320);

      render(SideNavMobileFocusTrapTest, { props: { isOpen: true } });
      await tick();

      const from = screen.getByRole("link", { name: start });
      const to = screen.getByRole("link", { name: end });

      from.focus();
      expect(from).toHaveFocus();

      await user.keyboard(keys);

      expect(to).toHaveFocus();
    },
  );

  it.each([
    { width: 320, fixed: true },
    { width: 1280, fixed: false },
  ])(
    "does not trap focus at width $width with fixed $fixed",
    async ({ width, fixed }) => {
      setViewportWidth(width);

      render(SideNavMobileFocusTrapTest, { props: { isOpen: true, fixed } });
      await tick();

      const first = screen.getByRole("link", { name: "First" });
      const last = screen.getByRole("link", { name: "Third" });

      last.focus();
      expect(last).toHaveFocus();

      await user.keyboard("{Tab}");

      expect(first).not.toHaveFocus();
    },
  );
});

describe("SideNav unmount", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it("resets the shared hamburger, mobile and width state", async () => {
    setViewportWidth(320);
    const { component } = render(SideNavUnmountTest, {
      props: { resizable: true },
    });
    await tick();
    expect(get(shouldRenderHamburgerMenu)).toBe(true);
    expect(get(isSideNavMobile)).toBe(true);
    expect(get(sideNavWidth)).toBe(256);

    component.showSideNav = false;
    await flushMacrotask();

    expect(get(shouldRenderHamburgerMenu)).toBe(false);
    expect(get(isSideNavMobile)).toBe(false);
    expect(get(sideNavWidth)).toBeUndefined();
  });

  it("releases the body scroll lock", async () => {
    setViewportWidth(320);
    const { component } = render(SideNavUnmountTest, {
      props: { isOpen: true },
    });
    await tick();
    expect(document.body).toHaveClass("bx--body--with-modal-open");

    component.showSideNav = false;
    await flushMacrotask();

    expect(document.body).not.toHaveClass("bx--body--with-modal-open");
  });

  it("keeps a newer hamburger ref when an older one unmounts", async () => {
    const { component } = render(SideNavUnmountTest, {
      props: {
        showSideNav: false,
        showOldHamburger: true,
        showNewHamburger: true,
      },
    });
    await tick();
    const newer = screen.getByRole("button", { name: "New menu" });
    expect(get(hamburgerMenuRef)).toBe(newer);

    component.showOldHamburger = false;
    await tick();

    expect(get(hamburgerMenuRef)).toBe(newer);
  });
});

describe("SideNav overlay click", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it("closes the mobile side nav and leaves the hamburger unfocused", async () => {
    setViewportWidth(500);
    const { component, container } = render(UiShell, {
      props: { sideNavIsOpen: true },
    });
    await flushMacrotask();

    const hamburger = screen.getByRole("button", { name: /menu/i });
    const overlay = container.querySelector(".bx--side-nav__overlay");
    assert(overlay instanceof HTMLElement);
    await user.click(overlay);

    expect(component.sideNavIsOpen).toBe(false);
    expect(hamburger).not.toHaveFocus();
  });
});

describe("SideNav rail hover delay", () => {
  // jsdom doesn't run CSS transitions; `e2e/side-nav-rail.test.ts` checks the
  // delays in a real browser.
  const ENTER = "--ccs-side-nav-rail-enter-delay";
  const LEAVE = "--ccs-side-nav-rail-leave-delay";

  function getNav(container: HTMLElement) {
    return container.querySelector(".bx--side-nav") as HTMLElement;
  }

  it("sets the default delays on a rail", () => {
    const { container } = render(SideNav, { props: { rail: true } });
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("100ms");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("0ms");
  });

  it("sets custom delays", () => {
    const { container } = render(SideNav, {
      props: { rail: true, enterDelayMs: 300, leaveDelayMs: 200 },
    });
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("300ms");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("200ms");
  });

  it("omits the delays without rail", () => {
    const { container } = render(SideNav, {
      props: { rail: false },
    });
    const nav = getNav(container);
    expect(nav.style.getPropertyValue(ENTER)).toBe("");
    expect(nav.style.getPropertyValue(LEAVE)).toBe("");
  });
});

describe("SideNav border prop", () => {
  it("applies the border class when border is true", () => {
    const { container } = render(SideNav, { props: { border: true } });
    expect(container.querySelector(".bx--side-nav")).toHaveClass(
      "bx--side-nav--border",
    );
  });
});

describe("SideNavDivider", () => {
  it("renders the separator inside a plain list item", () => {
    render(SideNavDividerTest);
    const divider = screen.getByTestId("divider");
    expect(divider.tagName).toBe("LI");
    expect(divider).not.toHaveAttribute("role");
    expect(divider).toHaveClass("bx--side-nav__divider");
    expect(divider.querySelector("hr")).toBe(screen.getByRole("separator"));
  });

  it("keeps the side nav list valid for axe", async () => {
    const { container } = render(SideNavDividerTest);
    const results = await axe.run(container, {
      runOnly: ["list", "listitem"],
    });
    expect(results.violations).toEqual([]);
  });
});
