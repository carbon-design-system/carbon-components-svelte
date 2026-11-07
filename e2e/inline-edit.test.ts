import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("InlineEdit", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/inline-edit.html");
    const states = page.getByTestId("states");
    await expect(
      states.getByRole("textbox", { name: "Project name" }),
    ).toBeVisible();

    // Resting, invalid, read-only and disabled.
    let results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    // Editing, with a change to save or cancel.
    await states
      .getByRole("textbox", { name: "Project name" })
      .fill("Q4 roadmap");
    await expect(states.getByRole("button", { name: "Save" })).toBeEnabled();
    results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("the field's size is its whole height, with or without the invalid ring", async ({
    page,
  }) => {
    await page.goto("/inline-edit.html");
    const fields = page.getByTestId("states").locator(".bx--edit-in-place");
    for (let i = 0; i < 4; i++) {
      expect((await fields.nth(i).boundingBox())?.height).toBe(40);
    }
  });

  test("in a DataTable cell, the field keeps the row height and lines up with the header", async ({
    page,
  }) => {
    await page.goto("/inline-edit.html");
    const tables = page.locator("[data-row-height]");
    await expect(tables).toHaveCount(5);

    for (const table of await tables.all()) {
      const want = Number(await table.getAttribute("data-row-height"));
      const { rowHeight, textLeft, headerLeft } = await table.evaluate((el) => {
        const row = el.querySelector("tbody tr") as HTMLElement;
        const input = row.querySelector("input") as HTMLInputElement;
        const header = el.querySelector("th") as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(
          header.querySelector(".bx--table-header-label") ?? header,
        );
        return {
          rowHeight: row.getBoundingClientRect().height,
          textLeft:
            input.getBoundingClientRect().left +
            Number.parseFloat(getComputedStyle(input).paddingLeft),
          headerLeft: range.getBoundingClientRect().left,
        };
      });
      expect(rowHeight).toBeCloseTo(want, 0);
      expect(Math.abs(textLeft - headerLeft)).toBeLessThanOrEqual(0.5);
    }
  });
});
