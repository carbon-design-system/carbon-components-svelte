import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Button from "./Button.test.svelte";

describe("Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with various kinds", () => {
    render(Button);

    const kinds = [
      "primary",
      "secondary",
      "tertiary",
      "ghost",
      "danger",
      "danger-tertiary",
      "danger-ghost",
    ];

    for (const kind of kinds) {
      const button = screen.getByText(kind);
      expect(button.closest("button")).toHaveClass(`bx--btn--${kind}`);
    }
  });

  it("should render with different sizes", () => {
    render(Button);

    const sizes = {
      field: "bx--btn--field",
      small: "bx--btn--sm",
    };

    for (const [size, className] of Object.entries(sizes)) {
      const buttons = screen.getAllByText(new RegExp(`${size}`, "i"));
      for (const button of buttons) {
        expect(button.closest("button")).toHaveClass(className);
      }
    }
  });

  it("should render icon-only button with tooltip", () => {
    render(Button);

    const iconButton = screen.getByText("Tooltip text").parentElement;
    assert(iconButton);
    expect(iconButton).toHaveClass("bx--btn--icon-only");
    expect(iconButton).toHaveClass("bx--tooltip__trigger");
    expect(iconButton).toHaveClass("bx--tooltip--a11y");
    expect(iconButton).toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).toHaveClass("bx--tooltip--align-center");
  });

  it("should render as link when href is provided", () => {
    render(Button);

    const linkButton = screen.getByText("Link button");
    expect(linkButton.tagName).toBe("A");
    expect(linkButton).toHaveAttribute("href", "#");
  });

  it("should render custom element when as prop is used", () => {
    render(Button);

    const customButton = screen.getByText("Custom element");
    expect(customButton.tagName).toBe("P");
    expect(customButton).toHaveClass("bx--btn");
  });

  it("should render disabled state", () => {
    render(Button);

    const disabledButton = screen.getByText("Disabled button");
    expect(disabledButton).toBeDisabled();
    expect(disabledButton).toHaveClass("bx--btn--disabled");
  });

  it("should render skeleton state", () => {
    render(Button);

    const skeletons = document.querySelectorAll(".bx--skeleton");
    expect(skeletons).toHaveLength(3);

    for (const skeleton of skeletons) {
      expect(skeleton).toHaveClass("bx--btn");
    }
  });

  it("should handle click events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Button);

    const button = screen.getByTestId("btn");
    await user.click(button);
    expect(consoleLog).toHaveBeenCalledWith("click");
    expect(consoleLog).toHaveBeenCalledTimes(1);
  });

  it("should render with icon", () => {
    render(Button);

    const buttonWithIcon = screen.getByRole("button", { name: "With icon" });
    const icon = buttonWithIcon.querySelector(".bx--btn__icon");
    expect(icon).toBeInTheDocument();
  });

  it("should hide tooltip but keep accessibility when hideTooltip is true", () => {
    render(Button);

    const iconButton = screen.getByTestId("btn-icon-only-hide-tooltip");
    expect(iconButton).toHaveClass("bx--btn--icon-only");

    // Should NOT have tooltip classes.
    expect(iconButton).not.toHaveClass("bx--tooltip__trigger");
    expect(iconButton).not.toHaveClass("bx--tooltip--a11y");
    expect(iconButton).not.toHaveClass("bx--btn--icon-only--bottom");
    expect(iconButton).not.toHaveClass("bx--tooltip--align-center");

    // Should still have accessible text for screen readers.
    const assistiveText = iconButton.querySelector(".bx--assistive-text");
    assert(assistiveText);
    expect(assistiveText).toHaveTextContent("Add item");
  });
});
