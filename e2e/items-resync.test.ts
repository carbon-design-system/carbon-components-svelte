import { expect, test } from "@playwright/test";

test.describe("Items resync — display derived from value + items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/items-resync.html");
  });

  test("ComboBox shows preloaded selection at mount", async ({ page }) => {
    await expect(page.getByTestId("cb-preload-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-preload")).toHaveValue("George Orwell");
  });

  test("ComboBox shows selection after async fill", async ({ page }) => {
    await expect(page.getByTestId("cb-fill")).toHaveValue("");
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
  });

  test("ComboBox keeps selection after items ref swap", async ({ page }) => {
    await expect(page.getByTestId("cb-swap")).toHaveValue("George Orwell");
    await page.getByTestId("reload").click();
    await expect(page.getByTestId("cb-swap-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-swap")).toHaveValue("George Orwell");
  });

  test("Select shows selection after async fill", async ({ page }) => {
    await page.getByTestId("load").click();
    await expect(page.getByTestId("sel-fill-selected")).toHaveText("orwell");
    await expect(page.getByTestId("sel-fill")).toHaveValue("orwell");
  });

  test("Select shows selection after clear + second async fill", async ({
    page,
  }) => {
    // Second load does not change selected; afterUpdate never re-synced the native value.
    await page.getByTestId("load").click();
    await expect(page.getByTestId("sel-fill")).toHaveValue("orwell");
    await page.getByTestId("clear-fill").click();
    await expect(page.getByTestId("sel-fill")).toHaveValue("");
    await page.getByTestId("load").click();
    await expect(page.getByTestId("sel-fill-selected")).toHaveText("orwell");
    await expect(page.getByTestId("sel-fill")).toHaveValue("orwell");
  });

  test("ComboBox shows selection after clear + second async fill", async ({
    page,
  }) => {
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
    await page.getByTestId("clear-fill").click();
    await expect(page.getByTestId("cb-fill-id")).toHaveText("orwell");
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
  });

  test("ComboBox clears input when fill items clear but selectedId is preserved", async ({
    page,
  }) => {
    await page.getByTestId("load").click();
    await expect(page.getByTestId("cb-fill")).toHaveValue("George Orwell");
    await page.getByTestId("clear-fill").click();
    await expect(page.getByTestId("cb-fill-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-fill")).toHaveValue("");
  });

  test("ComboBox clears input when selected id is removed from items", async ({
    page,
  }) => {
    await expect(page.getByTestId("cb-remove")).toHaveValue("George Orwell");
    await page.getByTestId("reload-without-orwell").click();
    await expect(page.getByTestId("cb-remove-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-remove")).toHaveValue("");
  });

  test("Select keeps selection after items ref swap", async ({ page }) => {
    await expect(page.getByTestId("sel-swap")).toHaveValue("orwell");
    await page.getByTestId("reload").click();
    await expect(page.getByTestId("sel-swap-selected")).toHaveText("orwell");
    await expect(page.getByTestId("sel-swap")).toHaveValue("orwell");
  });

  test("MultiSelect keeps selection after items ref swap (control)", async ({
    page,
  }) => {
    await expect(page.getByTestId("ms-swap")).toContainText("1");
    await page.getByTestId("reload").click();
    await expect(page.getByTestId("ms-swap-ids")).toHaveText("orwell");
    await expect(page.getByTestId("ms-swap")).toContainText("1");
  });

  test("MultiSelect keeps selection through clear + reload cycle", async ({
    page,
  }) => {
    // Items clear dropped checked to 0; afterUpdate wrote selectedIds = [] every other cycle.
    await page.getByTestId("load").click();
    await expect(page.getByTestId("ms-fill-ids")).toHaveText("orwell");
    await expect(page.getByTestId("ms-fill")).toContainText("1");

    await page.getByTestId("clear-fill").click();
    await expect(page.getByTestId("ms-fill-ids")).toHaveText("orwell");

    await page.getByTestId("load").click();
    await expect(page.getByTestId("ms-fill-ids")).toHaveText("orwell");
    await expect(page.getByTestId("ms-fill")).toContainText("1");

    await page.getByTestId("clear-fill").click();
    await page.getByTestId("load").click();
    await expect(page.getByTestId("ms-fill-ids")).toHaveText("orwell");
    await expect(page.getByTestId("ms-fill")).toContainText("1");
  });

  test("Select keeps selection after a non-selected option is removed", async ({
    page,
  }) => {
    // Removing an <option> mutates the native <select> subtree, which can reset
    // selectedIndex to -1. The unmount cleanup re-asserts ref.value from the store.
    await expect(page.getByTestId("sel-remove")).toHaveValue("orwell");
    await page.getByTestId("remove-non-selected").click();
    await expect(page.getByTestId("sel-remove-selected")).toHaveText("orwell");
    await expect(page.getByTestId("sel-remove")).toHaveValue("orwell");
  });

  test("ComboBox keeps selection after a non-selected option is removed", async ({
    page,
  }) => {
    // Display derives from selectedId in JS, so an items change re-resolves it; no
    // per-option unmount handling is needed.
    await expect(page.getByTestId("cb-keep")).toHaveValue("George Orwell");
    await page.getByTestId("remove-non-selected").click();
    await expect(page.getByTestId("cb-keep-id")).toHaveText("orwell");
    await expect(page.getByTestId("cb-keep")).toHaveValue("George Orwell");
  });

  test("MultiSelect keeps selection after a non-selected option is removed", async ({
    page,
  }) => {
    // Selection lives in selectedIds; an items change re-baselines checked counts.
    await expect(page.getByTestId("ms-remove")).toContainText("1");
    await page.getByTestId("remove-non-selected").click();
    await expect(page.getByTestId("ms-remove-ids")).toHaveText("orwell");
    await expect(page.getByTestId("ms-remove")).toContainText("1");
  });

  test("Dropdown shows selection after async fill (reference)", async ({
    page,
  }) => {
    await page.getByTestId("load").click();
    await expect(page.getByTestId("drop-fill-id")).toHaveText("orwell");
    await expect(page.getByTestId("drop-fill")).toContainText("George Orwell");
  });
});
