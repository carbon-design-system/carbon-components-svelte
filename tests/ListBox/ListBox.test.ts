import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ListBox from "./ListBox.test.svelte";

const getRoot = (container: HTMLElement) =>
  container.querySelector(".bx--list-box") as HTMLElement;

describe("ListBox", () => {
  it("should render with default props", () => {
    const { container } = render(ListBox);

    const listbox = getRoot(container);
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveClass("bx--list-box");
  });

  it("should not set a role on the root element", () => {
    const { container } = render(ListBox);

    expect(getRoot(container)).not.toHaveAttribute("role");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should handle open state", () => {
    const { container } = render(ListBox, { props: { open: true } });

    expect(getRoot(container)).toHaveClass("bx--list-box--expanded");
  });

  it("should handle closed state", () => {
    const { container } = render(ListBox, { props: { open: false } });

    expect(getRoot(container)).not.toHaveClass("bx--list-box--expanded");
  });

  it("should handle disabled state", () => {
    const { container } = render(ListBox, { props: { disabled: true } });

    expect(getRoot(container)).toHaveClass("bx--list-box--disabled");
  });

  it("should handle light variant", () => {
    const { container } = render(ListBox, { props: { light: true } });

    expect(getRoot(container)).toHaveClass("bx--list-box--light");
  });

  it("should handle inline type", () => {
    const { container } = render(ListBox, { props: { type: "inline" } });

    expect(getRoot(container)).toHaveClass("bx--list-box--inline");
  });

  it("should handle default type", () => {
    const { container } = render(ListBox, { props: { type: "default" } });

    expect(getRoot(container)).not.toHaveClass("bx--list-box--inline");
  });

  test.each([
    ["sm", "bx--list-box--sm"],
    ["xl", "bx--list-box--xl"],
  ] as const)("should handle size variants", (size, className) => {
    const { container } = render(ListBox, { props: { size } });
    expect(getRoot(container)).toHaveClass(className);
  });

  it("should handle invalid state", () => {
    const { container } = render(ListBox, {
      props: {
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    const listbox = getRoot(container);
    expect(listbox).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("Invalid selection")).toBeInTheDocument();
    expect(screen.getByText("Invalid selection")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should handle warning state", () => {
    const { container } = render(ListBox, {
      props: {
        warn: true,
        warnText: "Warning message",
      },
    });

    const listbox = getRoot(container);
    expect(listbox).toHaveClass("bx--list-box--warning");
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByText("Warning message")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should prioritize invalid over warning", () => {
    const { container } = render(ListBox, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const listbox = getRoot(container);
    expect(listbox).toHaveAttribute("data-invalid", "true");
    expect(listbox).not.toHaveClass("bx--list-box--warning");
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
  });

  it("should handle keydown events", async () => {
    const keydownHandler = vi.fn();
    const { container } = render(ListBox, {
      props: { onkeydown: keydownHandler },
    });

    await user.click(getRoot(container));
    await user.keyboard("{Escape}");

    expect(keydownHandler).toHaveBeenCalled();
  });

  it("should stop propagation of Escape key", async () => {
    const { container } = render(ListBox);
    const escapeHandler = vi.fn();

    container.addEventListener("keydown", escapeHandler);

    await user.click(getRoot(container));
    await user.keyboard("{Escape}");

    expect(escapeHandler).not.toHaveBeenCalled();
  });

  it("should render slot content", () => {
    render(ListBox, {
      props: {
        slotContent: "Custom content",
      },
    });

    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    const clickHandler = vi.fn();
    const { container } = render(ListBox, {
      props: { onclick: clickHandler },
    });

    await user.click(getRoot(container));

    expect(clickHandler).toHaveBeenCalled();
  });

  it("should apply custom attributes", () => {
    const { container } = render(ListBox, {
      props: {
        "data-testid": "custom-listbox",
      },
    });

    expect(getRoot(container)).toHaveAttribute("data-testid", "custom-listbox");
  });
});
