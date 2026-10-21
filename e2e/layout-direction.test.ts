import { expect, test } from "./helpers/host";

test.describe("LayoutDirection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/layout-direction.html");
  });

  test("keeps a portalled menu in its subtree's direction", async ({
    page,
  }) => {
    for (const [name, dir] of [
      ["RTL region", "rtl"],
      ["LTR region", "ltr"],
    ] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      await page.getByRole("combobox", { name }).click();
      const option = page.getByRole("option", { name: "eu-west-1" });
      await expect(option).toBeVisible();
      await expect(page.locator("body > [data-portal]")).toHaveAttribute(
        "dir",
        dir,
      );
      await expect(option).toHaveCSS("direction", dir);
      await page.keyboard.press("Escape");
      await expect(option).toBeHidden();
    }
  });
});
