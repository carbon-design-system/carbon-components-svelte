import { expect, test } from "@playwright/test";

test.describe("TreeView virtualization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tree-view-virtualize.html");
  });

  test("showNode scrolls the deep row into view and focuses it", async ({
    page,
  }) => {
    const tree = page.getByTestId("tree-view-virtualize");
    await expect(tree).toBeVisible();
    expect(await tree.evaluate((el) => el.scrollTop)).toBe(0);

    await page.getByTestId("jump-deep").click();

    // The focused row must be the deep target, and it must be inside the
    // scroll viewport rather than merely mounted in the DOM.
    const focused = page.locator("[data-tree-row-id]:focus");
    await expect(focused).toBeVisible();

    const inView = await tree.evaluate((el) => {
      const row = el.querySelector("[data-tree-row-id]:focus");
      if (!row) return null;
      const treeBox = el.getBoundingClientRect();
      const rowBox = row.getBoundingClientRect();
      return {
        scrollTop: el.scrollTop,
        fullyVisible:
          rowBox.top >= treeBox.top && rowBox.bottom <= treeBox.bottom,
      };
    });

    expect(inView).not.toBeNull();
    expect(inView?.scrollTop).toBeGreaterThan(0);
    expect(inView?.fullyVisible).toBe(true);
  });

  test("scroll container is height-limited and scrollable", async ({
    page,
  }) => {
    const metrics = await page
      .getByTestId("tree-view-virtualize")
      .evaluate((el) => ({
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      }));

    expect(metrics.clientHeight).toBe(480);
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  });
});
