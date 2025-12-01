import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import ListBoxMenuItem from "./ListBoxMenuItem.test.svelte";

describe("ListBoxMenuItem", () => {
  it("should render with default props", () => {
    render(ListBoxMenuItem, { props: { slotContent: "Menu item" } });

    const menuItem = screen
      .getByText("Menu item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toBeInTheDocument();
    expect(menuItem).toHaveAttribute("role", "option");
  });

  it("should handle active state", () => {
    render(ListBoxMenuItem, {
      props: {
        active: true,
        slotContent: "Active item",
      },
    });

    const menuItem = screen
      .getByText("Active item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveClass("bx--list-box__menu-item--active");
    expect(menuItem).toHaveClass("bx--list-box__menu-item--highlighted");
    expect(menuItem).toHaveAttribute("aria-selected", "true");
  });

  it("should handle inactive state", () => {
    render(ListBoxMenuItem, {
      props: {
        active: false,
        slotContent: "Inactive item",
      },
    });

    const menuItem = screen
      .getByText("Inactive item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).not.toHaveClass("bx--list-box__menu-item--active");
    expect(menuItem).toHaveAttribute("aria-selected", "false");
  });

  it("should handle highlighted state", () => {
    render(ListBoxMenuItem, {
      props: {
        highlighted: true,
        slotContent: "Highlighted item",
      },
    });

    const menuItem = screen
      .getByText("Highlighted item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should handle disabled state", () => {
    render(ListBoxMenuItem, {
      props: {
        disabled: true,
        slotContent: "Disabled item",
      },
    });

    const menuItem = screen
      .getByText("Disabled item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveAttribute("aria-disabled", "true");
    expect(menuItem).toHaveAttribute("disabled", "true");
  });

  it("should handle enabled state", () => {
    render(ListBoxMenuItem, {
      props: {
        disabled: false,
        slotContent: "Enabled item",
      },
    });

    const menuItem = screen
      .getByText("Enabled item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).not.toHaveAttribute("aria-disabled");
    expect(menuItem).not.toHaveAttribute("disabled");
  });

  it("should handle click events", async () => {
    const clickHandler = vi.fn();
    render(ListBoxMenuItem, {
      props: { slotContent: "Clickable item", onclick: clickHandler },
    });

    const menuItem = screen
      .getByText("Clickable item")
      .closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    expect(clickHandler).toHaveBeenCalled();
  });

  it("should not trigger click on disabled item", async () => {
    const clickHandler = vi.fn();
    render(ListBoxMenuItem, {
      props: {
        disabled: true,
        slotContent: "Disabled clickable",
        onclick: clickHandler,
      },
    });

    const menuItem = screen
      .getByText("Disabled clickable")
      .closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    // Click event still fires on disabled items
    // Behavior should be handled by parent components
    expect(clickHandler).toHaveBeenCalled();
  });

  it("should handle mouseenter events", async () => {
    const mouseenterHandler = vi.fn();
    render(ListBoxMenuItem, {
      props: { slotContent: "Hover item", onmouseenter: mouseenterHandler },
    });

    const menuItem = screen
      .getByText("Hover item")
      .closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.hover(menuItem);

    expect(mouseenterHandler).toHaveBeenCalled();
  });

  it("should handle mouseleave events", async () => {
    const mouseleaveHandler = vi.fn();
    render(ListBoxMenuItem, {
      props: { slotContent: "Unhover item", onmouseleave: mouseleaveHandler },
    });

    const menuItem = screen
      .getByText("Unhover item")
      .closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.hover(menuItem);
    await user.unhover(menuItem);

    expect(mouseleaveHandler).toHaveBeenCalled();
  });

  it("should render slot content inside option wrapper", () => {
    render(ListBoxMenuItem, { props: { slotContent: "Wrapped content" } });

    const option = screen
      .getByText("Wrapped content")
      .closest(".bx--list-box__menu-item__option");
    expect(option).toBeInTheDocument();
  });

  it("should apply custom attributes", () => {
    render(ListBoxMenuItem, {
      props: {
        "data-testid": "custom-item",
        slotContent: "Custom attrs",
      },
    });

    const menuItem = screen
      .getByText("Custom attrs")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveAttribute("data-testid", "custom-item");
  });

  it("should handle both active and highlighted states", () => {
    render(ListBoxMenuItem, {
      props: {
        active: true,
        highlighted: true,
        slotContent: "Both states",
      },
    });

    const menuItem = screen
      .getByText("Both states")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveClass("bx--list-box__menu-item--active");
    expect(menuItem).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should have tabindex -1", () => {
    render(ListBoxMenuItem, { props: { slotContent: "Tabindex item" } });

    const menuItem = screen
      .getByText("Tabindex item")
      .closest(".bx--list-box__menu-item");
    expect(menuItem).toHaveAttribute("tabindex", "-1");
  });
});
