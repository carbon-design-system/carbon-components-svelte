import { expect, test } from "@playwright/test";

// Browsers lay out only so tall an element: Firefox about 17.9 million
// pixels, and it drops a taller one outright, so the list cannot scroll.
test("a list taller than the browser scrolls still scrolls to its end", async ({
  page,
}) => {
  // 1,000,000 rows of 24px: 24 million pixels.
  await page.goto("/virtual-list-max-height.html?rows=1000000&itemHeight=24");
  const list = page.getByTestId("list");
  await expect(list.locator("[data-row]").first()).toBeVisible();

  const scrollable = await list.evaluate(
    (el) => el.scrollHeight - el.clientHeight,
  );
  expect(scrollable).toBeGreaterThan(0);

  // At the end, the last row rendered sits against the bottom edge.
  await expect
    .poll(() =>
      list.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        const rows = el.querySelectorAll("[data-row]");
        const last = rows[rows.length - 1];
        if (!last) return null;
        return Math.round(
          el.getBoundingClientRect().bottom -
            last.getBoundingClientRect().bottom,
        );
      }),
    )
    .toBeLessThanOrEqual(0);

  // Most of the list is reachable.
  const lastRow = await list
    .locator("[data-row]")
    .last()
    .getAttribute("data-row");
  expect(Number(lastRow)).toBeGreaterThan(500_000);
});
