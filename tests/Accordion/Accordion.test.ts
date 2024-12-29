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

    // Test interaction with accordion items.
    const firstItem = screen.getByText("Natural Language Classifier");
    const lastItem = screen.getByText("Language Translator");

    // Click first item and verify content.
    await user.click(firstItem);
    itemIsExpanded(/Natural Language Classifier/);

    // Click last item and verify both contents are visible (testing multiple open items).
    await user.click(lastItem);
    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Language Translator/);
  });

  it("programmatically expands and collapses all items", async () => {
    render(AccordionProgrammatic);

    // Initially all items should be collapsed
    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);

    // Click expand button
    const expandButton = screen.getByRole("button", { name: /Expand all/i });
    await user.click(expandButton);

    // Verify all items are expanded
    itemIsExpanded(/Natural Language Classifier/);
    itemIsExpanded(/Natural Language Understanding/);
    itemIsExpanded(/Language Translator/);

    expect(
      screen.getByRole("button", { name: /Collapse all/i }),
    ).toBeInTheDocument();

    // Click collapse button.
    await user.click(screen.getByRole("button", { name: /Collapse all/i }));

    // Verify all items are collapsed again.
    itemIsCollapsed(/Natural Language Classifier/);
    itemIsCollapsed(/Natural Language Understanding/);
    itemIsCollapsed(/Language Translator/);
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
});
