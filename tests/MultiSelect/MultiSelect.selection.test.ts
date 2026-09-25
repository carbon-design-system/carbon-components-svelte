import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { closeMenu, openMenu, toggleOption } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectCustom from "./MultiSelectCustom.test.svelte";

const items = [
  { id: "0", text: "Slack" },
  { id: "1", text: "Email" },
  { id: "2", text: "Fax" },
] as const;

describe("MultiSelect", () => {
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

    it("does not fire select event for a programmatic selectedIds change", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(MultiSelect, { props: { items } });

      await rerender({ selectedIds: ["1", "2"] });
      await tick();
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());

      await openMenu();
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveTextContent("Email");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveTextContent("Fax");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
    });

    it("does not fire select for a programmatic change with selectionFeedback: top, but does for a toggle", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { rerender } = render(MultiSelect, {
        props: { items, selectionFeedback: "top" },
      });

      await rerender({ selectedIds: ["2"] });
      await tick();
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());

      await openMenu();
      await toggleOption("Slack");
      const selectCalls = consoleLog.mock.calls.filter(
        ([name]) => name === "select",
      );
      expect(selectCalls).toHaveLength(1);
      expect(selectCalls[0][1].selectedIds).toEqual(
        expect.arrayContaining(["0", "2"]),
      );
    });

    it("still fires select when the selection is cleared", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, { props: { items, selectedIds: ["0", "1"] } });

      await user.click(screen.getByRole("button", { name: /clear/i }));
      expect(consoleLog).toHaveBeenCalledWith(
        "select",
        expect.objectContaining({ selectedIds: [] }),
      );
    });

    it("still fires select when the selection is cleared with Delete", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, { props: { items, selectedIds: ["0", "1"] } });

      screen.getByRole("combobox").focus();
      await user.keyboard("{Delete}");
      expect(consoleLog).toHaveBeenCalledWith(
        "select",
        expect.objectContaining({ selectedIds: [] }),
      );
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

  describe("shift+click range selection", () => {
    const rangeItems = [
      { id: "0", text: "Alpha" },
      { id: "1", text: "Bravo" },
      { id: "2", text: "Charlie" },
      { id: "3", text: "Delta" },
    ];

    it("selects every item between the anchor and the shift-clicked item", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: { items: rangeItems },
      });

      await openMenu();
      await toggleOption("Alpha");

      const deltaOption = screen.getByRole("option", { name: "Delta" });
      await user.keyboard("{Shift>}");
      await user.click(deltaOption);
      await user.keyboard("{/Shift}");

      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "true");
      }
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toEqual(
        expect.arrayContaining(["0", "1", "2", "3"]),
      );
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toHaveLength(4);
    });

    it("falls back to a single toggle when shift+click has no prior anchor", async () => {
      render(MultiSelect, {
        props: { items: rangeItems },
      });

      await openMenu();

      const charlieOption = screen.getByRole("option", { name: "Charlie" });
      await user.keyboard("{Shift>}");
      await user.click(charlieOption);
      await user.keyboard("{/Shift}");

      expect(charlieOption).toHaveAttribute("aria-selected", "true");
      for (const option of screen.getAllByRole("option")) {
        if (option !== charlieOption) {
          expect(option).toHaveAttribute("aria-selected", "false");
        }
      }
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

    it("scopes select-all to the currently filtered items, not the whole list", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Ed");
      await toggleOption("All roles");

      expect(consoleLog).toHaveBeenCalledWith("select", {
        selectedIds: ["editor"],
        selected: [expect.objectContaining({ id: "editor", checked: true })],
        unselected: expect.arrayContaining([
          expect.objectContaining({ id: "owner", checked: false }),
          expect.objectContaining({ id: "reader", checked: false }),
          expect.objectContaining({ id: "uploader", checked: false }),
        ]),
      });
      expect(consoleLog.mock.calls[0][1].unselected).toHaveLength(3);
    });

    it("does not indicate select-all as checked when unfiltered items remain unselected", async () => {
      render(MultiSelect, {
        props: {
          items: itemsWithSelectAll,
          labelText: "Roles",
          filterable: true,
          placeholder: "Filter...",
        },
      });

      const input = screen.getByRole("combobox");
      await user.click(input);
      await user.type(input, "Ed");
      await toggleOption("All roles");

      await user.clear(input);
      const selectAllOption = screen.getByRole("option", { name: "All roles" });
      expect(selectAllOption).toHaveAttribute("aria-selected", "false");
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

    it("select-all option shows checked when all enabled items are selected and disabled items are excluded", async () => {
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
      const readerOption = screen.getByRole("option", { name: "Reader" });
      expect(readerOption).toHaveAttribute("aria-disabled", "true");
      expect(readerOption).toHaveAttribute("aria-selected", "false");
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

  describe("maxSelectedItems", () => {
    const preferenceItems = [
      { id: "0", text: "Email" },
      { id: "1", text: "Slack" },
      { id: "2", text: "SMS" },
      { id: "3", text: "Push" },
    ];

    it("stops checking items once the cap is reached and still allows unchecking", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: preferenceItems,
          maxSelectedItems: 2,
          labelText: "Preferences",
        },
      });

      await openMenu();
      await toggleOption("Email");
      await toggleOption("Slack");

      expect(consoleLog).toHaveBeenLastCalledWith(
        "select",
        expect.objectContaining({
          selectedIds: expect.arrayContaining(["0", "1"]),
        }),
      );
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toHaveLength(2);

      const smsOption = screen.getByRole("option", { name: "SMS" });
      expect(smsOption).toHaveAttribute("aria-disabled", "true");

      await user.click(smsOption);
      expect(smsOption).toHaveAttribute("aria-selected", "false");
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toHaveLength(2);

      await toggleOption("Email");
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toEqual(["1"]);

      expect(smsOption).not.toHaveAttribute("aria-disabled");
      await toggleOption("SMS");
      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toEqual(
        expect.arrayContaining(["1", "2"]),
      );
    });

    it("keeps cap-disabled items navigable but refuses selection", async () => {
      render(MultiSelect, {
        props: {
          items: preferenceItems,
          maxSelectedItems: 1,
          selectedIds: ["0"],
          sortItem: () => 0,
          labelText: "Preferences",
        },
      });

      await openMenu();

      const emailOption = screen.getByRole("option", { name: "Email" });
      const slackOption = screen.getByRole("option", { name: "Slack" });
      expect(slackOption).toHaveAttribute("aria-disabled", "true");

      await user.keyboard("{ArrowDown}");
      expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

      await user.keyboard("{ArrowDown}");
      expect(slackOption).toHaveClass("bx--list-box__menu-item--highlighted");

      await user.keyboard("{Enter}");
      expect(slackOption).toHaveAttribute("aria-selected", "false");
      expect(slackOption).toHaveAttribute("aria-disabled", "true");
      expect(emailOption).toHaveAttribute("aria-selected", "true");
    });

    it("describes why cap-disabled options refuse selection", async () => {
      render(MultiSelect, {
        props: {
          items: preferenceItems,
          maxSelectedItems: 1,
          selectedIds: ["0"],
          sortItem: () => 0,
          labelText: "Preferences",
        },
      });

      await openMenu();

      const slackOption = screen.getByRole("option", { name: "Slack" });
      const describedById = slackOption.getAttribute("aria-describedby");
      expect(describedById).toBeTruthy();
      expect(document.getElementById(describedById ?? "")).toHaveTextContent(
        "Maximum items selected",
      );

      // Checked items stay selectable at the cap and need no explanation.
      const emailOption = screen.getByRole("option", { name: "Email" });
      expect(emailOption).not.toHaveAttribute("aria-describedby");

      // Below the cap, no option carries the description.
      await toggleOption("Email");
      expect(slackOption).not.toHaveAttribute("aria-describedby");
    });

    it("disables select-all when a cap is set", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: [
            { id: "select-all", text: "All roles", isSelectAll: true },
            { id: "editor", text: "Editor" },
            { id: "owner", text: "Owner" },
            { id: "uploader", text: "Uploader" },
          ],
          maxSelectedItems: 2,
          labelText: "Roles",
        },
      });

      await openMenu();
      const selectAllOption = screen.getByRole("option", { name: "All roles" });
      expect(selectAllOption).toHaveAttribute("aria-disabled", "true");

      await user.click(selectAllOption);
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());
    });

    it("preserves unlimited selection when maxSelectedItems is omitted", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, {
        props: {
          items: preferenceItems,
          labelText: "Preferences",
        },
      });

      await openMenu();
      await toggleOption("Email");
      await toggleOption("Slack");
      await toggleOption("SMS");
      await toggleOption("Push");

      expect(consoleLog.mock.calls.at(-1)?.[1].selectedIds).toHaveLength(4);
      for (const name of ["Email", "Slack", "SMS", "Push"]) {
        expect(screen.getByRole("option", { name })).not.toHaveAttribute(
          "aria-disabled",
        );
      }
    });
  });

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

      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{ArrowDown}");
      await tick();
      const firstOptionId = screen.getAllByRole("option")[0].id;
      expect(combobox).toHaveAttribute("aria-activedescendant", firstOptionId);

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

  describe("Space toggles the highlighted option and Home/End jump (APG)", () => {
    it("non-filterable: Space toggles the highlighted option and keeps the menu open", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{ArrowDown}");
      await tick();

      const firstOption = screen.getAllByRole("option")[0];
      expect(firstOption).toHaveAttribute("aria-checked", "false");

      await user.keyboard(" ");
      expect(firstOption).toHaveAttribute("aria-checked", "true");
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await user.keyboard(" ");
      expect(firstOption).toHaveAttribute("aria-checked", "false");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });

    it("non-filterable: Space still opens the menu when closed", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.keyboard(" ");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).not.toHaveAttribute("aria-activedescendant");
    });

    it("non-filterable: Enter opens the menu when closed without selecting", async () => {
      const consoleLog = vi.spyOn(console, "log");
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Enter}");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).not.toHaveAttribute("aria-activedescendant");
      expect(consoleLog).not.toHaveBeenCalledWith("select", expect.anything());

      await user.keyboard("{ArrowDown}{Enter}");
      expect(screen.getAllByRole("option")[0]).toHaveAttribute(
        "aria-checked",
        "true",
      );
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });

    it("non-filterable: Enter opens the menu for review when read-only", async () => {
      render(MultiSelect, { props: { items, readonly: true } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Enter}");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });

    it("filterable: Enter does not open a closed menu", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter" },
      });

      const input = screen.getByPlaceholderText("Filter");
      await user.click(input);
      await user.keyboard("{Escape}");
      expect(input).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{Enter}");
      expect(input).toHaveAttribute("aria-expanded", "false");
    });

    it("non-filterable: Space does not toggle a hover-highlighted option", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      const emailOption = screen.getByRole("option", { name: "Email" });
      await user.hover(emailOption);
      expect(emailOption).toHaveClass("bx--list-box__menu-item--highlighted");

      await user.keyboard(" ");
      expect(emailOption).toHaveAttribute("aria-checked", "false");
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("non-filterable: Space on a highlighted disabled option is a no-op", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "1", text: "Aa" },
            { id: "2", text: "Ba", disabled: true },
            { id: "3", text: "Ca" },
          ],
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");
      await tick();

      const disabledOption = screen.getByRole("option", { name: "Ba" });
      expect(disabledOption).toHaveClass(
        "bx--list-box__menu-item--highlighted",
      );

      await user.keyboard(" ");
      expect(disabledOption).toHaveAttribute("aria-selected", "false");
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });

    it("non-filterable: Space does not change the selection when read-only", async () => {
      render(MultiSelect, { props: { items, readonly: true } });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.keyboard("{ArrowDown}");
      await tick();

      await user.keyboard(" ");
      expect(screen.getAllByRole("option")[0]).toHaveAttribute(
        "aria-checked",
        "false",
      );
      expect(combobox).toHaveAttribute("aria-expanded", "true");
    });

    it("non-filterable: Home and End jump to the first and last option", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{ArrowDown}");
      await tick();

      const options = screen.getAllByRole("option");

      await user.keyboard("{End}");
      expect(combobox).toHaveAttribute(
        "aria-activedescendant",
        options.at(-1)?.id,
      );

      await user.keyboard("{Home}");
      expect(combobox).toHaveAttribute("aria-activedescendant", options[0].id);
    });

    it("non-filterable: End opens a closed menu and highlights the last option", async () => {
      render(MultiSelect, { props: { items } });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      expect(combobox).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{End}");
      await tick();

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      expect(combobox).toHaveAttribute(
        "aria-activedescendant",
        screen.getAllByRole("option").at(-1)?.id,
      );
    });

    it("filterable: Home and End move the text caret, not the highlight", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      const input = screen.getByPlaceholderText<HTMLInputElement>("Filter...");
      await user.click(input);
      await user.type(input, "a");
      expect(input).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Home}");
      expect(input).not.toHaveAttribute("aria-activedescendant");
      expect(input.selectionStart).toBe(0);

      await user.keyboard("{End}");
      expect(input).not.toHaveAttribute("aria-activedescendant");
      expect(input.selectionStart).toBe(1);
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

      await user.keyboard("{Backspace}");

      // Re-open to check all options since filter may hide some
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
      await user.click(input);
      await user.keyboard("{Escape}");
      expect(input).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{Delete}");

      await user.click(input);
      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "false");
      expect(options[1]).toHaveAttribute("aria-selected", "false");
      expect(options[2]).toHaveAttribute("aria-selected", "false");
    });

    it("announces the cleared selection through the status region", async () => {
      render(MultiSelect, {
        props: {
          items,
          filterable: true,
          placeholder: "Filter...",
          selectedIds: ["0", "1"],
        },
      });

      expect(screen.getByRole("status")).toHaveTextContent("");

      await user.click(screen.getByPlaceholderText("Filter..."));
      await user.keyboard("{Backspace}");

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "All items cleared",
        ),
      );
    });
  });

  describe("non-filterable: Delete/Backspace clears selection (with announcement)", () => {
    it("Delete clears the selection while the menu is closed and announces it", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          selectedIds: ["0", "1"],
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      expect(combobox).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByRole("status")).toHaveTextContent("");

      await user.keyboard("{Delete}");

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "All items cleared",
        ),
      );

      await user.click(combobox);
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
    });

    it("Backspace clears the selection while the menu is open and keeps it open", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
        },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{ArrowDown}");
      await tick();
      expect(combobox).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Backspace}");

      expect(combobox).toHaveAttribute("aria-expanded", "true");
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "All items cleared",
        ),
      );
    });

    it("Delete with nothing selected announces nothing", async () => {
      render(MultiSelect, {
        props: { items, labelText: "Contact methods" },
      });

      const combobox = screen.getByRole("combobox");
      combobox.focus();
      await user.keyboard("{Delete}");
      await tick();

      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does not clear the selection when read-only", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          readonly: true,
          selectedIds: ["0", "1"],
        },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(combobox);
      await user.keyboard("{Delete}");
      await user.keyboard("{Backspace}");
      await tick();

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveAttribute("aria-selected", "true");
      expect(options[1]).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("announces when the selection is cleared with the clear button", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
        },
      });

      const closeIcon = container.querySelector(".bx--tag__close-icon");
      assert(closeIcon);
      await user.click(closeIcon);

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent(
          "All items cleared",
        ),
      );
    });

    it("advertises the clear shortcut in the field description only while there is a selection", async () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
        },
      });

      const description = document.querySelector("#selection-test-multiselect");
      expect(description).toHaveTextContent(
        "1 selected. To clear the selection, press Delete or Backspace",
      );

      screen.getByRole("combobox").focus();
      await user.keyboard("{Delete}");
      await tick();

      // The existing "omits the selection count description when nothing is
      // selected" behavior removes the shortcut hint along with the count.
      expect(
        document.querySelector("#selection-test-multiselect"),
      ).not.toBeInTheDocument();
    });

    it("supports overriding the shortcut hint and cleared announcement", async () => {
      render(MultiSelect, {
        props: {
          id: "test-multiselect",
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
          clearSelectionText: "Press Delete to reset",
          selectionClearedText: "Selection reset",
        },
      });

      expect(
        document.querySelector("#selection-test-multiselect"),
      ).toHaveTextContent("1 selected. Press Delete to reset");

      screen.getByRole("combobox").focus();
      await user.keyboard("{Delete}");

      await waitFor(() =>
        expect(screen.getByRole("status")).toHaveTextContent("Selection reset"),
      );
    });
  });

  describe("openOnClear", () => {
    it("does not open the menu after clearing by default", async () => {
      const { container } = render(MultiSelect, {
        props: { items, labelText: "Contact methods", selectedIds: ["0"] },
      });

      const closeIcon = container.querySelector(".bx--tag__close-icon");
      assert(closeIcon);
      await user.click(closeIcon);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("opens the menu after clicking the clear button when true", async () => {
      const { container } = render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
          openOnClear: true,
        },
      });

      const closeIcon = container.querySelector(".bx--tag__close-icon");
      assert(closeIcon);
      await user.click(closeIcon);

      expect(screen.getByRole("listbox")).toBeVisible();
    });

    it("opens the menu after clearing with Delete when true", async () => {
      render(MultiSelect, {
        props: {
          items,
          labelText: "Contact methods",
          selectedIds: ["0"],
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
      render(MultiSelectCustom, { props: { selectedIds: ["0", "1"] } });

      const combobox = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear"));

      await user.click(combobox);
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
      expect(combobox).toHaveFocus();
    });

    it("does not focus the field when options.focus is false", async () => {
      render(MultiSelectCustom, { props: { selectedIds: ["0", "1"] } });

      const combobox = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear (no focus)"));

      expect(combobox).not.toHaveFocus();
    });

    it("opens the menu when options.open is true", async () => {
      render(MultiSelectCustom, { props: { selectedIds: ["0", "1"] } });

      await user.click(screen.getByText("Clear (reopen)"));

      expect(screen.getByRole("listbox")).toBeVisible();
    });

    it("focuses the filter input, not the field, when filterable", async () => {
      render(MultiSelectCustom, {
        props: { selectedIds: ["0", "1"], filterable: true },
      });

      const combobox = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear"));

      expect(combobox).toHaveFocus();
    });

    it("is a no-op when nothing is selected", async () => {
      render(MultiSelectCustom);

      const combobox = screen.getByRole("combobox");
      await user.click(screen.getByText("Clear"));

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      expect(combobox).not.toHaveFocus();
    });
  });
});
