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

  test("multi snippet hides expand button when content is below the threshold", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi-short");
    await expect(snippet).toBeVisible();
    await expect(
      snippet.getByRole("button", { name: /show more/i }),
    ).toBeHidden();
  });

  test("expand button appears when content grows past the threshold", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi-dynamic");
    const showMore = snippet.getByRole("button", { name: /show more/i });

    // Starts short: no overflow, no button.
    await expect(showMore).toBeHidden();

    await page.getByTestId("toggle-content-size").click();

    // Grows past the threshold: button appears.
    await expect(showMore).toBeVisible();
  });

  test("resets height when content shrinks below the threshold after expanding", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet-multi-dynamic");

    // Grow content, then expand.
    await page.getByTestId("toggle-content-size").click();
    await snippet.getByRole("button", { name: /show more/i }).click();
    await expect(snippet).toHaveClass(/bx--snippet--expand/);
    const expandedHeight = (await snippet.boundingBox())?.height ?? 0;

    // Shrink content back below the threshold.
    await page.getByTestId("toggle-content-size").click();

    // Button disappears, expanded state resets, and height collapses back down.
    await expect(
      snippet.getByRole("button", { name: /show (more|less)/i }),
    ).toBeHidden();
    await expect(snippet).not.toHaveClass(/bx--snippet--expand/);
    const shrunkHeight = (await snippet.boundingBox())?.height ?? 0;
    expect(shrunkHeight).toBeLessThan(expandedHeight);
  });

  test("copy button swaps to feedback icon during feedback window and reverts", async ({
    page,
  }) => {
    const copyButton = page.getByRole("button", {
      name: "Copy with feedback icon",
    });
    const feedbackIcon = copyButton.getByTestId("feedback-icon");

    await expect(feedbackIcon).toBeHidden();
    await copyButton.click();
    await expect(feedbackIcon).toBeVisible();
    await expect(feedbackIcon).toBeHidden();
  });
});
