import { expect, test } from "./helpers/host";

const names = ["dropdown", "combobox", "multiselect"];
const modes = ["in-place", "portal", "virtualized"];

// `maxHeight="10rem"` caps every menu at 160px, whether it renders in place,
// in a portal or virtualized. A virtualized menu resolves the length to
// pixels for its window, so the window fills the menu with no blank rows.
test("maxHeight caps the menu in every mode", async ({ page }) => {
  await page.goto("/list-box-max-height.html");

  for (const name of names) {
    for (const mode of modes) {
      await test.step(`${name} ${mode}`, async () => {
        const field = page.getByTestId(`${name}-${mode}`).getByRole("combobox");
        const menuId = await field.getAttribute("aria-controls");
        if (!menuId) throw new Error("no aria-controls");
        const menu = page.locator(`[id="${menuId}"]`);
        await expect(menu).toBeVisible();

        const box = await menu.boundingBox();
        if (!box) throw new Error("no menu box");
        expect.soft(box.height).toBeCloseTo(160, 0);

        await menu.evaluate((el) => {
          el.scrollTop = 1000;
        });
        // The row under the menu's bottom edge is an option, not blank space.
        const bottom = await menu.evaluate(async (el) => {
          await new Promise(requestAnimationFrame);
          await new Promise(requestAnimationFrame);
          const rect = el.getBoundingClientRect();
          const hit = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.bottom - 4,
          );
          return hit?.closest("[role=option]") !== null;
        });
        expect.soft(bottom).toBe(true);
      });
    }
  }
});
