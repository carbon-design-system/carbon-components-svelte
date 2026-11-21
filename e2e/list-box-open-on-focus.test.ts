import { expect, test } from "./helpers/host";

test.describe("List box openOnFocus", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/list-box-open-on-focus.html");
    await page.getByTestId("open-modal").click();
    await expect(page.locator(".bx--modal")).toHaveClass(/is-visible/);
  });

  test("a Modal's first focus opens the filterable MultiSelect", async ({
    page,
  }) => {
    const input = page.getByRole("combobox", { name: "Environments" });
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-expanded", "true");

    // The menu shows under its field, not unplaced.
    const menu = page.getByRole("listbox");
    await expect(menu.getByRole("option", { name: "Staging" })).toBeVisible();
    const field = await page
      .locator(".bx--list-box__field", { has: input })
      .boundingBox();
    const box = await menu.boundingBox();
    if (!field || !box) throw new Error("field or menu has no box");
    expect(box.x).toBeCloseTo(field.x, 0);
    expect(box.width).toBeCloseTo(field.width, 0);
  });

  test("Tab opens the next field's menu and Shift+Tab reopens the first", async ({
    page,
  }) => {
    const environments = page.getByRole("combobox", { name: "Environments" });
    const region = page.getByRole("combobox", { name: "Region" });
    await expect(environments).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Tab");
    await expect(region).toBeFocused();
    await expect(environments).toHaveAttribute("aria-expanded", "false");
    await expect(region).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Shift+Tab");
    await expect(environments).toBeFocused();
    await expect(environments).toHaveAttribute("aria-expanded", "true");
    await expect(region).toHaveAttribute("aria-expanded", "false");
  });

  test("a click from outside opens the menu and leaves it open", async ({
    page,
  }) => {
    // Focus opens the menu before the click lands, so the click must not
    // toggle it shut.
    const region = page.getByRole("combobox", { name: "Region" });
    await page.getByRole("heading", { name: "Deploy" }).click();
    await region.click();
    await expect(region).toBeFocused();
    await expect(region).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("listbox")).toBeVisible();
  });
});
