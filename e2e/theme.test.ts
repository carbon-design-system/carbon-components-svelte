import { expect, test } from "@playwright/test";

const STORAGE_KEY = "e2e-theme-key";

test.describe("Theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/theme.html");
  });

  test("sets theme attribute on document", async ({ page }) => {
    await expect(page.getByTestId("theme-display")).toHaveText("white");

    const themeAttr = await page.getAttribute("html", "theme");
    expect(themeAttr).toBe("white");
  });

  test("updates document theme when changed", async ({ page }) => {
    await page.getByTestId("set-g100").click();

    await expect(page.getByTestId("theme-display")).toHaveText("g100");
    const themeAttr = await page.getAttribute("html", "theme");
    expect(themeAttr).toBe("g100");
  });

  test("persists theme to localStorage when persist is true", async ({
    page,
  }) => {
    await page.getByTestId("set-g100").click();
    await expect(page.getByTestId("theme-display")).toHaveText("g100");

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("g100");
  });

  test("loads persisted theme on mount", async ({ page }) => {
    await page.goto("/theme.html");
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: STORAGE_KEY,
      value: "g100",
    });
    await page.reload();

    await expect(page.getByTestId("theme-display")).toHaveText("g100");
    const themeAttr = await page.getAttribute("html", "theme");
    expect(themeAttr).toBe("g100");
  });
});
