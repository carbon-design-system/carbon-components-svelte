import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import Tag from "./Tag.test.svelte";

describe("Tag", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders all tag variants with correct styles", () => {
    render(Tag);

    const basicTag = screen.getByText("IBM Cloud");
    expect(basicTag.parentElement).toHaveClass("my-class");
    expect(basicTag.parentElement).toHaveStyle({ margin: "1rem" });

    [
      "red",
      "magenta",
      "purple",
      "blue",
      "cyan",
      "teal",
      "green",
      "gray",
      "cool-gray",
      "warm-gray",
      "high-contrast",
      "outline",
    ].forEach((color) => {
      const tag = screen.getByText(color);
      expect(tag.parentElement).toHaveClass(`bx--tag--${color}`);
    });
  });

  it("renders and handles filterable tag correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(Tag);

    const filterableTag = screen.getByText("Filterable");
    expect(filterableTag).toHaveClass("bx--tag--filter");

    const closeButton = filterableTag.querySelector("button");
    assert(closeButton);
    expect(closeButton).toHaveClass("bx--tag__close-icon");
    expect(closeButton).toHaveAttribute("title", "Clear filter");

    await user.click(closeButton);
    expect(consoleLog).toHaveBeenCalledWith("close");
    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("renders custom icon tag correctly", () => {
    render(Tag);

    const iconTag = screen.getByText("Custom icon");
    const iconContainer = iconTag.parentElement?.querySelector(
      ".bx--tag__custom-icon",
    );
    expect(iconContainer).toBeInTheDocument();
  });

  it("renders interactive tag as a button", () => {
    render(Tag);

    const interactiveTag = screen.getByRole("button", { name: "Text" });
    expect(interactiveTag).toHaveClass("bx--tag--interactive");
  });

  it("renders skeleton state", () => {
    render(Tag);

    const skeleton = document.querySelector(".bx--skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("handles click events on interactive tag", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Tag);

    const interactiveTag = screen.getByRole("button", { name: "Text" });
    await user.click(interactiveTag);
    expect(consoleLog).toHaveBeenCalledWith("click");
  });

  it("renders small size variant", () => {
    render(Tag);

    const smallTag = screen.getByText("Small tag");
    expect(smallTag.parentElement).toHaveClass("bx--tag--sm");
  });

  it("renders disabled filterable tag", () => {
    render(Tag);

    const disabledTag = screen.getByText("Disabled filterable");
    expect(disabledTag).toHaveClass("bx--tag--disabled");

    const closeButton = disabledTag.querySelector("button");
    expect(closeButton).toBeDisabled();
    expect(closeButton).toHaveAttribute("title", "Custom title");
  });

  it("renders disabled interactive tag", () => {
    render(Tag);

    const disabledTag = screen.getByRole("button", {
      name: "Disabled interactive",
    });
    expect(disabledTag).toHaveClass("bx--tag--disabled");
    expect(disabledTag).toBeDisabled();
    expect(disabledTag).toHaveAttribute("aria-disabled", "true");
    expect(disabledTag).toHaveAttribute("tabindex", "-1");
  });

  it("applies custom id", () => {
    render(Tag);

    const customIdTag = screen.getByText("Custom ID tag").parentElement;
    expect(customIdTag).toHaveAttribute("id", "custom-tag-id");
  });

  it("handles mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Tag);

    const tag = screen.getByText("Mouse events").parentElement;
    assert(tag);

    await user.hover(tag);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(tag);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });

  it("renders icon slot", () => {
    render(Tag);

    const iconTag = screen.getByText("Icon slot");
    const iconContainer = iconTag.parentElement?.querySelector(
      ".bx--tag__custom-icon",
    );
    expect(iconContainer).toBeInTheDocument();
  });
});
