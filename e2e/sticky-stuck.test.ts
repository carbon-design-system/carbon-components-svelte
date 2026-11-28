import { expect, test } from "./helpers/host";

test.describe("sticky stuck state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sticky-stuck.html");
  });

  test("a PageHeader that starts where it sticks is stuck only once the page scrolls", async ({
    page,
  }) => {
    const header = page.getByTestId("page-header");
    await expect(page.getByTestId("header-stuck")).toHaveText(
      "Header stuck: false",
    );
    await expect(header).not.toHaveClass(/bx--page-header--stuck/);

    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(header).toHaveClass(/bx--page-header--stuck/);
    await expect(page.getByTestId("header-stuck")).toHaveText(
      "Header stuck: true",
    );

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(header).not.toHaveClass(/bx--page-header--stuck/);
  });

  test("a Toolbar and an ActionSet stick in their own scroll container", async ({
    page,
  }) => {
    const scroller = page.getByTestId("scroller");
    const toolbar = page.getByTestId("toolbar");
    const actions = page.getByTestId("action-set");

    // The set's place is below the fold, so it starts stuck to the bottom.
    await expect(toolbar).not.toHaveClass(/bx--table-toolbar--stuck/);
    await expect(actions).toHaveClass(/bx--action-set--stuck/);

    await scroller.evaluate((node) => node.scrollTo(0, 100));
    await expect(toolbar).toHaveClass(/bx--table-toolbar--stuck/);
    await expect(actions).toHaveClass(/bx--action-set--stuck/);

    // At the end, the set sits in its place: not stuck.
    await scroller.evaluate((node) => node.scrollTo(0, node.scrollHeight));
    await expect(actions).not.toHaveClass(/bx--action-set--stuck/);
    await expect(toolbar).toHaveClass(/bx--table-toolbar--stuck/);
    await expect(page.getByTestId("actions-stuck")).toHaveText(
      "Actions stuck: false",
    );

    await scroller.evaluate((node) => node.scrollTo(0, 0));
    await expect(toolbar).not.toHaveClass(/bx--table-toolbar--stuck/);
  });

  test("a Toolbar in a flex parent sticks with its sentinel inside", async ({
    page,
  }) => {
    const scroller = page.getByTestId("flex-scroller");
    const toolbar = page.getByTestId("flex-toolbar");
    await expect(
      toolbar.locator(":scope > [data-ccs-sticky-sentinel]"),
    ).toHaveCount(1);
    await expect(toolbar).not.toHaveClass(/bx--table-toolbar--stuck/);

    await scroller.evaluate((node) => node.scrollTo(0, 120));
    await expect(toolbar).toHaveClass(/bx--table-toolbar--stuck/);

    await scroller.evaluate((node) => node.scrollTo(0, 0));
    await expect(toolbar).not.toHaveClass(/bx--table-toolbar--stuck/);
  });

  test("a narrow ActionSet in a flex parent stacks with its sentinel inside", async ({
    page,
  }) => {
    const set = page.getByTestId("flex-action-set");
    await expect(
      set.locator(":scope > [data-ccs-sticky-sentinel]"),
    ).toHaveCount(1);
    const boxes = await set
      .locator(".bx--btn")
      .evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect()),
      );
    const width = await set.evaluate((node) => node.clientWidth);
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(2);
    for (const box of boxes) expect(Math.round(box.width)).toBe(width);
  });
});
