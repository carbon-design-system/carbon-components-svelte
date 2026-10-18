import { render, screen } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { tick } from "svelte";
import { TYPEAHEAD_RESET_MS } from "../../src/constants/timing.js";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import HeaderNavBreakpoint from "./HeaderNavBreakpoint.test.svelte";
import Fixture from "./HeaderNavMenubar.test.svelte";

const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNav keyboard navigation", () => {
  const items = [
    { text: "Link 1" },
    { text: "Link 2" },
    {
      text: "Menu",
      items: [
        { text: "Menu Item 1" },
        { text: "Menu Item 2" },
        { text: "Menu Item 3" },
      ],
    },
  ];

  describe("HeaderNavMenu", () => {
    it.each([
      { key: "{ArrowDown}", focused: "Menu Item 1" },
      { key: "{ArrowUp}", focused: "Menu Item 3" },
    ])(
      "should open menu and focus $focused when $key is pressed",
      async ({ key, focused }) => {
        render(Fixture, { props: { items } });

        const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
        menuTrigger.focus();

        await user.keyboard(key);
        expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByRole("menuitem", { name: focused })).toHaveFocus();
      },
    );

    it("opens the menu and focuses the first item when Enter is pressed", async () => {
      render(Fixture, { props: { items } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard("{Enter}");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("menuitem", { name: "Menu Item 1" }),
      ).toHaveFocus();
    });

    it("should toggle menu when Space is pressed on trigger", async () => {
      render(Fixture, { props: { items } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard(" ");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      menuTrigger.focus();
      await user.keyboard(" ");
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("HeaderNavItem within menu", () => {
    it("should wrap to last item when Up Arrow is pressed on first item", async () => {
      render(Fixture, { props: { items } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      menuTrigger.focus();

      await user.keyboard("{ArrowDown}");

      const firstItem = screen.getByRole("menuitem", { name: "Menu Item 1" });
      expect(firstItem).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      const lastItem = screen.getByRole("menuitem", { name: "Menu Item 3" });
      expect(lastItem).toHaveFocus();
    });
  });
});

describe("HeaderNav menubar", () => {
  const link1 = () => screen.getByRole("menuitem", { name: "Link 1" });
  const link2 = () => screen.getByRole("menuitem", { name: "Link 2" });
  const trigger = () => screen.getByRole("menuitem", { name: "Menu" });

  describe("roving tabindex", () => {
    it("makes the first item the only Tab stop by default", async () => {
      render(Fixture);
      await tick(); // let registrations flush

      expect(link1()).toHaveAttribute("tabindex", "0");
      expect(trigger()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "-1");
    });

    it("prefers the current page item", async () => {
      render(Fixture, { props: { current: "Link 2" } });
      await tick();

      expect(link1()).toHaveAttribute("tabindex", "-1");
      expect(trigger()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "0");
    });

    it("moves the Tab stop when the current page changes after mount", async () => {
      const { rerender } = render(Fixture, { props: { current: "Link 1" } });
      await tick();

      await rerender({ current: "Link 2" });

      expect(link1()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "0");
    });

    it("moves the Tab stop with focus", async () => {
      render(Fixture);

      link1().focus();
      await user.keyboard("{ArrowRight}");

      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute("tabindex", "0");
      expect(link1()).toHaveAttribute("tabindex", "-1");
    });

    it("falls back to the first item when the focused item is removed", async () => {
      const entries = [{ text: "Link 1" }, { text: "Link 2" }];
      const { rerender } = render(Fixture, { props: { items: entries } });
      await tick();

      link2().focus();
      await tick();
      expect(link2()).toHaveAttribute("tabindex", "0");

      await rerender({ items: [entries[0]] });
      await tick(); // the unmount updates the bar's store after the render
      expect(link1()).toHaveAttribute("tabindex", "0");
    });

    it("leaves items outside a HeaderNav tabbable", () => {
      render(Fixture, { props: { after: "item" } });

      expect(
        screen.getByRole("menuitem", { name: "Standalone" }),
      ).toHaveAttribute("tabindex", "0");
    });

    it("keeps submenu items tabbable", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(item("Menu Item 1")).toHaveAttribute("tabindex", "0");
      expect(item("Menu Item 2")).toHaveAttribute("tabindex", "0");
    });
  });

  describe("arrow keys", () => {
    it("moves between top-level items and wraps", async () => {
      render(Fixture);

      link1().focus();
      await user.keyboard("{ArrowRight}");
      expect(trigger()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(link1()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(trigger()).toHaveFocus();
    });

    it("follows DOM order for an item added after mount", async () => {
      const entries = [{ text: "Link 1" }, { text: "Link 2" }];
      const { rerender } = render(Fixture, { props: { items: entries } });

      await rerender({
        items: [entries[0], { text: "Added" }, entries[1]],
      });

      link1().focus();
      await user.keyboard("{ArrowRight}");
      expect(item("Added")).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
    });

    it("jumps to the first and last item with Home and End", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{End}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{Home}");
      expect(link1()).toHaveFocus();
    });

    it("closes an open menu when leaving its trigger", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { onClose } });

      trigger().focus();
      await user.keyboard("{Enter}");
      expect(trigger()).toHaveAttribute("aria-expanded", "true");

      trigger().focus();
      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes the submenu and moves on from inside it", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { onClose } });

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(item("Menu Item 1")).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);

      trigger().focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(item("Menu Item 2")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(link1()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("keeps Home and End inside an open submenu", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{ArrowDown}{End}");
      expect(item("Menu Item 2")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(item("Menu Item 1")).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});

describe("HeaderNav menubar opening adjacent menus", () => {
  const items = [
    { text: "Link 1" },
    { text: "Menu A", items: [{ text: "A1" }, { text: "A2" }] },
    { text: "Menu B", items: [{ text: "B1" }, { text: "B2" }] },
    { text: "Link 2" },
  ];

  it("opens the next menu from inside an open one with ArrowRight", async () => {
    const onClose = vi.fn();
    render(Fixture, { props: { items, onClose } });

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(item("A2")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(item("B1")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "true");
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("Menu A", "blur");
    // The Tab stop follows the new menu.
    expect(item("Menu B")).toHaveAttribute("tabindex", "0");
    expect(item("Menu A")).toHaveAttribute("tabindex", "-1");
  });

  it("opens the previous menu with ArrowLeft", async () => {
    render(Fixture, { props: { items } });

    item("Menu B").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("B1")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(item("A1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "true");
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the next menu from an open menu's trigger", async () => {
    render(Fixture, { props: { items } });

    item("Menu A").focus();
    await user.keyboard("{Enter}");
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "true");

    item("Menu A").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("B1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
  });

  it("only focuses a plain item", async () => {
    render(Fixture, { props: { items } });

    item("Menu B").focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(item("Link 2")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowLeft}");
    expect(item("Link 1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not open the next menu from a closed trigger", async () => {
    render(Fixture, { props: { items } });

    item("Menu A").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("Menu B")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the opened menu with Escape and returns to its trigger", async () => {
    const onClose = vi.fn();
    render(Fixture, { props: { items, onClose } });

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowRight}{Escape}");
    expect(item("Menu B")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenLastCalledWith("Menu B", "escape-key");
  });
});

describe("HeaderNav typeahead", () => {
  const items = [
    { text: "Home" },
    {
      text: "Tools",
      items: [{ text: "Alpha" }, { text: "Beta" }, { text: "Bravo" }],
    },
    { text: "Docs" },
  ];

  // Fake timers stand in for the idle wait; user-event needs to advance them.
  const typeaheadUser = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime,
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("focuses the next top-level item starting with the typed letter", async () => {
    render(Fixture, { props: { items } });

    item("Home").focus();
    await typeaheadUser.keyboard("t");
    expect(item("Tools")).toHaveFocus();
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS);
    await typeaheadUser.keyboard("d");
    expect(item("Docs")).toHaveFocus();
  });

  it("focuses the next menu item starting with the typed letter", async () => {
    render(Fixture, { props: { items } });

    item("Tools").focus();
    await typeaheadUser.keyboard("{ArrowDown}");
    expect(item("Alpha")).toHaveFocus();

    await typeaheadUser.keyboard("b");
    expect(item("Beta")).toHaveFocus();
    // Typing after the reset window starts a new query.
    vi.advanceTimersByTime(TYPEAHEAD_RESET_MS);
    await typeaheadUser.keyboard("b");
    expect(item("Bravo")).toHaveFocus();
    expect(item("Tools")).toHaveAttribute("aria-expanded", "true");
  });

  it("matches multiple typed letters", async () => {
    render(Fixture, { props: { items } });

    item("Tools").focus();
    await typeaheadUser.keyboard("{ArrowDown}");
    await typeaheadUser.keyboard("br");
    expect(item("Bravo")).toHaveFocus();
  });
});

describe("HeaderNav expansion breakpoint", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  const navs = () => {
    const sideNavItems = document.querySelector(
      "ul.bx--side-nav__header-navigation",
    );
    expect(sideNavItems).not.toBeNull();
    return [
      [
        screen.getByRole("navigation", { name: "Header links" }),
        "bx--header__nav",
      ],
      [sideNavItems, "bx--side-nav__header-navigation"],
    ] as const;
  };

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

      for (const [el, base] of navs()) {
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

  it("switches modifiers when the viewport crosses the breakpoint after mount", async () => {
    setViewportWidth(1200);
    render(HeaderNavBreakpoint, { props: { expansionBreakpoint: 1400 } });
    await tick();
    for (const [el, base] of navs()) {
      expect(el).toHaveClass(`${base}--collapsed`);
    }

    setViewportWidth(1500);
    await tick();
    for (const [el, base] of navs()) {
      expect(el).toHaveClass(`${base}--expanded`);
      expect(el).not.toHaveClass(`${base}--collapsed`);
    }
  });

  it("renders HeaderNav without a Header and adds no modifier", () => {
    render(HeaderNavBreakpoint, { props: { standalone: true } });

    const nav = screen.getByRole("navigation", { name: "Standalone" });
    expect(nav).toHaveClass("bx--header__nav");
    expect(nav).not.toHaveClass("bx--header__nav--expanded");
    expect(nav).not.toHaveClass("bx--header__nav--collapsed");
  });
});
