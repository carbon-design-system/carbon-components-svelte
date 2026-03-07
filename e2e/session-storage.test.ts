import { expect, test } from "@playwright/test";

const STORAGE_KEY = "e2e-session-storage-key";

test.describe("SessionStorage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/session-storage.html");
  });

  test("displays initial value and persists to sessionStorage", async ({
    page,
  }) => {
    await expect(page.getByTestId("display-value")).toHaveText("initial");

    const stored = await page.evaluate(
      (key) => sessionStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBe("initial");
  });

  test("loads existing value from sessionStorage on mount", async ({
    page,
  }) => {
    await page.goto("/session-storage.html");
    await page.evaluate(
      ({ key, value }) => sessionStorage.setItem(key, value),
      { key: STORAGE_KEY, value: "pre-loaded" },
    );
    await page.reload();

    await expect(page.getByTestId("display-value")).toHaveText("pre-loaded");
  });

  test("persists value when user changes it", async ({ page }) => {
    await page.getByTestId("value-input").fill("user-edited");
    await expect(page.getByTestId("display-value")).toHaveText("user-edited");

    const stored = await page.evaluate(
      (key) => sessionStorage.getItem(key),
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

  test("clearItem removes value from sessionStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.getByTestId("clear-item").click();

    const stored = await page.evaluate(
      (key) => sessionStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(stored).toBeNull();
  });

  test("clearAll removes all sessionStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.evaluate(() => sessionStorage.setItem("other-key", "other"));
    await page.getByTestId("clear-all").click();

    const ourStored = await page.evaluate(
      (key) => sessionStorage.getItem(key),
      STORAGE_KEY,
    );
    const otherStored = await page.evaluate(() =>
      sessionStorage.getItem("other-key"),
    );
    expect(ourStored).toBeNull();
    expect(otherStored).toBeNull();
  });
});
