import { render, screen } from "@testing-library/svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBoxReal from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ComboBox from "./ComboBox.test.svelte";
import { getInput } from "./helpers";

describe("ComboBox", () => {
  describe("Typeahead", () => {
    it("should autocomplete with typeahead when typing", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Banana", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Ap");

      expect(input).toHaveValue("Apple");
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(5);
    });

    it("should not commit a typeahead selection on Tab after the menu is closed via Escape", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Ap");
      await user.keyboard("{Escape}");

      await user.keyboard("{Tab}");

      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());
    });

    it("should skip a disabled item when suggesting and completing a typeahead match on Tab", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "ibm-cloud", text: "IBM Cloud", price: 0, disabled: true },
            { id: "ibm-quantum", text: "IBM Quantum", price: 0 },
            { id: "ibm-z", text: "IBM Z", price: 0 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "IBM ");

      expect(input).toHaveValue("IBM Quantum");

      await user.keyboard("{Tab}");

      expect(input).toHaveValue("IBM Quantum");
    });

    it("should filter items using prefix matching when typeahead is enabled", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
            { id: "3", text: "Cherry", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "B");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Banana");
    });

    it("should use default prefix matching when typeahead is enabled without custom filter", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "B");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent("Banana");
    });

    it("should use custom shouldFilterItem when typeahead is enabled", async () => {
      const customFilter = vi.fn((item: { text: string }, value: string) =>
        item.text.toLowerCase().includes(value.toLowerCase()),
      );
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Pineapple", price: 200 },
            { id: "3", text: "Banana", price: 300 },
          ],
          shouldFilterItem: customFilter,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "apple");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(2);
      expect(customFilter).toHaveBeenCalled();
    });

    it("should use case-insensitive prefix matching with typeahead", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "apricot", price: 200 },
            { id: "3", text: "AVOCADO", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "a");

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Apple");
      expect(options[1]).toHaveTextContent("apricot");
      expect(options[2]).toHaveTextContent("AVOCADO");
    });

    it("should not autocomplete when deleting characters", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      await user.clear(input);
      await user.type(input, "A");

      await user.keyboard("p");
      expect(input).toHaveValue("Apple");

      await user.keyboard("{Backspace}");
      await user.keyboard("{Backspace}");

      expect(input).toHaveValue("A");
    });

    it("should show all items when input is empty with typeahead", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
            { id: "3", text: "Cherry", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
    });

    it("should update autocomplete suggestion as user types", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Avocado", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      await user.clear(input);
      await user.type(input, "Ap");
      expect(input).toHaveValue("Apple");

      await user.clear(input);
      await user.type(input, "Apr");
      expect(input).toHaveValue("Apricot");
    });

    it("should allow selecting autocompleted item", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      await user.keyboard("{Enter}");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple", price: 100 },
      });
    });

    it("should not show suggestion when no items match prefix", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Z");

      expect(input).toHaveValue("Z");
      expect(screen.queryByRole("option")).not.toBeInTheDocument();
    });

    it("should work with typeahead and keyboard navigation", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Apricot", price: 200 },
            { id: "3", text: "Avocado", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "A");
      expect(input).toHaveValue("Apple");

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("Apricot");
    });

    it("should accept the suggestion on Tab and normalize casing", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");
      // Inline suggestion shows the lowercased typed text plus the completion.
      expect(input).toHaveValue("apple");

      await user.keyboard("{Tab}");

      // Tab commits the suggestion with the item's casing and closes the menu.
      expect(input).toHaveValue("Apple");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple", price: 100 },
      });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should accept the suggestion when clicking away", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");

      await user.click(document.body);

      expect(input).toHaveValue("Apple");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple", price: 100 },
      });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should accept the inline suggestion in place on ArrowRight", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");
      // Inline ghost: typed casing plus the completed tail, selected.
      expect(input).toHaveValue("apple");
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(5);

      await user.keyboard("{ArrowRight}");

      // Accept in place: the displayed text is committed (cursor collapsed to
      // the end), focus stays, the menu stays open, and no item is selected.
      expect(input).toHaveValue("apple");
      expect(input.selectionStart).toBe(5);
      expect(input.selectionEnd).toBe(5);
      expect(input).toHaveFocus();
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());
    });

    it("should accept the inline suggestion in place on End", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");
      expect(input).toHaveValue("apple");

      await user.keyboard("{End}");

      expect(input).toHaveValue("apple");
      expect(input.selectionStart).toBe(5);
      expect(input.selectionEnd).toBe(5);
      expect(input).toHaveFocus();
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());
    });

    it("should still commit and normalize after accepting in place", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");
      await user.keyboard("{ArrowRight}");
      expect(input).toHaveValue("apple");

      // Enter still selects the item and normalizes to the item's casing.
      await user.keyboard("{Enter}");
      expect(input).toHaveValue("Apple");
      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple", price: 100 },
      });
    });

    it("should not intercept ArrowRight when there is no ghost", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ap");
      // Collapse the selection to the end so no ghost remains.
      await user.keyboard("{ArrowRight}");
      expect(input.selectionStart).toBe(input.selectionEnd);

      // A second ArrowRight has no ghost to accept; value is unchanged.
      await user.keyboard("{ArrowRight}");
      expect(input).toHaveValue("apple");
    });

    it("should move the highlight on End when there is no ghost to accept", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          items: [
            { id: "1", text: "Apple", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await tick();
      expect(input).toHaveAttribute("aria-expanded", "true");

      // Nothing typed, so there is no ghost completion for End to accept;
      // it falls through to the highlight-navigation behavior instead.
      await user.keyboard("{End}");
      await tick();
      expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);
    });

    it("should not inline-complete when the top match is not a prefix", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          // The default fixture uses a contains filter, so "ri" matches
          // "Apricot" even though it is not a prefix of the typed text.
          items: [
            { id: "1", text: "Apricot", price: 100 },
            { id: "2", text: "Banana", price: 200 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "ri");

      // No nonsense completion ("riricot"); the dropdown still filters.
      expect(input).toHaveValue("ri");
      expect(screen.getByRole("option")).toHaveTextContent("Apricot");
    });

    describe("default typeahead filter", () => {
      const countries = [
        { id: "de", text: "Germany" },
        { id: "fr", text: "France" },
      ];
      const codeLabel = (item: ComboBoxItem) =>
        `${String(item.id).toUpperCase()} ${item.text}`;

      it("matches the prefix of the itemToString label", async () => {
        render(ComboBoxReal, {
          props: { typeahead: true, items: countries, itemToString: codeLabel },
        });

        const input = getInput();
        await user.click(input);
        await user.type(input, "DE");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("DE Germany");
        expect(input).toHaveValue("DE Germany");
        expect(input.selectionStart).toBe(2);
        expect(input.selectionEnd).toBe(10);
      });

      it("does not match the prefix of item.text when the label differs", async () => {
        render(ComboBoxReal, {
          props: { typeahead: true, items: countries, itemToString: codeLabel },
        });

        const input = getInput();
        await user.click(input);
        await user.type(input, "Ger");

        expect(screen.queryAllByRole("option")).toHaveLength(0);
        expect(input).toHaveValue("Ger");
      });

      it("filters items without text by their label", async () => {
        type KeyItem = { id: string; key: string };
        render(ComboBoxReal, {
          props: {
            typeahead: true,
            items: [
              { id: "0", key: "Slack" },
              { id: "1", key: "Email" },
            ] as unknown as ComboBoxItem[],
            itemToString: (item: ComboBoxItem) =>
              (item as unknown as KeyItem).key,
          },
        });

        const input = getInput();
        await user.click(input);
        await user.type(input, "sl");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("Slack");
      });

      it("keeps prefix matching on item.text with the default itemToString", async () => {
        render(ComboBoxReal, {
          props: {
            typeahead: true,
            items: [
              { id: "1", text: "Apple" },
              { id: "2", text: "Apricot" },
              { id: "3", text: "Banana" },
            ],
          },
        });

        const input = getInput();
        await user.click(input);
        await user.type(input, "ap");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveTextContent("Apple");
        expect(options[1]).toHaveTextContent("Apricot");
      });

      it("still prefers a custom shouldFilterItem", async () => {
        render(ComboBoxReal, {
          props: {
            typeahead: true,
            items: [
              { id: "1", text: "Apple" },
              { id: "2", text: "Apricot" },
              { id: "3", text: "Banana" },
            ],
            shouldFilterItem: (item: ComboBoxItem, value: string) =>
              item.text.toLowerCase().includes(value.toLowerCase()),
          },
        });

        const input = getInput();
        await user.click(input);
        await user.type(input, "an");

        const options = screen.getAllByRole("option");
        expect(options).toHaveLength(1);
        expect(options[0]).toHaveTextContent("Banana");
      });
    });

    it('should set aria-autocomplete to "list" without typeahead', () => {
      render(ComboBox, { props: { typeahead: false } });
      expect(getInput()).toHaveAttribute("aria-autocomplete", "list");
    });

    it('should set aria-autocomplete to "both" when typeahead is enabled', () => {
      render(ComboBox, { props: { typeahead: true } });
      expect(getInput()).toHaveAttribute("aria-autocomplete", "both");
    });

    it("should keep a custom value on Tab when no suggestion matches", async () => {
      render(ComboBox, {
        props: {
          typeahead: true,
          allowCustomValue: true,
          items: [{ id: "1", text: "Apple", price: 100 }],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "xyz");
      await user.keyboard("{Tab}");

      expect(input).toHaveValue("xyz");
    });
  });
});
