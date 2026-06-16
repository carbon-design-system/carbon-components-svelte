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

    expect(await page.sessionStorage.getItem(STORAGE_KEY)).toBe("initial");
  });

  test("loads existing value from sessionStorage on mount", async ({
    page,
  }) => {
    await page.goto("/session-storage.html");
    await page.sessionStorage.setItem(STORAGE_KEY, "pre-loaded");
    await page.reload();

    await expect(page.getByTestId("display-value")).toHaveText("pre-loaded");
  });

  test("persists value when user changes it", async ({ page }) => {
    await page.getByTestId("value-input").fill("user-edited");
    await expect(page.getByTestId("display-value")).toHaveText("user-edited");

    expect(await page.sessionStorage.getItem(STORAGE_KEY)).toBe("user-edited");
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

    expect(await page.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("clearAll removes all sessionStorage", async ({ page }) => {
    await page.getByTestId("value-input").fill("to-be-cleared");
    await page.sessionStorage.setItem("other-key", "other");
    await page.getByTestId("clear-all").click();

    expect(await page.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(await page.sessionStorage.getItem("other-key")).toBeNull();
  });
});
