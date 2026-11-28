import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A node's name too long for its row ends in an ellipsis inside the tree,
// with the full name as a title on hover; a short name has no title.
// Virtualized rows have a fixed height, so a wrapped name would also spill
// out of its row.
test("a long node name ends in an ellipsis, titled on hover", async ({
  page,
}) => {
  await page.goto("/tree-long-names.html");
  for (const testId of ["tree", "tree-virtual"]) {
    await expectTruncatedNames(page, testId);
  }
});

async function expectTruncatedNames(page: Page, testId: string) {
  const tree = page.getByTestId(testId);
  const names = tree.locator(".bx--tree-node__label__text");
  await expect(names).toHaveCount(3);
  await page.evaluate(() => document.fonts.ready);

  const geometry = await names.evaluateAll((els) => {
    const edge =
      els[0].closest(".bx--tree")?.getBoundingClientRect().right ?? 0;
    return els.map((el) => ({
      right: el.getBoundingClientRect().right,
      edge,
      ellipsis: getComputedStyle(el).textOverflow,
      cut: el.scrollWidth > el.clientWidth,
    }));
  });
  for (const g of geometry) {
    expect(g.right, testId).toBeLessThanOrEqual(g.edge + 0.5);
    expect(g.ellipsis, testId).toBe("ellipsis");
  }
  expect(
    geometry.map((g) => g.cut),
    testId,
  ).toEqual([true, true, false]);

  await names.nth(0).hover();
  await expect(names.nth(0)).toHaveAttribute(
    "title",
    "Datenschutzgrundverordnungskonformitätsprüfung",
  );
  await names.nth(2).hover();
  await expect(names.nth(2)).not.toHaveAttribute("title");
}
