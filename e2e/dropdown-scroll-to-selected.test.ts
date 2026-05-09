import { expect, test } from "@playwright/test";

test.describe("Dropdown scroll to selected", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dropdown-scroll-to-selected.html");
  });

  test("shows selected option within menu bounds when opened", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Items" }).click();

    const selected = page.getByRole("option", { name: "Item 43" });
    await expect(selected).toBeVisible();
    await expect(selected).toHaveAttribute("aria-selected", "true");

    const intersectsMenu = await selected.evaluate((el) => {
      const menu = el.closest('[role="listbox"]');
      if (!(menu instanceof HTMLElement)) return false;
      const mr = menu.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      const overlap = Math.min(mr.bottom, er.bottom) - Math.max(mr.top, er.top);
      return overlap > 0;
    });

    expect(intersectsMenu).toBe(true);
  });
});
