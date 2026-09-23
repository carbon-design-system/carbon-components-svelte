import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MultiSelect from "./MultiSelect.test.svelte";

const items = [
  { id: "0", text: "Alpha" },
  { id: "1", text: "Bravo" },
  { id: "2", text: "Charlie" },
  { id: "3", text: "Delta" },
];

describe("MultiSelect keyboard", () => {
  const openMenu = async () =>
    await user.click(await screen.findByRole("combobox", { expanded: false }));

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
});
