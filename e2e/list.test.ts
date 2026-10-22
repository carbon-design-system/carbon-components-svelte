import { expect, test } from "./helpers/host";

test("top-level list markers sit inside the list's box", async ({ page }) => {
  await page.goto("/list.html");
  await expect(page.getByTestId("unordered")).toBeVisible();

  const lists = await page.evaluate(() =>
    ["unordered", "ordered"].map((id) => {
      const list = document.querySelector(`[data-testid="${id}"]`);
      const item = list?.querySelector(".bx--list__item");
      if (!list || !item) throw new Error(`no ${id}`);
      const marker = getComputedStyle(item, "::before");
      return {
        id,
        markerLeft:
          item.getBoundingClientRect().left + Number.parseFloat(marker.left),
        clipLeft: list.parentElement?.getBoundingClientRect().left ?? 0,
      };
    }),
  );
  for (const { id, markerLeft, clipLeft } of lists) {
    expect.soft(markerLeft, id).toBeGreaterThanOrEqual(clipLeft);
  }

  // Native markers render outside the item, in the list's padding.
  await expect(page.getByTestId("ordered-native")).toHaveCSS(
    "padding-left",
    "24px",
  );

  // The nested square asks for text presentation, so iOS draws no emoji.
  const square = await page
    .getByTestId("unordered-nested")
    .locator(".bx--list__item")
    .evaluate((item) => getComputedStyle(item, "::before").content);
  expect(square).toBe('"▪︎"');
});
