import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import UIShell from "./UIShell.test.svelte";

describe("UIShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Header", () => {
    it("should render with default props", () => {
      render(UIShell);

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("bx--header");
    });

    it("should render with company name", () => {
      render(UIShell, { props: { company: "IBM" } });

      expect(screen.getByText(/IBM/)).toBeInTheDocument();
    });

    it("should render with platform name", () => {
      render(UIShell, { props: { platformName: "Platform" } });

      expect(screen.getByText("Platform")).toBeInTheDocument();
    });

    it("should render with href", () => {
      render(UIShell, {
        props: { headerHref: "/home", platformName: "Platform" },
      });

      const link = screen.getByText("Platform").closest("a");
      expect(link).toHaveAttribute("href", "/home");
    });

    it("should render company and platform slots", () => {
      render(UIShell, { props: { useSlots: true } });

      expect(screen.getByText("Custom Company")).toBeInTheDocument();
      expect(screen.getByText("Custom Platform")).toBeInTheDocument();
    });

    it("should apply custom class to Header link", () => {
      render(UIShell, {
        props: { headerClass: "custom-header", platformName: "Platform" },
      });

      const link = screen.getByText("Platform").closest("a");
      expect(link).toHaveClass("custom-header");
    });

    it("should handle click events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(UIShell, { props: { headerHref: "#", platformName: "Platform" } });

      const link = screen.getByText("Platform").closest("a");
      assert(link);
      await user.click(link);

      expect(consoleLog).toHaveBeenCalledWith("header-click");
    });

    it("should bind ref to anchor element", () => {
      const { component } = render(UIShell, {
        props: { headerHref: "#", platformName: "Platform" },
      });

      expect(component.headerRef).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe("HeaderNav", () => {
    it("should render navigation", () => {
      render(UIShell);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("bx--header__nav");
    });

    it("should render navigation items", () => {
      render(UIShell);

      const nav = screen.getByRole("navigation", { name: "Navigation" });
      expect(nav.querySelector('[role="menuitem"]')).toBeInTheDocument();
    });

    it("should apply custom class to HeaderNav", () => {
      render(UIShell, { props: { headerNavClass: "custom-nav" } });

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("custom-nav");
    });
  });

  describe("SideNav", () => {
    it("should render with default props", () => {
      const { container } = render(UIShell);

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toBeInTheDocument();
    });

    it("should render fixed variant", () => {
      const { container } = render(UIShell, {
        props: { sideNavFixed: true },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).not.toBeInTheDocument();
    });

    it("should render rail variant", () => {
      const { container } = render(UIShell, {
        props: { sideNavRail: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--rail");
    });

    it("should handle isOpen state", () => {
      const { container } = render(UIShell, {
        props: { sideNavIsOpen: true },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("bx--side-nav--expanded");
      expect(nav).toHaveAttribute("aria-hidden", "false");
    });

    it("should apply custom aria-label", () => {
      const { container } = render(UIShell, {
        props: { sideNavAriaLabel: "Main navigation" },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveAttribute("aria-label", "Main navigation");
    });

    it("should apply custom class to SideNav", () => {
      const { container } = render(UIShell, {
        props: { sideNavClass: "custom-sidenav" },
      });

      const nav = container.querySelector(".bx--side-nav");
      expect(nav).toHaveClass("custom-sidenav");
    });

    it("should dispatch open event", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(UIShell);

      component.sideNavIsOpen = true;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleLog).toHaveBeenCalledWith("sidenav-open");
    });

    it("should dispatch close event", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { component } = render(UIShell, {
        props: { sideNavIsOpen: true },
      });

      component.sideNavIsOpen = false;
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleLog).toHaveBeenCalledWith("sidenav-close");
    });

    it("should handle overlay click", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(UIShell, {
        props: { sideNavIsOpen: true },
      });

      const overlay = container.querySelector(".bx--side-nav__overlay");
      expect(overlay).toBeInTheDocument();
      assert(overlay);

      await user.click(overlay);

      expect(consoleLog).toHaveBeenCalledWith("sidenav-overlay-click");
    });

    it("should render side nav links", () => {
      const { container } = render(UIShell);

      const sideNav = container.querySelector(".bx--side-nav");
      const links = sideNav?.querySelectorAll(".bx--side-nav__link");

      expect(links?.length).toBeGreaterThan(0);
    });
  });

  describe("Content", () => {
    it("should render content", () => {
      render(UIShell);

      expect(screen.getByText("Content goes here")).toBeInTheDocument();
    });
  });
});
