import { expect, test } from "./helpers/host";

test.describe("Toggletip", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toggletip.html");
  });

  test("closes on Escape after a mouse click opened it", async ({ page }) => {
    const button = page.getByRole("button", { name: "Show information" });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    // Safari does not focus a button on click, so focus is not inside the
    // toggletip when the key is pressed.
    await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.blur(),
    );
    await expect(button).not.toBeFocused();

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
