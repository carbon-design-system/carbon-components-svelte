import { expect, test } from "@playwright/test";

// A set measured before IBM Plex loads must measure again once it has:
// the font changes each tag's width but not the set's.
test("counts the overflow again once the web font loads", async ({ page }) => {
  await page.route(/s81c\.com/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await page.goto("/tag-set-font.html");
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.fonts].some(
            (font) =>
              font.family.includes("IBM Plex Sans") && font.status === "loaded",
          ),
        ),
      { timeout: 10_000 },
    )
    .toBe(true);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Mount late set" }).click();
  const overflow = (testId: string) =>
    page.getByTestId(testId).getByRole("button");
  await expect(overflow("late").first()).toBeVisible();

  await expect
    .poll(() => overflow("early").first().textContent())
    .toBe(await overflow("late").first().textContent());
});
