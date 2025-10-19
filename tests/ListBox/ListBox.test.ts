import { render, screen } from "@testing-library/svelte";
import { user, isSvelte4, isSvelte5 } from "../setup-tests";
import ListBoxSvelte4 from "./ListBox.test.svelte";
import ListBoxSvelte5 from "./ListBox.svelte5.test.svelte";

const ListBox = isSvelte5 ? ListBoxSvelte5 : ListBoxSvelte4;

describe("ListBox", () => {
  it("should render with default props", () => {
    render(ListBox);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(listbox).toHaveClass("bx--list-box");
  });

  it("should handle open state", () => {
    render(ListBox, { props: { open: true } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--list-box--expanded");
  });

  it("should handle closed state", () => {
    render(ListBox, { props: { open: false } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).not.toHaveClass("bx--list-box--expanded");
  });

  it("should handle disabled state", () => {
    render(ListBox, { props: { disabled: true } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--list-box--disabled");
  });

  it("should handle light variant", () => {
    render(ListBox, { props: { light: true } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--list-box--light");
  });

  it("should handle inline type", () => {
    render(ListBox, { props: { type: "inline" } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--list-box--inline");
  });

  it("should handle default type", () => {
    render(ListBox, { props: { type: "default" } });

    const listbox = screen.getByRole("listbox");
    expect(listbox).not.toHaveClass("bx--list-box--inline");
  });

  test.each([
    ["sm", "bx--list-box--sm"],
    ["xl", "bx--list-box--xl"],
  ] as const)("should handle size variants", (size, className) => {
    render(ListBox, { props: { size } });
    expect(screen.getByRole("listbox")).toHaveClass(className);
  });

  it("should handle invalid state", () => {
    render(ListBox, {
      props: {
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-invalid", "true");
    expect(screen.getByText("Invalid selection")).toBeInTheDocument();
    expect(screen.getByText("Invalid selection")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should handle warning state", () => {
    render(ListBox, {
      props: {
        warn: true,
        warnText: "Warning message",
      },
    });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveClass("bx--list-box--warning");
    expect(screen.getByText("Warning message")).toBeInTheDocument();
    expect(screen.getByText("Warning message")).toHaveClass(
      "bx--form-requirement",
    );
  });

  it("should prioritize invalid over warning", () => {
    render(ListBox, {
      props: {
        invalid: true,
        invalidText: "Invalid",
        warn: true,
        warnText: "Warning",
      },
    });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-invalid", "true");
    expect(listbox).not.toHaveClass("bx--list-box--warning");
    expect(screen.getByText("Invalid")).toBeInTheDocument();
    expect(screen.queryByText("Warning")).not.toBeInTheDocument();
  });

  it("should handle keydown events", async () => {
    const { component } = render(ListBox);
    const keydownHandler = vi.fn();

    component.$on("keydown", keydownHandler);

    const listbox = screen.getByRole("listbox");
    await user.click(listbox);
    await user.keyboard("{Escape}");

    expect(keydownHandler).toHaveBeenCalled();
  });

  it("should stop propagation of Escape key", async () => {
    const { container } = render(ListBox);
    const escapeHandler = vi.fn();

    container.addEventListener("keydown", escapeHandler);

    const listbox = screen.getByRole("listbox");
    await user.click(listbox);
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
    const { component } = render(ListBox);
    const clickHandler = vi.fn();

    component.$on("click", clickHandler);

    const listbox = screen.getByRole("listbox");
    await user.click(listbox);

    expect(clickHandler).toHaveBeenCalled();
  });

  it("should apply custom attributes", () => {
    render(ListBox, {
      props: {
        "data-testid": "custom-listbox",
      },
    });

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("data-testid", "custom-listbox");
  });
});
