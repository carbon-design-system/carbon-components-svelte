import { render, screen } from "@testing-library/svelte";
import { TOOLTIP_ICON_LEAVE_DELAY_MS } from "../../src/constants/timing.js";
import { user } from "../utils/user";

/**
 * Shared checks for `bind:value={row.item}` where a parent owns the rows.
 * The fixture renders a row "a" (value "Widget") that logs
 * `("save" | "cancel", row.id, row.item)` and a "Rename outside" button
 * that sets row "a" to "Sprocket".
 */
export function describeBindValueInRow(
  name: string,
  Fixture: Parameters<typeof render>[0],
) {
  describe(`InlineEdit with bind:value in ${name}`, () => {
    const input = () => screen.getByRole("textbox", { name: "Item a" });
    const save = () => screen.getByRole("button", { name: "Save a" });
    const cancel = () => screen.getByRole("button", { name: "Cancel a" });

    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("enables save and cancel after typing", async () => {
      render(Fixture);
      await user.click(input());
      expect(save()).toBeDisabled();
      expect(cancel()).toBeDisabled();

      await user.clear(input());
      await user.type(input(), "Widget Pro");

      expect(input()).toHaveValue("Widget Pro");
      expect(save()).toBeEnabled();
      expect(cancel()).toBeEnabled();
    });

    it("restores the value from when editing began on Escape", async () => {
      render(Fixture);
      await user.click(input());
      await user.type(input(), " Pro");
      await user.keyboard("{Escape}");

      expect(input()).toHaveValue("Widget");
      expect(console.log).toHaveBeenCalledWith("cancel", "a", "Widget");
    });

    it("restores the value from when editing began on cancel", async () => {
      render(Fixture);
      await user.click(input());
      await user.type(input(), " Pro");
      await user.click(cancel());

      expect(input()).toHaveValue("Widget");
      expect(console.log).toHaveBeenCalledWith("cancel", "a", "Widget");
      expect(cancel()).toBeDisabled();
    });

    it("fires save with the new value, which becomes the new baseline", async () => {
      render(Fixture);
      await user.click(input());
      await user.type(input(), " Pro");
      await user.click(save());

      expect(console.log).toHaveBeenCalledWith("save", "a", "Widget Pro");
      expect(save()).toBeDisabled();
      expect(cancel()).toBeDisabled();

      await user.type(input(), "!");
      // The Save tooltip from the click waits out its leave delay, and
      // Escape would hide it before it reverts the field.
      await new Promise((resolve) =>
        setTimeout(resolve, TOOLTIP_ICON_LEAVE_DELAY_MS),
      );
      await user.keyboard("{Escape}");
      expect(input()).toHaveValue("Widget Pro");
    });

    it("auto-saves on blur after typing", async () => {
      render(Fixture);
      await user.click(input());
      await user.type(input(), " Pro");
      await user.click(document.body);

      expect(console.log).toHaveBeenCalledWith("save", "a", "Widget Pro");
      expect(input()).toHaveValue("Widget Pro");
    });

    it("takes an outside change to value as the new baseline while not editing", async () => {
      render(Fixture);
      await user.click(screen.getByRole("button", { name: "Rename outside" }));
      expect(input()).toHaveValue("Sprocket");

      await user.click(input());
      expect(save()).toBeDisabled();
      await user.type(input(), "s");
      await user.keyboard("{Escape}");
      expect(input()).toHaveValue("Sprocket");
    });
  });
}
