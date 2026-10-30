import { expect, test } from "@playwright/test";
import { expectAligned } from "./helpers/layout";

// Dropdown, ComboBox and MultiSelect share ListBox's sizes, so a size
// renders the same height on each. Dropdown's `lg` drew at 40px (its own
// height rule outranked ListBox's) where the others drew 48px.
const HEIGHTS = { xs: 24, sm: 32, md: 40, lg: 48, xl: 48 };

test("list boxes render the same height at each size", async ({ page }) => {
  await page.goto("/list-box-sizes.html");
  await expect(page.locator("[data-size] .bx--list-box")).toHaveCount(15);

  const measured = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-size]")].map((row) => ({
      size: row.dataset.size,
      heights: [...row.querySelectorAll(".bx--list-box")].map(
        (field) => field.getBoundingClientRect().height,
      ),
    })),
  );

  expect(measured).toEqual(
    Object.entries(HEIGHTS).map(([size, height]) => ({
      size,
      heights: [height, height, height],
    })),
  );
});

// Fields in a row align to the top of their field box, and their values
// and labels share a baseline, at each size.
test("a text input and list boxes in one row line up at each size", async ({
  page,
}) => {
  await page.goto("/list-box-sizes.html");
  for (const size of Object.keys(HEIGHTS)) {
    const row = page.locator(`[data-row="${size}"]`);
    // biome-ignore lint/performance/noAwaitInLoops: one row at a time
    await test.step(size, async () => {
      const fields = [
        row.locator(".bx--text-input-wrapper input"),
        row.locator(".bx--list-box"),
      ];
      expect(await expectAligned(fields, { edge: "top" })).toBe(3);
      expect(await expectAligned(fields, { edge: "bottom" })).toBe(3);
      expect(
        await expectAligned(
          [
            row.locator(".bx--text-input-wrapper input"),
            row.locator(".bx--dropdown .bx--list-box__label"),
            row.locator(".bx--combo-box input"),
          ],
          { edge: "baseline" },
        ),
      ).toBe(3);
      expect(
        await expectAligned(row.locator(".bx--label"), { edge: "baseline" }),
      ).toBe(3);
    });
  }
});
