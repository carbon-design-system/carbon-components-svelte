import { render, screen } from "@testing-library/svelte";
import { MultiSelect } from "carbon-components-svelte";
import { user } from "../setup-tests";

describe("MultiSelect sorts items correctly", () => {
  /** Opens the dropdown. */
  const openMenu = async () =>
    await user.click(
      await screen.findByLabelText("Open menu", {
        selector: `[role="button"]`,
      }),
    );

  /** Closes the dropdown. */
  const closeMenu = async () =>
    await user.click(
      await screen.findByLabelText("Close menu", {
        selector: `[role="button"]`,
      }),
    );

  /** Toggles an option, identifying it by its `text` value. */
  const toggleOption = async (optionText: string) =>
    await user.click(
      await screen.findByText((text) => text.trim() === optionText),
    );

  /** Fetches the `text` value of the nth option in the MultiSelect component. */
  const nthRenderedOptionText = (index: number) =>
    screen.queryAllByRole("option").at(index)?.textContent?.trim();

  it("initially sorts items alphabetically", async () => {
    render(MultiSelect, {
      items: [
        { id: "1", text: "C" },
        { id: "3", text: "A" },
        { id: "2", text: "B" },
      ],
    });

    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");
    expect(nthRenderedOptionText(1)).toBe("B");
    expect(nthRenderedOptionText(2)).toBe("C");
  });

  it("immediately moves selected items to the top (with selectionFeedback: top)", async () => {
    render(MultiSelect, {
      items: [
        { id: "3", text: "C" },
        { id: "1", text: "A" },
        { id: "2", text: "B" },
      ],
      selectionFeedback: "top",
    });

    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");

    await toggleOption("C");
    expect(nthRenderedOptionText(0)).toBe("C");

    await toggleOption("C");
    expect(nthRenderedOptionText(0)).toBe("A");
  });

  it("sorts newly-toggled items only after the dropdown is reoponed (with selectionFeedback: top-after-reopen)", async () => {
    render(MultiSelect, {
      items: [
        { id: "3", text: "C" },
        { id: "1", text: "A" },
        { id: "2", text: "B" },
      ],
    });

    // Initially, items should be sorted alphabetically.
    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");

    // While the menu is still open, a newly-selected item should not move.
    await toggleOption("C");
    expect(nthRenderedOptionText(0)).toBe("A");

    // The newly-selected item should move after the menu is closed and
    // re-opened.
    await closeMenu();
    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("C");

    // A deselected item should not move while the dropdown is still open.
    await toggleOption("C");
    expect(nthRenderedOptionText(0)).toBe("C");

    // The deselected item should move after closing and re-opening the dropdown.
    await closeMenu();
    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");
  });

  it("never moves selected items to the top (with selectionFeedback: fixed)", async () => {
    render(MultiSelect, {
      items: [
        { id: "3", text: "C" },
        { id: "1", text: "A" },
        { id: "2", text: "B" },
      ],
      selectionFeedback: "fixed",
    });

    // Items should be sorted alphabetically.
    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");

    // A newly-selected item should not move after the selection is made.
    await toggleOption("C");
    expect(nthRenderedOptionText(0)).toBe("A");

    // The newly-selected item also shouldn’t move after the dropdown is closed
    // and reopened.
    await closeMenu();
    await openMenu();
    expect(nthRenderedOptionText(0)).toBe("A");
  });
});
