import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import HeaderSlot from "./Header.slot.test.svelte";
import UiShell from "./UIShell.test.svelte";

describe("UIShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Header", () => {
    it("should render with default props", () => {
      render(UiShell);

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("bx--header");
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

    it("supports custom company slot", () => {
      render(HeaderSlot);

      const customCompany = screen.getByText("Custom company content");
      expect(customCompany).toBeInTheDocument();
    });

    it("should apply custom class to Header link", () => {
      render(UiShell, {
        props: { headerClass: "custom-header", platformName: "Platform" },
      });

      const link = screen.getByText("Platform").closest("a");
      expect(link).toHaveClass("custom-header");
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(UiShell, { props: { headerHref: "#", platformName: "Platform" } });

      const link = screen.getByText("Platform").closest("a");
      assert(link);
      await user.click(link);

      expect(consoleLog).toHaveBeenCalledWith("header-click");
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

    it("should default to 'Open menu' when side nav is closed", () => {
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
      expect(hamburgerButton).toHaveAttribute("title", "Open menu");
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

    describe("user interaction preservation", () => {
      const setViewportWidth = (width: number) => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event("resize"));
      };

      afterEach(() => {
        setViewportWidth(1024);
        document.body.classList.remove("bx--body--with-modal-open");
      });

      it("should preserve user-opened state after minor width changes on mobile", async () => {
        setViewportWidth(500); // Mobile viewport

        const { container, component } = render(UiShell, {
          props: {
            persistentHamburgerMenu: true,
            isSideNavOpen: false,
          },
        });

        // User clicks hamburger to open
        const hamburgerButton = container.querySelector(
          ".bx--header__menu-trigger",
        );
        assert(hamburgerButton);
        await user.click(hamburgerButton);

        expect(component.isSideNavOpen).toBe(true);

        // Simulate minor width change (like mobile address bar hide/show)
        setViewportWidth(520);
        await new Promise((resolve) => setTimeout(resolve, 0));

        // SideNav should still be open
        expect(component.isSideNavOpen).toBe(true);
      });

      it("should auto-expand when crossing breakpoint to desktop", async () => {
        setViewportWidth(500); // Start on mobile

        const { component } = render(UiShell, {
          props: { isSideNavOpen: false },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(component.isSideNavOpen).toBe(false);

        // Cross to desktop
        setViewportWidth(1200);
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Should auto-expand on desktop
        expect(component.isSideNavOpen).toBe(true);
      });

      it("should auto-collapse when crossing breakpoint to mobile", async () => {
        setViewportWidth(1200); // Start on desktop

        const { component } = render(UiShell, {
          props: { isSideNavOpen: true },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        // Cross to mobile
        setViewportWidth(500);
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Should auto-collapse on mobile
        expect(component.isSideNavOpen).toBe(false);
      });
    });
  });

  describe("HeaderNav", () => {
    it("should render navigation", () => {
      render(UiShell);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("bx--header__nav");
    });

    it("should render navigation items", () => {
      render(UiShell);

      const nav = screen.getByRole("navigation", { name: "Navigation" });
      expect(nav.querySelector('[role="menuitem"]')).toBeInTheDocument();
    });

    it("should apply custom class to HeaderNav", () => {
      render(UiShell, { props: { headerNavClass: "custom-nav" } });

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("custom-nav");
    });
  });

  describe("SideNav", () => {
    // Regression test for initial event dispatch in Svelte 5
    // https://github.com/carbon-design-system/carbon-components-svelte/issues/2533
    it("does not fire open/close event on initial render", () => {
      const consoleLog = vi.spyOn(console, "log");
      render(UiShell, {
        props: { sideNavIsOpen: false },
      });

      expect(consoleLog).not.toHaveBeenCalledWith("sidenav-open");
      expect(consoleLog).not.toHaveBeenCalledWith("sidenav-close");
    });

    // Regression test for initial event dispatch in Svelte 5
    // https://github.com/carbon-design-system/carbon-components-svelte/issues/2533
    it("does not fire open/close event on initial render when isOpen is true", () => {
      const consoleLog = vi.spyOn(console, "log");
      render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      expect(consoleLog).not.toHaveBeenCalledWith("sidenav-open");
      expect(consoleLog).not.toHaveBeenCalledWith("sidenav-close");
    });

    it("should render with default props", () => {
      const { container } = render(UiShell);

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toBeInTheDocument();
    });

    describe("body scroll lock", () => {
      const setViewportWidth = (width: number) => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event("resize"));
      };

      afterEach(() => {
        // Reset viewport and cleanup body class
        setViewportWidth(1024);
        document.body.classList.remove("bx--body--with-modal-open");
      });

      it("should add scroll lock class when open on mobile viewport", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");

        component.sideNavIsOpen = true;
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.body).toHaveClass("bx--body--with-modal-open");
      });

      it("should remove scroll lock class when closed on mobile viewport", async () => {
        setViewportWidth(500); // Mobile viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });

        expect(document.body).toHaveClass("bx--body--with-modal-open");

        component.sideNavIsOpen = false;
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });

      it("should not add scroll lock class on desktop viewport", async () => {
        setViewportWidth(1200); // Desktop viewport

        const { component } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        component.sideNavIsOpen = true;
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });

      it("should not add scroll lock class for fixed variant", async () => {
        setViewportWidth(500); // Mobile viewport

        render(UiShell, {
          props: { sideNavIsOpen: true, sideNavFixed: true },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });

      it("should not add scroll lock class for rail variant", async () => {
        setViewportWidth(500); // Mobile viewport

        render(UiShell, {
          props: { sideNavIsOpen: true, sideNavRail: true },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(document.body).not.toHaveClass("bx--body--with-modal-open");
      });
    });

    it("should render fixed variant", () => {
      const { container } = render(UiShell, {
        props: { sideNavFixed: true },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).not.toBeInTheDocument();
    });

    it("should render rail variant", () => {
      const { container } = render(UiShell, {
        props: { sideNavRail: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--rail");
    });

    it("should handle isOpen state", () => {
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--expanded");
      expect(nav).toHaveAttribute("aria-hidden", "false");
    });

    it("should apply custom aria-label", () => {
      const { container } = render(UiShell, {
        props: { sideNavAriaLabel: "Main navigation" },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveAttribute("aria-label", "Main navigation");
    });

    it("should apply custom class to SideNav", () => {
      const { container } = render(UiShell, {
        props: { sideNavClass: "custom-sidenav" },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("custom-sidenav");
    });

    it("should dispatch open event", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(UiShell);

      component.sideNavIsOpen = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleLog).toHaveBeenCalledWith("sidenav-open");
    });

    it("should dispatch close event", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      component.sideNavIsOpen = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleLog).toHaveBeenCalledWith("sidenav-close");
    });

    it("should handle overlay click", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).toBeInTheDocument();
      assert(overlay);

      await user.click(overlay);

      expect(consoleLog).toHaveBeenCalledWith("sidenav-overlay-click");
    });

    it("should render side nav links", () => {
      const { container } = render(UiShell);

      const sideNav = container.querySelector(".bx--side-nav");
      const links = sideNav?.querySelectorAll(".bx--side-nav__link");

      expect(links?.length).toBeGreaterThan(0);
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

    it("should allow focus on links when open", () => {
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveAttribute("aria-hidden", "false");
      expect(nav).not.toHaveStyle({ visibility: "hidden" });
    });

    it("should not apply visibility:hidden in rail mode when closed", () => {
      const { container } = render(UiShell, {
        props: { sideNavIsOpen: false, sideNavRail: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--rail");
      expect(nav).not.toHaveStyle({ visibility: "hidden" });
    });
  });

  describe("Content", () => {
    it("should render content", () => {
      render(UiShell);

      expect(screen.getByText("Content goes here")).toBeInTheDocument();
    });

    describe("mobile margin behavior", () => {
      const setViewportWidth = (width: number) => {
        Object.defineProperty(window, "innerWidth", {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event("resize"));
      };

      afterEach(() => {
        setViewportWidth(1024);
      });

      it("should unset left margin on mobile viewport", async () => {
        setViewportWidth(500); // Mobile viewport

        const { container } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const content = container.querySelector(".bx--content");
        expect(content).toHaveStyle({ marginLeft: "0px" });
      });

      it("should not force margin on desktop viewport when SideNav is open", async () => {
        setViewportWidth(1200); // Desktop viewport

        const { container } = render(UiShell, {
          props: { sideNavIsOpen: true },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const content = container.querySelector(".bx--content");
        // On desktop with SideNav open, margin should not be explicitly set to 0
        // (CSS will handle the margin via .bx--side-nav ~ .bx--content)
        expect(content).not.toHaveStyle({ marginLeft: "0px" });
      });

      it("should unset left margin when SideNav is collapsed on desktop", async () => {
        setViewportWidth(1200); // Desktop viewport

        const { container } = render(UiShell, {
          props: { sideNavIsOpen: false },
        });

        await new Promise((resolve) => setTimeout(resolve, 0));

        const content = container.querySelector(".bx--content");
        expect(content).toHaveStyle({ marginLeft: "0px" });
      });
    });
  });
});
