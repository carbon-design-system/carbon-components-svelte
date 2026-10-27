import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function download(page: Page, trigger: string, item: string) {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: item }).click();
  const file = await pending;
  const chunks: Buffer[] = [];
  for await (const chunk of await file.createReadStream()) {
    chunks.push(chunk as Buffer);
  }
  return {
    filename: file.suggestedFilename(),
    content: Buffer.concat(chunks).toString("utf8"),
  };
}

test.describe("ToolbarExport", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toolbar-export.html");
  });

  test("downloads every row in the table's sort order", async ({ page }) => {
    await page
      .getByRole("columnheader", { name: /Name/ })
      .getByRole("button")
      .click();

    const { filename, content } = await download(page, "Export", "Export CSV");

    expect(filename).toBe("fruit.csv");
    expect(content.split("\r\n")).toEqual([
      "Name,Port",
      "Apple,3001 ms",
      "Banana,3002 ms",
      "Cherry,3000 ms",
      "Date,3003 ms",
      "Elderberry,3004 ms",
      "Fig,3005 ms",
      "Grape,3006 ms",
    ]);
  });

  test("rowScope page exports only the visible page", async ({ page }) => {
    const { content } = await download(page, "Export page", "Export CSV");

    expect(content.split("\r\n")).toHaveLength(6);
    await page.getByRole("button", { name: "Next page" }).click();
    const next = await download(page, "Export page", "Export CSV");
    expect(next.content.split("\r\n")).toEqual([
      "Name,Port",
      "Fig,3005 ms",
      "Grape,3006 ms",
    ]);
  });

  test("rowScope selected is offered in the batch actions bar", async ({
    page,
  }) => {
    await page
      .getByRole("checkbox", { name: "Select row" })
      .nth(1)
      .click({ force: true });

    const { filename, content } = await download(
      page,
      "Export selected",
      "Export JSON",
    );

    expect(filename).toBe("selected.json");
    expect(JSON.parse(content)).toEqual([{ name: "Apple", port: "3001 ms" }]);
  });

  test("a canceled export starts no download", async ({ page }) => {
    await page.getByRole("button", { name: "Export", exact: true }).click();
    await page.getByRole("menuitem", { name: "Export TSV" }).click();

    await expect(page.getByTestId("canceled")).toHaveText("fruit.tsv");
  });

  test("Escape closes the menu and returns focus to the trigger", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Export", exact: true });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem").first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");

    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const mode of ["ltr", "rtl", "forced-colors"] as const) {
    test(`an open menu has no detectable accessibility violations in ${mode}`, async ({
      page,
    }) => {
      if (mode === "rtl") {
        await page.evaluate(() => {
          document.documentElement.dir = "rtl";
        });
      }
      if (mode === "forced-colors") {
        await page.emulateMedia({ forcedColors: "active" });
      }
      await page.getByRole("button", { name: "Export", exact: true }).click();
      await expect(page.getByRole("menu")).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
