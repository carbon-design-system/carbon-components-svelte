import { expect, test } from "@playwright/test";

test.describe("DescriptionList summary", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/description-list.html");
  });

  test("holds every detail to the right edge, past a wrapping term", async ({
    page,
  }) => {
    const list = page.getByTestId("summary");
    const box = await list.boundingBox();
    const rights = await list
      .locator("dd")
      .evaluateAll((nodes) =>
        nodes.map((node) => Math.round(node.getBoundingClientRect().right)),
      );

    expect(new Set(rights).size).toBe(1);
    expect(rights[0]).toBe(Math.round((box?.x ?? 0) + (box?.width ?? 0)));

    const long = list.locator("dt").nth(1);
    const lineHeight = await long.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).lineHeight),
    );
    expect((await long.boundingBox())?.height).toBeGreaterThan(lineHeight);
  });

  test("rules off the total and enlarges its detail", async ({ page }) => {
    const total = page
      .getByTestId("summary")
      .locator(".bx--description-list-item--total");
    const styles = await total.evaluate((node) => ({
      border: getComputedStyle(node).borderTopWidth,
      size: getComputedStyle(node.querySelector("dd") as Element).fontSize,
    }));

    expect(styles.border).toBe("1px");
    expect(styles.size).toBe("20px");
  });
});
