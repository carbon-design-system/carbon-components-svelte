import { render, screen } from "@testing-library/svelte";
import TagComponent from "carbon-components-svelte/Tag/Tag.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { openTooltips } from "../utils/open-tooltips";
import { user } from "../utils/user";
import Tag from "./Tag.test.svelte";

describe("Tag", () => {
  it("renders all tag variants with correct styles", () => {
    render(Tag);

    const basicTag = screen.getByText("IBM Cloud");
    expect(basicTag.parentElement).toHaveClass("my-class");
    expectInlineStyle(basicTag.parentElement, { margin: "1rem" });

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
    const onFilterClose = vi.fn();

    render(Tag, { onFilterClose });

    const filterableTag = screen.getByText("Filterable");
    expect(filterableTag.closest(".bx--tag")).toHaveClass("bx--tag--filter");

    const tagElement = filterableTag.closest(".bx--tag--filter");
    assert(tagElement);
    const closeButton = tagElement.querySelector(".bx--tag__close-icon");
    assert(closeButton instanceof HTMLElement);
    // A tooltip shows the label, so no native `title` doubles it.
    expect(closeButton).not.toHaveAttribute("title");

    await user.click(closeButton);
    expect(onFilterClose).toHaveBeenCalled();
  });

  it("names each filter close button with its title and tag text", () => {
    render(Tag);

    expect(
      screen.getByRole("button", { name: "Clear filter Filterable" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Custom title Disabled filterable" }),
    ).toBeInTheDocument();
  });

  it("shows the close button's title in a tooltip on focus, unless disabled", async () => {
    render(Tag);

    screen.getByRole("button", { name: "Clear filter Filterable" }).focus();
    await tick();
    expect(openTooltips().map((tooltip) => tooltip.textContent)).toEqual([
      "Clear filter",
    ]);

    // Escape hides it; with the button focused, the key goes on too.
    await user.keyboard("{Escape}");
    expect(openTooltips()).toHaveLength(0);

    const disabled = screen.getByRole("button", {
      name: "Custom title Disabled filterable",
    });
    await user.hover(disabled);
    expect(openTooltips()).toHaveLength(0);
  });

  it("moves aria-label from the role-less filter tag wrapper to the close button", () => {
    render(TagComponent, {
      props: { filter: true, "aria-label": "Region" },
    });

    expect(document.querySelector(".bx--tag")).not.toHaveAttribute(
      "aria-label",
    );
    expect(screen.getByRole("button", { name: "Region" })).toBeInTheDocument();
  });

  it("fires click event when clicking filterable tag body", async () => {
    const onBodyClick = vi.fn();
    const onBodyClose = vi.fn();
    render(Tag, { onBodyClick, onBodyClose });

    const tagBody = screen.getByText("Filter click and close");
    await user.click(tagBody);
    expect(onBodyClick).toHaveBeenCalled();
    expect(onBodyClose).not.toHaveBeenCalled();
  });

  it("fires only close event when clicking filterable tag close button", async () => {
    const onBodyClick = vi.fn();
    const onBodyClose = vi.fn();
    render(Tag, { onBodyClick, onBodyClose });

    const tagElement = screen
      .getByText("Filter click and close")
      .closest(".bx--tag--filter");
    assert(tagElement);
    const closeButton = tagElement.querySelector(".bx--tag__close-icon");
    assert(closeButton instanceof HTMLElement);

    await user.click(closeButton);
    expect(onBodyClose).toHaveBeenCalled();
    expect(onBodyClick).not.toHaveBeenCalled();
  });

  it("renders custom icon tag correctly", () => {
    render(Tag);

    const iconTag = screen.getByText("Custom icon");
    const tagElement = iconTag.closest(".bx--tag");
    assert(tagElement);
    const iconContainer = tagElement.querySelector(".bx--tag__custom-icon");
    expect(iconContainer).toBeInTheDocument();
  });

  it("marks tags with an icon for the tighter leading padding", () => {
    render(Tag);

    expect(screen.getByText("Custom icon").closest(".bx--tag")).toHaveClass(
      "bx--tag--with-icon",
    );
    expect(screen.getByText("Icon slot").closest(".bx--tag")).toHaveClass(
      "bx--tag--with-icon",
    );
    expect(screen.getByText("IBM Cloud").closest(".bx--tag")).not.toHaveClass(
      "bx--tag--with-icon",
    );
  });

  it("renders interactive tag as a button", () => {
    render(Tag);

    const interactiveTag = screen.getByRole("button", { name: "Text" });
    expect(interactiveTag).toHaveClass("bx--tag--interactive");
  });

  it("renders href tag as an anchor with interactive styles", () => {
    render(Tag);

    const linkedTag = screen.getByRole("link", { name: "Linked tag" });
    expect(linkedTag).toHaveAttribute("href", "/filtered?tag=ml");
    expect(linkedTag).toHaveClass("bx--tag");
    expect(linkedTag).toHaveClass("bx--tag--interactive");
    expect(linkedTag).toHaveClass("bx--tag--blue");
  });

  it("forwards target and sets rel for blank targets", () => {
    render(Tag);

    const linkedTag = screen.getByRole("link", { name: "External linked tag" });
    expect(linkedTag).toHaveAttribute("target", "_blank");
    expect(linkedTag).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("disables href navigation when disabled", () => {
    render(Tag);

    const linkedTag = screen
      .getByText("Disabled linked tag")
      .closest(".bx--tag");
    assert(linkedTag);
    expect(linkedTag.tagName).toBe("A");
    expect(linkedTag).not.toHaveAttribute("href");
    expect(linkedTag).toHaveAttribute("role", "link");
    expect(linkedTag).toHaveAttribute("aria-disabled", "true");
    expect(linkedTag).not.toHaveAttribute("tabindex");
    expect(linkedTag).toHaveClass("bx--tag--disabled");
  });

  it("prefers filter over href when both are set", () => {
    render(Tag);

    const filterTag = screen
      .getByText("Filter wins over href")
      .closest(".bx--tag");
    assert(filterTag);
    expect(filterTag.tagName).toBe("DIV");
    expect(filterTag).toHaveClass("bx--tag--filter");
    expect(filterTag).not.toHaveAttribute("href");
    expect(
      screen.queryByRole("link", { name: "Filter wins over href" }),
    ).not.toBeInTheDocument();
  });

  it("renders skeleton state", () => {
    render(Tag);

    const skeleton = document.querySelector(".bx--skeleton");
    expect(skeleton).toBeInTheDocument();
  });

  it("handles click events on interactive tag", async () => {
    const onInteractiveClick = vi.fn();
    const onFilterClick = vi.fn();
    render(Tag, { onInteractiveClick, onFilterClick });

    const interactiveTag = screen.getByRole("button", { name: "Text" });
    await user.click(interactiveTag);
    expect(onInteractiveClick).toHaveBeenCalled();
    expect(onFilterClick).not.toHaveBeenCalled();
  });

  it.each([
    ["Small tag", "bx--tag--sm"],
    ["Large tag", "bx--tag--lg"],
    ["Large filterable", "bx--tag--lg"],
    ["Large filterable", "bx--tag--filter"],
    ["Inline tag", "bx--tag--inline"],
  ])("%s has %s", (label, cls) => {
    render(Tag);

    expect(screen.getByText(label).closest(".bx--tag")).toHaveClass(cls);
  });

  it("renders large skeleton tag", () => {
    render(Tag);

    const skeletons = document.querySelectorAll(".bx--skeleton");
    const largeSkeleton = Array.from(skeletons).find((el) =>
      el.classList.contains("bx--tag--lg"),
    );
    expect(largeSkeleton).toBeInTheDocument();
  });

  it("renders disabled filterable tag", () => {
    render(Tag);

    const disabledTag = screen
      .getByText("Disabled filterable")
      .closest(".bx--tag");
    expect(disabledTag).toHaveClass("bx--tag--disabled");

    const closeButton = screen.getByRole("button", { name: /custom title/i });
    expect(closeButton).toBeDisabled();
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

  it("handles mouse events", async () => {
    const onMouseenter = vi.fn();
    const onMouseover = vi.fn();
    const onMouseleave = vi.fn();
    render(Tag, { onMouseenter, onMouseover, onMouseleave });

    const tag = screen.getByText("Mouse events").parentElement;
    assert(tag);

    await user.hover(tag);
    expect(onMouseenter).toHaveBeenCalled();
    expect(onMouseover).toHaveBeenCalled();

    await user.unhover(tag);
    expect(onMouseleave).toHaveBeenCalled();
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
