import { expect, test } from "@playwright/test";

// A node's name too long for its row ends in an ellipsis inside the tree,
// with the full name as a title on hover; a short name has no title.
test("a long node name ends in an ellipsis, titled on hover", async ({
  page,
}) => {
  await page.goto("/tree-long-names.html");
  const tree = page.getByTestId("tree");
  const names = tree.locator(".bx--tree-node__label__text");
  await expect(names).toHaveCount(3);

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
    expect(g.right).toBeLessThanOrEqual(g.edge + 0.5);
    expect(g.ellipsis).toBe("ellipsis");
  }
  expect(geometry.map((g) => g.cut)).toEqual([true, true, false]);

  await names.nth(0).hover();
  await expect(names.nth(0)).toHaveAttribute(
    "title",
    "Datenschutzgrundverordnungskonformitätsprüfung",
  );
  await names.nth(2).hover();
  await expect(names.nth(2)).not.toHaveAttribute("title");
});
