import {
  createEvent,
  fireEvent,
  render,
  screen,
} from "@testing-library/svelte";
import type HeaderActionLinkComponent from "carbon-components-svelte/UIShell/HeaderActionLink.svelte";
import type HeaderGlobalActionComponent from "carbon-components-svelte/UIShell/HeaderGlobalAction.svelte";
import type SideNavLinkComponent from "carbon-components-svelte/UIShell/SideNavLink.svelte";
import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
import type SideNavMenuComponent from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
import type { ComponentProps } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import HeaderActionPanelLinks from "./HeaderActionPanelLinks.test.svelte";
import UiShell from "./UIShell.test.svelte";

describe("UIShell", () => {
  afterEach(() => {
    setViewportWidth(1024);
    document.body.classList.remove("bx--body--with-modal-open");
  });

  describe("HeaderNav", () => {
    // Regression: aria-label belongs on the <nav> landmark only, not on the
    // inner <ul role="menubar"> (avoids screen readers announcing the label
    // twice).
    it("should not duplicate aria-label onto the menubar", () => {
      render(UiShell);

      const nav = screen.getByRole("navigation", { name: "Navigation" });
      expect(nav).toHaveAttribute("aria-label", "Navigation");

      const menubar = screen.getByRole("menubar");
      expect(menubar).not.toHaveAttribute("aria-label");
      expect(menubar).not.toHaveAttribute("aria-labelledby");
    });
  });

  describe("Header panels", () => {
    // A bare <hr> cannot be a direct child of <ul>.
    it("wraps a contentless HeaderPanelDivider's hr in an li", async () => {
      const { container } = render(HeaderActionPanelLinks);

      const trigger = container.querySelector(
        "button.bx--header__action:not(.bx--header__menu-toggle)",
      );
      assert(trigger);
      await user.click(trigger);

      const hr = container.querySelector("hr.bx--switcher__item--divider");
      assert(hr);
      expect(hr.parentElement?.tagName).toBe("LI");
    });
  });

  describe("SideNav", () => {
    // Regression test for initial event dispatch in Svelte 5
    // https://github.com/carbon-design-system/carbon-components-svelte/issues/2533
    it.each([false, true])(
      "does not fire open/close event on initial render when isOpen is %s",
      (sideNavIsOpen) => {
        const onSideNavOpen = vi.fn();
        const onSideNavClose = vi.fn();
        render(UiShell, {
          props: { sideNavIsOpen, onSideNavOpen, onSideNavClose },
        });

        expect(onSideNavOpen).not.toHaveBeenCalled();
        expect(onSideNavClose).not.toHaveBeenCalled();
      },
    );

    it("should apply classic UI Shell class when theme is classic", () => {
      const { container } = render(UiShell, {
        props: { sideNavTheme: "classic" },
      });

      expect(container.querySelector(".bx--side-nav")).toHaveClass(
        "bx--side-nav--ui-shell-classic",
      );
    });

    describe("Escape key", () => {
      function sideNavLink(container: HTMLElement) {
        const link =
          container.querySelector<HTMLAnchorElement>(".bx--side-nav a");
        assert(link);
        return link;
      }

      it("closes the overlay side nav and refocuses the hamburger trigger", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });
        await flushMacrotask();

        const hamburgerButton = screen.getByRole("button", { name: /menu/i });

        await user.keyboard("{Escape}");

        expect(component.sideNavIsOpen).toBe(false);
        expect(hamburgerButton).toHaveFocus();
      });

      it.each([
        ["mobile", 500, {}],
        ["mobile rail", 500, { sideNavRail: true }],
        ["desktop", 1200, { persistentHamburgerMenu: true }],
      ])(
        "closes a %s side nav from inside and refocuses the hamburger",
        async (_, width, props) => {
          setViewportWidth(width);

          const { component, container } = render(UiShell, {
            props: { sideNavIsOpen: true, ...props },
          });
          await flushMacrotask();
          sideNavLink(container).focus();

          await user.keyboard("{Escape}");

          expect(component.sideNavIsOpen).toBe(false);
          expect(screen.getByRole("button", { name: /menu/i })).toHaveFocus();
        },
      );

      it.each([
        ["fixed", 500, { sideNavFixed: true }],
        ["desktop side nav with no hamburger", 1200, {}],
        [
          "desktop rail",
          1200,
          { sideNavRail: true, persistentHamburgerMenu: true },
        ],
        [
          "desktop fixed",
          1200,
          { sideNavFixed: true, persistentHamburgerMenu: true },
        ],
      ])("does not close a %s side nav", async (_, width, props) => {
        setViewportWidth(width);

        const { component, container } = render(UiShell, {
          props: { sideNavIsOpen: true, ...props },
        });
        await flushMacrotask();
        sideNavLink(container).focus();

        await user.keyboard("{Escape}");

        expect(component.sideNavIsOpen).toBe(true);
      });

      it.each([
        ["the hamburger", true],
        ["the page", false],
      ])(
        "on desktop, Escape from %s closes the side nav: %s",
        async (origin, closes) => {
          setViewportWidth(1200);

          const { component } = render(UiShell, {
            props: { sideNavIsOpen: true, persistentHamburgerMenu: true },
          });
          await flushMacrotask();
          if (origin === "the hamburger") {
            screen.getByRole("button", { name: /menu/i }).focus();
          }

          await user.keyboard("{Escape}");

          expect(component.sideNavIsOpen).toBe(!closes);
        },
      );

      it.each([
        ["isComposing", { isComposing: true }],
        ["keyCode 229", { keyCode: 229 }],
        ["defaultPrevented", {}],
      ])("ignores an Escape with %s", async (name, init) => {
        setViewportWidth(500);

        const { component, container } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });
        await flushMacrotask();
        const link = sideNavLink(container);
        const event = createEvent.keyDown(link, { key: "Escape", ...init });
        if (name === "defaultPrevented") event.preventDefault();

        await fireEvent(link, event);

        expect(component.sideNavIsOpen).toBe(true);
      });
    });

    describe("body scroll lock", () => {
      it("should add scroll lock class when open on mobile viewport", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");

        component.sideNavIsOpen = true;
        await flushMacrotask();

        expect(document.body).toHaveClass("bx--body--with-modal-open");
      });

      it("should remove scroll lock class when closed on mobile viewport", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });

        expect(document.body).toHaveClass("bx--body--with-modal-open");

        component.sideNavIsOpen = false;
        await flushMacrotask();

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });

      it("should not add scroll lock class on desktop viewport", async () => {
        setViewportWidth(1200); // Desktop viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        component.sideNavIsOpen = true;
        await flushMacrotask();

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });

      it.each([
        ["fixed", { sideNavFixed: true }],
        ["rail", { sideNavRail: true }],
      ])(
        "should not add scroll lock class for %s variant",
        async (_, variantProps) => {
          setViewportWidth(500); // Mobile viewport

          render(UiShell, {
            props: { sideNavIsOpen: true, ...variantProps },
          });

          await flushMacrotask();

          expect(document.body).not.toHaveClass("bx--body--with-modal-open");
        },
      );
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2701
    it("should not render hamburger menu when SideNav is fixed", () => {
      const { container } = render(UiShell, {
        props: { sideNavFixed: true },
      });

      const hamburgerButton = container.querySelector(
        ".bx--header__menu-trigger",
      );
      expect(hamburgerButton).not.toBeInTheDocument();
    });

    it("should render fixed variant", () => {
      const { container } = render(UiShell, {
        props: { sideNavFixed: true },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).not.toBeInTheDocument();

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--fixed");
    });

    it("should render rail variant", () => {
      const { container } = render(UiShell, {
        props: { sideNavRail: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--rail");
      // A collapsed rail is still visible and focusable, so it must stay in
      // the accessibility tree.
      expect(nav).not.toHaveAttribute("aria-hidden");
      expect(nav).not.toHaveStyle({ visibility: "hidden" });
    });

    it("should handle isOpen state", () => {
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--expanded");
      expect(nav).toHaveAttribute("aria-hidden", "false");
      expect(nav).not.toHaveStyle({ visibility: "hidden" });
    });

    it("should dispatch open event", async () => {
      const onSideNavOpen = vi.fn();
      const { component } = render(UiShell, { props: { onSideNavOpen } });

      component.sideNavIsOpen = true;
      await flushMacrotask();

      expect(onSideNavOpen).toHaveBeenCalledTimes(1);
    });

    it("should dispatch close event", async () => {
      const onSideNavClose = vi.fn();
      const { component } = render(UiShell, {
        props: { sideNavIsOpen: true, onSideNavClose },
      });

      component.sideNavIsOpen = false;
      await flushMacrotask();

      expect(onSideNavClose).toHaveBeenCalledTimes(1);
    });

    it("should handle overlay click", async () => {
      const onSideNavOverlayClick = vi.fn();
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: true, onSideNavOverlayClick },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).toBeInTheDocument();
      assert(overlay);

      await user.click(overlay);

      expect(onSideNavOverlayClick).toHaveBeenCalledTimes(1);
    });

    describe("custom expansion breakpoint (HeaderNavCustomBreakpoint-style)", () => {
      it("with expansionBreakpoint Infinity, overlay has --mobile and -active when open at desktop width", async () => {
        setViewportWidth(1200);

        const { container } = render(UiShell, {
          props: {
            expansionBreakpoint: Number.POSITIVE_INFINITY,
            isSideNavOpen: true,
            sideNavIsOpen: true,
          },
        });

        await flushMacrotask();

        const overlay = container.querySelector(".bx--side-nav__overlay");
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass("bx--side-nav__overlay--mobile");
        expect(overlay).toHaveClass("bx--side-nav__overlay-active");
      });

      it("with expansionBreakpoint Infinity, clicking overlay at desktop width closes side nav", async () => {
        setViewportWidth(1200);
        const onSideNavOverlayClick = vi.fn();

        const { container, component } = render(UiShell, {
          props: {
            expansionBreakpoint: Number.POSITIVE_INFINITY,
            isSideNavOpen: true,
            sideNavIsOpen: true,
            onSideNavOverlayClick,
          },
        });

        await flushMacrotask();

        const overlay = container.querySelector(".bx--side-nav__overlay");
        assert(overlay);
        await user.click(overlay);

        expect(component.sideNavIsOpen).toBe(false);
        expect(onSideNavOverlayClick).toHaveBeenCalledTimes(1);
      });
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/604
    it("should prevent focus on links when closed (not rail mode)", () => {
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: false },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveAttribute("aria-hidden", "true");
      expect(nav).toHaveStyle({ visibility: "hidden" });
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/1383
    describe("pre-hydration flicker prevention", () => {
      it("should apply collapsed state after viewport width becomes known", async () => {
        setViewportWidth(undefined as unknown as number);

        const { container } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        const nav = container.querySelector(".bx--side-nav");
        expect(nav).not.toHaveClass("bx--side-nav--collapsed");
        expect(nav).not.toHaveStyle({ visibility: "hidden" });

        // Simulate hydration: viewport width becomes known.
        setViewportWidth(500);
        await flushMacrotask();

        expect(nav).toHaveClass("bx--side-nav--collapsed");
        expect(nav).toHaveStyle({ visibility: "hidden" });
      });
    });
  });

  describe("Content", () => {
    describe("mobile margin behavior", () => {
      it.each([
        {
          name: "is unset on a mobile viewport",
          width: 500,
          props: { sideNavIsOpen: true },
          marginInlineStart: "0px",
        },
        {
          name: "is not forced on desktop when SideNav is open",
          width: 1200,
          props: { sideNavIsOpen: true },
          // CSS handles the margin via `.bx--side-nav ~ .bx--content`.
          marginInlineStart: "",
        },
        {
          name: "is not unset on mobile when SideNav is fixed",
          width: 500,
          props: { sideNavIsOpen: true, sideNavFixed: true },
          // Regression: https://github.com/carbon-design-system/carbon-components-svelte/issues/2701
          // A fixed SideNav is always visible, so Content keeps its CSS margin.
          marginInlineStart: "",
        },
        {
          name: "is not set for a rail on desktop",
          width: 1200,
          props: { sideNavRail: true, sideNavIsOpen: false },
          marginInlineStart: "",
        },
        {
          name: "is unset when SideNav is collapsed on desktop",
          width: 1200,
          props: { sideNavIsOpen: false },
          marginInlineStart: "0px",
        },
      ])(
        "inline-start margin $name",
        async ({ width, props, marginInlineStart }) => {
          setViewportWidth(width);

          const { container } = render(UiShell, { props });

          await flushMacrotask();

          expectInlineStyle(container.querySelector(".bx--content"), {
            marginInlineStart,
          });
        },
      );

      it("should keep the rail margin on mobile when SideNav is an expanded rail", async () => {
        setViewportWidth(500);

        const { container } = render(UiShell, {
          props: { sideNavRail: true, sideNavIsOpen: true },
        });

        await flushMacrotask();

        // The expanded rail overlays content instead of pushing it 16rem.
        expect(container.querySelector(".bx--side-nav")).toHaveClass(
          "bx--side-nav--expanded",
        );
        expectInlineStyle(container.querySelector(".bx--content"), {
          marginInlineStart: "3rem",
        });
      });
    });
  });

  describe("Generics", () => {
    describe("HeaderActionLink", () => {
      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = HeaderActionLinkComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = HeaderActionLinkComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      });
    });

    describe("HeaderGlobalAction", () => {
      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = HeaderGlobalActionComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["icon"]>().toExtend<CustomIcon | undefined>();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = HeaderGlobalActionComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      });
    });

    describe("SideNavLink", () => {
      it("should apply the large class when large is true", () => {
        const { container } = render(SideNavLink, {
          props: { href: "#", text: "Link", large: true },
        });

        expect(container.querySelector(".bx--side-nav__item")).toHaveClass(
          "bx--side-nav__item--large",
        );
      });

      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = SideNavLinkComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = SideNavLinkComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      });
    });

    describe("SideNavMenu", () => {
      it("should apply the large class when large is true", () => {
        const { container } = render(SideNavMenu, {
          props: { text: "Menu", large: true },
        });

        expect(container.querySelector(".bx--side-nav__item")).toHaveClass(
          "bx--side-nav__item--large",
        );
      });

      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = SideNavMenuComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = SideNavMenuComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
      });
    });
  });
});
