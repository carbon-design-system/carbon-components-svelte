import { render, screen } from "@testing-library/svelte";
import type HamburgerMenuComponent from "carbon-components-svelte/UIShell/HamburgerMenu.svelte";
import type HeaderComponent from "carbon-components-svelte/UIShell/Header.svelte";
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

  describe("Header", () => {
    it("should apply classic UI Shell class when theme is classic", () => {
      render(UiShell, { props: { headerTheme: "classic" } });

      expect(screen.getByRole("banner")).toHaveClass(
        "bx--header--ui-shell-classic",
      );
    });

    it("should render with company name", () => {
      render(UiShell, { props: { companyName: "IBM" } });

      expect(screen.getByText(/IBM/)).toBeInTheDocument();
    });

    it("should render with platform name", () => {
      render(UiShell, { props: { platformName: "Platform" } });

      expect(screen.getByText("Platform")).toBeInTheDocument();
    });

    // Regression: ?? for aria-label chain so empty string is used (not fallback)
    it("uses empty aria-label when passed (nullish coalescing)", () => {
      render(UiShell, {
        props: { platformName: "Platform", ariaLabel: "" },
      });
      const header = screen.getByRole("banner");
      expect(header).toHaveAttribute("aria-label", "");
    });

    it("should render with href", () => {
      render(UiShell, {
        props: { headerHref: "/home", platformName: "Platform" },
      });

      const link = screen.getByText("Platform").closest("a");
      expect(link).toHaveAttribute("href", "/home");
    });

    it("should render company and platform slots", () => {
      render(UiShell, { props: { useSlots: true } });

      expect(screen.getByText("Custom Company")).toBeInTheDocument();
      expect(screen.getByText("Custom Platform")).toBeInTheDocument();
    });

    it("should handle click events", async () => {
      const onHeaderClick = vi.fn();
      render(UiShell, {
        props: { headerHref: "#", platformName: "Platform", onHeaderClick },
      });

      const link = screen.getByText("Platform").closest("a");
      assert(link);
      await user.click(link);

      expect(onHeaderClick).toHaveBeenCalledTimes(1);
    });

    it("should bind ref to anchor element", () => {
      const { component } = render(UiShell, {
        props: { headerHref: "#", platformName: "Platform" },
      });

      expect(component.headerRef).toBeInstanceOf(HTMLAnchorElement);
    });

    it("should apply custom ariaLabelMenu to hamburger menu when persistentHamburgerMenu is true", () => {
      const { container } = render(UiShell, {
        props: {
          persistentHamburgerMenu: true,
          ariaLabelMenu: "Toggle menu",
        },
      });

      const hamburgerButton = container.querySelector(
        ".bx--header__menu-trigger",
      );
      expect(hamburgerButton).toHaveAttribute("aria-label", "Toggle menu");
      expect(hamburgerButton).toHaveAttribute("title", "Toggle menu");
    });

    it("should update label when hamburger menu is clicked", async () => {
      const { container } = render(UiShell, {
        props: {
          persistentHamburgerMenu: true,
          isSideNavOpen: false,
        },
      });

      const hamburgerButton = container.querySelector(
        ".bx--header__menu-trigger",
      );
      expect(hamburgerButton).toHaveAttribute("aria-label", "Open menu");

      assert(hamburgerButton);
      await user.click(hamburgerButton);

      expect(hamburgerButton).toHaveAttribute("aria-label", "Close menu");
      expect(hamburgerButton).toHaveAttribute("title", "Close menu");
    });

    it("should toggle aria-expanded on the hamburger menu button", async () => {
      const { container } = render(UiShell, {
        props: {
          persistentHamburgerMenu: true,
          isSideNavOpen: false,
        },
      });

      const hamburgerButton = container.querySelector(
        ".bx--header__menu-trigger",
      );
      assert(hamburgerButton);
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");

      await user.click(hamburgerButton);
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "true");

      await user.click(hamburgerButton);
      expect(hamburgerButton).toHaveAttribute("aria-expanded", "false");
    });

    describe("user interaction preservation", () => {
      it("should preserve user-opened state after minor width changes on mobile", async () => {
        setViewportWidth(500); // Mobile viewport

        const { container, component } = render(UiShell, {
          props: {
            persistentHamburgerMenu: true,
            isSideNavOpen: false,
          },
        });

        const hamburgerButton = container.querySelector(
          ".bx--header__menu-trigger",
        );
        assert(hamburgerButton);
        await user.click(hamburgerButton);

        expect(component.isSideNavOpen).toBe(true);

        // Simulate minor width change (like mobile address bar hide/show)
        setViewportWidth(520);
        await flushMacrotask();

        expect(component.isSideNavOpen).toBe(true);
      });

      it("preserves a user-toggled state across the next breakpoint crossing", async () => {
        // Regression: `userExplicitlySet` was set on hamburger click but never
        // gated the auto-write, so a viewport resize clobbered the user's choice.
        setViewportWidth(500); // Mobile

        const { container, component } = render(UiShell, {
          props: { persistentHamburgerMenu: true, isSideNavOpen: false },
        });

        const hamburgerButton = container.querySelector(
          ".bx--header__menu-trigger",
        );
        assert(hamburgerButton);
        await user.click(hamburgerButton);
        expect(component.isSideNavOpen).toBe(true);

        // With `persistentHamburgerMenu: true`, `shouldAutoExpand` is always
        // false. Without the gate, crossing to desktop would force-close
        // the nav the user just opened.
        setViewportWidth(1200);
        await flushMacrotask();
        expect(component.isSideNavOpen).toBe(true);
      });

      it("auto-expands on desktop after toggling the mobile hamburger (open then close)", async () => {
        // Regression: in the default (non-persistent) mode the hamburger
        // appears only on mobile, so clicking it set `userExplicitlySet`,
        // which then suppressed the desktop auto-expand. Repro: desktop ->
        // mobile -> open + close menu -> desktop must re-expand the side nav.
        setViewportWidth(1200); // Desktop
        const { container, component } = render(UiShell, {
          props: { isSideNavOpen: true },
        });
        await flushMacrotask();
        expect(component.isSideNavOpen).toBe(true);

        // Desktop -> mobile: auto-collapses, hamburger appears.
        setViewportWidth(500);
        await flushMacrotask();
        expect(component.isSideNavOpen).toBe(false);

        const hamburgerButton = container.querySelector(
          ".bx--header__menu-trigger",
        );
        assert(hamburgerButton);
        await user.click(hamburgerButton);
        expect(component.isSideNavOpen).toBe(true);
        await user.click(hamburgerButton);
        expect(component.isSideNavOpen).toBe(false);

        setViewportWidth(1200);
        await flushMacrotask();
        expect(component.isSideNavOpen).toBe(true);
      });

      it("should auto-expand when crossing breakpoint to desktop", async () => {
        setViewportWidth(500); // Start on mobile

        const { component } = render(UiShell, {
          props: { isSideNavOpen: false },
        });

        await flushMacrotask();
        expect(component.isSideNavOpen).toBe(false);

        setViewportWidth(1200);
        await flushMacrotask();

        expect(component.isSideNavOpen).toBe(true);
      });

      it("should auto-collapse when crossing breakpoint to mobile", async () => {
        setViewportWidth(1200); // Start on desktop

        const { component } = render(UiShell, {
          props: { isSideNavOpen: true },
        });

        await flushMacrotask();

        setViewportWidth(500);
        await flushMacrotask();

        expect(component.isSideNavOpen).toBe(false);
      });
    });
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

    describe("Escape key (overlay mode)", () => {
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

      it("does not close on Escape when fixed", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: true, sideNavFixed: true },
        });
        await flushMacrotask();

        await user.keyboard("{Escape}");

        expect(component.sideNavIsOpen).toBe(true);
      });

      it("does not close on Escape on desktop viewport", async () => {
        setViewportWidth(1200); // Desktop viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });
        await flushMacrotask();

        await user.keyboard("{Escape}");

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
          marginLeft: "0px",
        },
        {
          name: "is not forced on desktop when SideNav is open",
          width: 1200,
          props: { sideNavIsOpen: true },
          // CSS handles the margin via `.bx--side-nav ~ .bx--content`.
          marginLeft: "",
        },
        {
          name: "is not unset on mobile when SideNav is fixed",
          width: 500,
          props: { sideNavIsOpen: true, sideNavFixed: true },
          // Regression: https://github.com/carbon-design-system/carbon-components-svelte/issues/2701
          // A fixed SideNav is always visible, so Content keeps its CSS margin.
          marginLeft: "",
        },
        {
          name: "is not set for a rail on desktop",
          width: 1200,
          props: { sideNavRail: true, sideNavIsOpen: false },
          marginLeft: "",
        },
        {
          name: "is unset when SideNav is collapsed on desktop",
          width: 1200,
          props: { sideNavIsOpen: false },
          marginLeft: "0px",
        },
      ])("left margin $name", async ({ width, props, marginLeft }) => {
        setViewportWidth(width);

        const { container } = render(UiShell, { props });

        await flushMacrotask();

        expectInlineStyle(container.querySelector(".bx--content"), {
          marginLeft,
        });
      });

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
          marginLeft: "3rem",
        });
      });
    });
  });

  describe("Generics", () => {
    describe("HamburgerMenu", () => {
      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = HamburgerMenuComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["iconMenu"]>().toEqualTypeOf<
          CustomIcon | undefined
        >();
        expectTypeOf<Props["iconClose"]>().toEqualTypeOf<
          CustomIcon | undefined
        >();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = HamburgerMenuComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["iconMenu"]>().toEqualTypeOf<any>();
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["iconClose"]>().toEqualTypeOf<any>();
      });
    });

    describe("Header", () => {
      it("should support custom Icon types with generics", () => {
        type CustomIcon = new (...args: unknown[]) => unknown;

        type ComponentType = HeaderComponent<CustomIcon>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["iconMenu"]>().toEqualTypeOf<
          CustomIcon | undefined
        >();
        expectTypeOf<Props["iconClose"]>().toEqualTypeOf<
          CustomIcon | undefined
        >();
      });

      it("should default to any type when generic is not specified", () => {
        type ComponentType = HeaderComponent;
        type Props = ComponentProps<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["iconMenu"]>().toEqualTypeOf<any>();
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["iconClose"]>().toEqualTypeOf<any>();
      });
    });

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
