import { render, screen } from "@testing-library/svelte";
import type TagComponent from "carbon-components-svelte/Tag/Tag.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import Tag from "./Tag.test.svelte";
import TagMaxWidth from "./TagMaxWidth.test.svelte";
import TagSkeleton from "./TagSkeleton.test.svelte";

describe("Tag", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

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
    const consoleLog = vi.spyOn(console, "log");

    render(Tag);

    const filterableTag = screen.getByText("Filterable");
    expect(filterableTag.closest(".bx--tag")).toHaveClass("bx--tag--filter");

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

  it("renders large size variant", () => {
    render(Tag);

    const largeTag = screen.getByText("Large tag");
    expect(largeTag.parentElement).toHaveClass("bx--tag--lg");
  });

  it("renders large filterable tag", () => {
    render(Tag);

    const largeFilterable = screen
      .getByText("Large filterable")
      .closest(".bx--tag");
    expect(largeFilterable).toHaveClass("bx--tag--lg");
    expect(largeFilterable).toHaveClass("bx--tag--filter");
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

  it("omits the default margin via the inline prop", () => {
    render(Tag);

    const inlineTag = screen.getByText("Inline tag").parentElement;
    expect(inlineTag).toHaveClass("bx--tag--inline");
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

  describe("maxWidth truncation", () => {
    let clientWidthSpy: ReturnType<typeof vi.spyOn>;
    let scrollWidthSpy: ReturnType<typeof vi.spyOn>;

    function mockOverflow(truncated: boolean) {
      clientWidthSpy = vi
        .spyOn(HTMLElement.prototype, "clientWidth", "get")
        .mockReturnValue(truncated ? 40 : 200);
      scrollWidthSpy = vi
        .spyOn(HTMLElement.prototype, "scrollWidth", "get")
        .mockReturnValue(truncated ? 200 : 40);
    }

    afterEach(() => {
      clientWidthSpy?.mockRestore();
      scrollWidthSpy?.mockRestore();
    });

    it("applies the truncate class and max-width style", async () => {
      mockOverflow(false);
      render(TagMaxWidth, {
        props: { maxWidth: "8rem", label: "Short", filter: true },
      });
      await tick();

      const tag = screen.getByText("Short").closest(".bx--tag");
      expect(tag).toHaveClass("bx--tag--truncate");
      expectInlineStyle(tag, { maxWidth: "8rem" });
    });

    it("does not render a tooltip when the label is not truncated", async () => {
      mockOverflow(false);
      render(TagMaxWidth, {
        props: { maxWidth: "8rem", label: "Short", filter: true },
      });
      await tick();

      expect(
        document.querySelector(".bx--tooltip--definition"),
      ).not.toBeInTheDocument();
    });

    it("renders a tooltip when the filter label overflows", async () => {
      mockOverflow(true);
      const label =
        "status:active AND region:us-south AND service:cloud-object-storage";
      render(TagMaxWidth, {
        props: { maxWidth: "8rem", label, filter: true },
      });
      await tick();
      // Wrapping the label remounts it; wait for the post-measure update.
      await tick();

      const tooltip = document.querySelector(".bx--tooltip--definition");
      expect(tooltip).toBeInTheDocument();
      expect(
        tooltip?.querySelector(".bx--tooltip__trigger")?.textContent?.trim(),
      ).toBe(label);
    });
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

  describe("TagSkeleton", () => {
    let consoleLog: Console["log"];

    beforeEach(() => {
      consoleLog = vi.spyOn(console, "log");
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should render with default props", () => {
      const { container } = render(TagSkeleton);

      const skeleton = container.querySelector(".bx--tag");
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass("bx--skeleton");
      expect(skeleton).toHaveClass("bx--tag");
    });

    it("should render with sm size", () => {
      const { container } = render(TagSkeleton, { props: { size: "sm" } });

      const skeleton = container.querySelector(".bx--tag");
      expect(skeleton).toHaveClass("bx--tag--sm");
    });

    it("should render with lg size", () => {
      const { container } = render(TagSkeleton, { props: { size: "lg" } });

      const skeleton = container.querySelector(".bx--tag");
      expect(skeleton).toHaveClass("bx--tag--lg");
    });

    it("does not forward click but forwards mouse events", async () => {
      const { container } = render(TagSkeleton);

      const skeleton = container.querySelector(".bx--tag");
      if (!skeleton) {
        throw new Error("Skeleton not found");
      }

      await user.click(skeleton);
      expect(consoleLog).not.toHaveBeenCalledWith("click");

      await user.hover(skeleton);
      expect(consoleLog).toHaveBeenCalledWith("mouseover");

      await user.unhover(skeleton);
      expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    });
  });
});
