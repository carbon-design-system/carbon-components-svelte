import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Splitter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/splitter.html");
  });

  test("lays out the start pane at the given size", async ({ page }) => {
    const root = await page.getByTestId("splitter").boundingBox();
    const separator = await page
      .getByRole("separator", { name: "Resize file tree" })
      .boundingBox();
    if (!root || !separator) throw new Error("missing box");

    // 30% of 600px, with the 8px hit target centered on the boundary.
    expect(separator.x + separator.width / 2 - root.x).toBeCloseTo(180, 0);
    expect(separator.height).toBeCloseTo(300, 0);
  });

  test("drags the separator, clamps to max, and fires resize once", async ({
    page,
  }) => {
    const separator = page.getByRole("separator", { name: "Resize file tree" });
    const box = await separator.boundingBox();
    const root = await page.getByTestId("splitter").boundingBox();
    if (!box || !root) throw new Error("missing box");
    // Clear of the nested splitter's separator, which crosses at mid-height.
    const y = box.y + box.height / 4;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(root.x + 300, y, { steps: 5 });
    await expect(page.getByTestId("size-display")).toHaveText("50");
    await expect(separator).toBeFocused();

    // Past `max` and across the nested splitter: capture keeps the drag.
    await page.mouse.move(root.x + 590, y + 100, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("size-display")).toHaveText("80");
    await expect(page.getByTestId("resize-count")).toHaveText("1");
  });

  test("resizes a nested vertical splitter with the keyboard", async ({
    page,
  }) => {
    const inner = page.getByRole("separator", { name: "Resize terminal" });
    await inner.focus();
    await page.keyboard.press("Shift+ArrowDown");
    await expect(inner).toHaveAttribute("aria-valuenow", "60");

    const box = await inner.boundingBox();
    const innerRoot = await page.getByTestId("inner-splitter").boundingBox();
    if (!box || !innerRoot) throw new Error("missing box");
    expect(box.y + box.height / 2 - innerRoot.y).toBeCloseTo(180, 0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
