import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const cases = [
  { trigger: "Delete file", title: "File deleted", action: "Undo" },
  { trigger: "Upload", title: "Upload failed", action: "Retry" },
];

test.describe("Actionable notification", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/actionable-notification.html");
  });

  test("has no detectable accessibility violations when open", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Delete file" }).click();
    await page.getByRole("button", { name: "Upload" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(2);
    // Focus moving to the action starts a color transition. Read contrast
    // once it settles.
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState !== "running"),
    );

    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  for (const { trigger, title, action } of cases) {
    test(`${title}: keyboard reaches the action and Escape returns focus`, async ({
      page,
    }) => {
      const opener = page.getByRole("button", { name: trigger });
      await opener.focus();
      await page.keyboard.press("Enter");

      const dialog = page.getByRole("alertdialog", { name: title });
      const actionButton = dialog.getByRole("button", { name: action });
      const close = dialog.getByRole("button", { name: "Close notification" });
      await expect(actionButton).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(actionButton).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(close).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    });

    test(`${title}: the action closes it and returns focus`, async ({
      page,
    }) => {
      const opener = page.getByRole("button", { name: trigger });
      await opener.focus();
      await page.keyboard.press("Enter");

      const dialog = page.getByRole("alertdialog", { name: title });
      await expect(dialog.getByRole("button", { name: action })).toBeFocused();
      await page.keyboard.press("Enter");

      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    });
  }
});
