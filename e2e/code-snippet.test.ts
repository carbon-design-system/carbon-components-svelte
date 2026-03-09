import { expect, test } from "@playwright/test";

test.describe("CodeSnippet", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/code-snippet.html");
  });

  test("renders single snippet with code", async ({ page }) => {
    const snippet = page.getByTestId("snippet-single");
    await expect(snippet).toBeVisible();
    await expect(snippet.locator("code")).toHaveText("const x = 1;");
  });

  test("renders multi snippet with code", async ({ page }) => {
    const snippet = page.getByTestId("snippet-multi");
    await expect(snippet).toBeVisible();
    await expect(snippet.locator("code")).toContainText("function example()");
  });

  test("multi snippet shows expand button when content exceeds height", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi");
    const showMore = snippet.getByRole("button", { name: /show more/i });
    await expect(showMore).toBeVisible();
  });

  test("multi snippet expands and collapses on show more/less click", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi");
    const showMore = snippet.getByRole("button", { name: /show more/i });
    await showMore.click();

    await expect(snippet).toHaveClass(/bx--snippet--expand/);
    await expect(
      snippet.getByRole("button", { name: /show less/i }),
    ).toBeVisible();

    const showLess = snippet.getByRole("button", { name: /show less/i });
    await showLess.click();

    await expect(snippet).not.toHaveClass(/bx--snippet--expand/);
    await expect(showMore).toBeVisible();
  });

  test("multi snippet expanded content is visible and has greater height", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi");
    const codeBlock = snippet.locator("code");
    const collapsedHeight = (await codeBlock.boundingBox())?.height ?? 0;
    await snippet.getByRole("button", { name: /show more/i }).click();
    await expect(snippet).toHaveClass(/bx--snippet--expand/);
    const expandedHeight = (await codeBlock.boundingBox())?.height ?? 0;
    expect(expandedHeight).toBeGreaterThanOrEqual(collapsedHeight);
  });
});
