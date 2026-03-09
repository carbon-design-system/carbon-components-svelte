import { render, screen } from "@testing-library/svelte";
import type TagComponent from "carbon-components-svelte/Tag/Tag.svelte";
import type { ComponentProps } from "svelte";
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

    const colors = [
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
    ];
    for (const color of colors) {
      const tag = screen.getByText(color);
      expect(tag.parentElement).toHaveClass(`bx--tag--${color}`);
    }
  });

  it("renders and handles filterable tag correctly", async () => {
    const consoleLog = vi.spyOn(console, "log");

    render(Tag);

    const filterableTag = screen.getByText("Filterable");
    expect(filterableTag).toHaveClass("bx--tag--filter");

    const tagElement = filterableTag.closest(".bx--tag--filter");
    assert(tagElement);
    const closeButton = tagElement.querySelector(".bx--tag__close-icon");
    assert(closeButton instanceof HTMLElement);
    expect(closeButton).toHaveAttribute("title", "Clear filter");

    await user.click(closeButton);
    expect(consoleLog).toHaveBeenCalledWith("close");
  });

  it("fires click event when clicking filterable tag body", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Tag);

    const tagBody = screen.getByText("Filter click and close");
    await user.click(tagBody);
    expect(consoleLog).toHaveBeenCalledWith("filter-body-click");
    expect(consoleLog).not.toHaveBeenCalledWith("filter-close");
  });

  it("fires only close event when clicking filterable tag close button", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(Tag);

    const tagElement = screen
      .getByText("Filter click and close")
      .closest(".bx--tag--filter");
    assert(tagElement);
    const closeButton = tagElement.querySelector(".bx--tag__close-icon");
    assert(closeButton instanceof HTMLElement);

    await user.click(closeButton);
    expect(consoleLog).toHaveBeenCalledWith("filter-close");
    expect(consoleLog).not.toHaveBeenCalledWith("filter-body-click");
  });

  it("renders custom icon tag correctly", () => {
    render(Tag);

    const iconTag = screen.getByText("Custom icon");
    const tagElement = iconTag.closest(".bx--tag");
    assert(tagElement);
    const iconContainer = tagElement.querySelector(".bx--tag__custom-icon");
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

    const closeButton = screen.getByRole("button", { name: /custom title/i });
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
    const tagElement = iconTag.closest(".bx--tag");
    assert(tagElement);
    const iconContainer = tagElement.querySelector(".bx--tag__custom-icon");
    expect(iconContainer).toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = TagComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = TagComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
