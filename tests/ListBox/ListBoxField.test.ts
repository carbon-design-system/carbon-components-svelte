import { render, screen } from "@testing-library/svelte";
import type { ComponentProps } from "svelte";
import { user } from "../setup-tests";
import ListBoxField from "./ListBoxField.test.svelte";

describe("ListBoxField", () => {
  it("should render with default props", () => {
    render(ListBoxField, { props: { slotContent: "Field content" } });

    const field = screen
      .getByText("Field content")
      .closest(".bx--list-box__field");
    expect(field).toBeInTheDocument();
    expect(field).toHaveAttribute("role", "combobox");
  });

  it("should handle disabled state", () => {
    render(ListBoxField, {
      props: {
        disabled: true,
        slotContent: "Disabled field",
      },
    });

    const field = screen
      .getByText("Disabled field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-disabled", "true");
    expect(field).toHaveAttribute("tabindex", "-1");
  });

  it("should handle enabled state with custom tabindex", () => {
    render(ListBoxField, {
      props: {
        disabled: false,
        tabindex: "0",
        slotContent: "Enabled field",
      },
    });

    const field = screen
      .getByText("Enabled field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("tabindex", "0");
  });

  it("should handle custom role", () => {
    render(ListBoxField, {
      props: {
        role: "button",
        slotContent: "Custom role",
      },
    });

    const field = screen
      .getByText("Custom role")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("role", "button");
  });

  it("should handle aria-expanded", () => {
    render(ListBoxField, {
      props: {
        "aria-expanded": true,
        slotContent: "Expanded field",
      },
    });

    const field = screen
      .getByText("Expanded field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-expanded", "true");
  });

  it("should show 'Open menu' label when collapsed", () => {
    render(ListBoxField, {
      props: {
        "aria-expanded": false,
        slotContent: "Test field",
      },
    });

    const field = screen
      .getByText("Test field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-label", "Open menu");
  });

  it("should show 'Close menu' label when expanded", () => {
    render(ListBoxField, {
      props: {
        "aria-expanded": true,
        slotContent: "Test field",
      },
    });

    const field = screen
      .getByText("Test field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-label", "Close menu");
  });

  it("should use custom translation for open", () => {
    const customTranslations = {
      open: "Custom open",
      close: "Custom close",
    } as const;

    const props = {
      "aria-expanded": false,
      translateWithId: (id: keyof typeof customTranslations) =>
        customTranslations[id],
      slotContent: "Custom field",
    } satisfies ComponentProps<ListBoxField>;

    render(ListBoxField, { props });

    const field = screen
      .getByText("Custom field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-label", "Custom open");
  });

  it("should use custom translation for close", () => {
    const customTranslations = {
      open: "Custom open",
      close: "Custom close",
    } as const;

    const props = {
      "aria-expanded": true,
      translateWithId: (id: keyof typeof customTranslations) =>
        customTranslations[id],
      slotContent: "Custom field",
    } satisfies ComponentProps<ListBoxField>;

    render(ListBoxField, { props });

    const field = screen
      .getByText("Custom field")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-label", "Custom close");
  });

  it("should generate menu id based on field id", () => {
    render(ListBoxField, {
      props: {
        id: "test-field",
        "aria-expanded": true,
        slotContent: "ID test",
      },
    });

    const field = screen.getByText("ID test").closest(".bx--list-box__field");
    expect(field).toHaveAttribute("aria-owns", "menu-test-field");
    expect(field).toHaveAttribute("aria-controls", "menu-test-field");
  });

  it("should not set aria-owns and aria-controls when collapsed", () => {
    render(ListBoxField, {
      props: {
        id: "test-field",
        "aria-expanded": false,
        slotContent: "Collapsed field",
      },
    });

    const field = screen
      .getByText("Collapsed field")
      .closest(".bx--list-box__field");
    expect(field).not.toHaveAttribute("aria-owns");
    expect(field).not.toHaveAttribute("aria-controls");
  });

  it("should handle click events", async () => {
    const clickHandler = vi.fn();
    render(ListBoxField, {
      props: { slotContent: "Clickable field", onclick: clickHandler },
    });

    const field = screen
      .getByText("Clickable field")
      .closest(".bx--list-box__field");
    assert(field);
    await user.click(field);

    expect(clickHandler).toHaveBeenCalled();
  });

  it("should handle keydown events", async () => {
    const keydownHandler = vi.fn();
    render(ListBoxField, {
      props: {
        slotContent: "Keyboard field",
        tabindex: "0",
        onkeydown: keydownHandler,
      },
    });

    const field = screen
      .getByText("Keyboard field")
      .closest(".bx--list-box__field");
    assert(field instanceof HTMLElement);

    field.focus();
    await user.keyboard("{Enter}");

    expect(keydownHandler).toHaveBeenCalled();
  });

  it("should handle focus and blur events", () => {
    const focusHandler = vi.fn();
    const blurHandler = vi.fn();
    render(ListBoxField, {
      props: {
        slotContent: "Focus field",
        tabindex: "0",
        onfocus: focusHandler,
        onblur: blurHandler,
      },
    });

    const field = screen
      .getByText("Focus field")
      .closest(".bx--list-box__field");
    assert(field instanceof HTMLElement);

    field.focus();
    expect(focusHandler).toHaveBeenCalled();

    field.blur();
    expect(blurHandler).toHaveBeenCalled();
  });

  it("should handle mouse events", async () => {
    const mouseoverHandler = vi.fn();
    const mouseenterHandler = vi.fn();
    const mouseleaveHandler = vi.fn();
    render(ListBoxField, {
      props: {
        slotContent: "Mouse field",
        onmouseover: mouseoverHandler,
        onmouseenter: mouseenterHandler,
        onmouseleave: mouseleaveHandler,
      },
    });

    const field = screen
      .getByText("Mouse field")
      .closest(".bx--list-box__field");
    assert(field);

    await user.hover(field);
    expect(mouseoverHandler).toHaveBeenCalled();
    expect(mouseenterHandler).toHaveBeenCalled();

    await user.unhover(field);
    expect(mouseleaveHandler).toHaveBeenCalled();
  });

  it("should expose ref", () => {
    const { component } = render(ListBoxField, {
      props: { slotContent: "Ref field" },
    });

    expect(component.ref).toBeInstanceOf(HTMLDivElement);
  });

  it("should apply custom attributes", () => {
    render(ListBoxField, {
      props: {
        "data-testid": "custom-field",
        slotContent: "Custom attrs",
      },
    });

    const field = screen
      .getByText("Custom attrs")
      .closest(".bx--list-box__field");
    expect(field).toHaveAttribute("data-testid", "custom-field");
  });
});
