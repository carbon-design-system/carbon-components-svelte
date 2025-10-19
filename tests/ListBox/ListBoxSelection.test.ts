import { render, screen } from "@testing-library/svelte";
import { user, isSvelte4, isSvelte5 } from "../setup-tests";
import ListBoxSelectionSvelte4 from "./ListBoxSelection.test.svelte";
import ListBoxSelectionSvelte5 from "./ListBoxSelection.svelte5.test.svelte";

const ListBoxSelection = isSvelte5
  ? ListBoxSelectionSvelte5
  : ListBoxSelectionSvelte4;

describe("ListBoxSelection", () => {
  it("should render single selection button", () => {
    render(ListBoxSelection);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bx--list-box__selection");
    expect(button).toHaveAttribute("aria-label", "Clear selected item");
  });

  it("should render multi selection tag when selectionCount is provided", () => {
    render(ListBoxSelection, { props: { selectionCount: 3 } });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(document.querySelector(".bx--tag")).toBeInTheDocument();
    expect(document.querySelector(".bx--tag--filter")).toBeInTheDocument();
  });

  it("should handle disabled state for single selection", () => {
    render(ListBoxSelection, { props: { disabled: true } });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("tabindex", "-1");
  });

  it("should handle enabled state for single selection", () => {
    render(ListBoxSelection, { props: { disabled: false } });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("tabindex", "0");
  });

  it("should handle disabled state for multi selection", () => {
    render(ListBoxSelection, {
      props: {
        selectionCount: 2,
        disabled: true,
      },
    });

    const tag = document.querySelector(".bx--tag");
    expect(tag).toHaveClass("bx--tag--disabled");
  });

  it("should dispatch clear event on single selection click", async () => {
    const { component } = render(ListBoxSelection);
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    await user.click(screen.getByRole("button"));

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should dispatch clear event on multi selection click", async () => {
    const { component } = render(ListBoxSelection, {
      props: { selectionCount: 2 },
    });
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const closeIcon = document.querySelector(".bx--tag__close-icon");
    assert(closeIcon);
    await user.click(closeIcon);

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should not dispatch clear event when disabled (single)", async () => {
    const { component } = render(ListBoxSelection, {
      props: { disabled: true },
    });
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    await user.click(screen.getByRole("button"));

    expect(clearHandler).not.toHaveBeenCalled();
  });

  it("should not dispatch clear event when disabled (multi)", async () => {
    const { component } = render(ListBoxSelection, {
      props: {
        selectionCount: 2,
        disabled: true,
      },
    });
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const closeIcon = document.querySelector(".bx--tag__close-icon");
    assert(closeIcon);
    await user.click(closeIcon);

    expect(clearHandler).not.toHaveBeenCalled();
  });

  it("should handle keyboard Enter on single selection", async () => {
    const { component } = render(ListBoxSelection);
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard("{Enter}");

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should handle keyboard Space on single selection", async () => {
    const { component } = render(ListBoxSelection);
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const button = screen.getByRole("button");
    button.focus();
    await user.keyboard(" ");

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should handle keyboard Enter on multi selection", async () => {
    const { component } = render(ListBoxSelection, {
      props: { selectionCount: 2 },
    });
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const closeIcon = document.querySelector(".bx--tag__close-icon");
    assert(closeIcon);
    closeIcon.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should handle keyboard Space on multi selection", async () => {
    const { component } = render(ListBoxSelection, {
      props: { selectionCount: 2 },
    });
    const clearHandler = vi.fn();

    component.$on("clear", clearHandler);

    const closeIcon = document.querySelector(".bx--tag__close-icon");
    assert(closeIcon);
    closeIcon.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    );

    expect(clearHandler).toHaveBeenCalled();
  });

  it("should use custom translations when translateWithId is provided", async () => {
    const customTranslations = {
      clearSelection: "Remove item",
      clearAll: "Remove all",
    } as const;

    const { component } = render(ListBoxSelection, {
      props: {
        translateWithId: (id) => customTranslations[id],
      },
    });

    let button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Remove item");
    expect(button).toHaveAttribute("title", "Remove item");

    component.selectionCount = 3;
    await user.click(document.body); // trigger update

    const closeIcon = document.querySelector(".bx--tag__close-icon");
    expect(closeIcon).toHaveAttribute("aria-label", "Remove all");
    expect(closeIcon).toHaveAttribute("title", "Remove all");
  });

  it("should show selection count in tag label", () => {
    render(ListBoxSelection, { props: { selectionCount: 5 } });

    const label = document.querySelector(".bx--tag__label");
    expect(label).toHaveTextContent("5");
    expect(label).toHaveAttribute("title", "5");
  });

  it("should render close icon", () => {
    render(ListBoxSelection);

    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should expose ref for single selection", () => {
    const { component } = render(ListBoxSelection);

    expect(component.ref).toBeInstanceOf(HTMLDivElement);
  });

  it("should expose ref for multi selection", () => {
    const { component } = render(ListBoxSelection, {
      props: { selectionCount: 2 },
    });

    expect(component.ref).toBeInstanceOf(HTMLDivElement);
  });

  it("should stop propagation of click event", async () => {
    const { container } = render(ListBoxSelection);
    const clickHandler = vi.fn();

    container.addEventListener("click", clickHandler);

    await user.click(screen.getByRole("button"));

    expect(clickHandler).not.toHaveBeenCalled();
  });

  it("should stop propagation of keydown event", () => {
    const { container } = render(ListBoxSelection);
    const keydownHandler = vi.fn();

    container.addEventListener("keydown", keydownHandler);

    const button = screen.getByRole("button");
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );

    expect(keydownHandler).not.toHaveBeenCalled();
  });

  it("should prevent default on click", async () => {
    render(ListBoxSelection);

    const button = screen.getByRole("button");
    const clickEvent = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    });

    button.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it("should apply custom attributes", () => {
    render(ListBoxSelection, {
      props: {
        "data-testid": "custom-selection",
      },
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "custom-selection");
  });
});
