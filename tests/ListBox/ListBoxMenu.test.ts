import { render, screen } from "@testing-library/svelte";
import ListBoxMenu from "./ListBoxMenu.test.svelte";

describe("ListBoxMenu", () => {
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

  it("should handle scroll events", async () => {
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
});
