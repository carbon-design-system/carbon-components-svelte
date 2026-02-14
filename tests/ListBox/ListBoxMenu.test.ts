import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import ListBoxMenu from "./ListBoxMenu.test.svelte";

describe("ListBoxMenu", () => {
  afterEach(() => {
    const existingPortals = document.querySelectorAll("[data-floating-portal]");
    for (const portal of existingPortals) {
      portal.remove();
    }
  });

  it("should render with default props", () => {
    render(ListBoxMenu, { props: { slotContent: "Menu content" } });

    const menu = screen
      .getByText("Menu content")
      .closest(".bx--list-box__menu");
    expect(menu).toBeInTheDocument();
    expect(menu).toHaveAttribute("role", "listbox");
  });

  it("should generate menu id", () => {
    render(ListBoxMenu, {
      props: {
        id: "test-menu",
        slotContent: "Menu with ID",
      },
    });

    const menu = screen
      .getByText("Menu with ID")
      .closest(".bx--list-box__menu");
    expect(menu).toHaveAttribute("id", "menu-test-menu");
  });

  it("should render slot content", () => {
    render(ListBoxMenu, { props: { slotContent: "Custom menu items" } });

    expect(screen.getByText("Custom menu items")).toBeInTheDocument();
  });

  it("should handle scroll events", () => {
    const scrollHandler = vi.fn();
    render(ListBoxMenu, {
      props: { slotContent: "Scrollable menu", onscroll: scrollHandler },
    });

    const menu = screen
      .getByText("Scrollable menu")
      .closest(".bx--list-box__menu");
    assert(menu);

    menu.dispatchEvent(new Event("scroll"));
    expect(scrollHandler).toHaveBeenCalled();
  });

  it("should expose ref", () => {
    const { component } = render(ListBoxMenu, {
      props: { slotContent: "Ref menu" },
    });

    expect(component.ref).toBeInstanceOf(HTMLDivElement);
  });

  it("should apply custom attributes", () => {
    render(ListBoxMenu, {
      props: {
        "data-testid": "custom-menu",
        slotContent: "Custom attrs",
      },
    });

    const menu = screen
      .getByText("Custom attrs")
      .closest(".bx--list-box__menu");
    expect(menu).toHaveAttribute("data-testid", "custom-menu");
  });

  describe("portal mode", () => {
    it("should render in document flow when portal is false", () => {
      render(ListBoxMenu, {
        props: { slotContent: "Non-portal menu", portal: false },
      });

      const menu = screen
        .getByText("Non-portal menu")
        .closest(".bx--list-box__menu");
      expect(menu).toBeInTheDocument();
      expect(menu?.closest("[data-floating-portal]")).not.toBeInTheDocument();
    });

    it("should render in FloatingPortal when portal is true and open is true", async () => {
      render(ListBoxMenu, {
        props: { slotContent: "Portal menu", portal: true, open: true },
      });

      const menu = await screen.findByText("Portal menu");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu when portal is true and open is false", () => {
      render(ListBoxMenu, {
        props: { slotContent: "Hidden portal menu", portal: true, open: false },
      });

      const menu = screen.queryByText("Hidden portal menu");
      expect(menu).not.toBeInTheDocument();

      const floatingPortal = document.querySelector("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    it("should show menu when open becomes true", async () => {
      const { rerender } = render(ListBoxMenu, {
        props: { slotContent: "Toggle menu", portal: true, open: false },
      });

      expect(screen.queryByText("Toggle menu")).not.toBeInTheDocument();

      rerender({ slotContent: "Toggle menu", portal: true, open: true });

      const menu = await screen.findByText("Toggle menu");
      expect(menu).toBeInTheDocument();
    });

    it("should hide menu when open becomes false", async () => {
      const { rerender } = render(ListBoxMenu, {
        props: { slotContent: "Close menu", portal: true, open: true },
      });

      await screen.findByText("Close menu");

      rerender({ slotContent: "Close menu", portal: true, open: false });
      await tick();

      expect(screen.queryByText("Close menu")).not.toBeInTheDocument();
    });

    it("should pass direction to FloatingPortal", async () => {
      render(ListBoxMenu, {
        props: {
          slotContent: "Top direction menu",
          portal: true,
          open: true,
          direction: "top",
        },
      });

      const menu = await screen.findByText("Top direction menu");
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toHaveAttribute("data-floating-direction", "top");
    });

    it("should expose ref when portal is true", async () => {
      const { component } = render(ListBoxMenu, {
        props: { slotContent: "Portal ref menu", portal: true, open: true },
      });

      const menu = await screen.findByText("Portal ref menu");
      expect(component.ref).toBeInstanceOf(HTMLDivElement);
      expect(component.ref).toHaveClass("bx--list-box__menu");
      expect(component.ref).toContainElement(menu);
    });
  });
});
