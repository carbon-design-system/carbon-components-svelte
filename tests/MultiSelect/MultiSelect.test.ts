import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { fuzzyMatch } from "carbon-components-svelte/utils/fuzzyMatch";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import MultiSelectFluidForm from "./MultiSelect.fluidForm.test.svelte";
import MultiSelectFluidSkeleton from "./MultiSelect.fluidSkeleton.test.svelte";
import MultiSelectFluidSlot from "./MultiSelect.fluidSlot.test.svelte";
import MultiSelectLabelSlot from "./MultiSelect.slot.test.svelte";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectBindValue from "./MultiSelectBindValue.test.svelte";
import MultiSelectDuplicateIds from "./MultiSelectDuplicateIds.test.svelte";
import MultiSelectGenerics from "./MultiSelectGenerics.test.svelte";
import MultiSelectInModal from "./MultiSelectInModal.test.svelte";
import MultiSelectItemSlot from "./MultiSelectItemSlot.test.svelte";
import MultiSelectItemToStringId from "./MultiSelectItemToStringId.test.svelte";
import MultiSelectSlot from "./MultiSelectSlot.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
  const openMenu = async () =>
    await user.click(
      await screen.findByLabelText("Open menu", {
        selector: `[role="combobox"]`,
      }),
    );

  const closeMenu = async () =>
    await user.click(
      await screen.findByLabelText("Close menu", {
        selector: `[role="combobox"]`,
      }),
    );

  const toggleOption = async (optionText: string) =>
    await user.click(
      await screen.findByText((text) => text.trim() === optionText),
    );

  const nthRenderedOptionText = (index: number) =>
    screen.queryAllByRole("option").at(index)?.textContent?.trim();

  it("renders with default props", () => {
    render(MultiSelect, {
      props: {
        items,
        labelText: "Contact methods",
      },
    });

    expect(screen.getByText("Contact methods")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("renders default slot", () => {
    render(MultiSelectSlot, { items });
    expect(screen.getByText("1 Email 0")).toBeInTheDocument();
    expect(screen.getByText("2 Fax 1")).toBeInTheDocument();
    expect(screen.getByText("0 Slack 2")).toBeInTheDocument();
  });

  it("should clear the hover highlight when the cursor leaves the menu", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("does not toggle a hover-highlighted item on Enter", async () => {
    render(MultiSelect, { props: { items } });

    await openMenu();

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");
    expect(emailOption).toHaveAttribute("aria-checked", "false");

    await user.keyboard("{Enter}");
    expect(emailOption).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("should not leave the option checkbox independently focusable", async () => {
    render(MultiSelect, { props: { items } });
    await openMenu();

    const option = screen.getByRole("option", { name: "Slack" });
    const checkbox = option.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveAttribute("tabindex", "-1");
  });

  it("should hide the decorative option checkbox from the accessibility tree", async () => {
    render(MultiSelect, { props: { items } });
    await openMenu();

    const option = screen.getByRole("option", { name: "Slack" });
    const checkbox = option.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveStyle({ display: "none" });
  });

  it("should pass selected and highlighted to the default slot", async () => {
    render(MultiSelectItemSlot, { props: { selectedIds: ["1"] } });

    await openMenu();

    const customItems = screen.getAllByTestId("custom-item");
    const byText = (text: string) => {
      const el = customItems.find((item) => item.textContent?.includes(text));
      if (!el) throw new Error(`No custom item matching "${text}"`);
      return el;
    };

    // selectedIds ["1"] is "Option 2". Items may be sorted selected-to-top,
    // so assert by content rather than position.
    expect(byText("Option 2")).toHaveAttribute("data-selected", "true");
    expect(byText("Option 1")).toHaveAttribute("data-selected", "false");
    expect(byText("Option 3")).toHaveAttribute("data-selected", "false");

    await user.hover(byText("Option 3"));
    expect(byText("Option 3")).toHaveAttribute("data-highlighted", "true");
    expect(byText("Option 1")).toHaveAttribute("data-highlighted", "false");
  });

  // Regression: ?? for itemToString so item.text "" is used (not id)
  it("displays empty string when item.text is empty (nullish coalescing)", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "" },
          { id: "2", text: "Email" },
        ],
        labelText: "Contact",
        itemToString: (item: { id: string; text: string }) =>
          item.text ?? item.id,
      },
    });
    await openMenu();
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("");
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("uses empty aria-label when passed (nullish coalescing)", async () => {
    render(MultiSelect, {
      props: {
        items: [{ id: "1", text: "Email" }],
        labelText: "Contact",
        ariaLabel: "",
      },
    });
    await openMenu();
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "");
  });

  describe("selection behavior", () => {
    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
    it("does not fire select event on initial render", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      expect(consoleLog).not.toHaveBeenCalled();

      await openMenu();
      await toggleOption("Email");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0", "1"],
        selected: [
          { id: "0", text: "Slack", checked: true },
          { id: "1", text: "Email", checked: true },
        ],
        unselected: [{ id: "2", text: "Fax", checked: false }],
      });
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2525
    it("does not fire select event on initial render without selectedIds", () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      expect(consoleLog).not.toHaveBeenCalled();
    });

    it("handles item selection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      await openMenu();
      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0"],
        selected: [{ id: "0", text: "Slack", checked: true }],
        unselected: [
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
    });

    it("handles multiple selections", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items },
      });

      await openMenu();
      await toggleOption("Slack");
      await toggleOption("Email");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["0"],
        selected: [{ id: "0", text: "Slack", checked: true }],
        unselected: [
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1", "0"],
        selected: [
          { id: "1", text: "Email", checked: true },
          { id: "0", text: "Slack", checked: true },
        ],
        unselected: [{ id: "2", text: "Fax", checked: false }],
      });
    });

    it("handles item deselection", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: [],
        selected: [],
        unselected: [
          { id: "0", text: "Slack", checked: false },
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });

      await toggleOption("Slack");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: [],
        selected: [],
        unselected: [
          { id: "0", text: "Slack", checked: false },
          { id: "1", text: "Email", checked: false },
          { id: "2", text: "Fax", checked: false },
        ],
      });
    });
  });

  describe("isSelectAll behavior", () => {
    const itemsWithSelectAll = [
      { id: "select-all", text: "All roles", isSelectAll: true },
      { id: "editor", text: "Editor" },
      { id: "owner", text: "Owner" },
      { id: "uploader", text: "Uploader" },
      { id: "reader", text: "Reader", disabled: true },
    ];

    it("renders select-all item first in the list", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveTextContent("All roles");
    });

    it("applies bx--multi-select--selectall class when an item has isSelectAll", () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      const wrapper = screen.getByRole("combobox").closest(".bx--multi-select");
      expect(wrapper).toHaveClass("bx--multi-select--selectall");
    });

    it("does not apply bx--multi-select--selectall when no item has isSelectAll", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
        },
      });

      const wrapper = screen.getByRole("combobox").closest(".bx--multi-select");
      expect(wrapper).not.toHaveClass("bx--multi-select--selectall");
    });

    it("clicking select-all selects all non-disabled items", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      await toggleOption("All roles");

      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["editor", "owner", "uploader"],
        selected: expect.arrayContaining([
          expect.objectContaining({
            id: "editor",
            text: "Editor",
            checked: true,
          }),
          expect.objectContaining({
            id: "owner",
            text: "Owner",
            checked: true,
          }),
          expect.objectContaining({
            id: "uploader",
            text: "Uploader",
            checked: true,
          }),
        ]),
        unselected: expect.arrayContaining([
          expect.objectContaining({
            id: "reader",
            text: "Reader",
            disabled: true,
            checked: false,
          }),
        ]),
      });
      expect(consoleLog.mock.calls[0][1].selected).toHaveLength(3);

      const readerOption = screen.getByRole("option", { name: "Reader" });
      expect(readerOption).toHaveAttribute("aria-selected", "false");
    });

    it("disabled items are not selected when clicking select-all", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      await toggleOption("All roles");

      const options = screen.getAllByRole("option");
      const readerOption = options.find(
        (o) => o.textContent?.trim() === "Reader",
      );
      expect(readerOption).toHaveAttribute("aria-selected", "false");
    });

    it("clicking select-all when all selected deselects all non-disabled items", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          selectedIds: ["editor", "owner", "uploader"],
          labelText: "Roles",
        },
      });

      await openMenu();
      await toggleOption("All roles");

      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: [],
        selected: [],
        unselected: expect.arrayContaining([
          expect.objectContaining({
            id: "editor",
            text: "Editor",
            checked: false,
          }),
          expect.objectContaining({
            id: "owner",
            text: "Owner",
            checked: false,
          }),
          expect.objectContaining({
            id: "uploader",
            text: "Uploader",
            checked: false,
          }),
          expect.objectContaining({
            id: "reader",
            text: "Reader",
            disabled: true,
            checked: false,
          }),
        ]),
      });
      expect(consoleLog.mock.calls[0][1].unselected).toHaveLength(4);
    });

    it("select event excludes isSelectAll item from selectedIds and selected/unselected", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      await toggleOption("All roles");

      const detail = consoleLog.mock.calls[0][1];
      expect(detail.selectedIds).not.toContain("select-all");
      expect(
        detail.selected.every((s: { id: string }) => s.id !== "select-all"),
      ).toBe(true);
      expect(
        detail.unselected.every((u: { id: string }) => u.id !== "select-all"),
      ).toBe(true);
    });

    it("select-all option shows indeterminate state when some items selected", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          selectedIds: ["editor"],
          labelText: "Roles",
        },
      });

      await openMenu();
      const allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "mixed");
    });

    it("select-all option shows checked when all selectable items selected", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          selectedIds: ["editor", "owner", "uploader"],
          labelText: "Roles",
        },
      });

      await openMenu();
      const allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "true");
    });

    it("select-all option shows unchecked when no items selected", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      const allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "false");
    });

    it("clear button deselects all including select-all state", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          selectedIds: ["editor", "owner", "uploader"],
          labelText: "Roles",
        },
      });

      await openMenu();
      const clearButton = screen.getByRole("button", { name: /clear/i });
      await user.click(clearButton);
      await closeMenu();
      await openMenu();

      const allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "false");
      const editorOption = screen.getByRole("option", { name: "Editor" });
      expect(editorOption).toHaveAttribute("aria-selected", "false");
    });

    it("select-all item remains visible when filterable and filter is applied", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          filterable: true,
          placeholder: "Filter roles...",
          labelText: "Roles",
        },
      });

      const input = screen.getByPlaceholderText("Filter roles...");
      await user.click(input);
      await user.type(input, "Ed");

      expect(screen.getByText("All roles")).toBeInTheDocument();
      expect(screen.getByText("Editor")).toBeInTheDocument();
      expect(screen.queryByText("Owner")).not.toBeInTheDocument();
      expect(screen.queryByText("Uploader")).not.toBeInTheDocument();
    });

    it("selecting individual items updates select-all checked/indeterminate state", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
        },
      });

      await openMenu();
      let allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "false");

      await toggleOption("Editor");
      allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "mixed");

      await toggleOption("Owner");
      await toggleOption("Uploader");
      allRolesOption = screen.getByRole("option", { name: "All roles" });
      expect(allRolesOption).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("filtering behavior", () => {
    it("filters items based on input", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter items...",
        },
      });

      const input = screen.getByPlaceholderText("Filter items...");
      await user.click(input);
      await user.type(input, "em");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();

      await user.keyboard("{ArrowDown}{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1"],
        selected: [{ id: "1", text: "Email", checked: true }],
        unselected: [
          { id: "2", text: "Fax", checked: false },
          { id: "0", text: "Slack", checked: false },
        ],
      });
    });

    it("uses custom filter function", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const props = {
        items,
        filterable: true,
        filterItem: (item: MultiSelectItem, value: string) => {
          return item.text.toLowerCase().startsWith(value.toLowerCase());
        },
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "e");

      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();

      await user.keyboard("{ArrowDown}{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["1"],
        selected: [{ id: "1", text: "Email", checked: true }],
        unselected: [
          { id: "2", text: "Fax", checked: false },
          { id: "0", text: "Slack", checked: false },
        ],
      });
    });

    it("supports fuzzyMatch as filterItem", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          filterItem: (item: MultiSelectItem, value: string) =>
            fuzzyMatch(item.text, value).matched,
        },
      });

      const input = screen.getByRole("combobox");
      await user.click(input);
      // Subsequence match: "sk" matches "Slack" but no substring would.
      await user.type(input, "sk");

      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();
    });

    it("does not clear bound `value` on initial render when not filterable", async () => {
      render(MultiSelectBindValue, {
        props: { items, filterable: false, value: "hello" },
      });

      await tick();

      expect(screen.getByTestId("bound-value")).toHaveTextContent("hello");
    });
  });

  describe("sorting behavior", () => {
    it("initially sorts items alphabetically", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "C" },
            { id: "3", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");
      expect(nthRenderedOptionText(2)).toBe("C");
    });

    it("moves selected items to top with selectionFeedback: top", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("C");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("does not double re-sort when toggling with selectionFeedback: top", async () => {
      let sortCallCount = 0;

      // Wrap sortItem to count how many comparisons occur per toggle.
      const sortItem = (a: { text: string }, b: { text: string }) => {
        sortCallCount++;
        return a.text.localeCompare(b.text);
      };

      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "A" },
            { id: "2", text: "B" },
            { id: "3", text: "C" },
            { id: "4", text: "D" },
            { id: "5", text: "E" },
          ],
          selectionFeedback: "top",
          sortItem,
        },
      });

      await openMenu();
      sortCallCount = 0;

      // Toggle two items so both checked and unchecked partitions get sorted.
      await toggleOption("C");
      await toggleOption("E");
      const callsForTwoToggles = sortCallCount;

      // With 5 items and 2 checked, a single sort() call produces
      // at most ~10 comparisons (two small partitions).
      // A double re-sort per toggle would roughly double this count.
      // Use a generous upper bound for a single-pass sort per toggle.
      expect(callsForTwoToggles).toBeLessThanOrEqual(20);
      expect(callsForTwoToggles).toBeGreaterThan(0);
    });

    it("re-sorts when selectedIds changes externally with selectionFeedback: top", async () => {
      const { rerender } = render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      // External selectedIds change should still trigger re-sort.
      await rerender({ selectedIds: ["3"] });
      await tick();

      expect(nthRenderedOptionText(0)).toBe("C");
    });

    it("sorts after reopen with selectionFeedback: top-after-reopen", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("C");
    });

    it("maintains order with selectionFeedback: fixed", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "fixed",
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");

      await toggleOption("C");
      expect(nthRenderedOptionText(0)).toBe("A");

      await closeMenu();
      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("A");
    });

    it("recomputes sortedItems when the items prop changes", async () => {
      const { rerender } = render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
        },
      });

      await openMenu();
      expect(screen.getAllByRole("option")).toHaveLength(2);
      expect(nthRenderedOptionText(0)).toBe("A");
      expect(nthRenderedOptionText(1)).toBe("B");

      await rerender({
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B" },
          { id: "3", text: "C" },
        ],
      });
      await tick();

      expect(screen.getAllByRole("option")).toHaveLength(3);
      expect(nthRenderedOptionText(2)).toBe("C");

      await rerender({
        items: [
          { id: "1", text: "Alpha" },
          { id: "2", text: "B" },
          { id: "3", text: "C" },
        ],
      });
      await tick();

      expect(nthRenderedOptionText(0)).toBe("Alpha");
    });

    it("exposes sortedItems via bind", async () => {
      const { component } = render(MultiSelect, {
        props: {
          items: [
            { id: "3", text: "C" },
            { id: "1", text: "A" },
            { id: "2", text: "B" },
          ],
          selectionFeedback: "top",
        },
      });

      await tick();
      expect(component.sortedItems?.map((item) => item.id)).toEqual([
        "1",
        "2",
        "3",
      ]);
      expect(component.sortedItems?.every((item) => !item.checked)).toBe(true);

      await openMenu();
      await toggleOption("C");
      await tick();

      expect(component.sortedItems?.map((item) => item.id)).toEqual([
        "3",
        "1",
        "2",
      ]);
      expect(
        component.sortedItems?.find((item) => item.id === "3")?.checked,
      ).toBe(true);
    });
  });

  describe("variants and states", () => {
    it("renders in light variant", async () => {
      render(MultiSelect, {
        props: {
          items,
          light: true,
        },
      });

      await openMenu();
      const listBox = screen.getByRole("listbox").closest(".bx--list-box");
      expect(listBox).toHaveClass("bx--list-box--light");
    });

    it("renders in inline variant", () => {
      render(MultiSelect, {
        props: {
          items,
          type: "inline",
        },
      });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--multi-select__wrapper");
      expect(wrapper).toHaveClass("bx--multi-select__wrapper--inline");
    });

    it("handles invalid state", () => {
      render(MultiSelect, {
        props: {
          items,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      expect(screen.getByText("Invalid selection")).toBeInTheDocument();
      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--multi-select--invalid");
    });

    // Regression: filterable + invalid rendered two WarningFilled icons
    it("renders only one invalid icon when filterable", () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          filterable: true,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const icons = container.querySelectorAll(".bx--list-box__invalid-icon");
      expect(icons).toHaveLength(1);
    });

    // Regression: filterable + warn rendered two WarningAltFilled icons
    it("renders only one warning icon when filterable", () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          filterable: true,
          warn: true,
          warnText: "Warning message",
        },
      });

      const icons = container.querySelectorAll(".bx--list-box__invalid-icon");
      expect(icons).toHaveLength(1);
    });

    it("handles warning state", () => {
      render(MultiSelect, {
        props: {
          items,
          warn: true,
          warnText: "Warning message",
        },
      });

      expect(screen.getByText("Warning message")).toBeInTheDocument();
      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).toHaveClass("bx--list-box--warning");
    });

    it.each([
      "disabled",
      "readonly",
    ] as const)("suppresses invalid and warn states when %s", (state) => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          [state]: true,
          invalid: true,
          invalidText: "Invalid selection",
          warn: true,
          warnText: "Warning message",
        },
      });

      const wrapper = screen.getByRole("combobox").closest(".bx--list-box");
      expect(wrapper).not.toHaveClass("bx--multi-select--invalid");
      expect(wrapper).not.toHaveClass("bx--list-box--warning");
      expect(wrapper).not.toHaveAttribute("data-invalid");
      expect(container.querySelector(".bx--list-box__invalid-icon")).toBeNull();
      expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
    });

    it("handles disabled state", () => {
      render(MultiSelect, {
        props: {
          items,
          disabled: true,
        },
      });

      const field = screen.getByRole("combobox");
      expect(field).toHaveAttribute("aria-disabled", "true");
      expect(field).toHaveAttribute("tabindex", "-1");
      expect(field.closest(".bx--multi-select")).toHaveAttribute(
        "tabindex",
        "-1",
      );
    });

    it("handles disabled items", async () => {
      const itemsWithDisabled = [
        { id: "0", text: "Slack" },
        { id: "1", text: "Email", disabled: true },
        { id: "2", text: "Fax" },
      ];

      render(MultiSelect, {
        props: {
          items: itemsWithDisabled,
        },
      });

      await openMenu();
      const emailOption = screen.getByRole("option", { name: "Email" });
      expect(emailOption).toHaveAttribute("disabled");
    });
  });

  describe("focus outline", () => {
    // Carbon resets the field's own `:focus` outline to transparent and relies
    // on a `--input-focused` class to render the visible, theme-aware outline.
    it("toggles the input-focused class on the default field wrapper", async () => {
      render(MultiSelect, { props: { items, labelText: "Contact methods" } });

      // The outline renders on the field wrapper, not the focusable field
      // itself, so Carbon's transparent `:focus` reset cannot win by specificity.
      const field = screen.getByRole("combobox");
      const wrapper = field.closest(".bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(field);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(field);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the menu is open", () => {
      // Selecting an item bounces focus to the option and back; tying the
      // outline to `open` (not just focus) keeps it stable mid-interaction.
      render(MultiSelect, { props: { items, open: true } });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("toggles the input-focused class on the filterable field", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByRole("combobox");
      const field = input.closest(".bx--list-box__field");
      expect(field).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(input);
      await tick();
      expect(field).toHaveClass("bx--list-box__field--wrapper--input-focused");

      fireEvent.blur(input);
      await tick();
      expect(field).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });

  describe("accessibility", () => {
    it("handles hidden label", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          hideLabel: true,
        },
      });

      const label = screen.getByText("Contact methods");
      expect(label).toHaveClass("bx--visually-hidden");
    });

    it("non-filterable variant has correct ARIA attributes", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("role", "combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("tabindex", "0");
    });

    it("non-filterable variant opens menu and updates aria-controls", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).not.toHaveAttribute("aria-controls");

      await user.click(combobox);

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-controls");
      const menuId = combobox.getAttribute("aria-controls");
      expect(screen.getByRole("listbox")).toHaveAttribute("id", menuId);
    });

    it("clicking the label opens the menu and focuses the field (non-filterable)", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.click(screen.getByText("Contact methods"));

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveFocus();
    });

    it("filterable variant has correct ARIA attributes", () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("role", "combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveAttribute("aria-autocomplete", "list");
      expect(combobox).toHaveAttribute("tabindex", "0");
    });

    it("filterable variant updates aria-controls when opened", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).not.toHaveAttribute("aria-controls");

      await user.click(combobox);

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-controls");
      const menuId = combobox.getAttribute("aria-controls");
      expect(screen.getByRole("listbox")).toHaveAttribute("id", menuId);
    });

    it("listbox has aria-multiselectable attribute", async () => {
      render(MultiSelect, {
        props: {
          items,
        },
      });

      await openMenu();
      const listbox = screen.getByRole("listbox");
      expect(listbox).toHaveAttribute("aria-multiselectable", "true");
    });

    it("options have correct aria-selected state", async () => {
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });

    it("options have correct aria-checked state for screen reader announcement", async () => {
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-checked", "true");
      expect(options[1]).toHaveAttribute("aria-checked", "false");
      expect(options[2]).toHaveAttribute("aria-checked", "false");

      await toggleOption("Email");
      expect(options[1]).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("custom formatting", () => {
    it("handles custom itemToString", () => {
      const props = {
        items,
        selectedIds: ["0"],
        itemToString: (item: MultiSelectItem) => `${item.text} (${item.id})`,
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      expect(screen.getByText("Slack (0)")).toBeInTheDocument();
    });

    it("handles custom itemToInput", async () => {
      const props = {
        items,
        itemToInput: (item: MultiSelectItem) => ({
          name: `contact_${item.id}`,
          value: item.text.toLowerCase(),
        }),
      } satisfies ComponentProps<MultiSelect>;

      render(MultiSelect, { props });

      await openMenu();
      const option = screen.getByRole("option", { name: "Slack" });
      const checkbox = option.querySelector('input[type="checkbox"]');
      expect(checkbox).toHaveAttribute("name", "contact_0");
      expect(checkbox).toHaveAttribute("value", "slack");
    });
  });

  it("does not show helper text if warn is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        warn: true,
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("does not show helper text if invalid is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        invalid: true,
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("does not show helper text if inline is true", () => {
    render(MultiSelect, {
      props: {
        items,
        helperText: "Help",
        type: "inline",
      },
    });
    expect(screen.queryByText("Help")).not.toBeInTheDocument();
  });

  it("clears all selections when clear button is clicked", async () => {
    render(MultiSelect, {
      props: {
        items,
        selectedIds: ["0", "1"],
      },
    });
    await openMenu();

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "false");

    const clearButton = screen.getByRole("button", { name: /clear/i });
    await user.click(clearButton);
    await closeMenu();

    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "false");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("should not infinite loop when all items are disabled", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "Aa", disabled: true },
          { id: "2", text: "Ba", disabled: true },
          { id: "3", text: "Ca", disabled: true },
        ],
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);

    // If the while loop has no guard, this would hang forever.
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    // No item should be selected since all are disabled.
    const options = screen.getAllByRole("option");
    for (const option of options) {
      expect(option).toHaveAttribute("aria-selected", "false");
    }
  });

  it("skips disabled items during keyboard navigation", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "Aa" },
          { id: "2", text: "Ba", disabled: true },
          { id: "3", text: "Ca" },
        ],
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    await user.type(input, "a");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    const options = screen.getAllByRole("option");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
  });

  it("focuses input when filterable and menu is opened", async () => {
    render(MultiSelect, {
      props: {
        items,
        filterable: true,
        placeholder: "Filter...",
      },
    });
    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    expect(input).toHaveFocus();
  });

  it("does not select disabled items when clicked", async () => {
    render(MultiSelect, {
      props: {
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C" },
        ],
      },
    });
    await openMenu();
    const disabledOption = screen.getByRole("option", { name: "B" });

    await user.click(disabledOption);
    expect(disabledOption).toHaveAttribute("aria-selected", "false");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2288
  it("clicking checkbox in filterable variant should not throw error", async () => {
    render(MultiSelect, {
      props: {
        items,
        filterable: true,
        placeholder: "Filter...",
      },
    });

    const input = screen.getByPlaceholderText("Filter...");
    await user.click(input);
    await toggleOption("Slack");

    const options = screen.getAllByRole("option");
    expect(options[2]).toHaveAttribute("aria-selected", "true");
    expect(input).toHaveFocus();
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2313
  describe("keyboard navigation (issue #2313)", () => {
    it("filterable: menu does not open on focus alone (WAI-ARIA combobox)", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      await user.tab();
      expect(input).toHaveFocus();

      expect(input).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      await user.keyboard("{ArrowDown}");
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("filterable: first character shows correctly after tabbing", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");

      await user.tab();
      expect(input).toHaveFocus();

      await user.type(input, "s");
      expect(input).toHaveValue("s");

      await user.type(input, "lack");
      expect(input).toHaveValue("slack");

      expect(screen.getByText("Slack")).toBeInTheDocument();
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
    });

    it("filterable: Tab key does not close menu when navigating", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      await user.click(input);
      expect(input).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Tab}");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("filterable: focus goes to input, not clear button", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      const clearButton = screen.getAllByRole("button", { name: /clear/i })[0];

      expect(clearButton).toHaveAttribute("tabindex", "-1");
      await user.tab();

      expect(input).toHaveFocus();
      expect(clearButton).not.toHaveFocus();
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("filterable: clear button is not keyboard accessible but works with mouse", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      const clearButton = screen.getAllByRole("button", { name: /clear/i })[0];

      expect(clearButton).toHaveAttribute("tabindex", "-1");
      await user.click(clearButton);

      await user.click(input);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
    });

    it("non-filterable: ArrowDown opens the menu and highlights the first item", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{ArrowDown}");
      await tick();

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      // The first rendered (sorted) item is highlighted.
      expect(combobox).toHaveAttribute(
        "aria-activedescendant",
        screen.getAllByRole("option")[0].id,
      );
    });

    it("filterable: ArrowDown opens the menu and highlights the first filtered item", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByPlaceholderText("Filter...");
      input.focus();

      await user.keyboard("{ArrowDown}");
      await tick();

      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(input).toHaveAttribute(
        "aria-activedescendant",
        screen.getAllByRole("option")[0].id,
      );
    });

    it("non-filterable: opens the menu on Alt+ArrowDown without moving the highlight", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();

      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      await tick();

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("listbox")).toBeVisible();
      expect(combobox).not.toHaveAttribute("aria-activedescendant");
    });

    it("non-filterable: closes the menu on Alt+ArrowUp and keeps focus", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(combobox).toHaveFocus();
    });

    it("treats Alt+ArrowDown on an open menu and Alt+ArrowUp on a closed menu as no-ops", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();

      // Alt+ArrowUp while closed does nothing.
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      // Plain ArrowDown opens and highlights the first item.
      await user.keyboard("{ArrowDown}");
      await tick();
      const firstOptionId = screen.getAllByRole("option")[0].id;
      expect(combobox).toHaveAttribute("aria-activedescendant", firstOptionId);

      // Alt+ArrowDown while open keeps the menu open without moving the highlight.
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute("aria-activedescendant", firstOptionId);
    });

    it("filterable: opens on Alt+ArrowDown and closes on Alt+ArrowUp", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByPlaceholderText("Filter...");
      input.focus();

      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      await tick();
      expect(input).toHaveAttribute("aria-expanded", "true");
      expect(input).not.toHaveAttribute("aria-activedescendant");

      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Generics", () => {
    it("should support custom item types with generics", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      const products: Product[] = [
        {
          id: "1",
          text: "Laptop",
          price: 999,
          category: "Electronics",
          inStock: true,
        },
        {
          id: "2",
          text: "Phone",
          price: 599,
          category: "Electronics",
          inStock: false,
        },
      ];

      expectTypeOf<typeof products>().toEqualTypeOf<Product[]>();

      const itemToString = (item: Product) => `${item.text} - $${item.price}`;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const filterItem = (item: Product, value: string) =>
        item.category.toLowerCase().includes(value.toLowerCase()) ||
        item.text.toLowerCase().includes(value.toLowerCase());
      expectTypeOf(filterItem).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(filterItem).parameter(1).toEqualTypeOf<string>();
      expectTypeOf(filterItem).returns.toEqualTypeOf<boolean>();

      type SelectEvent = CustomEvent<{
        selectedIds: string[];
        selected: Product[];
        unselected: Product[];
      }>;
      expectTypeOf<
        SelectEvent["detail"]["selected"][0]
      >().toEqualTypeOf<Product>();
      expectTypeOf<
        SelectEvent["detail"]["unselected"][0]
      >().toEqualTypeOf<Product>();
    });

    it("should provide type-safe access to custom properties in callbacks", () => {
      type Tag = {
        id: number;
        text: string;
        color: string;
        usageCount: number;
      };

      const itemToString = (item: Tag) => {
        expectTypeOf(item).toHaveProperty("color");
        expectTypeOf(item).toHaveProperty("usageCount");
        return `${item.text} (${item.usageCount})`;
      };

      const filterItem = (item: Tag, value: string) => {
        expectTypeOf(item).toHaveProperty("color");
        expectTypeOf(item).toHaveProperty("usageCount");
        return (
          item.color.includes(value) ||
          item.usageCount > Number.parseInt(value, 10)
        );
      };

      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Tag>();
      expectTypeOf(filterItem).parameter(0).toEqualTypeOf<Tag>();
    });

    it("sortItem should return number, not Item", () => {
      type Item = { id: string; text: string };

      const sortItem: ComponentProps<MultiSelectComponent<Item>>["sortItem"] = (
        a: Item,
        b: Item,
      ) => a.text.localeCompare(b.text, "en", { numeric: true });

      expectTypeOf(sortItem).returns.toEqualTypeOf<number>();
      expectTypeOf(sortItem).parameters.toEqualTypeOf<[Item, Item]>();
    });

    it('itemToString may return string or Item["id"] (matches default text ?? id)', () => {
      type Row = { id: number; text: string };

      type ItemToString = NonNullable<
        ComponentProps<MultiSelectComponent<Row>>["itemToString"]
      >;

      expectTypeOf<ItemToString>().returns.toEqualTypeOf<string | number>();

      const showText = (item: Row) => item.text;
      const showId = (item: Row) => item.id;
      // `text` must be optional so `?? id` is typed as `string | number` (required `text` would infer only `string`).
      const showFallback = (item: { id: number; text?: string }) =>
        item.text ?? item.id;

      expectTypeOf(showText).returns.toEqualTypeOf<string>();
      expectTypeOf(showId).returns.toEqualTypeOf<number>();
      expectTypeOf(showFallback).returns.toEqualTypeOf<string | number>();

      expectTypeOf(showText).toMatchTypeOf<ItemToString>();
      expectTypeOf(showId).toMatchTypeOf<ItemToString>();
      expectTypeOf(showFallback).toMatchTypeOf<ItemToString>();
    });

    it('itemToString may return numeric Item["id"] for option labels', async () => {
      render(MultiSelectItemToStringId);
      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options.map((o) => o.textContent?.trim())).toEqual(["101", "102"]);
    });

    it("should support slot props with generic item type", () => {
      type MenuItem = {
        id: string;
        text: string;
        icon: string;
        shortcut?: string;
      };

      type SlotProps = { item: MenuItem; index: number };

      const slotItem: MenuItem = {
        id: "1",
        text: "Save",
        icon: "save-icon",
        shortcut: "Ctrl+S",
      };

      expectTypeOf<SlotProps["item"]>().toEqualTypeOf<MenuItem>();
      expectTypeOf(slotItem).toHaveProperty("icon");
      expectTypeOf(slotItem).toHaveProperty("shortcut");
    });

    it("should infer generic type from items and support destructuring in slots", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelectGenerics);

      await openMenu();

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      // Items are sorted alphabetically, so Desk comes first
      expect(options[0]).toHaveTextContent("Desk");
      expect(options[0]).toHaveTextContent("$299");
      expect(options[0]).toHaveTextContent("Furniture");

      await toggleOption("Laptop");

      expect(consoleLog).toHaveBeenCalledWith("selected:", [
        {
          id: "1",
          text: "Laptop",
          price: 999,
          category: "Electronics",
          checked: true,
        },
      ]);
    });

    it("should support generic types with ComponentProps and ComponentEvents", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      type ComponentType = MultiSelectComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const itemToInput = (item: Product) => ({
        name: item.id,
        value: item.id,
      });
      expectTypeOf(itemToInput).parameter(0).toEqualTypeOf<Product>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<SelectEventDetail["selected"][0]>().toEqualTypeOf<Product>();
      expectTypeOf<
        SelectEventDetail["unselected"][0]
      >().toEqualTypeOf<Product>();
    });

    it("should default to MultiSelectItem when generic is not specified", () => {
      type ComponentType = MultiSelectComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly MultiSelectItem[]
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selected"][0]
      >().toEqualTypeOf<MultiSelectItem>();
      expectTypeOf<
        SelectEventDetail["unselected"][0]
      >().toEqualTypeOf<MultiSelectItem>();
    });

    it("should enforce MultiSelectItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = MultiSelectComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = MultiSelectComponent<MultiSelectItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly MultiSelectItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should default Id to any when not specified", () => {
        type ComponentType = MultiSelectComponent;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
          // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
          readonly any[] | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<SelectEventDetail["selectedIds"]>().toEqualTypeOf<any[]>();
      });

      it("should support different ID types (string, number, union)", () => {
        // String ID
        type StringItem = { id: string; text: string };
        type StringComponent = MultiSelectComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedIds"]
        >().toEqualTypeOf<readonly string[] | undefined>();

        // Number ID
        type NumberItem = { id: number; text: string };
        type NumberComponent = MultiSelectComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedIds"]
        >().toEqualTypeOf<readonly number[] | undefined>();

        // Union ID
        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = MultiSelectComponent<UnionItem>;
        type UnionEvents = ComponentEvents<UnionComponent>;
        type UnionSelectDetail =
          UnionEvents["select"] extends CustomEvent<infer T> ? T : never;
        expectTypeOf<UnionSelectDetail["selectedIds"]>().toEqualTypeOf<
          UnionId[]
        >();
      });

      it("should work with 'as const' for literal type inference", () => {
        const items = [
          { id: "option1", text: "Option 1" },
          { id: "option2", text: "Option 2" },
          { id: "option3", text: "Option 3" },
        ] as const;

        type InferredItem = (typeof items)[number];
        type InferredId = InferredItem["id"];

        expectTypeOf<InferredId>().toEqualTypeOf<
          "option1" | "option2" | "option3"
        >();

        type ComponentType = MultiSelectComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedIds"]>().toEqualTypeOf<
          readonly InferredId[] | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        expectTypeOf<SelectEventDetail["selectedIds"]>().toEqualTypeOf<
          InferredId[]
        >();
        expectTypeOf<
          SelectEventDetail["selected"][0]
        >().toEqualTypeOf<InferredItem>();
      });
    });
  });

  it("supports custom label slot", () => {
    render(MultiSelectLabelSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  describe("virtualization", () => {
    const createLargeItemList = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));
    };

    it("should enable virtualization for large lists", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeGreaterThan(0);
    });

    it("should default itemHeight to the size row height", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          size: "sm",
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      // 500 items at 32px (sm), spacer height 16000px
      const spacer = menu.querySelector<HTMLElement>(":scope > div");
      expect(spacer?.style.height).toBe("16000px");
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])("should scroll to selected item when menu opens $description", async ({
      virtualize,
    }) => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["250"], // Item 251, in the middle
          virtualize,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();

        // The selected item should be visible
        const selectedOption = within(menu).getByRole("option", {
          name: "Item 251",
        });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");

        // The scroll position should be set to show the selected item at the top
        // Item 251 is at index 250, itemHeight=40
        // Expected scroll: 250 * 40 = 10000
        expect(menu.scrollTop).toBe(10000);
      });
    });

    it.each([
      { virtualize: true, description: "with explicit virtualization" },
      {
        virtualize: undefined,
        description: "with auto-enabled virtualization",
      },
    ])("should scroll to selected item when menu reopens $description", async ({
      virtualize,
    }) => {
      const largeItems = createLargeItemList(500);
      const { rerender } = render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["250"], // Item 251, in the middle
          virtualize,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeVisible();

      // Scroll away from the selected item
      menu.scrollTop = 0;
      await new Promise((resolve) => setTimeout(resolve, 100));

      rerender({ open: false });
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      rerender({ open: true });
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 200));

      await waitFor(
        () => {
          const menuAfterReopen = screen.getByRole("listbox");
          expectTypeOf(menuAfterReopen).toEqualTypeOf<HTMLElement>();

          // Selected item should be visible after reopening
          const selectedOption = within(menuAfterReopen).getByRole("option", {
            name: "Item 251",
          });
          expect(selectedOption).toBeInTheDocument();
          expect(selectedOption).toHaveAttribute("aria-selected", "true");

          // Should have scrolled back to show the selected item at the top
          // Item 251 is at index 250, itemHeight=40, so scroll should be 10000
          expect(menuAfterReopen.scrollTop).toBe(10000);
        },
        { timeout: 3000 },
      );
    });

    it("should scroll to top when no items are selected", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: [],
          virtualize: true,
        },
      });

      await openMenu();

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        expect(menu).toBeVisible();
        // Should scroll to top when no selection
        expect(menu.scrollTop).toBe(0);
      });
    });

    it("should handle selected items at the end of list", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["499"], // Last item
          virtualize: true,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();

        // The selected item should be visible
        const selectedOption = within(menu).getByRole("option", {
          name: "Item 500",
        });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");

        // Scroll should be at the position to show last item at top
        // Item 500 is at index 499, itemHeight=40, so scroll should be 499 * 40 = 19960
        // But max scroll is 500 * 40 - 300 = 19700, so it should be capped at 19700
        expect(menu.scrollTop).toBe(19700);
      });
    });

    it("should accept virtualization configuration object", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 50,
            containerHeight: 400,
            overscan: 5,
            threshold: 50,
            maxItems: 20,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // With maxItems: 20, should render at most 20 items
      expect(options.length).toBeLessThanOrEqual(20);
    });

    it("should not virtualize lists below threshold", async () => {
      const smallItems = createLargeItemList(50);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
          virtualize: {
            threshold: 100, // Threshold is 100, list has 50 items
          },
        },
      });

      await openMenu();

      const options = screen.getAllByRole("option");
      // Should render all items when below threshold
      expect(options.length).toBe(50);
    });

    it("should use default item height when not specified", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
    });

    it("should handle virtualization with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 60,
            containerHeight: 300,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(500);
      expect(options.length).toBeLessThan(15);
    });

    it("should calculate scroll position correctly with custom item height", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 80,
            containerHeight: 400,
          },
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();

      menu.scrollTop = 800;
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const optionsAfterScroll = screen.getAllByRole("option");
      expect(optionsAfterScroll.length).toBeGreaterThan(0);

      // Click on the option (the option's own checkbox is decorative and
      // hidden from the accessibility tree; the option owns selection).
      const firstOption = optionsAfterScroll[0];
      const firstCheckbox = firstOption.querySelector('input[type="checkbox"]');

      // Get the current checked state
      expect.assert(firstCheckbox instanceof HTMLInputElement);
      const wasChecked = firstCheckbox.checked;

      // Click the option to toggle it
      await user.click(firstOption);
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify selection works - the checkbox should have toggled
      await waitFor(() => {
        const updatedCheckbox = firstOption.querySelector(
          'input[type="checkbox"]',
        );
        expect.assert(updatedCheckbox instanceof HTMLInputElement);
        expect(updatedCheckbox.checked).toBe(!wasChecked);
      });
    });

    it("should override default item height when specified", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            itemHeight: 100,
            containerHeight: 500,
          },
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      expect(options.length).toBeGreaterThan(0);
      expect(options.length).toBeLessThan(15);
    });

    it("should maintain selection when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["250"],
          virtualize: true,
        },
      });

      await openMenu();

      // With auto-scroll, the selected item should be visible without manual scrolling
      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
        const selectedOption = within(menu).getByRole("option", {
          name: "Item 251",
        });
        expect(selectedOption).toBeInTheDocument();
        expect(selectedOption).toHaveAttribute("aria-selected", "true");
      });
    });

    it("should handle keyboard navigation with virtualization", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: [],
          virtualize: true,
          selectionFeedback: "fixed", // Keep items in original order
          sortItem: () => 0, // Disable sorting to maintain original order
        },
      });

      await openMenu();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      await tick();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ArrowDown twice selects index 1, which is "Item 2" (items are 0-indexed)
      // Verify the item is selected - check if any checkbox is checked.
      // The option checkboxes are decorative (hidden from the accessibility
      // tree), so query the underlying <input> elements directly rather than
      // via role.
      await waitFor(() => {
        const checkboxes = Array.from(
          screen
            .getAllByRole("option")
            .map((option) => option.querySelector('input[type="checkbox"]')),
        );
        const checkedCheckboxes = checkboxes.filter((cb) => {
          expect.assert(cb instanceof HTMLInputElement);
          return cb.checked;
        });
        expect(checkedCheckboxes.length).toBeGreaterThan(0);

        // Also verify we can find Item 2 if it's visible
        const item2Checkbox = checkboxes.find((cb) => {
          const label = cb?.closest(".bx--checkbox-wrapper")?.textContent;
          return label?.trim() === "Item 2";
        });
        if (item2Checkbox) {
          expect.assert(item2Checkbox instanceof HTMLInputElement);
          expect(item2Checkbox.checked).toBe(true);
        }
      });
    });

    it("should apply max-height style when virtualized", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: {
            containerHeight: 400,
          },
        },
      });

      await openMenu();

      // The ListBoxMenu itself has the style applied
      const menu = screen.getByRole("listbox");
      expectTypeOf(menu).toEqualTypeOf<HTMLElement>();
      expect(menu).toBeInTheDocument();
      expect(menu.style.maxHeight).toBe("400px");
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should automatically enable virtualization for lists with more than 100 items when virtualize is undefined", async () => {
      const largeItems = createLargeItemList(150);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should virtualize, so fewer than 150 items rendered
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      // Should have max-height style applied
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should not virtualize lists with 100 or fewer items when virtualize is undefined", async () => {
      const smallItems = createLargeItemList(100);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items when at or below threshold
      expect(options.length).toBe(100);
      // Should not have max-height style when not virtualized
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should not virtualize lists with exactly 100 items when virtualize is undefined", async () => {
      const items = createLargeItemList(100);
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
        },
      });

      await openMenu();

      const options = screen.getAllByRole("option");
      // Should render all 100 items (threshold is 100, so > 100 is needed)
      expect(options.length).toBe(100);
    });

    it("should explicitly disable virtualization when virtualize is false, even with large lists", async () => {
      const largeItems = createLargeItemList(100);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: false,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items when explicitly disabled
      expect(options.length).toBe(100);
      // Should not have max-height style when not virtualized
      expect(menu.style.maxHeight).toBeFalsy();
    });

    it("should respect threshold when virtualize is true with fewer than 100 items", async () => {
      const smallItems = createLargeItemList(50);
      render(MultiSelect, {
        props: {
          items: smallItems,
          selectedIds: ["0"],
          virtualize: true, // Explicitly enabled, but below threshold
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should render all items because threshold (100) is not met
      // Even though virtualize=true, the threshold check prevents virtualization
      expect(options.length).toBe(50);
      // Should have max-height style applied (virtualConfig is created)
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    it("should virtualize when virtualize is true with more than 100 items", async () => {
      const largeItems = createLargeItemList(150);
      render(MultiSelect, {
        props: {
          items: largeItems,
          selectedIds: ["0"],
          virtualize: true, // Explicitly enabled, above threshold
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();

      const options = screen.getAllByRole("option");
      // Should virtualize when above threshold
      expect(options.length).toBeLessThan(150);
      expect(options.length).toBeGreaterThan(0);
      // Should have max-height style applied
      expect(menu.style.maxHeight).toBeTruthy();
      expect(menu.style.overflowY).toBe("auto");
    });

    // Regression: with virtualization, the data-last item is not mounted
    // until scrolled into view, so a per-item blur handler bound to it
    // never fires when focus leaves the menu. The menu must close based
    // on focus leaving the wrapper, not blur of a specific list index.
    it("closes menu when focus moves outside the wrapper (virtualized)", async () => {
      const largeItems = createLargeItemList(500);
      render(MultiSelect, {
        props: { items: largeItems, virtualize: true },
      });

      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        await openMenu();
        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        // The data-last item (index 499) is far below the viewport and
        // not mounted, so any close logic tied to it cannot fire.
        const visibleOptions = screen.getAllByRole("option");
        expect(visibleOptions.length).toBeLessThan(500);

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });

  describe("portalMenu", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should render menu in FloatingPortal when portalMenu is true", () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", () => {
      render(MultiSelectInModal, {
        props: { modalOpen: true, multiSelectOpen: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(MultiSelectInModal, {
        props: {
          modalOpen: true,
          multiSelectOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    // Regression: when portaled, the menu loses its `.bx--multi-select`
    // ancestor, so descendant CSS rules (e.g. checkbox-wrapper sizing) stop
    // matching and the checkbox/label visually shift down inside each row.
    // The menu must be wrapped with `bx--multi-select bx--list-box--expanded`
    // so those selectors keep matching.
    it("should wrap portaled menu with multi-select host classes", () => {
      render(MultiSelect, {
        props: {
          items: [{ id: "0", text: "Slack" }],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      const host = menu.parentElement;
      expect(host).toHaveClass("bx--multi-select");
      expect(host).toHaveClass("bx--list-box--expanded");
      expect(host?.parentElement).toHaveAttribute("data-floating-portal");
    });

    it("should close portaled menu when clicking outside", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
        },
      });

      await openMenu();
      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("should close portaled menu when focus moves outside", async () => {
      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        render(MultiSelect, {
          props: {
            items: [
              { id: "0", text: "Slack" },
              { id: "1", text: "Email" },
            ],
            portalMenu: true,
          },
        });

        await openMenu();
        const combobox = screen.getByRole("combobox");
        const menu = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");
        expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
          document.body,
        );

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });

  describe("filterable: Backspace/Delete clears selection", () => {
    it("Backspace clears selection when input is empty", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(options[2]).toHaveAttribute("aria-selected", "false");

      await user.keyboard("{Backspace}");

      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });

    it("Backspace does not clear selection when input has text", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      await user.click(input);
      await user.type(input, "Sl");

      // Backspace should remove a character, not clear selection
      await user.keyboard("{Backspace}");

      // Re-open to check all options since filter may hide some
      // The selection should still be intact
      await user.clear(input);

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("Delete clears input text when menu is open", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      await user.click(input);
      await user.type(input, "Sl");
      expect(input).toHaveValue("Sl");

      await user.keyboard("{Delete}");

      // Delete clears the entire input value when menu is open
      expect(input).toHaveValue("");
    });

    it("Delete clears selection when menu is closed", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const input = screen.getByPlaceholderText("Filter...");
      // Focus input then close menu
      await user.click(input);
      await user.keyboard("{Escape}");
      expect(input).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{Delete}");

      // Open menu to verify selections were cleared
      await user.click(input);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("readonly", () => {
    it("should apply readonly class on the listbox", () => {
      const { container } = render(MultiSelect, {
        props: { items, labelText: "Contact", readonly: true },
      });

      expect(
        container.querySelector(".bx--multi-select--readonly"),
      ).toBeTruthy();
    });

    it("opens the menu for review on click when readonly (default)", async () => {
      const { container } = render(MultiSelect, {
        props: { items, labelText: "Contact", readonly: true },
      });

      const trigger = await screen.findByRole("combobox");
      // Read-only conveys read-only semantics, not disabled/unavailable.
      expect(trigger).toHaveAttribute("aria-readonly", "true");
      expect(trigger).not.toHaveAttribute("aria-disabled", "true");
      expect(container.querySelector(".bx--list-box")).not.toHaveAttribute(
        "aria-disabled",
      );

      await user.click(trigger);

      // The menu opens so the selected values can be reviewed/navigated.
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(screen.getAllByRole("option")).toHaveLength(items.length);
    });

    it("opens the menu for review on click when readonly + filterable", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          filterable: true,
          placeholder: "Select",
        },
      });

      const input = screen.getByRole("combobox");
      assert(input instanceof HTMLInputElement);

      // Read-only, not disabled: the input stays non-editable but reviewable.
      expect(input).toHaveAttribute("readonly");
      expect(input).toHaveAttribute("aria-readonly", "true");
      expect(input).not.toHaveAttribute("aria-disabled", "true");

      await user.click(input);

      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    it("does not toggle a selection when an option is clicked while readonly", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0"],
        },
      });

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");

      // Clicking an option must not change the selection in read-only.
      await user.click(options[1]);
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "false");

      // Nor may clicking a selected option clear it.
      await user.click(options[0]);
      expect(options[0]).toHaveAttribute("aria-selected", "true");
    });

    it("marks the open menu and its checkboxes as read-only", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0"],
        },
      });

      const trigger = await screen.findByRole("combobox");
      await user.click(trigger);

      // The listbox itself advertises that it cannot be modified.
      expect(screen.getByRole("listbox")).toHaveAttribute(
        "aria-readonly",
        "true",
      );

      // Each option's checkbox is read-only so a browse-mode toggle is blocked.
      const checkboxes = container.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      expect(checkboxes.length).toBe(items.length);
      for (const checkbox of checkboxes) {
        expect(checkbox).toHaveAttribute("aria-readonly", "true");
      }
    });

    it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
        },
      });

      // VoiceOver does not surface aria-readonly, so the state is also exposed
      // as a visually-hidden description referenced by the combobox.
      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute(
        "aria-describedby",
        "readonly-test-multiselect",
      );

      const description = container.querySelector("#readonly-test-multiselect");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");
    });

    it("supports overriding the read-only assistive text", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
          readonlyText: "Schreibgeschützt",
        },
      });

      expect(
        container.querySelector("#readonly-test-multiselect"),
      ).toHaveTextContent("Schreibgeschützt");
    });

    it("includes the selected count in the read-only description", () => {
      const { container } = render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0", "1"],
        },
      });

      // The count badge is hidden from AT in read-only, so the count is folded
      // into the description to keep the collapsed field reviewable.
      expect(
        container.querySelector("#readonly-test-multiselect"),
      ).toHaveTextContent("Read-only, 2 selected");
    });

    it("appends the read-only description to existing helper text", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact",
          helperText: "Helper text",
          readonly: true,
        },
      });

      // Both ids are referenced so the help text is not lost in read-only.
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-describedby",
        "readonly-test-multiselect helper-test-multiselect",
      );
    });

    it("should not clear selection when readonly", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          selectedIds: ["0", "1"],
        },
      });

      const closeIcon = container.querySelector(".bx--tag__close-icon");
      assert(closeIcon);
      await user.click(closeIcon);

      expect(
        container.querySelectorAll(".bx--tag--filter").length,
      ).toBeGreaterThan(0);
    });
  });

  // Regression: checkbox ids are scoped by the MultiSelect `id` so that two
  // instances sharing the same item ids do not emit duplicate DOM ids (which
  // would make a label click on one instance toggle the other instance's input).
  it("scopes checkbox ids per instance to avoid clashes between instances", () => {
    const { container } = render(MultiSelectDuplicateIds);

    const checkboxes = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[id^="checkbox-"]'),
    );
    const ids = checkboxes.map((checkbox) => checkbox.id);

    // Two instances of 3 items each.
    expect(ids).toHaveLength(6);
    // Every id is unique across instances.
    expect(new Set(ids).size).toBe(ids.length);
    // Ids are scoped by the instance `id` prop.
    expect(ids).toEqual(
      expect.arrayContaining([
        "checkbox-first-0",
        "checkbox-first-1",
        "checkbox-first-2",
        "checkbox-second-0",
        "checkbox-second-1",
        "checkbox-second-2",
      ]),
    );

    // Each option's aria-labelledby resolves to the checkbox within the same instance.
    for (const option of container.querySelectorAll('[role="option"]')) {
      const labelledby = option.getAttribute("aria-labelledby");
      assert(labelledby);
      expect(container.querySelector(`#${labelledby}`)).not.toBeNull();
    }

    // Every option id is globally unique and prefixed by its instance id,
    // even though both instances share the same raw item ids.
    const optionIds = Array.from(
      container.querySelectorAll('[role="option"]'),
    ).map((option) => option.id);
    expect(optionIds).toHaveLength(6);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(optionIds).toEqual(
      expect.arrayContaining([
        "first-0",
        "first-1",
        "first-2",
        "second-0",
        "second-1",
        "second-2",
      ]),
    );
  });

  it("scopes aria-activedescendant to options within the same instance", async () => {
    const { container } = render(MultiSelectDuplicateIds);

    const comboboxes = Array.from(
      container.querySelectorAll<HTMLElement>('[role="combobox"]'),
    );
    expect(comboboxes).toHaveLength(2);

    // Highlight the first item of an instance and verify the active descendant
    // resolves to an option belonging to that same instance.
    const expectScopedActiveDescendant = async (
      combobox: HTMLElement,
      prefix: string,
    ) => {
      combobox.focus();
      await user.keyboard("{ArrowDown}");

      const activeDescendant = combobox.getAttribute("aria-activedescendant");
      assert(activeDescendant);
      expect(activeDescendant.startsWith(`${prefix}-`)).toBe(true);

      const active = container.querySelector(`#${activeDescendant}`);
      expect(active).not.toBeNull();
      expect(active?.getAttribute("role")).toBe("option");
      // The resolved option lives inside the same instance's list box.
      expect(combobox.closest(".bx--list-box")).toBe(
        active?.closest(".bx--list-box"),
      );
    };

    await expectScopedActiveDescendant(comboboxes[0], "first");
    await expectScopedActiveDescendant(comboboxes[1], "second");
  });

  describe("fluid variant", () => {
    const getCombobox = () => screen.getByRole("combobox");

    it("does not render fluid classes by default", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
      expect(document.querySelector(".bx--list-box__divider")).toBeNull();
    });

    it("renders fluid variant and suppresses helper text", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          helperText: "Helper text",
        },
      });

      const combobox = getCombobox();
      expect(combobox.closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
      expect(
        document.querySelector(".bx--list-box__divider"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
      expect(combobox).not.toHaveAttribute("aria-describedby");
    });

    it("renders the error message inside the fluid wrapper", () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          fluid: true,
          items,
          labelText: "Contact methods",
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      const message = screen.getByText("Invalid selection");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--list-box__wrapper--fluid")).not.toBeNull();
      expect(message.closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--invalid",
      );
      expect(getCombobox()).toHaveAttribute(
        "aria-describedby",
        "error-test-multiselect",
      );
    });

    it("renders the warning message inside the fluid wrapper", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          warn: true,
          warnText: "Warning message",
        },
      });

      const message = screen.getByText("Warning message");
      expect(message).toHaveClass("bx--form-requirement");
      expect(message.closest(".bx--list-box__wrapper--fluid")).not.toBeNull();
    });

    it.each([
      { disabled: true },
      { readonly: true },
    ])("suppresses invalid and warn states when %o", (props) => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
          invalid: true,
          invalidText: "Invalid selection",
          warn: true,
          warnText: "Warning message",
          ...props,
        },
      });

      expect(screen.queryByText("Invalid selection")).not.toBeInTheDocument();
      expect(screen.queryByText("Warning message")).not.toBeInTheDocument();
      expect(document.querySelector("[data-invalid]")).toBeNull();
    });

    it("marks the wrapper as condensed when fluid", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          condensed: true,
          items,
          labelText: "Contact methods",
        },
      });

      expect(getCombobox().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--condensed",
      );
    });

    it("ignores condensed when not fluid", () => {
      render(MultiSelect, {
        props: {
          condensed: true,
          items,
          labelText: "Contact methods",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid--condensed"),
      ).toBeNull();
    });

    it("ignores fluid for the inline variant", () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          fluid: true,
          type: "inline",
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toBeNull();
    });

    it("inherits fluid from the FluidForm context", () => {
      render(MultiSelectFluidForm);

      expect(getCombobox().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid",
      );
    });

    it("marks the label as slotted when fluid", () => {
      render(MultiSelectFluidSlot);

      expect(screen.getByText("Custom label content")).toHaveClass(
        "bx--label--slotted",
      );
    });

    it("does not mark the label as slotted when not fluid", () => {
      render(MultiSelectFluidSlot, { props: { fluid: false } });

      expect(screen.getByText("Custom label content")).not.toHaveClass(
        "bx--label--slotted",
      );
    });

    it("toggles the input-focused class on the fluid field wrapper", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          items,
          labelText: "Contact methods",
        },
      });

      const combobox = getCombobox();
      const wrapper = combobox.closest(".bx--list-box__field--wrapper");

      expect(wrapper).toHaveClass("bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(combobox);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(combobox);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the fluid menu is open", () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          open: true,
          items,
          labelText: "Contact methods",
        },
      });

      const wrapper = getCombobox().closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("renders filterable fluid classes and selection-count tag", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          filterable: true,
          items,
          labelText: "Contact methods",
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      const wrapper = getCombobox().closest(".bx--list-box__wrapper");
      expect(wrapper).toHaveClass("bx--list-box__wrapper--fluid");
      expect(wrapper).toHaveClass("bx--multi-select--filterable__wrapper");

      const fieldWrapper = getCombobox().closest(
        ".bx--list-box__field--wrapper",
      );
      expect(fieldWrapper).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();

      await user.click(getCombobox());
      expect(getCombobox()).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles the input-focused class on the filterable fluid field wrapper", async () => {
      render(MultiSelect, {
        props: {
          fluid: true,
          filterable: true,
          items,
          placeholder: "Filter...",
        },
      });

      const input = getCombobox();
      const wrapper = input.closest(".bx--list-box__field--wrapper");

      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(input);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(input);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });

  it("renders fluid skeleton state", () => {
    render(MultiSelectFluidSkeleton);

    const skeleton = screen.getByTestId("fluid-multi-select-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bx--list-box__wrapper--fluid");
    expect(skeleton.children).toHaveLength(1);

    const listBox = skeleton.children[0];
    expect(listBox).toHaveClass("bx--skeleton", "bx--list-box");
    expect(listBox.children).toHaveLength(2);
    expect(listBox.children[0]).toHaveClass("bx--list-box__label");
    expect(listBox.children[1]).toHaveClass("bx--list-box__field");
  });
});
