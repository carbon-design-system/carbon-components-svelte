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

    expect(await page.localStorage.getItem(STORAGE_KEY)).toBe("initial");
  });

  test("loads existing value from localStorage on mount", async ({ page }) => {
    await page.goto("/local-storage.html");
    await page.localStorage.setItem(STORAGE_KEY, "pre-loaded");
    await page.reload();

    await expect(page.getByTestId("display-value")).toHaveText("pre-loaded");
  });

  test("persists value when user changes it", async ({ page }) => {
    await page.getByTestId("value-input").fill("user-edited");
    await expect(page.getByTestId("display-value")).toHaveText("user-edited");

    expect(await page.localStorage.getItem(STORAGE_KEY)).toBe("user-edited");
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

    expect(await page.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("clearAll removes all localStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.localStorage.setItem("other-key", "other");
    await page.getByTestId("clear-all").click();

    expect(await page.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await page.localStorage.getItem("other-key")).toBeNull();
  });
});
