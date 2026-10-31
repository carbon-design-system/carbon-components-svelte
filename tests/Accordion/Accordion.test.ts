import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import AccordionBatchDisable from "./Accordion.batch-disable.test.svelte";
import AccordionDisabledOpen from "./Accordion.disabled-open.test.svelte";
import AccordionDisabled from "./Accordion.disabled.test.svelte";
import AccordionLazy from "./Accordion.lazy.test.svelte";
import AccordionSingle from "./Accordion.single.test.svelte";
import AccordionSkeleton from "./Accordion.skeleton.test.svelte";
import Accordion from "./Accordion.test.svelte";
import AccordionItemExtra from "./AccordionItem.extra.test.svelte";

describe("Accordion", () => {
  const itemIsDisabled = (name: string | RegExp) => {
    expect(screen.getByRole("button", { name })).toBeDisabled();
  };

  const itemIsCollapsed = (name: string | RegExp) => {
    expect(screen.getByRole("button", { name })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  };

  const itemIsExpanded = (name: string | RegExp) => {
    expect(screen.getByRole("button", { name })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  };

  it("links the header button to its content region via aria-controls", () => {
    render(Accordion);

    const button = screen.getByRole("button", {
      name: /Natural Language Classifier/,
    });
    const contentId = button.getAttribute("aria-controls");
    assert(contentId);

    const content = document.getElementById(contentId);
    assert(content);
    expect(content).toHaveClass("bx--accordion__content");
    expect(content).toHaveTextContent("1");
  });

  it("renders and functions correctly", async () => {
    render(Accordion);

    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion"),
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    itemIsDisabled(/Natural Language Understanding/);

    const firstItem = screen.getByText("Natural Language Classifier");
    const lastItem = screen.getByText("Language Translator");

    await user.click(firstItem);
    itemIsExpanded(/Natural Language Classifier/);
    itemIsCollapsed(/Language Translator/);

    await user.click(lastItem);
    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Language Translator/);
  });

  it("programmatically expands and collapses all items", async () => {
    render(AccordionBatchDisable);

    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    const expandButton = screen.getByRole("button", { name: /Expand all/i });
    await user.click(expandButton);

    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Natural Language Understanding/);
    itemIsExpanded(/Language Translator/);

    expect(
      screen.getByRole("button", { name: /Collapse all/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Collapse all/i }));

    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);
  });

  it("disables all items when Accordion disabled prop is true", () => {
    render(AccordionDisabled);

    const item1 = screen.getByRole("button", {
      name: /Natural Language Classifier/,
    });
    const item2 = screen.getByRole("button", {
      name: /Natural Language Understanding/,
    });
    const item3 = screen.getByRole("button", { name: /Language Translator/ });

    expect(item1).toBeDisabled();
    expect(item2).toBeDisabled();
    expect(item3).toBeDisabled();
  });

  it("prevents items from being clicked when Accordion is disabled", async () => {
    render(AccordionDisabled);

    const item1 = screen.getByRole("button", {
      name: /Natural Language Classifier/,
    });

    await user.click(item1);

    itemIsCollapsed(/Natural Language Classifier/);
  });

  it("programmatically toggles disabled state and collapses items", async () => {
    render(AccordionBatchDisable);

    expect(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Natural Language Understanding/ }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Language Translator/ }),
    ).not.toBeDisabled();

    const expandButton = screen.getByRole("button", { name: /Expand all/i });
    await user.click(expandButton);

    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Natural Language Understanding/);
    itemIsExpanded(/Language Translator/);

    const disableButton = screen.getByRole("button", { name: /Disable all/i });
    await user.click(disableButton);

    itemIsDisabled(/Natural Language Classifier/);
    itemIsDisabled(/Natural Language Understanding/);
    itemIsDisabled(/Language Translator/);

    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    const enableButton = screen.getByRole("button", { name: /Enable all/i });
    await user.click(enableButton);

    expect(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Natural Language Understanding/ }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Language Translator/ }),
    ).not.toBeDisabled();
  });

  it("does not toggle an item when the Accordion is disabled", async () => {
    const onToggle = vi.fn();
    render(AccordionDisabledOpen, {
      props: { accordionDisabled: true, onToggle },
    });

    await user.click(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    );

    expect(onToggle).not.toHaveBeenCalled();
    itemIsCollapsed(/Natural Language Classifier/);
  });

  it("applies flush class to skeleton", () => {
    render(AccordionSkeleton, { props: { flush: true } });

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveClass("bx--accordion--flush");
  });

  it("renders skeleton", () => {
    render(AccordionSkeleton);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);

    expect(items[0]).toHaveAttribute(
      "class",
      expect.stringContaining(
        "bx--accordion__item bx--accordion__item--active",
      ),
    );

    expect(items[1]).toHaveAttribute(
      "class",
      expect.not.stringContaining("bx--accordion__item--active"),
    );
    expect(items[2]).toHaveAttribute(
      "class",
      expect.not.stringContaining("bx--accordion__item--active"),
    );
    expect(items[3]).toHaveAttribute(
      "class",
      expect.not.stringContaining("bx--accordion__item--active"),
    );
  });

  it("renders no active skeleton item when open is false", () => {
    render(AccordionSkeleton, { props: { open: false, count: 3 } });

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item).not.toHaveClass("bx--accordion__item--active");
    }
  });

  it("marks the item expanding on open and collapsing on close until the content's own animationend", async () => {
    render(Accordion);

    const button = screen.getByRole("button", {
      name: /Natural Language Classifier/,
    });
    const item = button.closest("li");
    const content = item?.querySelector(".bx--accordion__content");
    assert(item && content);

    await user.click(button);
    expect(item).toHaveClass("bx--accordion__item--expanding");
    await fireEvent.animationEnd(button);
    expect(item).toHaveClass("bx--accordion__item--expanding");
    await fireEvent.animationEnd(content);
    expect(item).not.toHaveClass("bx--accordion__item--expanding");

    await user.click(button);
    expect(item).toHaveClass("bx--accordion__item--collapsing");
    await fireEvent.animationEnd(content);
    expect(item).not.toHaveClass("bx--accordion__item--collapsing");
  });

  it.each([
    {
      name: "align start",
      props: { align: "start" as const },
      has: ["bx--accordion--start"],
      not: ["bx--accordion--end"],
    },
    {
      name: "no align (defaults to end)",
      props: {},
      has: ["bx--accordion--end"],
      not: ["bx--accordion--start"],
    },
    {
      name: "size sm",
      props: { size: "sm" as const },
      has: ["bx--accordion--sm"],
    },
    {
      name: "size xl",
      props: { size: "xl" as const },
      has: ["bx--accordion--xl"],
    },
    { name: "flush", props: { flush: true }, has: ["bx--accordion--flush"] },
    {
      name: "flush with align start",
      props: { flush: true, align: "start" as const },
      not: ["bx--accordion--flush"],
    },
  ] satisfies {
    name: string;
    props: Record<string, unknown>;
    has?: string[];
    not?: string[];
  }[])(
    "applies the expected classes: $name",
    ({ props, has = [], not = [] }) => {
      render(Accordion, { props });

      const accordion = screen.getByRole("list");
      for (const cls of has) expect(accordion).toHaveClass(cls);
      for (const cls of not) expect(accordion).not.toHaveClass(cls);
    },
  );

  it.each([
    {
      name: "Accordion",
      props: { customClass: "custom-accordion" },
      getElement: () => screen.getByRole("list"),
      custom: "custom-accordion",
      base: "bx--accordion",
    },
    {
      name: "AccordionItem",
      props: { itemClass: "custom-item" },
      getElement: () => screen.getByText("Language Translator").closest("li"),
      custom: "custom-item",
      base: "bx--accordion__item",
    },
  ])(
    "should apply custom class to $name",
    ({ props, getElement, custom, base }) => {
      render(Accordion, { props });

      const element = getElement();
      expect(element).toHaveClass(custom);
      expect(element).toHaveClass(base);
    },
  );

  it("should handle click events on Accordion", async () => {
    const onClick = vi.fn();
    render(Accordion, { props: { onClick } });

    const accordion = screen.getByRole("list");
    await user.click(accordion);

    expect(onClick).toHaveBeenCalled();
  });

  it("should handle mouse events on Accordion", async () => {
    const onMouseenter = vi.fn();
    const onMouseover = vi.fn();
    const onMouseleave = vi.fn();
    render(Accordion, { props: { onMouseenter, onMouseover, onMouseleave } });

    const accordion = screen.getByRole("list");
    await user.hover(accordion);

    expect(onMouseenter).toHaveBeenCalled();
    expect(onMouseover).toHaveBeenCalled();

    await user.unhover(accordion);
    expect(onMouseleave).toHaveBeenCalled();
  });

  it("should handle click events on AccordionItem", async () => {
    const onItemClick = vi.fn();
    render(Accordion, { props: { onItemClick } });

    const item = screen.getByText("Language Translator");
    await user.click(item);

    expect(onItemClick).toHaveBeenCalled();
  });

  it("should forward focus and blur from the heading button", () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(Accordion, { props: { onFocus, onBlur } });

    const button = screen.getByRole("button", { name: /Language Translator/ });
    button.focus();
    expect(onFocus).toHaveBeenCalled();

    button.blur();
    expect(onBlur).toHaveBeenCalled();
  });

  it("should render title slot", () => {
    render(Accordion, { props: { useSlot: true } });

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("does not render a literal 'title' heading by default", () => {
    const { container } = render(Accordion, { props: { noTitle: true } });

    const heading = container.querySelector(".bx--accordion__title");
    expect(heading?.textContent?.trim()).toBe("");
  });

  it("should forward Escape keydown without closing the item", async () => {
    const onKeydown = vi.fn();
    render(Accordion, { props: { onKeydown } });

    const item = screen.getByText("Language Translator");
    await user.click(item);

    itemIsExpanded(/Language Translator/);

    await user.keyboard("{Escape}");
    expect(onKeydown).toHaveBeenCalledWith("Escape");

    itemIsExpanded(/Language Translator/);
  });

  it("should expose ref to the heading button", () => {
    const { component } = render(Accordion);

    expect(component.ref).toBeInstanceOf(HTMLButtonElement);
    expect(component.ref).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion__heading"),
    );
  });

  it('closes other items when type is "single"', async () => {
    render(AccordionSingle);

    const firstItem = screen.getByText("Natural Language Classifier");
    const lastItem = screen.getByText("Language Translator");

    await user.click(firstItem);
    itemIsExpanded(/Natural Language Classifier/);

    await user.click(lastItem);
    itemIsExpanded(/Language Translator/);
    itemIsCollapsed(/Natural Language Classifier/);

    await user.click(lastItem);
    itemIsCollapsed(/Language Translator/);
  });

  it('lets an item inserted with open take over when type is "single"', async () => {
    const { rerender } = render(AccordionSingle);

    await user.click(screen.getByText("Language Translator"));
    await rerender({ showLate: true });

    itemIsExpanded(/Late/);
    itemIsCollapsed(/Language Translator/);
  });

  it('opens an item inserted with open after the open item unmounts when type is "single"', async () => {
    const { rerender } = render(AccordionSingle);

    await user.click(screen.getByText("Language Translator"));
    await rerender({ count: 2 });
    await rerender({ showLate: true });

    itemIsExpanded(/Late/);
  });

  it('closes the extra open panel when type changes from "multiple" to "single"', async () => {
    const { rerender } = render(AccordionSingle, {
      props: { type: "multiple", count: 2, open: true },
    });

    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Natural Language Understanding/);

    await rerender({ type: "single" });

    itemIsExpanded(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
  });

  it("should defer mounting panel content until first opened when lazy", async () => {
    const onContentMount = vi.fn();
    render(AccordionLazy, {
      props: { lazy: true, open: false, onContentMount },
    });

    expect(screen.queryByText("Lazy panel content")).not.toBeInTheDocument();
    expect(onContentMount).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    );

    expect(screen.getByText("Lazy panel content")).toBeInTheDocument();
    expect(onContentMount).toHaveBeenCalled();
    onContentMount.mockClear();

    // Collapsing keeps the content mounted (no remount on re-expand).
    await user.click(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    );
    await user.click(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    );

    expect(screen.getByText("Lazy panel content")).toBeInTheDocument();
    expect(onContentMount).not.toHaveBeenCalled();
  });

  it.each([
    { lazy: false, open: false },
    { lazy: true, open: true },
  ])(
    "should mount panel content immediately (lazy=$lazy, open=$open)",
    ({ lazy, open }) => {
      render(AccordionLazy, { props: { lazy, open } });

      expect(screen.getByText("Lazy panel content")).toBeInTheDocument();
    },
  );

  it("names an open panel as a region labelled by its header button", async () => {
    render(Accordion);

    const button = screen.getByRole("button", {
      name: /Natural Language Classifier/,
    });
    await user.click(button);

    const region = screen.getByRole("region", {
      name: /Natural Language Classifier/,
    });
    expect(region).toHaveAttribute("aria-labelledby", button.id);
  });

  it("does not expose role='region' on a closed panel", () => {
    render(Accordion);

    const closedButton = screen.getByRole("button", {
      name: /Language Translator/,
    });
    const contentId = closedButton.getAttribute("aria-controls");
    assert(contentId);

    const content = document.getElementById(contentId);
    assert(content);
    expect(content).not.toHaveAttribute("role", "region");
  });

  it("does not mount a disabled item as open", () => {
    render(AccordionDisabledOpen, { props: { open: true, disabled: true } });

    const item = screen.getByText("Natural Language Classifier").closest("li");
    expect(item).not.toHaveClass("bx--accordion__item--active");
  });

  it("closes an open item when it becomes disabled", async () => {
    render(AccordionDisabledOpen, { props: { open: true, disabled: false } });

    itemIsExpanded(/Natural Language Classifier/);

    await user.click(screen.getByRole("button", { name: /Toggle disabled/ }));

    itemIsCollapsed(/Natural Language Classifier/);
  });

  it("keeps an item disabled after the Accordion is disabled and re-enabled", async () => {
    const { rerender } = render(AccordionDisabledOpen);

    await rerender({ disabled: true });
    await rerender({ accordionDisabled: true });
    await rerender({ accordionDisabled: false });

    itemIsDisabled(/Natural Language Classifier/);
  });

  it("keeps a disabled, closed item closed on click", async () => {
    const onToggle = vi.fn();
    render(AccordionDisabledOpen, {
      props: { open: false, disabled: true, onToggle },
    });

    itemIsDisabled(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Classifier/);

    await user.click(
      screen.getByRole("button", { name: /Natural Language Classifier/ }),
    );

    expect(onToggle).not.toHaveBeenCalled();
    itemIsCollapsed(/Natural Language Classifier/);
  });

  it("should dispatch toggle with the next open state on click", async () => {
    const onToggle = vi.fn();
    render(Accordion, { props: { onToggle } });

    const item = screen.getByText("Language Translator");

    await user.click(item);
    expect(onToggle).toHaveBeenLastCalledWith(true);

    await user.click(item);
    expect(onToggle).toHaveBeenLastCalledWith(false);
  });

  it("should not dispatch toggle when mounted open", () => {
    const onToggle = vi.fn();
    render(AccordionLazy, { props: { open: true, onToggle } });

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("should not dispatch toggle when open changes via a parent-driven prop update", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(AccordionLazy, {
      props: { open: false, onToggle },
    });

    await rerender({ open: true });
    await rerender({ open: false });

    expect(onToggle).not.toHaveBeenCalled();
  });

  describe("extra slot", () => {
    it("renders extra content outside the heading button", () => {
      render(AccordionItemExtra);

      const heading = screen.getByRole("button", {
        name: /Natural Language Classifier/,
      });
      const extra = screen.getByText("3 errors");

      expect(extra).toBeInTheDocument();
      expect(heading).not.toContainElement(extra);
      expect(extra.closest(".bx--accordion__extra")).toBeInTheDocument();
    });

    it("does not toggle the item when extra content is clicked", async () => {
      render(AccordionItemExtra);

      itemIsCollapsed(/Natural Language Classifier/);

      await user.click(screen.getByRole("button", { name: "Manage" }));

      itemIsCollapsed(/Natural Language Classifier/);
    });

    it("still toggles the item from the heading button", async () => {
      render(AccordionItemExtra);

      const heading = screen.getByRole("button", {
        name: /Natural Language Classifier/,
      });

      await user.click(heading);
      itemIsExpanded(/Natural Language Classifier/);

      await user.click(heading);
      itemIsCollapsed(/Natural Language Classifier/);
    });

    it("does not render the header row without the slot", () => {
      const { container } = render(AccordionItemExtra, {
        props: { withExtra: false },
      });

      expect(
        container.querySelector(".bx--accordion__heading-row"),
      ).not.toBeInTheDocument();
      expect(
        container.querySelector(".bx--accordion__extra"),
      ).not.toBeInTheDocument();
    });
  });
});
