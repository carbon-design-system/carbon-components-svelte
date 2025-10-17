import { render, screen } from "@testing-library/svelte";
import { user } from "../setup-tests";
import MultiSelect from "./MultiSelect.test.svelte";
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
        titleText: "Contact methods",
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

  describe("selection behavior", () => {
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
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          filterItem: (item, value) => {
            return item.text.toLowerCase().startsWith(value.toLowerCase());
          },
        },
      });

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
      const emailOption = screen
        .getByText("Email")
        .closest(".bx--list-box__menu-item");
      expect(emailOption).toHaveAttribute("disabled");
    });
  });

  describe("accessibility", () => {
    it("handles hidden label", () => {
      render(MultiSelect, {
        props: {
          items,
          titleText: "Contact methods",
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
          titleText: "Contact methods",
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
          titleText: "Contact methods",
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
  });

  describe("custom formatting", () => {
    it("handles custom itemToString", () => {
      render(MultiSelect, {
        props: {
          items,
          selectedIds: ["0"],
          itemToString: (item) => `${item.text} (${item.id})`,
        },
      });

      expect(screen.getByText("Slack (0)")).toBeInTheDocument();
    });

    it("handles custom itemToInput", async () => {
      render(MultiSelect, {
        props: {
          items,
          itemToInput: (item) => ({
            name: `contact_${item.id}`,
            value: item.text.toLowerCase(),
          }),
        },
      });

      await openMenu();
      const checkbox = screen.getByText("Slack");
      const checkboxWrapper = checkbox.closest(".bx--checkbox-wrapper");
      const checkboxInput = checkboxWrapper?.querySelector("input");
      expect(checkboxInput).toHaveAttribute("name", "contact_0");
      expect(checkboxInput).toHaveAttribute("value", "slack");
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
    const disabledOption = screen.getByText("B").closest("[role='option']");
    assert(disabledOption);

    await user.click(disabledOption);
    expect(disabledOption).toHaveAttribute("aria-selected", "false");
  });
});
