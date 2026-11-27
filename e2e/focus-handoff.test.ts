import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const focused = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el && el !== document.body
      ? (el.textContent ?? "").trim() || el.getAttribute("data-testid")
      : "BODY";
  });

test.describe("Focus handoff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/focus-handoff.html");
    await expect(
      page.getByRole("heading", { name: "Focus handoff" }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test.describe("DataTable row delete", () => {
    test("moves focus to the next row's Delete button", async ({ page }) => {
      await page.getByRole("button", { name: "Delete Row 2" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Delete Row 3" }),
      ).toBeFocused();
    });

    test("keeps up with a held Enter key through every row", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Delete Row 1" }).focus();
      for (let i = 1; i <= 5; i++) {
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("button", { name: `Delete Row ${i + 1}` }),
        ).toBeFocused();
      }

      // The last row has no next row and no previous row: the table keeps it.
      await expect(page.getByRole("row")).toHaveCount(2);
      await page.keyboard.press("Enter");
      await expect(page.getByRole("row")).toHaveCount(1);
      expect(await focused(page)).not.toBe("BODY");
    });

    test("moves to the previous row when the last row is deleted", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Delete Row 6" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Delete Row 5" }),
      ).toBeFocused();
    });

    test("does not steal focus when the app removes another row", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Delete Row 4" }).focus();
      await page
        .getByRole("button", { name: "App removes Row 2" })
        .evaluate((el) => (el as HTMLElement).click());

      await expect(
        page.getByRole("button", { name: "Delete Row 2" }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Delete Row 4" }),
      ).toBeFocused();
    });

    test("keeps focus on a button that moves in a keyed reorder", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Move Row 3 up" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Move Row 3 up" }),
      ).toBeFocused();
      await expect(page.getByRole("row").nth(2)).toContainText("Row 3");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("row").nth(1)).toContainText("Row 3");
      await expect(
        page.getByRole("button", { name: "Move Row 3 up" }),
      ).toBeFocused();
    });

    test("moves focus after a pointer click on the button", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Delete Row 2" }).click();

      await expect(
        page.getByRole("button", { name: "Delete Row 3" }),
      ).toBeFocused();
    });

    test("leaves focus on the page when no control held it", async ({
      page,
    }) => {
      // Safari does not focus a clicked button, so nothing held focus.
      await page
        .getByRole("button", { name: "Delete Row 2" })
        .evaluate((el) => (el as HTMLElement).click());

      await expect(
        page.getByRole("button", { name: "Delete Row 2" }),
      ).toHaveCount(0);
      expect(await focused(page)).toBe("BODY");
    });
  });

  test.describe("explicit API", () => {
    test("delete in a list moves focus and announces it", async ({ page }) => {
      await page.getByRole("button", { name: "Delete bravo" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Delete charlie" }),
      ).toBeFocused();
      await expect(page.getByTestId("announcement")).toHaveText(
        "Task deleted, focus on next task",
      );
    });

    test("delete the last item, then the only item left", async ({ page }) => {
      await page.getByRole("button", { name: "Delete delta" }).focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("button", { name: "Delete charlie" }),
      ).toBeFocused();
      for (const next of ["bravo", "alpha"]) {
        await page.keyboard.press("Enter");
        await expect(
          page.getByRole("button", { name: `Delete ${next}` }),
        ).toBeFocused();
      }
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("tasks")).toBeFocused();
    });

    test("keeps focus on a moved item in a keyed list", async ({ page }) => {
      await page.getByRole("button", { name: "Move charlie up" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Move charlie up" }),
      ).toBeFocused();
      await expect(
        page.getByTestId("tasks").locator("li").nth(1),
      ).toHaveAttribute("data-id", "charlie");
    });

    test("returns focus to the trigger when a panel closes", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "Open panel" }).click();
      await page.getByRole("button", { name: "Close panel" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Open panel" }),
      ).toBeFocused();
    });

    test("follows a button that turns into its inverse", async ({ page }) => {
      await page.getByRole("button", { name: "Cancel run" }).focus();
      await page.keyboard.press("Enter");

      await expect(
        page.getByRole("button", { name: "Retry run" }),
      ).toBeFocused();
    });
  });

  test("the action keeps focus in a plain list", async ({ page }) => {
    await page.getByRole("button", { name: "Delete n3" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Delete n2" })).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Delete n1" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("notes")).toBeFocused();
  });
});
