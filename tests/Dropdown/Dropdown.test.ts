import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/svelte";
import type DropdownComponent from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { DropdownItem } from "carbon-components-svelte/Dropdown/Dropdown.svelte";
import type { ComponentEvents, ComponentProps } from "svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import DropdownLabelChildren from "./Dropdown.slot.test.svelte";
import Dropdown from "./Dropdown.test.svelte";
import DropdownCustom from "./DropdownCustom.test.svelte";
import DropdownDuplicateIds from "./DropdownDuplicateIds.test.svelte";
import DropdownGenerics from "./DropdownGenerics.test.svelte";
import DropdownIconEnd from "./DropdownIconEnd.test.svelte";
import DropdownIconSlots from "./DropdownIconSlots.test.svelte";
import DropdownInModal from "./DropdownInModal.test.svelte";
import DropdownItemIcon from "./DropdownItemIcon.test.svelte";
import DropdownSlot from "./DropdownSlot.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("Dropdown", () => {
  it("should render with default props", () => {
    render(Dropdown, {
      props: { items, selectedId: "0", labelText: "Contact" },
    });

    expect(screen.getByText("Contact")).toBeInTheDocument();
    const button = screen.getByLabelText("Contact");
    expect(within(button).getByText("Slack")).toBeInTheDocument();
  });

  it("should handle custom item display text", () => {
    const props = {
      items,
      selectedId: "0",
      labelText: "Contact",
      itemToString: (item: (typeof items)[number]) =>
        `${item.text} (${item.id})`,
    };

    render(Dropdown, { props });

    const button = screen.getByLabelText("Contact");
    expect(within(button).getByText("Slack (0)")).toBeInTheDocument();
  });

  // Regression: ?? for itemToString so item.text "" is used (not id)
  it("should display empty string when item.text is empty (nullish coalescing)", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "1", text: "" },
          { id: "2", text: "Email" },
        ],
        labelText: "Contact",
        selectedId: "1",
      },
    });
    await user.click(screen.getByLabelText("Contact"));
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveTextContent("");
  });

  // Regression: ?? for aria-label so empty string is used (not fallback)
  it("should use empty aria-label when passed (nullish coalescing)", async () => {
    const { container } = render(Dropdown, {
      props: {
        items: [{ id: "1", text: "Email" }],
        labelText: "Contact",
        "aria-label": "",
      },
    });
    // The list box wrapper has no role, so `aria-label` is prohibited on it.
    const dropdown = container.querySelector(".bx--dropdown");
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).not.toHaveAttribute("aria-label");

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-label", "");
  });

  it("names the combobox with aria-label instead of the wrapper", () => {
    const { container } = render(Dropdown, {
      props: {
        items: [{ id: "1", text: "Email" }],
        "aria-label": "Contact method",
        "data-testid": "contact-dropdown",
      },
    });

    expect(
      screen.getByRole("combobox", { name: "Contact method" }),
    ).toBeInTheDocument();
    const wrapper = container.querySelector(".bx--dropdown__wrapper");
    expect(wrapper).not.toHaveAttribute("aria-label");
    // Other rest props still land on the wrapper.
    expect(wrapper).toHaveAttribute("data-testid", "contact-dropdown");
  });

  it("keeps the combobox labelled when the label is hidden", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        labelText: "Contact",
        hideLabel: true,
      },
    });

    expect(screen.getByLabelText("Contact")).toBe(screen.getByRole("combobox"));
  });

  it("should handle inline variant", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        type: "inline",
      },
    });

    const button = screen.getByRole("combobox");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
      "bx--dropdown__wrapper--inline",
    );
  });

  it("should handle size variants", async () => {
    const { rerender } = render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        size: "sm",
      },
    });

    const button = screen.getByRole("combobox");
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--sm");

    await rerender({ items, selectedId: "0", size: "lg" });
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--lg");

    await rerender({ items, selectedId: "0", size: "xl" });
    expect(button.closest(".bx--dropdown")).toHaveClass("bx--dropdown--xl");
  });

  it("marks the list box invalid and keeps the selection", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        invalid: true,
        invalidText: "Invalid selection",
      },
    });

    const button = screen.getByRole("combobox");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown")).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("marks the list box with the warning class and keeps the selection", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        warn: true,
        warnText: "Warning message",
      },
    });

    const button = screen.getByRole("combobox");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent("Slack");
    expect(button.closest(".bx--dropdown")).toHaveClass(
      "bx--dropdown--warning",
    );
  });

  it("should handle disabled state", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        disabled: true,
      },
    });

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("disabled");
    expect(screen.getByRole("combobox")).toHaveTextContent("Slack");
  });

  it.each(["disabled", "readonly"] as const)(
    "drops the invalid and warning markers when %s",
    (state) => {
      const { container } = render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          [state]: true,
          invalid: true,
          invalidText: "Invalid selection",
          warn: true,
          warnText: "Warning message",
        },
      });

      const listbox = container.querySelector(".bx--dropdown");
      expect(listbox).not.toHaveAttribute("data-invalid");
      expect(listbox).not.toHaveClass("bx--dropdown--invalid");
      expect(listbox).not.toHaveClass("bx--dropdown--warning");
      expect(container.querySelector(".bx--list-box__invalid-icon")).toBeNull();
    },
  );

  it("should hide the clear button when clearable is false", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        labelText: "Contact",
        clearable: false,
      },
    });

    expect(
      screen.queryByRole("button", { name: "Clear selected item" }),
    ).not.toBeInTheDocument();
  });

  it("shows the placeholder when nothing is selected", () => {
    render(Dropdown, {
      props: { items, labelText: "Contact", placeholder: "Choose one" },
    });

    expect(screen.getByRole("combobox")).toHaveTextContent("Choose one");
  });

  it("rejects the removed label prop in its types", () => {
    const props: ComponentProps<DropdownComponent> = {
      items,
      // @ts-expect-error `label` was renamed to `placeholder`
      label: "Choose one",
    };

    expect(props).toBeDefined();
  });

  it("should hide the clear button when there is no selection", () => {
    render(Dropdown, {
      props: {
        items,
        labelText: "Contact",
        placeholder: "Choose a contact method",
        clearable: true,
      },
    });

    expect(
      screen.queryByRole("button", { name: "Clear selected item" }),
    ).not.toBeInTheDocument();
  });

  it("should reserve extra field padding for the clear button only when it renders", async () => {
    const { rerender } = render(Dropdown, {
      props: {
        items,
        labelText: "Contact",
        clearable: true,
      },
    });

    expect(screen.getByRole("combobox")).not.toHaveClass(
      "bx--list-box__field--clearable",
    );

    await rerender({
      items,
      selectedId: "0",
      labelText: "Contact",
      clearable: true,
    });

    expect(screen.getByRole("combobox")).toHaveClass(
      "bx--list-box__field--clearable",
    );
  });

  it("marks the list box while the clear button renders", async () => {
    const { container, rerender } = render(Dropdown, {
      props: { items, labelText: "Contact", clearable: true, invalid: true },
    });
    const listBox = container.querySelector(".bx--list-box");

    expect(listBox).not.toHaveClass("bx--dropdown--clearable");

    await rerender({
      items,
      selectedId: "0",
      labelText: "Contact",
      clearable: true,
      invalid: true,
    });

    expect(listBox).toHaveClass("bx--dropdown--clearable");
  });

  it("should clear the selection and dispatch clear when clicking the clear button", async () => {
    const onclear = vi.fn();
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        labelText: "Contact",
        placeholder: "Choose a contact method",
        clearable: true,
        onclear,
      },
    });

    const clearButton = screen.getByRole("button", {
      name: "Clear selected item",
    });
    await user.click(clearButton);

    expect(onclear).toHaveBeenCalledOnce();
    expect(onclear.mock.calls[0][0].type).toEqual(expect.any(String));
    expect(
      screen.queryByRole("button", { name: "Clear selected item" }),
    ).not.toBeInTheDocument();
    const button = screen.getByLabelText("Contact");
    expect(
      within(button).getByText("Choose a contact method"),
    ).toBeInTheDocument();
    expect(within(button).queryByText("Slack")).not.toBeInTheDocument();
  });

  it("should use custom translations for the clear button", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        clearable: true,
        translateWithIdSelection: () => "Remove selected item",
      },
    });

    expect(
      screen.getByRole("button", { name: "Remove selected item" }),
    ).toBeInTheDocument();
  });

  describe("clearable: Delete/Backspace clears selection (with announcement)", () => {
    it("Delete clears the selection while the menu is closed and announces it", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByRole("status")).toHaveTextContent("");

      await user.keyboard("{Delete}");

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Selection cleared",
        ),
      );
      expect(within(combobox).queryByText("Slack")).not.toBeInTheDocument();
    });

    it("Backspace clears the selection while the menu is open", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Backspace}");

      expect(within(combobox).queryByText("Slack")).not.toBeInTheDocument();
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Selection cleared",
        ),
      );
    });

    it.each(["Delete", "Backspace"])(
      "%s dispatches clear with the keyboard event",
      async (key) => {
        const onclear = vi.fn();
        render(Dropdown, {
          props: {
            items,
            selectedId: "0",
            labelText: "Contact",
            clearable: true,
            onclear,
          },
        });

        screen.getByRole("combobox").focus();
        await user.keyboard(`{${key}}`);

        expect(onclear).toHaveBeenCalledOnce();
        expect(onclear.mock.calls[0][0].detail).toBeInstanceOf(KeyboardEvent);
      },
    );

    it("does not clear the selection when clearable is false", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: false,
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Delete}");
      await user.keyboard("{Backspace}");

      expect(within(combobox).getByText("Slack")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does not clear the selection when read-only", async () => {
      const onclear = vi.fn();
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
          readonly: true,
          onclear,
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Delete}");
      await user.keyboard("{Backspace}");

      expect(within(combobox).getByText("Slack")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("");
      expect(onclear).not.toHaveBeenCalled();
    });

    it("Delete with nothing selected announces nothing", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", clearable: true },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Delete}");

      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("announces when the selection is cleared with the clear button", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
        },
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear selected item",
      });
      await user.click(clearButton);

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "Selection cleared",
        ),
      );
    });

    it("advertises the clear shortcut in the field description only while there is a selection", async () => {
      render(Dropdown, {
        props: {
          id: "test-dropdown",
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
        },
      });

      const description = document.querySelector("#selection-test-dropdown");
      expect(description).toHaveTextContent(
        "To clear the selection, press Delete or Backspace",
      );

      screen.getByRole("combobox").focus();
      await user.keyboard("{Delete}");

      expect(
        document.querySelector("#selection-test-dropdown"),
      ).not.toBeInTheDocument();
    });

    it("supports overriding the shortcut hint and cleared announcement", async () => {
      render(Dropdown, {
        props: {
          id: "test-dropdown",
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
          clearSelectionText: "Press Delete to reset",
          selectionClearedText: "Selection reset",
        },
      });

      expect(
        document.querySelector("#selection-test-dropdown"),
      ).toHaveTextContent("Press Delete to reset");

      screen.getByRole("combobox").focus();
      await user.keyboard("{Delete}");

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Selection reset"),
      );
    });
  });

  describe("openOnClear", () => {
    it("keeps the menu closed after clearing by default", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
        },
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear selected item",
      });
      await user.click(clearButton);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("reopens the menu after clicking the clear button when true", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
          openOnClear: true,
        },
      });

      const clearButton = screen.getByRole("button", {
        name: "Clear selected item",
      });
      await user.click(clearButton);

      expect(screen.getByRole("listbox")).toBeVisible();
    });

    it("reopens the menu after clearing with Delete when true", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          labelText: "Contact",
          clearable: true,
          openOnClear: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Delete}");

      expect(screen.getByRole("listbox")).toBeVisible();
    });
  });

  describe("programmatic clear()", () => {
    it("clears the selection and focuses the field by default", async () => {
      render(DropdownCustom, { props: { selectedId: "0" } });

      const button = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear"));

      expect(within(button).queryByText("Slack")).not.toBeInTheDocument();
      expect(button).toHaveFocus();
    });

    it("does not focus the field when options.focus is false", async () => {
      render(DropdownCustom, { props: { selectedId: "0" } });

      const button = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear (no focus)"));

      expect(within(button).queryByText("Slack")).not.toBeInTheDocument();
      expect(button).not.toHaveFocus();
    });

    it("reopens the menu when options.open is true", async () => {
      render(DropdownCustom, { props: { selectedId: "0" } });

      await user.click(screen.getByText("Clear (reopen)"));

      expect(screen.getByRole("listbox")).toBeVisible();
    });

    it("is a no-op when nothing is selected", async () => {
      render(DropdownCustom);

      const button = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(button).not.toHaveFocus();
    });
  });

  it("should handle helper text", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        helperText: "Help text",
      },
    });

    expect(screen.getByText("Help text")).toHaveClass("bx--form__helper-text");
  });

  it("should handle item selection", async () => {
    const selectHandler = vi.fn();
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        onselect: selectHandler,
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { selectedId: "1", selectedItem: items[1] },
      }),
    );
  });

  it("should handle keyboard navigation", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(screen.getByRole("option", { selected: true })).toHaveTextContent(
      "Slack",
    );

    // Keyboard nav starts at selected item (index 0, Slack)
    // ArrowDown once: 0 -> 1 (Email)
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveTextContent("Email");
  });

  describe("clicking the selected option", () => {
    it("closes without dispatching select", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, {
        props: { items, selectedId: "1", onselect: selectHandler },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      await user.click(screen.getByRole("option", { name: "Email" }));

      expect(selectHandler).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(button).toHaveTextContent("Email");
    });

    it("closes a portaled menu without dispatching select", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, {
        props: {
          items,
          selectedId: "1",
          portalMenu: true,
          onselect: selectHandler,
        },
      });

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "Email" }));

      expect(selectHandler).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not dispatch select in a virtualized list", async () => {
      const selectHandler = vi.fn();
      const largeItems = Array.from({ length: 150 }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));
      render(Dropdown, {
        props: {
          items: largeItems,
          selectedId: "3",
          virtualize: true,
          onselect: selectHandler,
        },
      });

      await user.click(screen.getByRole("combobox"));
      const option = await screen.findByRole("option", { name: "Item 4" });
      await user.click(option);

      expect(selectHandler).not.toHaveBeenCalled();
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not dispatch select for a selected numeric id of 0", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, {
        props: {
          items: [
            { id: 0, text: "Zero" },
            { id: 1, text: "One" },
          ],
          selectedId: 0,
          onselect: selectHandler,
        },
      });

      await user.click(screen.getByRole("combobox"));
      await user.click(screen.getByRole("option", { name: "Zero" }));

      expect(selectHandler).not.toHaveBeenCalled();
    });
  });

  it("does not select a hover-highlighted item on Enter; closes without selecting", async () => {
    const selectHandler = vi.fn();
    render(Dropdown, {
      props: { items, selectedId: "0", onselect: selectHandler },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(screen.getByRole("listbox")).toBeVisible();

    const fax = screen.getByText("Fax").closest(".bx--list-box__menu-item");
    assert(fax);
    await user.hover(fax);
    expect(fax).toHaveClass("bx--list-box__menu-item--highlighted");

    await user.keyboard("{Enter}");
    expect(selectHandler).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveTextContent("Slack");
  });

  // Regression: the Space keydown must cancel its default action so the
  // browser does not scroll the page (and does not synthesize a click)
  // before the keyup handler opens the menu.
  it("should prevent the default page scroll when opening with Space", async () => {
    render(Dropdown, { props: { items, selectedId: "0" } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    const keydown = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(keydown);
    expect(keydown.defaultPrevented).toBe(true);

    // Space opens on keyup.
    await fireEvent.keyUp(button, { key: " " });
    await tick();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
  });

  it("keeps focus on the field while clicking an option", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(button).toHaveFocus();

    // Focus must never move to the option — a focus bounce makes screen
    // readers re-announce the entire field on every click.
    const option = screen.getByRole("option", { name: "Email" });
    await user.click(option);

    expect(button).toHaveTextContent("Email");
    expect(button).toHaveFocus();
  });

  it("should open the menu on ArrowDown and highlight the first enabled item", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    // Slack (id="0") is the first enabled item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should open the menu on ArrowUp and highlight the last enabled item", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{ArrowUp}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Fax (id="2") is the last enabled item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should move the highlight to the last item with End", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{ArrowDown}");
    await tick();
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{End}");
    await tick();
    // Fax (id="2") is the last item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should move the highlight to the first item with Home", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{ArrowUp}");
    await tick();
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);

    await user.keyboard("{Home}");
    await tick();
    // Slack (id="0") is the first item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should open a closed menu and highlight the last item with End", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{End}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Fax (id="2") is the last item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);
  });

  it("should open a closed menu and highlight the first item with Home", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{Home}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Slack (id="0") is the first item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it.each([
    { key: "{Home}", selectedId: "1", expected: /-0$/ },
    { key: "{End}", selectedId: "1", expected: /-2$/ },
    { key: "{Home}", selectedId: "2", expected: /-0$/ },
  ])(
    "should highlight the edge item, not the selection, when $key opens a closed menu (selectedId $selectedId)",
    async ({ key, selectedId, expected }) => {
      render(Dropdown, { props: { items, selectedId } });

      const button = screen.getByRole("combobox");
      button.focus();

      await user.keyboard(key);
      await tick();

      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(button.getAttribute("aria-activedescendant")).toMatch(expected);
    },
  );

  it("should highlight the last item of a virtualized list when End opens it past the selection", async () => {
    const largeItems = Array.from({ length: 150 }, (_, i) => ({
      id: String(i),
      text: `Item ${i + 1}`,
    }));
    render(Dropdown, {
      props: { items: largeItems, selectedId: "42", virtualize: true },
    });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{End}");
    await tick();

    expect(button.getAttribute("aria-activedescendant")).toMatch(/-149$/);
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Item 150" })).toBeTruthy();
    });
  });

  it("should open an empty menu with Home without highlighting anything", async () => {
    render(Dropdown, { props: { items: [] } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Home}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-activedescendant", "");
  });

  it("should open the menu on Alt+ArrowDown without moving the highlight", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(button).toHaveAttribute("aria-activedescendant", "");
  });

  it("should highlight the selected item when opening the menu on Alt+ArrowDown", async () => {
    render(Dropdown, { props: { items, selectedId: "1" } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await tick();

    expect(button).toHaveAttribute("aria-expanded", "true");
    // Email (id="1") is the selected item.
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-1$/);
  });

  it("should close the menu on Alt+ArrowUp", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("should treat Alt+ArrowUp on a closed menu and Alt+ArrowDown on an open menu as no-ops", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    button.focus();

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    await tick();
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
  });

  it("should handle disabled items", async () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax" },
    ];

    render(Dropdown, {
      props: {
        items: itemsWithDisabled,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    expect(menuItem).not.toBeNull();
    expect(menuItem).toHaveAttribute("disabled");
  });

  describe("disabled option pointer interaction", () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax" },
    ];

    it("ignores a click on a disabled option and keeps the menu open", async () => {
      const onselect = vi.fn();
      render(Dropdown, {
        props: { items: itemsWithDisabled, selectedId: "0", onselect },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      await fireEvent.click(screen.getByRole("option", { name: "Email" }));

      expect(onselect).not.toHaveBeenCalled();
      expect(button).toHaveTextContent("Slack");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("does not highlight a disabled option on hover", async () => {
      render(Dropdown, { props: { items: itemsWithDisabled } });

      await user.click(screen.getByRole("combobox"));
      const option = screen.getByRole("option", { name: "Email" });
      await fireEvent.mouseEnter(option);

      expect(option).not.toHaveClass("bx--list-box__menu-item--highlighted");
    });
  });

  it("should pass selected and highlighted to the default slot", async () => {
    render(DropdownSlot, { props: { selectedId: "1" } });

    await user.click(screen.getByLabelText("Custom slot dropdown"));

    const customItems = screen.getAllByTestId("custom-item");

    expect(customItems).toHaveLength(3);
    expect(customItems[0]).toHaveTextContent("Item 1: Option 1");
    expect(customItems[1]).toHaveTextContent("Item 2: Option 2");
    expect(customItems[2]).toHaveTextContent("Item 3: Option 3");

    // selectedId "1" is the second item, not index 1.
    expect(customItems[0]).toHaveAttribute("data-selected", "false");
    expect(customItems[1]).toHaveAttribute("data-selected", "true");
    expect(customItems[2]).toHaveAttribute("data-selected", "false");

    await user.hover(customItems[2]);
    expect(customItems[2]).toHaveAttribute("data-highlighted", "true");
    expect(customItems[0]).toHaveAttribute("data-highlighted", "false");
  });

  it("supports custom label slot", () => {
    render(DropdownLabelChildren);

    const customLabel = screen.getByText("Custom label content");
    expect(customLabel).toBeInTheDocument();
  });

  it("should stay open when window click has a non-Node target", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        open: true,
      },
    });

    expect(screen.getByRole("listbox")).toBeVisible();

    const event = new Event("click", { bubbles: true });
    Object.defineProperty(event, "target", { value: null });
    window.dispatchEvent(event);

    expect(screen.getByRole("listbox")).toBeVisible();
  });

  it("should handle direction prop", () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        direction: "top",
      },
    });

    const dropdown = screen.getByRole("combobox").closest(".bx--dropdown");
    expect(dropdown).toHaveClass("bx--list-box--up");
  });

  it("should align the menu to the start of the field by default", () => {
    render(Dropdown, { props: { items, type: "inline", open: true } });

    expect(screen.getByRole("listbox")).not.toHaveClass(
      "bx--list-box__menu--align-end",
    );
  });

  it("should align the menu to the end of the field", () => {
    render(Dropdown, {
      props: { items, type: "inline", align: "end", open: true },
    });

    expect(screen.getByRole("listbox")).toHaveClass(
      "bx--list-box__menu--align-end",
    );
  });

  it("should select nothing when all items are disabled", async () => {
    const allDisabledItems = [
      { id: "0", text: "Slack", disabled: true },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax", disabled: true },
    ];

    render(Dropdown, {
      props: {
        items: allDisabledItems,
        labelText: "Contact",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Disabled items stay in the keyboard navigation sequence so
    // assistive-tech users can discover them.
    await user.keyboard("{ArrowDown}");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-0$/);
    await user.keyboard("{ArrowUp}");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);

    // Enter on a highlighted disabled item selects nothing and leaves the
    // menu open, matching click.
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    const options = screen.getAllByRole("option");
    for (const option of options) {
      expect(option).not.toHaveAttribute("aria-selected", "true");
    }
  });

  it("should highlight but not select disabled items during keyboard navigation", async () => {
    const itemsWithDisabled = [
      { id: "0", text: "Slack" },
      { id: "1", text: "Email", disabled: true },
      { id: "2", text: "Fax" },
    ];

    render(Dropdown, {
      props: {
        items: itemsWithDisabled,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Keyboard nav starts at selected item (index 0, Slack). ArrowDown lands
    // on disabled Email (index 1) — disabled items stay in the navigation
    // sequence so assistive-tech users can discover them.
    await user.keyboard("{ArrowDown}");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-1$/);

    // Enter on the highlighted disabled item selects nothing and leaves the
    // menu open, matching click.
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveTextContent("Slack");

    // ArrowDown again reaches Fax (index 2), which selects normally.
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Fax");
  });

  it("selects the highlighted option with Space and closes the menu", async () => {
    const onselect = vi.fn();
    render(Dropdown, { props: { items, selectedId: "0", onselect } });

    const button = screen.getByRole("combobox");
    await user.click(button);
    await user.keyboard("{ArrowDown}");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-1$/);

    await user.keyboard(" ");

    expect(button).toHaveTextContent("Email");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(onselect).toHaveBeenCalledTimes(1);
    expect(onselect.mock.calls[0][0].detail).toEqual({
      selectedId: "1",
      selectedItem: items[1],
    });
  });

  it("should handle keyboard navigation wrapping around", async () => {
    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("{ArrowUp}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Fax");

    await user.click(button);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(button).toHaveTextContent("Slack");
  });

  it("should render with no selected item when selectedId is not provided", async () => {
    render(Dropdown, {
      props: {
        items,
        placeholder: "Choose an option",
        labelText: "Contact",
      },
    });

    const button = screen.getByLabelText("Contact");
    expect(within(button).getByText("Choose an option")).toBeInTheDocument();

    await user.click(button);
    const menuItemText = screen.getByText("Email");
    const menuItem = menuItemText.closest(".bx--list-box__menu-item");
    assert(menuItem);
    await user.click(menuItem);

    expect(within(button).getByText("Email")).toBeInTheDocument();
  });

  it("should handle empty items array", () => {
    render(Dropdown, {
      props: {
        items: [],
        selectedId: undefined,
      },
    });

    const button = screen.getByRole("combobox");
    expect(button).toBeEnabled();
    // With no placeholder, the text falls back to ListBoxMenuIcon's "Open menu".
    expect(button).toHaveTextContent("Open menu");
    expect(button).not.toHaveTextContent("undefined");
  });

  it("should handle translateWithId prop", () => {
    const translateWithId = (id: "open" | "close") => {
      const translations = {
        open: "Open dropdown",
        close: "Close dropdown",
      };
      return translations[id];
    };

    render(Dropdown, {
      props: {
        items,
        selectedId: "0",
        translateWithId,
      },
    });

    const button = screen.getByRole("combobox");
    expect(
      within(button).getByRole("img", { name: "Open dropdown" }),
    ).toBeInTheDocument();
  });

  describe("Generics", () => {
    it("should infer generic type from items and support destructuring in slots", async () => {
      const onSelect = vi.fn();
      render(DropdownGenerics, { props: { onSelect } });

      const button = screen.getByLabelText("Products");
      await user.click(button);

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Laptop");
      expect(options[0]).toHaveTextContent("$999");
      expect(options[0]).toHaveTextContent("Electronics");

      // Laptop is already selected, so pick Phone to trigger `select`.
      await user.click(options[1]);

      expect(onSelect).toHaveBeenCalledOnce();
      expect(onSelect.mock.calls[0][0].selectedItem).toEqual({
        id: "2",
        text: "Phone",
        price: 599,
        category: "Electronics",
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

      type ComponentType = DropdownComponent<Product>;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      const itemToString = (item: Product) => item.text;
      expectTypeOf(itemToString).parameter(0).toEqualTypeOf<Product>();
      expectTypeOf(itemToString).returns.toEqualTypeOf<string>();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selectedItem"]
      >().toEqualTypeOf<Product>();
    });

    it("should default to DropdownItem when generic is not specified", () => {
      type ComponentType = DropdownComponent;
      type Props = ComponentProps<ComponentType>;
      type Events = ComponentEvents<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly DropdownItem[]
      >();

      type SelectEvent = Events["select"];
      type SelectEventDetail =
        SelectEvent extends CustomEvent<infer T> ? T : never;
      expectTypeOf<
        SelectEventDetail["selectedItem"]
      >().toEqualTypeOf<DropdownItem>();
    });

    it("should enforce DropdownItem constraint on generic type", () => {
      type Product = {
        id: string;
        text: string;
        price: number;
      };

      type ComponentType = DropdownComponent<Product>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<NonNullable<Props["items"]>>().toEqualTypeOf<
        readonly Product[]
      >();

      type BaseComponentType = DropdownComponent<DropdownItem>;
      type BaseProps = ComponentProps<BaseComponentType>;
      expectTypeOf<NonNullable<BaseProps["items"]>>().toEqualTypeOf<
        readonly DropdownItem[]
      >();
    });

    describe("Id generic parameter", () => {
      it("should allow selectedId to be undefined (optional)", () => {
        type ComponentType = DropdownComponent;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<undefined>().toExtend<Props["selectedId"]>();

        expectTypeOf<Record<string, never>>().toExtend<
          Pick<Props, "selectedId">
        >();

        type StringItem = { id: string; text: string };
        type StringComponent = DropdownComponent<StringItem>;
        type StringProps = ComponentProps<StringComponent>;
        expectTypeOf<undefined>().toExtend<StringProps["selectedId"]>();
      });

      it("should default Id to any when not specified", () => {
        type ComponentType = DropdownComponent;
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
        type StringComponent = DropdownComponent<StringItem>;
        expectTypeOf<
          ComponentProps<StringComponent>["selectedId"]
        >().toEqualTypeOf<string | undefined>();

        type NumberItem = { id: number; text: string };
        type NumberComponent = DropdownComponent<NumberItem>;
        expectTypeOf<
          ComponentProps<NumberComponent>["selectedId"]
        >().toEqualTypeOf<number | undefined>();

        type UnionId = "a" | "b" | "c";
        type UnionItem = { id: UnionId; text: string };
        type UnionComponent = DropdownComponent<UnionItem>;
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

        type ComponentType = DropdownComponent<InferredItem>;
        type Props = ComponentProps<ComponentType>;

        expectTypeOf<Props["selectedId"]>().toEqualTypeOf<
          InferredId | undefined
        >();

        type SelectEvent = ComponentEvents<ComponentType>["select"];
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

  it("should support typeahead when typing with menu open", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
          { id: "3", text: "Date" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("b");

    const bananaOption = screen.getByRole("option", { name: "Banana" });
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");

    expect(button).toHaveTextContent("Apple");

    await user.keyboard("{Enter}");
    expect(button).toHaveTextContent("Banana");
  });

  it("matches typeahead against itemToString instead of item.text", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        itemToString: (item: { text: string }) =>
          item.text === "Cherry" ? "Zebra" : item.text,
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Cherry is labelled "Zebra", so "z" finds it even though its text is "Cherry".
    await user.keyboard("z");
    expect(button.getAttribute("aria-activedescendant")).toMatch(/-2$/);
    expect(screen.getByRole("option", { name: "Zebra" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
  });

  it("should clear the hover highlight when the cursor leaves the menu", async () => {
    render(Dropdown, { props: { items } });

    const button = screen.getByRole("combobox");
    await user.click(button);

    const emailOption = screen.getByRole("option", { name: "Email" });
    await user.hover(emailOption);
    expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

    await fireEvent.mouseLeave(screen.getByRole("listbox"));
    expect(emailOption).not.toHaveClass("bx--list-box__menu-item--highlighted");
  });

  // "av" only reaches Avocado if the buffer accumulates: a search for "v"
  // alone matches nothing and would leave Apple highlighted.
  it("should support typeahead with multiple characters", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Apricot" },
          { id: "2", text: "Avocado" },
        ],
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("av");

    expect(screen.getByRole("option", { name: "Avocado" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
    expect(screen.getByRole("option", { name: "Apple" })).not.toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
  });

  // The typeahead buffer must reset after a delay of inactivity so a
  // later keystroke starts a fresh search instead of appending to a
  // stale buffer. Without the reset, typing "b" then (after a delay) "c"
  // would search "bc" (no match) and leave Banana highlighted instead of
  // moving to Cherry. The selected item (Apple) is intentionally excluded
  // from the assertions because it always carries the highlighted class
  // regardless of typeahead state.
  it("should reset the typeahead buffer after the delay", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });

    // Fire keydown only (no keyup) so the menu stays open between keystrokes.
    await fireEvent.keyDown(button, { key: "b" });
    expect(screen.getByRole("option", { name: "Banana" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );

    // Wait past the delay so the buffer clears.
    vi.advanceTimersByTime(600);

    // A fresh keystroke starts a new search ("c" -> Cherry) rather than
    // appending to the stale buffer ("bc" -> no match -> Banana highlighted).
    await fireEvent.keyDown(button, { key: "c" });
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
    expect(screen.getByRole("option", { name: "Banana" })).not.toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
  });

  it("should skip disabled items in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana", disabled: true },
          { id: "2", text: "Blueberry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("b");

    const blueberryText = screen.getByText("Blueberry");
    const blueberryOption = blueberryText.closest(".bx--list-box__menu-item");
    expect(blueberryOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  it("should be case-insensitive in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await user.keyboard("B");

    const bananaText = screen.getByText("Banana");
    const bananaOption = bananaText.closest(".bx--list-box__menu-item");
    expect(bananaOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  // Regression: Space must not be added to the typeahead buffer.
  // Fire keydown only (without keyup) so the menu stays open — this exposes
  // the buffer state. If Space were treated as a typeahead character, the
  // buffer would be " " and the next 'c' keydown would search for " c"
  // (no match), leaving the previous highlight in place.
  it("should not include Space in typeahead buffer", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
        selectedId: "0",
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    await fireEvent.keyDown(button, { key: " " });
    await fireEvent.keyDown(button, { key: "c" });

    const cherryOption = screen.getByRole("option", { name: "Cherry" });
    expect(cherryOption).toHaveClass("bx--list-box__menu-item--highlighted");
  });

  describe("typeahead on a closed menu", () => {
    const fruits = [
      { id: "0", text: "Apple" },
      { id: "1", text: "Banana" },
      { id: "2", text: "Cherry" },
    ];
    const isHighlighted = (name: string) =>
      screen
        .getByRole("option", { name })
        .classList.contains("bx--list-box__menu-item--highlighted");

    it("opens the menu and highlights the first match without selecting", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, { props: { items: fruits, onselect: selectHandler } });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("b");
      await tick();

      expect(button).toHaveAttribute("aria-expanded", "true");
      expect(isHighlighted("Banana")).toBe(true);
      expect(selectHandler).not.toHaveBeenCalled();
    });

    it("selects the match with Enter", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, { props: { items: fruits, onselect: selectHandler } });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("b");
      await tick();
      await user.keyboard("{Enter}");

      expect(button).toHaveTextContent("Banana");
      expect(selectHandler).toHaveBeenCalledTimes(1);
      expect(selectHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ selectedId: "1" }),
        }),
      );
    });

    it("starts the search past the selected item", async () => {
      render(Dropdown, {
        props: {
          items: [
            { id: "0", text: "Apple" },
            { id: "1", text: "Banana" },
            { id: "2", text: "Blueberry" },
          ],
          selectedId: "1",
        },
      });

      screen.getByRole("combobox").focus();
      await user.keyboard("b");
      await tick();

      expect(isHighlighted("Blueberry")).toBe(true);
    });

    it("skips disabled items", async () => {
      render(Dropdown, {
        props: {
          items: [
            { id: "0", text: "Apple" },
            { id: "1", text: "Banana", disabled: true },
            { id: "2", text: "Blueberry" },
          ],
        },
      });

      screen.getByRole("combobox").focus();
      await user.keyboard("b");
      await tick();

      expect(isHighlighted("Blueberry")).toBe(true);
    });

    it("opens with nothing highlighted when nothing matches", async () => {
      render(Dropdown, { props: { items: fruits } });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("z");
      await tick();

      expect(button).toHaveAttribute("aria-expanded", "true");
      for (const option of screen.getAllByRole("option")) {
        expect(option).not.toHaveClass("bx--list-box__menu-item--highlighted");
      }
    });

    it("does not open when readonly", async () => {
      render(Dropdown, { props: { items: fruits, readonly: true } });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("b");

      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("does not open for a modified key", async () => {
      render(Dropdown, { props: { items: fruits } });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("{Control>}b{/Control}");

      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("should wrap around to beginning in typeahead search", async () => {
    render(Dropdown, {
      props: {
        items: [
          { id: "0", text: "Apple" },
          { id: "1", text: "Banana" },
          { id: "2", text: "Cherry" },
        ],
      },
    });

    const button = screen.getByRole("combobox");
    await user.click(button);

    // Highlight the last option, so the only match for "a" lies behind it.
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: "Cherry" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );

    await user.keyboard("a");

    expect(screen.getByRole("option", { name: "Apple" })).toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
    expect(screen.getByRole("option", { name: "Cherry" })).not.toHaveClass(
      "bx--list-box__menu-item--highlighted",
    );
  });

  // Regression: non-virtualized lists that overflow the menu's max-height
  // must still scroll the selected option into view when the menu opens.
  // Selected item is aligned to the top of the menu, matching the
  // virtualized branch's behavior.
  it("should scroll selected item to top of menu on open (non-virtualized)", async () => {
    const ITEM_HEIGHT = 40;
    const rectSpy = vi
      .spyOn(Element.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: Element) {
        const role = this.getAttribute("role");
        if (role === "option") {
          // Option ids are scoped as `${dropdownId}-${itemId}`; the item id
          // (a numeric string here) is the last hyphen-delimited segment.
          const index = Number(this.getAttribute("id")?.split("-").pop());
          const top = index * ITEM_HEIGHT;
          return rect({ top, height: ITEM_HEIGHT });
        }
        if (role === "listbox") {
          return rect();
        }
        return new DOMRect();
      });

    try {
      const manyItems = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        text: `Item ${i + 1}`,
      }));

      render(Dropdown, {
        props: { items: manyItems, selectedId: "42", labelText: "Items" },
      });

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        const menu = screen.getByRole("listbox");
        expect(menu.scrollTop).toBe(42 * ITEM_HEIGHT);
      });
    } finally {
      rectSpy.mockRestore();
    }
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
      render(Dropdown, {
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
      render(DropdownInModal, {
        props: { modalOpen: true, dropdownOpen: true },
      });

      const menu = screen.getByRole("listbox", { name: "Contact" });
      expect(menu).toBeInTheDocument();
      expect(menu).toHaveAttribute("aria-label", "Contact");
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    describe("portaled menu accessible name", () => {
      it("should set aria-label from labelText and omit aria-labelledby on the menu", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            labelText: "Preferred channel",
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", { name: "Preferred channel" });
        expect(menu).toHaveAttribute("aria-label", "Preferred channel");
        expect(menu).not.toHaveAttribute("aria-labelledby");
      });

      it("should use Dropdown aria-label prop for the portaled menu when set", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            labelText: "Field label",
            "aria-label": "Explicit popup label",
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", {
          name: "Explicit popup label",
        });
        expect(menu).toHaveAttribute("aria-label", "Explicit popup label");
      });

      it("should default portaled menu aria-label to Choose an item without labelText or aria-label", () => {
        render(Dropdown, {
          props: {
            items: [{ id: "0", text: "A" }],
            portalMenu: true,
            open: true,
          },
        });

        const menu = screen.getByRole("listbox", { name: "Choose an item" });
        expect(menu).toHaveAttribute("aria-label", "Choose an item");
      });
    });

    it("should mark the portal host of an inline menu so it keeps the inline width", () => {
      render(Dropdown, {
        props: { items, type: "inline", portalMenu: true, open: true },
      });

      expect(screen.getByRole("listbox").parentElement).toHaveClass(
        "bx--dropdown__menu-host--inline",
      );
    });

    it("should not mark the portal host of a default menu", () => {
      render(Dropdown, {
        props: { items, portalMenu: true, open: true },
      });

      expect(screen.getByRole("listbox").parentElement).not.toHaveClass(
        "bx--dropdown__menu-host--inline",
      );
    });

    it("should close portaled menu when clicking outside", async () => {
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          portalMenu: true,
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    // Regression test for https://github.com/carbon-design-system/carbon-components-svelte/issues/2699
    it("should close after item click selection with portalMenu", async () => {
      const selectHandler = vi.fn();
      render(Dropdown, {
        props: {
          items,
          selectedId: "0",
          portalMenu: true,
          onselect: selectHandler,
        },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      const menuItemText = screen.getByText("Email");
      const menuItem = menuItemText.closest(".bx--list-box__menu-item");
      assert(menuItem);
      await user.click(menuItem);

      expect(selectHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { selectedId: "1", selectedItem: items[1] },
        }),
      );
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(DropdownInModal, {
        props: {
          modalOpen: true,
          dropdownOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });
  });

  describe("checkmark icon", () => {
    it("should render a checkmark icon for the selected item", async () => {
      render(Dropdown, {
        props: { items, selectedId: "1", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const options = screen.getAllByRole("option");
      // "Email" (index 1) is selected – should have the checkmark icon
      const selectedOption = options[1];
      const checkmark = selectedOption.querySelector(
        ".bx--list-box__menu-item__selected-icon",
      );
      expect(checkmark).toBeInTheDocument();

      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
      expect(
        options[2].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
    });

    it("should move the checkmark icon when selection changes", async () => {
      render(Dropdown, {
        props: { items, selectedId: "0", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      let options = screen.getAllByRole("option");
      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
      expect(
        options[1].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();

      await user.click(options[1]);

      await user.click(screen.getByRole("combobox"));

      options = screen.getAllByRole("option");
      expect(
        options[0].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).not.toBeInTheDocument();
      expect(
        options[1].querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
    });

    it("should not render a checkmark when no item is selected", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const options = screen.getAllByRole("option");
      for (const option of options) {
        expect(
          option.querySelector(".bx--list-box__menu-item__selected-icon"),
        ).not.toBeInTheDocument();
      }
    });
  });

  // Regression: aria-controls should only be set when the menu is rendered,
  // since ListBoxMenu is removed from the DOM when closed.
  it("should only set aria-controls when the menu is open", async () => {
    render(Dropdown, {
      props: { items, selectedId: "0", labelText: "Contact" },
    });

    const button = screen.getByRole("combobox");
    expect(button).not.toHaveAttribute("aria-controls");

    await user.click(button);
    const menu = screen.getByRole("listbox");
    expect(button).toHaveAttribute("aria-controls", menu.id);
    // ARIA 1.2 comboboxes reference the popup via aria-controls only;
    // aria-owns restructures the accessibility tree and can double-read.
    expect(button).not.toHaveAttribute("aria-owns");

    await user.click(button);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(button).not.toHaveAttribute("aria-controls");
  });

  // Regression: translateWithId function prop should not be rendered as a DOM attribute.
  it("should not render translateWithId as a DOM attribute on the button", () => {
    const { container } = render(Dropdown, {
      props: {
        items,
        labelText: "Contact",
        translateWithId: (id: string) => id,
      },
    });
    const button = container.querySelector("button.bx--list-box__field");
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveAttribute("translateWithId");
    expect(button).not.toHaveAttribute("translatewithid");
  });

  describe("readonly", () => {
    it("should apply readonly class and aria-readonly", () => {
      const { container } = render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      expect(container.querySelector(".bx--dropdown--readonly")).toBeTruthy();
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-readonly",
        "true",
      );
    });

    it("does not set aria-disabled when readonly", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      expect(screen.getByRole("combobox")).not.toHaveAttribute("aria-disabled");
    });

    it("describes the field as read-only for screen readers that ignore aria-readonly", () => {
      const { container } = render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute(
        "aria-describedby",
        "readonly-test-dropdown",
      );

      const description = container.querySelector("#readonly-test-dropdown");
      expect(description).toHaveTextContent("Read-only");
      expect(description).toHaveClass("bx--visually-hidden");
    });

    it("supports overriding the read-only assistive text", () => {
      const { container } = render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          readonly: true,
          readonlyText: "Schreibgeschützt",
        },
      });

      expect(
        container.querySelector("#readonly-test-dropdown"),
      ).toHaveTextContent("Schreibgeschützt");
    });

    it("does not render a read-only description or aria-describedby when not readonly", () => {
      const { container } = render(Dropdown, {
        props: { items, labelText: "Contact" },
      });

      expect(screen.getByRole("combobox")).not.toHaveAttribute(
        "aria-describedby",
      );
      expect(container.querySelector("#readonly-test-dropdown")).toBeNull();
    });

    it("should not open menu on click when readonly", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      await user.click(screen.getByRole("combobox"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not open menu on Space when readonly", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true },
      });

      screen.getByRole("combobox").focus();
      await user.keyboard(" ");

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("should not select on Enter when readonly", async () => {
      const onselect = vi.fn();
      render(Dropdown, {
        props: { items, labelText: "Contact", readonly: true, onselect },
      });

      const button = screen.getByRole("combobox");
      button.focus();
      await user.keyboard("{Enter}");

      // On a closed menu, Enter would open it; readonly keeps it closed.
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(onselect).not.toHaveBeenCalled();
    });
  });

  // Regression: option DOM ids must be scoped to the Dropdown instance id so
  // two Dropdowns sharing item ids don't emit duplicate (invalid) DOM ids, and
  // aria-activedescendant resolves unambiguously.
  describe("option id scoping", () => {
    it("should prefix each option id with the instance id", async () => {
      render(Dropdown, {
        props: { items, id: "contact", labelText: "Contact" },
      });

      await user.click(screen.getByRole("combobox"));

      const ids = screen.getAllByRole("option").map((option) => option.id);
      expect(ids).toEqual(["contact-0", "contact-1", "contact-2"]);
    });

    it("should keep option ids globally unique across instances", () => {
      render(DropdownDuplicateIds);

      const ids = screen.getAllByRole("option").map((option) => option.id);
      // Two dropdowns, three items each.
      expect(ids).toHaveLength(6);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids).toEqual([
        "dropdown-a-0",
        "dropdown-a-1",
        "dropdown-a-2",
        "dropdown-b-0",
        "dropdown-b-1",
        "dropdown-b-2",
      ]);
    });

    it("should point aria-activedescendant at the scoped option id", async () => {
      render(Dropdown, {
        props: { items, id: "contact", selectedId: "0", labelText: "Contact" },
      });

      const button = screen.getByRole("combobox");
      await user.click(button);
      // Opening highlights the selected item (index 0).
      expect(button).toHaveAttribute("aria-activedescendant", "contact-0");

      await user.keyboard("{ArrowDown}");
      expect(button).toHaveAttribute("aria-activedescendant", "contact-1");
    });
  });

  describe("item icons", () => {
    it("should render item.icon left of the label", () => {
      render(DropdownItemIcon);

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

    it("should render the checkmark when iconRight is absent", () => {
      render(DropdownItemIcon);

      const selected = screen
        .getByTestId("item-0")
        .closest(".bx--list-box__menu-item");
      expect(
        selected?.querySelector(".bx--list-box__menu-item__selected-icon"),
      ).toBeInTheDocument();
    });

    it("should prefer the icon slot over item.icon", () => {
      render(DropdownIconSlots, { props: { withItemIcons: true } });

      const icons = document.querySelectorAll(
        ".bx--list-box__menu-item__icon--left",
      );
      expect(icons).toHaveLength(2);
      for (const [index, icon] of icons.entries()) {
        expect(
          within(icon as HTMLElement).getByTestId(`left-${index}`),
        ).toBeVisible();
        expect(icon.querySelector("svg")).toBeNull();
      }
    });

    it("should render iconRight instead of the checkmark", () => {
      render(DropdownIconSlots);

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
      render(DropdownIconEnd);

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
      render(DropdownIconEnd, { props: { withIconRight: true } });

      expect(screen.getByTestId("end-0")).toBeInTheDocument();
      expect(screen.getByTestId("end-1")).toBeInTheDocument();
      expect(screen.queryByTestId("right-0")).toBeNull();
      expect(screen.queryByTestId("right-1")).toBeNull();
    });
  });

  describe("fluid variant", () => {
    it("does not render the fluid divider by default", () => {
      render(Dropdown, { props: { items, labelText: "Contact" } });

      expect(document.querySelector(".bx--list-box__divider")).toBeNull();
    });

    it("shows helper text under an inline field and describes it", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          type: "inline",
          helperText: "Helper text",
        },
      });

      const helper = screen.getByText("Helper text");
      expect(helper).toHaveClass("bx--form__helper-text");
      expect(screen.getByLabelText("Contact")).toHaveAttribute(
        "aria-describedby",
        expect.stringContaining(helper.id),
      );
    });

    it("renders the divider and leaves the field undescribed", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          fluid: true,
          helperText: "Helper text",
        },
      });

      expect(
        document.querySelector(".bx--list-box__divider"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Contact")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("marks the fluid wrapper invalid", () => {
      render(Dropdown, {
        props: {
          items,
          labelText: "Contact",
          fluid: true,
          invalid: true,
          invalidText: "Invalid selection",
        },
      });

      expect(
        screen.getByLabelText("Contact").closest(".bx--dropdown__wrapper"),
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
        render(Dropdown, {
          props: { items, labelText: "Contact", fluid: true, ...props },
        });

        const button = screen.getByLabelText("Contact");
        const wrapper = button.closest(".bx--dropdown__wrapper");
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
        render(Dropdown, {
          props: { items, labelText: "Contact", fluid: true, ...props },
        });

        const button = screen.getByLabelText("Contact");
        const wrapper = button.closest(".bx--dropdown__wrapper");
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
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true, condensed: true },
      });

      const button = screen.getByLabelText("Contact");
      expect(button.closest(".bx--dropdown__wrapper")).toHaveClass(
        "bx--list-box__wrapper--fluid--condensed",
      );
    });

    it("ignores condensed when not fluid", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", condensed: true },
      });

      expect(
        document.querySelector(".bx--list-box__wrapper--fluid--condensed"),
      ).toBeNull();
    });

    it("toggles the input-focused class on the fluid field wrapper", async () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true },
      });

      const button = screen.getByLabelText("Contact");
      const wrapper = button.closest(".bx--list-box__field--wrapper");

      expect(wrapper).toHaveClass("bx--list-box__field--wrapper");
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.focus(button);
      await tick();
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );

      fireEvent.blur(button);
      await tick();
      expect(wrapper).not.toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });

    it("keeps the input-focused class while the fluid menu is open", () => {
      render(Dropdown, {
        props: { items, labelText: "Contact", fluid: true, open: true },
      });

      const wrapper = screen
        .getByRole("combobox")
        .closest(".bx--list-box__field--wrapper");
      expect(wrapper).toHaveClass(
        "bx--list-box__field--wrapper--input-focused",
      );
    });
  });
});
