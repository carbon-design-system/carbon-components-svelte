import { expect, test } from "@playwright/test";

const STORAGE_KEY = "e2e-local-storage-key";

test.describe("LocalStorage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/local-storage.html");
  });

  test("displays initial value and persists to localStorage", async ({
    page,
  }) => {
    await expect(page.getByTestId("display-value")).toHaveText("initial");

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("initial");
  });

  test("loads existing value from localStorage on mount", async ({ page }) => {
    await page.goto("/local-storage.html");
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: STORAGE_KEY,
      value: "pre-loaded",
    });
    await page.reload();

    await expect(page.getByTestId("display-value")).toHaveText("pre-loaded");
  });

  test("persists value when user changes it", async ({ page }) => {
    await page.getByTestId("value-input").fill("user-edited");
    await expect(page.getByTestId("display-value")).toHaveText("user-edited");

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("user-edited");
  });

  test("persists across page reload", async ({ page }) => {
    await page.getByTestId("value-input").fill("survives-reload");
    await page.reload();

    await expect(page.getByTestId("display-value")).toHaveText(
      "survives-reload",
    );
  });

  test("clearItem removes value from localStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.getByTestId("clear-item").click();

    const stored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBeNull();
  });

  test("clearAll removes all localStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.evaluate(() => localStorage.setItem("other-key", "other"));
    await page.getByTestId("clear-all").click();

    const ourStored = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    const otherStored = await page.evaluate(() =>
      localStorage.getItem("other-key"),
    );
    expect(ourStored).toBeNull();
    expect(otherStored).toBeNull();
  });
});
