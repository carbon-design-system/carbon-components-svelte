import { fireEvent, render, screen } from "@testing-library/svelte";
import type MultiSelectComponent from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import type { MultiSelectItem } from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
import { fuzzyMatch } from "carbon-components-svelte/utils/fuzzy-match";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import {
  closeMenu,
  nthRenderedOptionText,
  openMenu,
  toggleOption,
} from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectBindValue from "./MultiSelectBindValue.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
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

    it("filters case-insensitively and ignores surrounding whitespace by default", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter items...",
        },
      });

      const input = screen.getByPlaceholderText("Filter items...");
      await user.click(input);
      await user.type(input, "  AX ");

      expect(screen.getByText("Fax")).toBeInTheDocument();
      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
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

    // Perf regression: `filteredItems` must be gated on `filterable && open`
    // so a closed, non-filterable MultiSelect never runs the (potentially
    // expensive, consumer-supplied) filterItem over the full item list.
    it("does not invoke filterItem while closed and not filterable", async () => {
      const filterItem = vi.fn((item: MultiSelectItem, value: string) =>
        item.text.toLowerCase().includes(value.trim().toLowerCase()),
      );

      const { component } = render(MultiSelect, {
        props: {
          items,
          filterable: false,
          filterItem,
        },
      });

      filterItem.mockClear();

      // Programmatic selectedIds updates reassign `sortedItems`, which is
      // what used to always re-run the always-on filter.
      component.selectedIds = ["0"];
      await tick();

      expect(filterItem).not.toHaveBeenCalled();
    });

    it("invokes filterItem once filterable and open", async () => {
      const filterItem = vi.fn((item: MultiSelectItem, value: string) =>
        item.text.toLowerCase().includes(value.trim().toLowerCase()),
      );

      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          filterItem,
          placeholder: "Filter items...",
        },
      });

      // Not yet open: still gated.
      expect(filterItem).not.toHaveBeenCalled();

      const input = screen.getByPlaceholderText("Filter items...");
      await user.click(input);
      filterItem.mockClear();

      await user.type(input, "em");

      expect(filterItem).toHaveBeenCalled();
      expect(screen.queryByText("Slack")).not.toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.queryByText("Fax")).not.toBeInTheDocument();
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

      // Toggle two items so both checked and unchecked partitions would be
      // sorted under a naive implementation.
      await toggleOption("C");
      await toggleOption("E");
      const callsForTwoToggles = sortCallCount;

      // A toggle never changes alphabetical order, only which partition an
      // entry belongs to, so `sort()` now partitions a cached, already-sorted
      // base order instead of re-sorting each partition. Zero comparator
      // calls (a stronger guarantee than "not doubled").
      expect(callsForTwoToggles).toBe(0);
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

    describe("external selectedIds without re-sorting", () => {
      const unsortedItems = [
        { id: "3", text: "C" },
        { id: "1", text: "A" },
        { id: "2", text: "B" },
      ];

      const optionByText = (text: string) =>
        screen
          .getAllByRole("option")
          .find((option) => option.textContent?.trim() === text);

      it("checks externally selected items in place with selectionFeedback: fixed", async () => {
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems, selectionFeedback: "fixed" },
        });

        await rerender({ selectedIds: ["2"] });
        await openMenu();

        expect(nthRenderedOptionText(0)).toBe("A");
        expect(nthRenderedOptionText(1)).toBe("B");
        expect(nthRenderedOptionText(2)).toBe("C");
        expect(optionByText("A")).toHaveAttribute("aria-selected", "false");
        expect(optionByText("B")).toHaveAttribute("aria-selected", "true");
        expect(optionByText("C")).toHaveAttribute("aria-selected", "false");
      });

      it("keeps an external selection when the user then toggles another item", async () => {
        const consoleLog = vi.spyOn(console, "log");
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems, selectionFeedback: "fixed" },
        });

        await rerender({ selectedIds: ["2"] });
        await openMenu();
        await toggleOption("C");

        const selectCalls = consoleLog.mock.calls.filter(
          ([name]) => name === "select",
        );
        const selectedIds = selectCalls.at(-1)?.[1]?.selectedIds;
        expect(selectedIds).toHaveLength(2);
        expect(selectedIds).toEqual(expect.arrayContaining(["2", "3"]));
      });

      it("checks externally selected items while open with top-after-reopen, reordering on reopen", async () => {
        const { rerender } = render(MultiSelect, {
          props: { items: unsortedItems },
        });

        await openMenu();
        await rerender({ selectedIds: ["3"] });

        expect(nthRenderedOptionText(2)).toBe("C");
        expect(optionByText("C")).toHaveAttribute("aria-selected", "true");

        await closeMenu();
        await openMenu();
        expect(nthRenderedOptionText(0)).toBe("C");
      });

      it("syncs the select-all item with selectionFeedback: fixed", async () => {
        const { rerender } = render(MultiSelect, {
          props: {
            items: [
              { id: "all", text: "All", isSelectAll: true },
              ...unsortedItems,
            ],
            selectionFeedback: "fixed",
          },
        });

        await rerender({ selectedIds: ["1", "2", "3"] });
        await openMenu();
        expect(optionByText("All")).toHaveAttribute("aria-checked", "true");

        await rerender({ selectedIds: ["1"] });
        expect(optionByText("All")).toHaveAttribute("aria-checked", "mixed");
      });
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

    it("sorts numeric-aware by default (Item 2 before Item 10)", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Item 10" },
            { id: "1", text: "Item 2" },
            { id: "2", text: "Item 1" },
          ],
        },
      });

      await openMenu();
      expect(nthRenderedOptionText(0)).toBe("Item 1");
      expect(nthRenderedOptionText(1)).toBe("Item 2");
      expect(nthRenderedOptionText(2)).toBe("Item 10");
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

  describe("filterable: announces filter result counts", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Keep in sync with the `announceFilterResults` debounce delay in
    // MultiSelect.svelte.
    const DEBOUNCE_MS = 800;

    // user-event stalls under fake timers, so these tests drive the input
    // with fireEvent. An input event both sets `value` and opens the menu.
    const renderFiltered = (
      props: Partial<ComponentProps<MultiSelectComponent>> = {},
    ) => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter...", ...props },
      });
      return screen.getByPlaceholderText("Filter...");
    };

    it("announces the match count once typing pauses", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "sl" } });
      expect(screen.getByRole("status")).toHaveTextContent("");

      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 result available",
      );
    });

    it("announces only the final count of a typing burst", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "a" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 100);
      expect(screen.getByRole("status")).toHaveTextContent("");

      await fireEvent.input(input, { target: { value: "ax" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 result available",
      );
    });

    it("announces no results and pluralizes counts", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "zzz" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent("No results");

      await fireEvent.input(input, { target: { value: "a" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent(
        "3 results available",
      );
    });

    it("skips the announcement when the count has not changed, supports a custom message", async () => {
      const filterResultsText = vi.fn((count: number) => `${count} matches`);
      const input = renderFiltered({ filterResultsText });

      await fireEvent.input(input, { target: { value: "sl" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent("1 matches");
      expect(filterResultsText).toHaveBeenCalledTimes(1);

      await fireEvent.input(input, { target: { value: "sla" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(filterResultsText).toHaveBeenCalledTimes(1);
    });

    it("clears the region when the menu closes and announces again on reopen", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "sl" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 result available",
      );

      await fireEvent.keyDown(input, { key: "Escape" });
      await tick();
      expect(screen.getByRole("status")).toHaveTextContent("");

      // Reopening resets the "last announced" count: the same count announces
      // again, since the region was cleared on close.
      await fireEvent.input(input, { target: { value: "sl" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(screen.getByRole("status")).toHaveTextContent(
        "1 result available",
      );
    });

    it("drops a pending announcement when the menu closes mid-debounce", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "sl" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
      await fireEvent.keyDown(input, { key: "Escape" });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does not announce when the filter text is emptied", async () => {
      const input = renderFiltered();

      await fireEvent.input(input, { target: { value: "sl" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS / 2);
      await fireEvent.input(input, { target: { value: "" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("excludes the select-all pseudo-item from the count", async () => {
      const input = renderFiltered({
        items: [{ id: "all", text: "Select all", isSelectAll: true }, ...items],
      });

      await fireEvent.input(input, { target: { value: "zzz" } });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

      // The select-all item always survives filtering; it must not count as a
      // result.
      expect(screen.getByRole("status")).toHaveTextContent("No results");
    });
  });
});
