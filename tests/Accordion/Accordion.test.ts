import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import AccordionDisabled from "./Accordion.disabled.test.svelte";
import AccordionProgrammatic from "./Accordion.programmatic.test.svelte";
import AccordionSkeleton from "./Accordion.skeleton.test.svelte";
import Accordion from "./Accordion.test.svelte";

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

  it("renders and functions correctly", async () => {
    render(Accordion);

    // Initial items are collapsed.
    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    // Check ARIA attributes and structure.
    const accordion = screen.getByRole("list");
    expect(accordion).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion"),
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    // Check disabled state.
    itemIsDisabled(/Natural Language Understanding/);

    // Verify children content is visible initially (expanded state)
    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    // Test interaction with accordion items.
    const firstItem = screen.getByText("Natural Language Classifier");
    const lastItem = screen.getByText("Language Translator");

    // Click first item and verify content.
    await user.click(firstItem);
    itemIsExpanded(/Natural Language Classifier/);
    expect(screen.getByText("1")).toBeVisible();

    // Click last item and verify both contents are visible (testing multiple open items).
    await user.click(lastItem);
    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Language Translator/);
    expect(screen.getByText("1")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
  });

  it("programmatically expands and collapses all items", async () => {
    render(AccordionProgrammatic);

    // Initially all items should be collapsed
    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    expect(
      screen.queryByText(
        "Natural Language Classifier uses advanced natural language processing",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Analyze text to extract meta-data"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Translate text, documents, and websites"),
    ).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByRole("button", { name: /Expand all/i });
    await user.click(expandButton);

    // Verify all items are expanded
    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Natural Language Understanding/);
    itemIsExpanded(/Language Translator/);

    // Verify all children content is visible when expanded
    expect(screen.getByText(/Natural Language Classifier uses/)).toBeVisible();
    expect(screen.getByText(/Analyze text to extract meta-data/)).toBeVisible();
    expect(
      screen.getByText(/Translate text, documents, and websites/),
    ).toBeVisible();

    expect(
      screen.getByRole("button", { name: /Collapse all/i }),
    ).toBeInTheDocument();

    // Click collapse button.
    await user.click(screen.getByRole("button", { name: /Collapse all/i }));

    // Verify all items are collapsed again.
    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    // Verify children content is hidden again when collapsed
    expect(
      screen.queryByText(
        "Natural Language Classifier uses advanced natural language processing",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Analyze text to extract meta-data"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Translate text, documents, and websites"),
    ).not.toBeInTheDocument();
  });

  it("is all disabled", async () => {
    render(AccordionDisabled);

    itemIsDisabled(/Natural Language Classifier/);
    itemIsDisabled(/Natural Language Understanding/);
    itemIsDisabled(/Language Translator/);
  });

  it("renders skeleton", async () => {
    render(AccordionSkeleton);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);

    // First item is open.
    expect(items[0]).toHaveAttribute(
      "class",
      expect.stringContaining(
        "bx--accordion__item bx--accordion__item--active",
      ),
    );

    // All other items are collapsed.
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

  it("applies left-aligned chevron styling", () => {
    render(Accordion, { props: { align: "start" } });

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--start"),
    );
    expect(accordion).not.toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--end"),
    );
  });

  it("applies right-aligned chevron styling", () => {
    render(Accordion, { props: { align: "end" } });

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--end"),
    );
    expect(accordion).not.toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--start"),
    );
  });

  it("defaults to right-aligned chevron when no align prop is specified", () => {
    render(Accordion);

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--end"),
    );
    expect(accordion).not.toHaveAttribute(
      "class",
      expect.stringContaining("bx--accordion--start"),
    );
  });

  test.each([
    ["sm", "bx--accordion--sm"],
    ["xl", "bx--accordion--xl"],
  ] as const)("should support %s size", (size, expectedClass) => {
    render(Accordion, { props: { size } });

    const accordion = screen.getByRole("list");
    expect(accordion).toHaveClass(expectedClass);
  });

  it("should not apply size classes when size is undefined", () => {
    render(Accordion, { props: { size: undefined } });

    const accordion = screen.getByRole("list");
    expect(accordion).not.toHaveClass("bx--accordion--sm");
    expect(accordion).not.toHaveClass("bx--accordion--xl");
  });
});
