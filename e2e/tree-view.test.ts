import { expect, test } from "@playwright/test";

test.describe("TreeView", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tree-view.html");
  });

  test("renders tree view", async ({ page }) => {
    await expect(page.getByTestId("tree-view")).toBeVisible();
    await expect(page.getByRole("tree", { name: "Tree" })).toBeVisible();
    await expect(
      page.getByRole("treeitem", { name: "Parent 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("treeitem", { name: "Parent 2" }),
    ).toBeVisible();
  });

  test("expands node when toggle is clicked", async ({ page }) => {
    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).not.toBeVisible();

    await page
      .getByRole("treeitem", { name: "Parent 1" })
      .locator(".bx--tree-parent-node__toggle")
      .click();

    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).toBeVisible();
  });

  test("selects node when clicked", async ({ page }) => {
    await page.getByRole("treeitem", { name: "Parent 2" }).click();

    await expect(
      page.getByRole("treeitem", { name: "Parent 2" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("Enter expands focused parent node", async ({ page }) => {
    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).not.toBeVisible();

    await page.getByRole("treeitem", { name: "Parent 1" }).focus();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).toBeVisible();
  });

  test("ArrowDown moves focus to next node", async ({ page }) => {
    await page.getByRole("treeitem", { name: "Parent 1" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByRole("treeitem", { name: "Parent 2" }),
    ).toBeFocused();
  });

  test("ArrowRight expands and ArrowLeft collapses parent", async ({
    page,
  }) => {
    await page.getByRole("treeitem", { name: "Parent 1" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("treeitem", { name: "Child 1-1" }),
    ).not.toBeVisible();
  });
});
