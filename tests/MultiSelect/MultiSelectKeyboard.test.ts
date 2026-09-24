import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import { openMenu } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";

const items = [
  { id: "0", text: "Alpha" },
  { id: "1", text: "Bravo" },
  { id: "2", text: "Charlie" },
  { id: "3", text: "Delta" },
];

describe("MultiSelect keyboard", () => {
  describe("Shift+Enter / Shift+Space range selection", () => {
    it("selects the range from the anchor to the keyboard-highlighted item on Shift+Enter", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      // Click sets the anchor (mirrors shift+click's `prevSelectedItemId`).
      await user.click(screen.getByRole("option", { name: "Alpha" }));
      // Move the keyboard highlight down to "Delta" without selecting it.
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

      await user.keyboard("{Shift>}{Enter}{/Shift}");

      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "true");
      }
    });

    it("selects the range from the anchor to the keyboard-highlighted item on Shift+Space", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      await user.click(screen.getByRole("option", { name: "Alpha" }));
      await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

      await user.keyboard("{Shift>} {/Shift}");

      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "true");
      }
    });

    it("ignores a pointer (hover) highlight: Shift+Enter only acts on a keyboard highlight", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      await user.click(screen.getByRole("option", { name: "Alpha" }));
      await user.hover(screen.getByRole("option", { name: "Delta" }));

      await user.keyboard("{Shift>}{Enter}{/Shift}");

      expect(screen.getByRole("option", { name: "Delta" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });
  });

  describe("Ctrl+A select all", () => {
    it("non-filterable: Ctrl+A selects all enabled items, and pressing it again deselects them", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      await user.keyboard("{Control>}a{/Control}");
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "true");
      }

      await user.keyboard("{Control>}a{/Control}");
      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
    });

    it("non-filterable: Ctrl+A leaves a disabled item unselected", async () => {
      const itemsWithDisabled = [
        { id: "0", text: "Alpha" },
        { id: "1", text: "Bravo", disabled: true },
      ];
      render(MultiSelect, { props: { items: itemsWithDisabled } });

      await openMenu();
      await user.keyboard("{Control>}a{/Control}");

      expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("option", { name: "Bravo" })).toHaveAttribute(
        "aria-selected",
        "false",
      );
    });

    it("filterable: Ctrl+A in the text input does not select options (keeps native text selection)", async () => {
      render(MultiSelect, {
        props: { items, filterable: true, placeholder: "Filter..." },
      });

      await user.click(screen.getByPlaceholderText("Filter..."));
      await user.keyboard("{Control>}a{/Control}");

      for (const option of screen.getAllByRole("option")) {
        expect(option).toHaveAttribute("aria-selected", "false");
      }
    });
  });

  describe("first-character typeahead", () => {
    it("non-filterable: typing a character moves the highlight without selecting", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      await user.keyboard("c");

      const combobox = screen.getByRole("combobox");
      const charlieOption = screen.getByRole("option", { name: "Charlie" });
      expect(combobox).toHaveAttribute(
        "aria-activedescendant",
        charlieOption.id,
      );
      expect(charlieOption).toHaveAttribute("aria-selected", "false");
    });

    it("non-filterable: Space still toggles the highlighted option, not consumed by typeahead", async () => {
      render(MultiSelect, { props: { items } });

      await openMenu();
      await user.keyboard("c");
      await user.keyboard(" ");

      expect(screen.getByRole("option", { name: "Charlie" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
});
