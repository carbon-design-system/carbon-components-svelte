// Real page loads: the host page remounts fixtures without loading the URL's
// hash, and back and forward need history entries of the fixture's own.
import { expect, test } from "@playwright/test";

function tab(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("tab", { name });
}

test.describe("Tabs hashLinked", () => {
  test("selects and scrolls to the tab the hash names on load", async ({
    page,
  }) => {
    await page.goto("/tabs-hash-linked.html#settings");

    await expect(tab(page, "Settings")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("Settings content")).toBeVisible();
    await expect(tab(page, "Settings")).toBeInViewport();
  });

  test("replaces the hash on selection and follows back and forward", async ({
    page,
  }) => {
    await page.goto("/tabs-hash-linked.html?view=compact");
    const length = await page.evaluate(() => history.length);

    await tab(page, "Activity").click();
    await expect(page).toHaveURL(
      /\/tabs-hash-linked\.html\?view=compact#activity$/,
    );
    expect(await page.evaluate(() => history.length)).toBe(length);

    // A link to the hash adds an entry and fires `hashchange`.
    await page.getByTestId("settings-link").click();
    await expect(tab(page, "Settings")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.goBack();
    await expect(page).toHaveURL(/#activity$/);
    await expect(tab(page, "Activity")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await page.goForward();
    await expect(page).toHaveURL(/#settings$/);
    await expect(tab(page, "Settings")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
