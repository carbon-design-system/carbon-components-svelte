import { expect, test } from "@playwright/test";

// Dropdown, ComboBox and MultiSelect share ListBox's sizes, so a size
// renders the same height on each. Dropdown's `lg` drew at 40px (its own
// height rule outranked ListBox's) where the others drew 48px.
const HEIGHTS = { xs: 24, sm: 32, md: 40, lg: 48, xl: 48 };

test("list boxes render the same height at each size", async ({ page }) => {
  await page.goto("/list-box-sizes.html");
  await expect(page.locator(".bx--list-box")).toHaveCount(15);

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
