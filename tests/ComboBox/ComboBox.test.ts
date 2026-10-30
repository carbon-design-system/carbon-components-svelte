import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import type ComboBoxComponent from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import type { ComboBoxItem } from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import ComboBoxReal from "carbon-components-svelte/ComboBox/ComboBox.svelte";
import { fuzzyMatch } from "carbon-components-svelte/utils/fuzzy-match";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ComboBoxSlot from "./ComboBox.slot.test.svelte";
import ComboBox from "./ComboBox.test.svelte";
import ComboBoxCustom from "./ComboBoxCustom.test.svelte";
import ComboBoxDuplicateIds from "./ComboBoxDuplicateIds.test.svelte";
import ComboBoxGenerics from "./ComboBoxGenerics.test.svelte";
import ComboBoxIconEnd from "./ComboBoxIconEnd.test.svelte";
import ComboBoxIconSlots from "./ComboBoxIconSlots.test.svelte";
import ComboBoxInModal from "./ComboBoxInModal.test.svelte";
import ComboBoxItemIcon from "./ComboBoxItemIcon.test.svelte";
import ComboBoxItemSlot from "./ComboBoxItemSlot.test.svelte";
import { getClearButton, getInput } from "./helpers";

describe("ComboBox", () => {
  it("should render with default props", () => {
    render(ComboBox);

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(getInput()).toHaveAttribute("placeholder", "Select contact method");
  });

  it("forwards a maxlength attribute to the input via restProps", () => {
    render(ComboBoxReal, { props: { items: [], maxlength: 10 } });

    expect(getInput()).toHaveAttribute("maxlength", "10");
  });

  it("should open menu on click", async () => {
    render(ComboBox);

    await user.click(getInput());

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();
  });

  it("should handle item selection", async () => {
    const onSelect = vi.fn();
    render(ComboBox, { props: { onSelect } });

    await user.click(getInput());
    await user.click(screen.getByText("Email"));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({
      selectedId: "1",
      selectedItem: { id: "1", text: "Email", price: 200 },
    });
    expect(getInput()).toHaveValue("Email");
  });

  it("should not re-dispatch select when clicking an already-selected item again", async () => {
    const onSelect = vi.fn();
    render(ComboBox, { props: { onSelect, selectedId: "1" } });

    await user.click(getInput());
    await user.click(screen.getByText("Email"));

    expect(onSelect).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");
  });

  it("should not re-dispatch select when re-confirming an already-selected item with Enter", async () => {
    const onSelect = vi.fn();
    render(ComboBox, { props: { onSelect, selectedId: "1" } });

    const input = getInput();
    await user.click(input);
    // Opening the menu already highlights the current selection (Email).
    await user.keyboard("{Enter}");

    expect(onSelect).not.toHaveBeenCalled();
    expect(input).toHaveValue("Email");
  });

  it("should handle keyboard navigation", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Slack");
  });

  it("should commit a keyboard-highlighted item on Tab, same as Enter", async () => {
    const onSelect = vi.fn();
    render(ComboBox, { props: { onSelect } });

    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Tab}");

    expect(input).toHaveValue("Slack");
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({
      selectedId: "0",
      selectedItem: { id: "0", text: "Slack", price: 100 },
    });
  });

  it("should open the menu on ArrowDown and highlight the first enabled item", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    // Slack (id="0") is the first enabled item.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Slack");
  });

  it("should open the menu on ArrowUp and highlight the last enabled item", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowUp}");
    await tick();

    expect(input).toHaveAttribute("aria-expanded", "true");
    // Fax (id="2") is the last enabled item.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Fax");
  });

  it("should highlight a disabled first item when opening the menu on ArrowDown", async () => {
    render(ComboBox, {
      props: {
        items: [
          { id: "0", text: "Slack", price: 100, disabled: true },
          { id: "1", text: "Email", price: 200 },
          { id: "2", text: "Fax", price: 300 },
        ],
      },
    });

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowDown}");
    await tick();

    // Slack (id="0") is disabled but stays in the navigation sequence so
    // assistive-tech users can discover it.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("should respect an existing typed filter when opening the menu on ArrowDown", async () => {
    render(ComboBox, {
      props: {
        value: "fa",
        allowCustomValue: true,
      },
    });

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowDown}");
    await tick();

    // "fa" filters the items to Fax (id="2") only; the highlight must target
    // the filtered set, not items[0] ("Slack").
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Fax");
  });

  it("should keep the highlight on the selected item when opening the menu on ArrowDown", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
        shouldFilterItem: () => true,
      },
    });

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowDown}");
    await tick();

    // Opening highlights the selected item (Email, id="1"), not the first item.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-1$/);

    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should open the menu on Alt+ArrowDown without moving the highlight", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(input).toHaveAttribute("aria-activedescendant", "");
  });

  it("should highlight the selected item when opening the menu on Alt+ArrowDown", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
        shouldFilterItem: () => true,
      },
    });

    const input = getInput();
    input.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-1$/);
  });

  it("should close the menu on Alt+ArrowUp", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("should treat Alt+ArrowDown on an open menu and Alt+ArrowUp on a closed menu as no-ops", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should move the caret, not the highlight, on Home/End when the menu is closed", async () => {
    render(ComboBox, {
      props: { selectedId: "1", value: "Email" },
    });

    const input = getInput();
    input.focus();
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Home}");
    expect(input.selectionStart).toBe(0);

    await user.keyboard("{End}");
    expect(input.selectionStart).toBe(5);
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("should move the highlight to the last enabled item on End when the menu is open", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowDown}");
    await tick();
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{End}");
    await tick();
    // Fax (id="2") is the last enabled item.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should move the highlight to the first enabled item on Home when the menu is open", async () => {
    render(ComboBox);

    const input = getInput();
    input.focus();

    await user.keyboard("{ArrowUp}");
    await tick();
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-2$/);

    await user.keyboard("{Home}");
    await tick();
    // Slack (id="0") is the first enabled item.
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should set aria-activedescendant to the highlighted filtered item", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.keyboard("fax");
    await user.keyboard("{ArrowDown}");

    // After filtering to "Fax" (id="2"), ArrowDown highlights filteredItems[0].
    // aria-activedescendant must reference that item, not items[0] ("Slack").
    // The option id is scoped with the instance id (`${id}-${item.id}`), so it
    // ends with "-2" and resolves to exactly one [role="option"] in the document.
    const activeId = input.getAttribute("aria-activedescendant");
    expect(activeId).toMatch(/-2$/);
    const activeOptions = document.querySelectorAll(`[id="${activeId}"]`);
    expect(activeOptions).toHaveLength(1);
    expect(activeOptions[0]).toHaveAttribute("role", "option");
  });

  it("should clear the hover highlight when the cursor leaves the menu", async () => {
    render(ComboBox);

    await user.click(getInput());

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("does not select a hover-highlighted item on Enter; closes without selecting", async () => {
    const onSelect = vi.fn();
    render(ComboBox, { props: { onSelect } });

    const input = getInput();
    await user.click(input);

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("should not set aria-owns on the combobox", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    expect(input).toHaveAttribute("aria-controls");
    // ARIA 1.2 comboboxes reference the popup via aria-controls only;
    // aria-owns restructures the accessibility tree and can double-read.
    expect(input).not.toHaveAttribute("aria-owns");
  });

  it("keeps focus on the field while clicking an option", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    expect(input).toHaveFocus();

    // Focus must never move to the option — a focus bounce makes screen
    // readers re-announce the entire field on every click.
    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.click(emailOption);

    expect(input).toHaveValue("Email");
    expect(input).toHaveFocus();
  });

  it("should set aria-activedescendant only when an item is highlighted", async () => {
    render(ComboBox, { props: { shouldFilterItem: () => true } });

    const input = getInput();
    expect(input).toHaveAttribute("aria-activedescendant", "");

    await user.click(input);
    expect(input).toHaveAttribute("aria-activedescendant", "");

    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).not.toBe("");
  });

  it("should not set a role on the combobox root element", async () => {
    const { container } = render(ComboBox);

    // The root wraps the role="combobox" input, which is not a valid child
    // of a listbox (aria-required-children). The listbox role belongs to
    // the dropdown menu alone.
    expect(container.querySelector(".bx--combo-box")).not.toHaveAttribute(
      "role",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(getInput());

    const listboxes = screen.getAllByRole("listbox");
    expect(listboxes).toHaveLength(1);
    expect(listboxes[0]).toHaveClass("bx--list-box__menu");
  });

  it("scopes option ids per instance to avoid duplicate ids across ComboBoxes", () => {
    render(ComboBoxDuplicateIds);

    const ids = Array.from(
      document.querySelectorAll<HTMLElement>('[role="option"]'),
    ).map((option) => option.id);

    // Two ComboBoxes render the same three items, so there are six options.
    expect(ids).toHaveLength(6);

    // Every option id is globally unique despite shared item ids.
    expect(new Set(ids).size).toBe(ids.length);

    // Ids are scoped with each instance's id prop.
    expect(ids.filter((id) => id.startsWith("combo-a-"))).toEqual([
      "combo-a-0",
      "combo-a-1",
      "combo-a-2",
    ]);
    expect(ids.filter((id) => id.startsWith("combo-b-"))).toEqual([
      "combo-b-0",
      "combo-b-1",
      "combo-b-2",
    ]);
  });

  it("should start keyboard navigation at selected item index", async () => {
    render(ComboBox, {
      props: {
        selectedId: "0", // Slack is first item (index 0)
        // Use a filter that shows all items so we can test navigation
        shouldFilterItem: () => true,
      },
    });

    const input = getInput();
    await user.click(input);

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("Email");
  });

  it("should handle clear selection via keyboard navigation (Enter)", async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    render(ComboBox, {
      props: {
        onSelect,
        onClear,
        selectedId: "1",
        value: "Email",
      },
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onClear).toHaveBeenCalledOnce();
    expect(onClear.mock.calls[0][0].type).toBe("clear");
    expect(onSelect).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("");
  });

  it("should handle clear selection via keyboard navigation (Space)", async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    render(ComboBox, {
      props: {
        onSelect,
        onClear,
        selectedId: "1",
        value: "Email",
      },
    });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue("Email");

    const clearButton = getClearButton();
    clearButton.focus();
    expect(clearButton).toHaveFocus();
    await user.keyboard(" ");
    await tick();

    expect(onClear).toHaveBeenCalledOnce();
    expect(onClear.mock.calls[0][0].type).toBe("clear");
    expect(onSelect).not.toHaveBeenCalled();
    // Wait for binding updates to complete
    await tick();
    expect(getInput()).toHaveValue("");
  });

  it("should use custom translations when translateWithId is provided", () => {
    const customTranslations = {
      clearSelection: "Remove selected item",
      clearAll: "Remove all items",
    } as const;

    const props = {
      selectedId: "1",
      value: "Email",
      translateWithIdSelection: (id: keyof typeof customTranslations) =>
        customTranslations[id],
    } satisfies ComponentProps<ComboBox>;

    render(ComboBox, { props });

    const clearButton = screen.getByRole("button", {
      name: "Remove selected item",
    });
    expect(clearButton).toBeInTheDocument();
  });

  // `open` belongs to the combo box, not its clear button; forwarded,
  // it lands on the button's div as `open="false"`, which server markup
  // leaves out.
  it("does not put an open attribute on the clear button", async () => {
    render(ComboBox, { props: { selectedId: "1", value: "Email" } });

    const clearButton = screen.getByRole("button", {
      name: "Clear selected item",
    });
    expect(clearButton).not.toHaveAttribute("open");
    await user.click(getInput());
    expect(clearButton).not.toHaveAttribute("open");
  });

  // A combo box rendered open hasn't been opened by the user, so it
  // leaves focus (and the page's scroll position) where they are.
  it("does not take focus when rendered open", async () => {
    render(ComboBox, { props: { open: true } });
    await tick();

    expect(getInput()).not.toHaveFocus();
  });

  it("focuses the input when opened after rendering", async () => {
    const { rerender } = render(ComboBox, { props: { open: false } });
    await tick();

    await rerender({ open: true });
    await tick();

    expect(getInput()).toHaveFocus();
  });

  it("should handle disabled state", () => {
    render(ComboBox, { props: { disabled: true } });

    expect(getInput()).toBeDisabled();
    expect(screen.getByText("Contact")).toHaveClass("bx--label--disabled");
  });

  // Invalid, warning, and helper wiring is in tests/form-field-contract.
  it("marks the list box invalid", () => {
    const { container } = render(ComboBox, {
      props: { invalid: true, invalidText: "Invalid selection" },
    });

    expect(container.querySelector(".bx--combo-box")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it.each(["disabled", "readonly"] as const)(
    "keeps the list box and its icon out of the invalid state when %s",
    (state) => {
      const { container } = render(ComboBox, {
        props: {
          [state]: true,
          invalid: true,
          invalidText: "Invalid selection",
          warn: true,
          warnText: "Warning message",
        },
      });

      expect(container.querySelector(".bx--combo-box")).not.toHaveAttribute(
        "data-invalid",
      );
      expect(container.querySelector(".bx--list-box__invalid-icon")).toBeNull();
    },
  );

  it.each([
    ["sm", "bx--list-box--sm"],
    ["xl", "bx--list-box--xl"],
  ] as const)("should handle size variants", (size, className) => {
    const { container } = render(ComboBox, { props: { size } });
    expect(container.querySelector(".bx--combo-box")).toHaveClass(className);
  });

  it("should handle filtering items", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    await user.type(input, "em");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Email");

    await user.clear(input);
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.click(document.body);
    expect(input).not.toHaveFocus();

    await user.keyboard("{Tab}");
    expect(input).toHaveFocus();

    await user.type(input, "a");
    await user.click(screen.getAllByRole("option")[1]);
    expect(input).toHaveValue("Email");

    await user.click(document.body);
    expect(input).not.toHaveFocus();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("omits the hidden attribute on open options when filterMode is remove", async () => {
    const { container } = render(ComboBox);

    await user.click(getInput());

    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(container.querySelectorAll('[role="option"][hidden]')).toHaveLength(
      0,
    );
  });

  it("keeps unmatched options mounted and hidden when filterMode is hide", async () => {
    const { container } = render(ComboBox, {
      props: { filterMode: "hide" },
    });

    const input = getInput();
    await user.click(input);
    await user.type(input, "em");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(3);
    expect(container.querySelectorAll('[role="option"][hidden]')).toHaveLength(
      2,
    );
    expect(screen.getByRole("option")).toHaveAttribute("aria-setsize", "1");
    expect(screen.getByRole("option")).toHaveAttribute("aria-posinset", "1");
  });

  it("unmounts unmatched options when filterMode is remove", async () => {
    const { container } = render(ComboBox, {
      props: { filterMode: "remove" },
    });

    const input = getInput();
    await user.click(input);
    await user.type(input, "em");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
  });

  describe("selection cleared announcement", () => {
    const getStatus = () => screen.getByRole("status");

    it("renders an empty status region", () => {
      render(ComboBox);

      expect(getStatus()).toHaveTextContent("");
    });

    it("announces clearing via the clear button", async () => {
      render(ComboBox, { props: { selectedId: "1" } });

      await user.click(getClearButton());

      await waitFor(() =>
        expect(getStatus()).toHaveTextContent("Selection cleared"),
      );
    });

    it("announces clearing a selection via Escape with the menu open", async () => {
      render(ComboBox, { props: { selectedId: "1" } });

      await user.click(getInput());
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      await user.keyboard("{Escape}");

      await waitFor(() =>
        expect(getStatus()).toHaveTextContent("Selection cleared"),
      );
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("dispatches clear with the keyboard event when Escape clears a selection", async () => {
      const onClear = vi.fn();
      render(ComboBox, { props: { selectedId: "1", onClear } });

      getInput().focus();
      await user.keyboard("{Escape}");

      expect(onClear).toHaveBeenCalledOnce();
      expect(onClear.mock.calls[0][0].detail).toBeInstanceOf(KeyboardEvent);
    });

    it("does not dispatch clear when Escape only clears typed text", async () => {
      const onClear = vi.fn();
      render(ComboBox, { props: { onClear } });

      const input = getInput();
      await user.click(input);
      await user.type(input, "sl");
      await user.keyboard("{Escape}");

      expect(onClear).not.toHaveBeenCalled();
    });

    it("does not dispatch clear on Escape when read-only", async () => {
      const onClear = vi.fn();
      render(ComboBox, { props: { selectedId: "1", readonly: true, onClear } });

      getInput().focus();
      await user.keyboard("{Escape}");

      expect(onClear).not.toHaveBeenCalled();
    });

    it("stays silent when Escape clears typed text without a selection", async () => {
      render(ComboBox);

      const input = getInput();
      await user.click(input);
      await user.type(input, "sl");
      await user.keyboard("{Escape}");
      await tick();

      expect(getStatus()).toHaveTextContent("");
    });

    it("announces a programmatic clear()", async () => {
      render(ComboBoxCustom, { props: { selectedId: "1" } });

      await user.click(screen.getByRole("button", { name: "Clear" }));

      await waitFor(() =>
        expect(getStatus()).toHaveTextContent("Selection cleared"),
      );
    });

    it("uses selectionClearedText", async () => {
      render(ComboBoxReal, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          selectedId: "1",
          selectionClearedText: "Channel cleared",
        },
      });

      await user.click(getClearButton());

      await waitFor(() =>
        expect(getStatus()).toHaveTextContent("Channel cleared"),
      );
    });

    it("stays silent when readonly", async () => {
      render(ComboBox, { props: { readonly: true, selectedId: "1" } });

      getInput().focus();
      await user.keyboard("{Escape}");
      await tick();

      expect(getStatus()).toHaveTextContent("");
    });
  });

  it("should clear input when clicking clear button", async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    render(ComboBox, { props: { selectedId: "1", onSelect, onClear } });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    await user.click(getClearButton());

    expect(getInput()).toHaveValue("");
    expect(onClear).toHaveBeenCalledOnce();
    expect(onClear.mock.calls[0][0].type).toBe("clear");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("should not reopen menu after clear button click by default", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    await user.click(getClearButton());

    expect(getInput()).toHaveValue("");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("should reopen menu after clear button click when openOnClear is true", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
        openOnClear: true,
      },
    });

    await user.click(getClearButton());

    expect(getInput()).toHaveValue("");
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(3);
  });

  it("should not reopen menu on Escape even when openOnClear is true", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
        openOnClear: true,
      },
    });

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
  });

  it("should handle disabled items", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const disabledOption = screen.getByRole("option", { name: /Fax/ });
    expect(disabledOption).toHaveAttribute("disabled", "true");
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");

    await user.click(disabledOption);
    expect(getInput()).toHaveValue("");

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();
  });

  it("should handle custom item display", async () => {
    render(ComboBoxCustom);

    await user.click(getInput());
    const options = screen.getAllByRole("option");

    expect(options[0]).toHaveTextContent("Item Slack");
    expect(options[1]).toHaveTextContent("Item Email");
    expect(options[2]).toHaveTextContent("Item Fax");
  });

  it("should handle top direction", async () => {
    const { container } = render(ComboBoxCustom, {
      props: { direction: "top" },
    });

    await user.click(screen.getAllByRole("button")[0]);
    expect(container.querySelector(".bx--combo-box")).toHaveClass(
      "bx--list-box--up",
    );
  });

  it("should programmatically clear selection", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
  });

  it("should programmatically clear and reopen menu", async () => {
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear (reopen)"));
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();

    const options = screen.getAllByRole("option");
    expect(options.length).toBe(3);
  });

  it("should close on the first outside click after clearing and reopening from a closed box", async () => {
    // closed -> open via clear({ open: true }): the gated outside-click
    // listener is absent while the triggering click bubbles, so it cannot
    // self-close. The next genuine outside click must close on the first try.
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    expect(input).toHaveValue("Email");
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.click(screen.getByText("Clear (reopen)"));
    expect(screen.getAllByRole("option").length).toBe(3);

    await user.click(document.body);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("should keep the menu open when clearing and reopening from an already-open box", async () => {
    // open -> open via clear({ open: true }): the triggering click must not
    // close the box that clear() just reopened.
    render(ComboBoxCustom, { props: { selectedId: "1" } });

    const input = getInput();
    await user.click(input);
    // Open with the current selection: the filter narrows to the one match.
    expect(screen.getByRole("option")).toHaveTextContent("Email");

    await user.click(screen.getByText("Clear (reopen)"));
    expect(input).toHaveValue("");
    expect(screen.getAllByRole("option").length).toBe(3);
  });

  it("should not re-focus textbox if clearOptions.focus is false", async () => {
    render(ComboBoxCustom, {
      props: {
        selectedId: "1",
        clearOptions: { focus: false },
      },
    });

    const input = getInput();
    expect(input).toHaveValue("Email");

    await user.click(screen.getByText("Clear"));
    expect(input).toHaveValue("");
    expect(input).not.toHaveFocus();
  });

  it("should close menu on Escape key", async () => {
    render(ComboBox);

    expect(getInput()).toHaveValue("");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should close menu and clear selection on Escape key", async () => {
    render(ComboBox, {
      props: {
        selectedId: "1",
        value: "Email",
      },
    });

    expect(getInput()).toHaveValue("Email");

    const input = getInput();
    await user.click(input);

    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();

    await user.keyboard("{Escape}");
    expect(dropdown).not.toBeVisible();
    expect(getInput()).toHaveValue("");
    expect(getInput()).toHaveFocus();
  });

  it("should use custom shouldFilterItem function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
          { id: "3", text: "Cherry" },
        ],
        shouldFilterItem: (item: { text: string }, value: string) =>
          item.text.startsWith(value),
      },
    });
    const input = getInput();
    await user.click(input);
    await user.type(input, "B");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
  });

  it("should support fuzzyMatch as shouldFilterItem", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Blueberry" },
          { id: "3", text: "Blackberry" },
        ],
        shouldFilterItem: (item: { text: string }, value: string) =>
          fuzzyMatch(item.text, value).matched,
      },
    });
    const input = getInput();
    await user.click(input);
    await user.type(input, "b");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Blueberry");
    expect(options[1]).toHaveTextContent("Blackberry");
  });

  it("should use custom itemToString function", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Apple" },
          { id: "2", text: "Banana" },
        ],
        itemToString: (item: { text: string }) => `Item ${item.text}`,
      },
    });
    const input = getInput();
    await user.click(input);
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("Item Apple");
    await user.click(options[1]);
    expect(input).toHaveValue("Item Banana");
  });

  describe("typed text matches the itemToString label", () => {
    const acceptAll = () => true;

    it("selects the item whose custom label is typed, on Enter", async () => {
      const onSelect = vi.fn();
      render(ComboBoxCustom, {
        props: {
          onSelect,
          itemToString: (item: ComboBoxItem) => `Item ${item.text}`,
          shouldFilterItem: acceptAll,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Item Email");
      await user.keyboard("{Enter}");

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "1",
        selectedItem: { id: "1", text: "Email" },
      });
      expect(input).toHaveValue("Item Email");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("ignores case and normalizes the value to the label", async () => {
      const onSelect = vi.fn();
      render(ComboBoxCustom, {
        props: {
          onSelect,
          itemToString: (item: ComboBoxItem) => `Item ${item.text}`,
          shouldFilterItem: acceptAll,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "item email");
      await user.keyboard("{Enter}");

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ selectedId: "1" }),
      );
      expect(input).toHaveValue("Item Email");
    });

    it("does not throw for items without text", async () => {
      const onSelect = vi.fn();
      type KeyItem = { id: string; key: string };
      render(ComboBoxCustom, {
        props: {
          onSelect,
          items: [
            { id: "0", key: "Slack" },
            { id: "1", key: "Email" },
          ] as unknown as ComboBoxItem[],
          itemToString: (item: ComboBoxItem) =>
            (item as unknown as KeyItem).key,
          shouldFilterItem: acceptAll,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Email");
      await user.keyboard("{Enter}");

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ selectedId: "1" }),
      );
      expect(input).toHaveValue("Email");
    });

    it("does not select a disabled item whose label is typed", async () => {
      const onSelect = vi.fn();
      render(ComboBoxCustom, {
        props: {
          onSelect,
          itemToString: (item: ComboBoxItem) => `Item ${item.text}`,
          shouldFilterItem: acceptAll,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Item Fax");
      await user.keyboard("{Enter}");

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("commits a typeahead suggestion with a custom label on Tab", async () => {
      const onSelect = vi.fn();
      render(ComboBoxCustom, {
        props: {
          onSelect,
          typeahead: true,
          items: [
            { id: "1", text: "Apple" },
            { id: "2", text: "Banana" },
          ],
          itemToString: (item: ComboBoxItem) => `${item.text} (${item.id})`,
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "Ap");
      expect(input).toHaveValue("Apple (1)");

      await user.keyboard("{Tab}");

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "1",
        selectedItem: { id: "1", text: "Apple" },
      });
      expect(input).toHaveValue("Apple (1)");
    });
  });

  // Regression: ?? for itemToString so item.text "" is used (not id)
  it("should display empty string when item.text is empty (nullish coalescing)", async () => {
    render(ComboBox, {
      props: {
        items: [
          { id: "1", text: "", price: 0 },
          { id: "2", text: "Email", price: 200 },
        ],
      },
    });
    await user.click(getInput());
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("");
    await user.click(options[0]);
    expect(getInput()).toHaveValue("");
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("should use empty aria-label when passed (nullish coalescing)", async () => {
    render(ComboBox, {
      props: {
        items: [{ id: "1", text: "Email", price: 200 }],
        ariaLabel: "",
      },
    });
    await user.click(getInput());
    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("aria-label", "");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2715
  it("should use labelText as aria-label fallback when aria-label is not passed", async () => {
    render(ComboBox, {
      props: {
        items: [{ id: "1", text: "Email", price: 200 }],
        labelText: "Contact",
      },
    });
    await user.click(getInput());
    const listbox = screen.getByRole("listbox", { name: "Contact" });
    expect(listbox).toHaveAttribute("aria-label", "Contact");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2715
  it("should use explicit aria-label over labelText when both are provided", async () => {
    render(ComboBox, {
      props: {
        items: [{ id: "1", text: "Email", price: 200 }],
        labelText: "Contact",
        ariaLabel: "Custom accessible name",
      },
    });
    await user.click(getInput());
    const listbox = screen.getByRole("listbox", {
      name: "Custom accessible name",
    });
    expect(listbox).toHaveAttribute("aria-label", "Custom accessible name");
  });

  // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2715
  it("should default to 'Choose an item' when neither labelText nor aria-label is provided", async () => {
    render(ComboBox, {
      props: {
        items: [{ id: "1", text: "Email", price: 200 }],
        labelText: "",
      },
    });
    await user.click(getInput());
    const listbox = screen.getByRole("listbox", { name: "Choose an item" });
    expect(listbox).toHaveAttribute("aria-label", "Choose an item");
  });

  it("leaves aria-label off the role-less list box wrapper", () => {
    const { container } = render(ComboBox, {
      props: { items: [{ id: "1", text: "Email", price: 200 }] },
    });
    const wrapper = container.querySelector(".bx--list-box");
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveAttribute("aria-label");
  });

  // Regression: aria-labelledby on the input pointed at the unnamed ListBox
  // wrapper, shadowing the <label for> association so the input's accessible
  // name was the wrapper's aria-label (or empty) instead of labelText.
  it("should associate the labelText with the combobox input", () => {
    render(ComboBox, {
      props: {
        items: [{ id: "1", text: "Email", price: 200 }],
        labelText: "Contact method",
        ariaLabel: "Listbox region",
      },
    });
    expect(screen.getByLabelText("Contact method")).toBe(getInput());
  });

  it("should open menu if open prop is true on mount", () => {
    render(ComboBox, { props: { open: true } });
    const dropdown = screen.getByRole("listbox");
    expect(dropdown).toBeVisible();
  });

  it("should select nothing when all items are disabled", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "A", disabled: true },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C", disabled: true },
        ],
      },
    });
    const input = getInput();
    await user.click(input);

    // Disabled items stay in the keyboard navigation sequence so
    // assistive-tech users can discover them.
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-1$/);
    await user.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-3$/);

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("should not auto-select an unrelated item when Enter is pressed with a partial match", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);
    // "a" matches "Slack" and "Fax" via the filter, but is not an exact
    // text match for either. Pressing Enter should not silently select
    // the first filtered item.
    await user.type(input, "a");
    await user.keyboard("{Enter}");

    expect(input).toHaveValue("a");
  });

  it("should navigate the filtered list, not the unfiltered list", async () => {
    // Regression guard: `change()` previously indexed into the wrong array
    // when filtering was active. Navigation must step through the filtered
    // items, including disabled ones.
    //
    // Unfiltered: [Ax, Bx, Ay(disabled), Az]
    // Filtered by "a": [Ax, Ay(disabled), Az]
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "Ax" },
          { id: "2", text: "Bx" },
          { id: "3", text: "Ay", disabled: true },
          { id: "4", text: "Az" },
        ],
      },
    });
    const input = getInput();
    await user.click(input);

    // Typing "a" filters to: Ax, Ay (disabled), Az
    await user.type(input, "a");

    // ArrowDown highlights Ax (filtered index 0)
    await user.keyboard("{ArrowDown}");
    // ArrowDown highlights disabled Ay (id "3"), not Bx (id "2") — the
    // highlight steps through the filtered list and includes disabled items.
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-3$/);
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("a");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Az");
  });

  it("should highlight but not select disabled items during keyboard navigation", async () => {
    render(ComboBoxCustom, {
      props: {
        items: [
          { id: "1", text: "A" },
          { id: "2", text: "B", disabled: true },
          { id: "3", text: "C" },
        ],
      },
    });
    const input = getInput();
    await user.click(input);
    await user.keyboard("{ArrowDown}"); // highlights A
    await user.keyboard("{ArrowDown}"); // highlights disabled B
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowDown}"); // highlights C
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("C");
  });

  it("should not set aria-describedby when no message is shown", () => {
    render(ComboBoxReal, { props: { id: "cb" } });
    expect(getInput()).not.toHaveAttribute("aria-describedby");
  });

  it("should not open menu when input is focused via keyboard", async () => {
    render(ComboBox);

    await user.keyboard("{Tab}");
    expect(getInput()).toHaveFocus();

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should infer generic type from items and support destructuring in slots", async () => {
      const onSelect = vi.fn();
      render(ComboBoxGenerics, { props: { onSelect } });

      const input = screen.getByRole("combobox");
      await user.click(input);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Laptop");
      expect(options[0]).toHaveTextContent("$999");
      expect(options[0]).toHaveTextContent("Electronics");

      await user.click(screen.getByText("Laptop"));

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "1",
        selectedItem: {
          id: "1",
          text: "Laptop",
          price: 999,
          category: "Electronics",
        },
      });
    });

    it("should support generic types with ComponentProps and ComponentEvents", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
        category: string;
        inStock: boolean;
      };

      type ComponentType = ComboBoxComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      type ItemsProp = NonNullable<Props["items"]>;
      expectTypeOf<ItemsProp>().toEqualTypeOf<readonly Product[]>();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      const shouldFilterItem = (item: Product, value: string) =>
        item.category.includes(value);
      expectTypeOf(shouldFilterItem).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(shouldFilterItem).parameter(1).toEqualTypeOf<string>();
      expectTypeOf(shouldFilterItem).returns.toEqualTypeOf<boolean>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      type SelectedItem = SelectEventDetail["selectedItem"];
      expectTypeOf<SelectedItem>().toEqualTypeOf<Product>();
    });

    it("should default to ComboBoxItem when generic is not specified", () => {
      type ComponentType = ComboBoxComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toHaveProperty("length");

      type ItemElement = NonNullable<Props["items"]>[number];
      expectTypeOf<ItemElement>().toHaveProperty("id");
      expectTypeOf<ItemElement>().toHaveProperty("text");

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      type SelectedItem = SelectEventDetail["selectedItem"];
      expectTypeOf<SelectedItem>().toHaveProperty("id");
      expectTypeOf<SelectedItem>().toHaveProperty("text");
    });

    it("should enforce ComboBoxItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = ComboBoxComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = ComboBoxComponent<ComboBoxItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly ComboBoxItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should default Id to any when not specified", () => {
        type ComponentType = ComboBoxComponent;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<any | undefined>();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
        expectTypeOf<SelectEventDetail["selectedId"]>().toEqualTypeOf<any>();
      });

      it("should support different ID types (string, number, union)", () => {
        type StringItem = { id: string; text: string };
        type StringComponent = ComboBoxComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedId"]
        >().toEqualTypeOf<string | undefined>();

        type NumberItem = { id: number; text: string };
        type NumberComponent = ComboBoxComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedId"]
        >().toEqualTypeOf<number | undefined>();

        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = ComboBoxComponent<UnionItem>;
        type UnionEvents = ComponentEvents<UnionComponent>;
        type UnionSelectDetail =
          UnionEvents["select"] extends CustomEvent<infer T> ? T : never;
        expectTypeOf<
          UnionSelectDetail["selectedId"]
        >().toEqualTypeOf<UnionId>();
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

        type ComponentType = ComboBoxComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;
        type Events = ComponentEvents<ComponentType>;

        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<
          InferredId | undefined
        >();

        type SelectEvent = Events["select"];
        type SelectEventDetail =
          SelectEvent extends CustomEvent<infer T> ? T : never;
        expectTypeOf<
          SelectEventDetail["selectedId"]
        >().toEqualTypeOf<InferredId>();
        expectTypeOf<
          SelectEventDetail["selectedItem"]
        >().toEqualTypeOf<InferredItem>();
      });
    });
  });

  it("supports custom label slot", () => {
    render(ComboBoxSlot);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should pass selected and highlighted to the default slot", async () => {
    render(ComboBoxItemSlot, { props: { selectedId: "1" } });

    await user.click(getInput());

    const customItems = screen.getAllByTestId("custom-item");

    // selectedId "1" is the second item, not index 1.
    expect(customItems[0]).toHaveAttribute("data-selected", "false");
    expect(customItems[1]).toHaveAttribute("data-selected", "true");
    expect(customItems[2]).toHaveAttribute("data-selected", "false");

    await user.hover(customItems[2]);
    expect(customItems[2]).toHaveAttribute("data-highlighted", "true");
    expect(customItems[0]).toHaveAttribute("data-highlighted", "false");
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
      render(ComboBox, {
        props: { portalMenu: true, open: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", () => {
      render(ComboBoxInModal, {
        props: { modalOpen: true, comboBoxOpen: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(ComboBoxInModal, {
        props: {
          modalOpen: true,
          comboBoxOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    it("should close portaled menu when clicking outside", async () => {
      render(ComboBox, {
        props: { portalMenu: true },
      });

      await user.click(getInput());
      const menu = screen.getByRole("listbox");
      expect(menu).toBeVisible();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should keep the portaled menu open when clicking inside it", async () => {
      render(ComboBox, {
        props: { portalMenu: true },
      });

      await user.click(getInput());
      await user.click(screen.getByRole("listbox"));

      expect(screen.getByRole("listbox")).toBeVisible();
    });
  });

  it("should not trap focus when tabbing away from an open menu", async () => {
    const { container } = render(ComboBox);

    const externalButton = document.createElement("button");
    externalButton.textContent = "Outside";
    container.appendChild(externalButton);

    const input = getInput();
    await user.click(input);

    expect(screen.getByRole("listbox")).toBeVisible();

    // Simulate a blur where focus moves to an element outside the combobox.
    // In a real browser, Tab triggers blur with relatedTarget = next element.
    // A buggy handler will call ref.focus() synchronously, trapping focus.
    const focusSpy = vi.spyOn(input, "focus");
    input.dispatchEvent(
      new FocusEvent("blur", { relatedTarget: externalButton, bubbles: true }),
    );

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("should refocus the input when blur moves focus to the open menu", async () => {
    render(ComboBox);

    const input = getInput();
    await user.click(input);

    const listbox = screen.getByRole("listbox");
    const focusSpy = vi.spyOn(input, "focus");
    input.dispatchEvent(
      new FocusEvent("blur", { relatedTarget: listbox, bubbles: true }),
    );

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it("should not highlight a disabled option on hover", async () => {
    render(ComboBox, {
      props: {
        items: [
          { id: "0", text: "Slack", price: 100 },
          { id: "1", text: "Email", price: 200, disabled: true },
        ],
      },
    });

    const input = getInput();
    await user.click(input);

    await user.hover(screen.getByRole("option", { name: "Email" }));
    expect(input).toHaveAttribute("aria-activedescendant", "");

    await user.hover(screen.getByRole("option", { name: "Slack" }));
    expect(input.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  describe("autoHighlight", () => {
    const getHighlightedItems = () =>
      document.querySelectorAll(
        ".bx--list-box__menu-item--highlighted:not(.bx--list-box__menu-item--active)",
      );

    const getHighlightedOption = () => {
      const items = document.querySelectorAll(
        ".bx--list-box__menu-item--highlighted",
      );
      // Return the highlighted item that isn't highlighted solely due to being active
      for (const item of items) {
        return item;
      }
      return null;
    };

    it("should not auto-highlight by default", async () => {
      render(ComboBox);

      const input = getInput();
      await user.click(input);
      await user.type(input, "f");

      await tick();

      const highlighted = getHighlightedItems();
      expect(highlighted.length).toBe(0);
    });

    it('should highlight first matching item with autoHighlight="first-match"', async () => {
      render(ComboBox, {
        props: { autoHighlight: "first-match" },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "f");

      await tick();

      const highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Fax");
    });

    it("should highlight the correct item without a custom shouldFilterItem", async () => {
      render(ComboBoxReal, {
        props: {
          autoHighlight: "first-match",
          items: [
            { id: "0", text: "Apple" },
            { id: "1", text: "Apricot" },
            { id: "2", text: "Banana" },
            { id: "3", text: "Blueberry" },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "b");

      const highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Banana");
    });

    it("should skip disabled items", async () => {
      render(ComboBox, {
        props: {
          autoHighlight: "first-match",
          items: [
            { id: "0", text: "Safari", price: 200, disabled: true },
            { id: "1", text: "Signal", price: 300 },
            { id: "2", text: "Slack", price: 100 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "s");

      await tick();

      // Safari is the first match but disabled, so the first enabled match wins.
      const highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Signal");
    });

    it("should reset highlight when no items match", async () => {
      render(ComboBox, {
        props: { autoHighlight: "first-match" },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "s");
      await tick();

      expect(getHighlightedItems().length).toBe(1);

      await user.type(input, "zz");
      await tick();

      expect(screen.queryAllByRole("option")).toHaveLength(0);
      expect(getHighlightedItems().length).toBe(0);
    });

    it("should not highlight when input is empty", async () => {
      const { rerender } = render(ComboBox, {
        props: {
          autoHighlight: "first-match",
          allowCustomValue: true,
          open: true,
          value: "s",
        },
      });

      await tick();
      expect(getHighlightedItems().length).toBe(1);

      await rerender({ value: "" });
      await tick();

      expect(getInput()).toHaveValue("");
      expect(screen.getAllByRole("option")).toHaveLength(3);
      expect(getHighlightedItems().length).toBe(0);
    });

    it("should highlight selected item on re-open, then update on typing", async () => {
      render(ComboBox, {
        props: { autoHighlight: "first-match" },
      });

      const input = getInput();

      await user.click(input);
      await user.click(screen.getByText("Email"));
      expect(input).toHaveValue("Email");

      await user.click(input);
      await tick();

      const emailOption = screen
        .getAllByRole("option")
        .find((el) => el.textContent?.includes("Email"));
      expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

      await user.clear(input);
      await user.type(input, "f");
      await tick();

      const highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Fax");
    });

    it("should allow arrow keys to override auto-highlight", async () => {
      render(ComboBox, {
        props: {
          autoHighlight: "first-match",
          items: [
            { id: "0", text: "Slack", price: 100 },
            { id: "1", text: "Signal", price: 200 },
            { id: "2", text: "Skype", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "s");

      await tick();

      let highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Slack");

      await user.keyboard("{ArrowDown}");
      await tick();

      highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Signal");
    });

    it("should work with typeahead: input autocompletes and first match highlights", async () => {
      render(ComboBox, {
        props: {
          autoHighlight: "first-match",
          typeahead: true,
          items: [
            { id: "0", text: "Slack", price: 100 },
            { id: "1", text: "Signal", price: 200 },
            { id: "2", text: "Email", price: 300 },
          ],
        },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "sl");

      await tick();

      // User typed "sl" (lowercase), typeahead appends "ack" from "Slack"
      expect(input.value).toBe("slack");
      // The typed portion ends at index 2, suggestion fills the rest
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(5);

      const highlighted = getHighlightedOption();
      expect(highlighted).not.toBeNull();
      expect(highlighted?.textContent).toContain("Slack");

      await user.keyboard("{Enter}");
      expect(input).toHaveValue("Slack");
    });
  });

  describe("readonly", () => {
    it("should apply readonly class and aria-readonly", () => {
      const { container } = render(ComboBox, { readonly: true });

      expect(container.querySelector(".bx--combo-box--readonly")).toBeTruthy();
      expect(getInput()).toHaveAttribute("aria-readonly", "true");
      expect(getInput()).toHaveAttribute("readonly");
      expect(getInput()).not.toHaveAttribute("aria-disabled");
      expect(container.querySelector(".bx--combo-box")).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
      render(ComboBox, { readonly: true });

      expect(getInput()).toHaveAccessibleDescription("Read-only");
    });

    it("should keep aria-disabled when disabled", () => {
      render(ComboBox, { disabled: true });

      expect(getInput()).toHaveAttribute("aria-disabled", "true");
      expect(getInput()).toBeDisabled();
    });

    it("should omit aria-disabled when neither disabled nor readonly", () => {
      render(ComboBox);

      expect(getInput()).not.toHaveAttribute("aria-disabled");
    });

    it("should set aria-disabled when both disabled and readonly", () => {
      render(ComboBox, { disabled: true, readonly: true });

      expect(getInput()).toHaveAttribute("aria-disabled", "true");
    });

    it("should not open menu on click when readonly", async () => {
      render(ComboBox, { readonly: true });

      await user.click(getInput());

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it.each(["{Enter}", "{ArrowDown}", "{ArrowUp}"])(
      "should not open the menu on %s when readonly",
      async (key) => {
        render(ComboBox, { readonly: true });

        const input = getInput();
        input.focus();
        await user.keyboard(key);

        expect(input).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      },
    );

    it("should not dispatch select when typing Enter on a highlighted item while readonly", async () => {
      const onSelect = vi.fn();
      render(ComboBox, { props: { readonly: true, open: true, onSelect } });

      const input = getInput();
      input.focus();
      await user.keyboard("{ArrowDown}{Enter}");

      expect(onSelect).not.toHaveBeenCalled();
      expect(input).toHaveValue("");
    });
  });

  describe("item icons", () => {
    it("should render item.icon left of the label", () => {
      render(ComboBoxItemIcon);

      const withIcon = screen
        .getByTestId("item-0")
        .closest(".bx--list-box__menu-item");
      expect(
        withIcon?.querySelector(".bx--list-box__menu-item__icon svg"),
      ).toBeInTheDocument();

      const noIcon = screen
        .getByTestId("item-1")
        .closest(".bx--list-box__menu-item");
      expect(
        noIcon?.querySelector(".bx--list-box__menu-item__icon"),
      ).toBeNull();
    });

    it("should expose selected and highlighted on the item slot", () => {
      render(ComboBoxItemIcon);

      expect(screen.getByTestId("item-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("item-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
    });

    it("should render the checkmark when iconRight is absent", () => {
      render(ComboBoxItemIcon);

      const selected = screen
        .getByTestId("item-0")
        .closest(".bx--list-box__menu-item");
      expect(
        selected?.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
    });

    it("should prefer the icon slot over item.icon", () => {
      render(ComboBoxIconSlots);

      expect(screen.getByTestId("left-0")).toBeInTheDocument();
      expect(screen.getByTestId("left-1")).toBeInTheDocument();

      // Item 0 also has `item.icon`, which the slot replaces.
      const withItemIcon = screen
        .getByTestId("left-0")
        .closest(".bx--list-box__menu-item__icon--left");
      expect(withItemIcon).toBeInTheDocument();
      expect(withItemIcon?.querySelector("svg")).toBeNull();
      expect(
        document.querySelectorAll(".bx--list-box__menu-item__icon--left"),
      ).toHaveLength(2);
    });

    it("should render iconRight instead of the checkmark", () => {
      render(ComboBoxIconSlots);

      expect(screen.getByTestId("right-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("right-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
      expect(
        document.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeNull();
    });

    it("should render iconEnd instead of the checkmark", () => {
      render(ComboBoxIconEnd);

      expect(screen.getByTestId("end-0")).toHaveAttribute(
        "data-selected",
        "true",
      );
      expect(screen.getByTestId("end-1")).toHaveAttribute(
        "data-selected",
        "false",
      );
      expect(
        screen
          .getByTestId("end-0")
          .closest(".bx--list-box__menu-item__icon--right"),
      ).toBeInTheDocument();
      expect(
        document.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeNull();
    });

    it("should prefer iconEnd over iconRight", () => {
      render(ComboBoxIconEnd, { props: { withIconRight: true } });

      expect(screen.getByTestId("end-0")).toBeInTheDocument();
      expect(screen.getByTestId("end-1")).toBeInTheDocument();
      expect(screen.queryByTestId("right-0")).toBeNull();
      expect(screen.queryByTestId("right-1")).toBeNull();
    });
  });

  describe("fluid variant", () => {
    // The shared fluid behavior is in tests/form-field-contract.
    it.each([false, true])(
      "renders the divider only when fluid is %s",
      (fluid) => {
        render(ComboBox, { props: { fluid } });

        expect(document.querySelector(".bx--list-box__divider") !== null).toBe(
          fluid,
        );
      },
    );

    it("marks the fluid wrapper invalid", () => {
      render(ComboBox, {
        props: { fluid: true, invalid: true, invalidText: "Invalid selection" },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid"),
      ).toHaveClass("bx--list-box__wrapper--fluid--invalid");
    });

    it.each([
      { props: {}, neutral: true },
      { props: { invalid: true, invalidText: "Invalid" }, neutral: false },
      { props: { warn: true, warnText: "Warning" }, neutral: false },
      { props: { disabled: true }, neutral: false },
      { props: { readonly: true }, neutral: false },
    ])(
      "sets the neutral wrapper class only when no other fluid modifier applies (%o)",
      ({ props, neutral }) => {
        render(ComboBox, { props: { fluid: true, ...props } });

        const wrapper = document.querySelector(".bx--list-box__wrapper--fluid");
        if (neutral) {
          expect(wrapper).toHaveClass("bx--list-box__wrapper--fluid--neutral");
        } else {
          expect(wrapper).not.toHaveClass(
            "bx--list-box__wrapper--fluid--neutral",
          );
        }
      },
    );

    it.each([
      { props: {}, hoverable: true },
      { props: { invalid: true, invalidText: "Invalid" }, hoverable: true },
      { props: { warn: true, warnText: "Warning" }, hoverable: true },
      { props: { disabled: true }, hoverable: false },
      { props: { readonly: true }, hoverable: false },
    ])(
      "sets the hoverable wrapper class unless disabled or readonly (%o)",
      ({ props, hoverable }) => {
        render(ComboBox, { props: { fluid: true, ...props } });

        const wrapper = document.querySelector(".bx--list-box__wrapper--fluid");
        if (hoverable) {
          expect(wrapper).toHaveClass(
            "bx--list-box__wrapper--fluid--hoverable",
          );
        } else {
          expect(wrapper).not.toHaveClass(
            "bx--list-box__wrapper--fluid--hoverable",
          );
        }
      },
    );

    it("marks the wrapper as condensed when fluid", () => {
      render(ComboBox, {
        props: {
          fluid: true,
          condensed: true,
        },
      });

      expect(getInput().closest(".bx--list-box__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--condensed",
      );
    });

    it("ignores condensed when not fluid", () => {
      render(ComboBox, {
        props: {
          condensed: true,
        },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid--condensed"),
      ).toBeNull();
    });

    it("toggles the input-focused class on the fluid field wrapper", async () => {
      render(ComboBox, {
        props: {
          fluid: true,
        },
      });

      const input = getInput();
      const wrapper = input.closest(".bx--list-box__field--wrapper");

      expect(wrapper).toHaveClass("bx--list-box__field--wrapper");
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

    it("keeps the input-focused class while the fluid menu is open", () => {
      render(ComboBox, {
        props: {
          fluid: true,
          open: true,
        },
      });

      const wrapper = getInput().closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });

  const countries = [
    { id: "US", text: "United States", price: 0 },
    { id: "UK", text: "United Kingdom", price: 0 },
  ];

  describe("exact match on leave", () => {
    it("should select an autofilled exact match when clicking away", async () => {
      const onSelect = vi.fn();
      render(ComboBox, { props: { onSelect, items: countries } });

      const input = getInput();
      await user.click(input);
      // Browser autofill writes the whole label and fires a single `input`.
      input.value = "United States";
      await fireEvent.input(input);

      await user.click(document.body);

      expect(input).toHaveValue("United States");
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "US",
        selectedItem: { id: "US", text: "United States", price: 0 },
      });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should select a typed exact match on Tab and normalize casing", async () => {
      const onSelect = vi.fn();
      render(ComboBox, { props: { onSelect, items: countries } });

      const input = getInput();
      await user.click(input);
      await user.type(input, "united states");
      await user.keyboard("{Tab}");

      expect(input).toHaveValue("United States");
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "US",
        selectedItem: { id: "US", text: "United States", price: 0 },
      });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should still clear a partial match when clicking away", async () => {
      const onSelect = vi.fn();
      render(ComboBox, { props: { onSelect, items: countries } });

      const input = getInput();
      await user.click(input);
      // A prefix of both labels, not an exact match of either.
      await user.type(input, "United");
      await user.click(document.body);

      expect(input).toHaveValue("");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should select an exact match instead of keeping it as a custom value", async () => {
      const onSelect = vi.fn();
      render(ComboBox, {
        props: { onSelect, items: countries, allowCustomValue: true },
      });

      const input = getInput();
      await user.click(input);
      await user.type(input, "united states");
      await user.click(document.body);

      // An exact label is in the items list, so it is not a custom value.
      expect(input).toHaveValue("United States");
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "US",
        selectedItem: { id: "US", text: "United States", price: 0 },
      });
    });
  });

  describe("fill while another field has focus", () => {
    // Autofill picked from another field fills this one without focusing it.
    function renderWithOtherFieldFocused(props = {}) {
      const { container } = render(ComboBox, {
        props: { items: countries, ...props },
      });
      const otherField = document.createElement("input");
      container.appendChild(otherField);
      otherField.focus();
      return otherField;
    }

    async function fill(text: string) {
      const input = getInput();
      input.value = text;
      await fireEvent.input(input);
      return input;
    }

    it("should select an exact match without opening the menu or taking focus", async () => {
      const onSelect = vi.fn();
      const otherField = renderWithOtherFieldFocused({ onSelect });

      const input = await fill("united states");

      expect(input).toHaveValue("United States");
      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect).toHaveBeenCalledWith({
        selectedId: "US",
        selectedItem: { id: "US", text: "United States", price: 0 },
      });
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(otherField).toHaveFocus();
    });

    it("should not open the menu or take focus when the fill matches no item", async () => {
      const onSelect = vi.fn();
      const otherField = renderWithOtherFieldFocused({ onSelect });

      await fill("Canada");

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(otherField).toHaveFocus();
    });

    it("should clear the selection when the fill matches no item", async () => {
      renderWithOtherFieldFocused({ selectedId: "US" });

      const input = await fill("Canada");

      expect(input).toHaveValue("");
    });

    it("should keep the filled text when it matches no item and allowCustomValue is set", async () => {
      renderWithOtherFieldFocused({ selectedId: "US", allowCustomValue: true });

      const input = await fill("Canada");

      expect(input).toHaveValue("Canada");
    });

    it.each(["disabled", "readonly"])(
      "should not select an exact match when %s",
      async (prop) => {
        const onSelect = vi.fn();
        renderWithOtherFieldFocused({ [prop]: true, onSelect });

        await fill("United States");

        expect(onSelect).not.toHaveBeenCalled();
      },
    );
  });
});
