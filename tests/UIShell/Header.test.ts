import { render, screen } from "@testing-library/svelte";
import type HamburgerMenuComponent from "carbon-components-svelte/UIShell/HamburgerMenu.svelte";
import type HeaderComponent from "carbon-components-svelte/UIShell/Header.svelte";
import Header from "carbon-components-svelte/UIShell/Header.svelte";
import type { ComponentProps } from "svelte";
import { get } from "svelte/store";
import { hamburgerMenuRef } from "../../src/UIShell/nav-store.js";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import HeaderAriaLabel from "./HeaderAriaLabel.test.svelte";
import UiShell from "./UIShell.test.svelte";
import UIShellLinkRel from "./UIShellLinkRel.test.svelte";

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

    it("does not auto-expand on desktop when expandedByDefault is false", async () => {
      setViewportWidth(1200);

      const { component } = render(UiShell, {
        props: { isSideNavOpen: false, expandedByDefault: false },
      });
      await flushMacrotask();

      expect(component.isSideNavOpen).toBe(false);
    });

    it("clears the stored hamburger ref when the header unmounts", () => {
      const { container, unmount } = render(UiShell, {
        props: { persistentHamburgerMenu: true },
      });
      expect(get(hamburgerMenuRef)).toBe(
        container.querySelector(".bx--header__menu-trigger"),
      );

      unmount();

      expect(get(hamburgerMenuRef)).toBeNull();
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
  });
});

describe("Header landmark label", () => {
  it("prefers uiShellAriaLabel over the company name", () => {
    render(HeaderAriaLabel, {
      props: {
        companyName: "IBM",
        platformName: "Cloud",
        uiShellAriaLabel: "IBM Cloud",
      },
    });

    expect(screen.getByRole("banner")).toHaveAttribute(
      "aria-label",
      "IBM Cloud",
    );
  });

  it("falls back to the company name, then the platform name", () => {
    const { unmount } = render(HeaderAriaLabel, {
      props: { companyName: "IBM", platformName: "Cloud" },
    });
    expect(screen.getByRole("banner")).toHaveAttribute("aria-label", "IBM");
    unmount();

    render(HeaderAriaLabel, { props: { platformName: "Cloud" } });
    expect(screen.getByRole("banner")).toHaveAttribute("aria-label", "Cloud");
  });

  it("omits the label when there is nothing to name it by", () => {
    render(HeaderAriaLabel);

    expect(screen.getByRole("banner")).not.toHaveAttribute("aria-label");
  });

  it("names the banner, not the name link, with a consumer aria-labelledby", () => {
    render(Header, {
      props: {
        companyName: "IBM",
        href: "/",
        "aria-labelledby": "shell-title",
      },
    });

    const banner = screen.getByRole("banner");
    expect(banner).toHaveAttribute("aria-labelledby", "shell-title");
    expect(banner).not.toHaveAttribute("aria-label");
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-labelledby");
  });
});

const links = {
  Header: () => screen.getByRole("link", { name: /IBM/ }),
  HeaderActionLink: () => screen.getByRole("link", { name: "Status" }),
  ProfileMenuHeader: () => screen.getByRole("link", { name: /Ada/ }),
  ProfileMenuItem: () => screen.getByRole("link", { name: "Settings" }),
  SideNavMenuItem: () => screen.getByRole("link", { name: "API reference" }),
};

describe("UI Shell links opening a new tab", () => {
  it.each(Object.entries(links))(
    "%s defaults rel to noopener noreferrer",
    (_name, getLink) => {
      render(UIShellLinkRel);

      expect(getLink()).toHaveAttribute("rel", "noopener noreferrer");
    },
  );

  it("keep an explicit rel", () => {
    render(UIShellLinkRel, { props: { rel: "external" } });

    for (const getLink of Object.values(links)) {
      expect(getLink()).toHaveAttribute("rel", "external");
    }
  });
});
