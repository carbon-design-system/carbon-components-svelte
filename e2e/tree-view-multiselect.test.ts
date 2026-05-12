import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Click on a tree node's label (not its children).
 * For parent nodes, clicking the <li> center may land on a child node,
 * so we target the label div directly.
 */
function nodeLabel(
  page: Page,
  name: string,
  options?: { exact?: boolean },
): Locator {
  return page
    .getByRole("treeitem", { name, exact: options?.exact })
    .locator("> .bx--tree-node__label");
}

test.describe("TreeView multiselect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tree-view-multiselect.html");
  });

  test("applies bx--tree--multiselect class", async ({ page }) => {
    const tree = page.getByRole("tree", { name: "Cloud Products" });
    await expect(tree).toHaveClass(/bx--tree--multiselect/);
  });

  test("plain click selects only the clicked node", async ({ page }) => {
    const blockchain = page.getByRole("treeitem", { name: "Blockchain" });
    await nodeLabel(page, "Blockchain").click();

    await expect(blockchain).toHaveAttribute("aria-selected", "true");

    // Initial selection on "AI / Machine learning" should be cleared
    await expect(
      page.getByRole("treeitem", { name: "AI / Machine learning" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  test("Ctrl+click toggles node selection (node mode)", async ({ page }) => {
    const ai = page.getByRole("treeitem", { name: "AI / Machine learning" });
    const blockchain = page.getByRole("treeitem", { name: "Blockchain" });

    // AI is initially selected. Ctrl+click Blockchain to add it.
    await nodeLabel(page, "Blockchain").click({ modifiers: ["ControlOrMeta"] });

    await expect(ai).toHaveAttribute("aria-selected", "true");
    await expect(blockchain).toHaveAttribute("aria-selected", "true");

    // Ctrl+click Blockchain again to deselect it.
    await nodeLabel(page, "Blockchain").click({ modifiers: ["ControlOrMeta"] });

    await expect(ai).toHaveAttribute("aria-selected", "true");
    await expect(blockchain).toHaveAttribute("aria-selected", "false");
  });

  test("Shift+click selects range of visible nodes", async ({ page }) => {
    const ai = page.getByRole("treeitem", { name: "AI / Machine learning" });
    const analytics = page.getByRole("treeitem", {
      name: "Analytics",
      exact: true,
    });
    const blockchain = page.getByRole("treeitem", { name: "Blockchain" });

    // Click AI first to set anchor
    await nodeLabel(page, "AI / Machine learning").click();

    // Analytics is expanded (expandedIds=[1]), so its children are visible.
    // Shift+click Blockchain to range-select visible nodes between AI and Blockchain.
    await nodeLabel(page, "Blockchain").click({ modifiers: ["Shift"] });

    await expect(ai).toHaveAttribute("aria-selected", "true");
    await expect(analytics).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Analytics Engine" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Cloud SQL Query" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Db2 Warehouse on Cloud" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(blockchain).toHaveAttribute("aria-selected", "true");
  });

  test("Shift+click skips collapsed children", async ({ page }) => {
    const ai = page.getByRole("treeitem", { name: "AI / Machine learning" });
    const analytics = page.getByRole("treeitem", {
      name: "Analytics",
      exact: true,
    });
    const databases = page.getByRole("treeitem", { name: "Databases" });

    // Collapse Analytics first via the toggle icon
    await analytics
      .locator("> .bx--tree-node__label .bx--tree-parent-node__toggle")
      .click();

    // Click AI to set anchor
    await nodeLabel(page, "AI / Machine learning").click();

    // Shift+click Databases - Analytics children should not be selected
    await nodeLabel(page, "Databases").click({ modifiers: ["Shift"] });

    await expect(ai).toHaveAttribute("aria-selected", "true");
    await expect(analytics).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "Blockchain" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(databases).toHaveAttribute("aria-selected", "true");

    // Collapsed children should NOT be selected
    const selectedIds = await page.getByTestId("selected-ids").textContent();
    expect(selectedIds).not.toContain(",2,"); // IBM Analytics Engine
    expect(selectedIds).not.toContain(",5,"); // IBM Cloud SQL Query
  });

  test("disabled nodes are skipped in range selection", async ({ page }) => {
    const databases = page.getByRole("treeitem", { name: "Databases" });
    const integration = page.getByRole("treeitem", { name: "Integration" });

    // Click Databases to set anchor
    await nodeLabel(page, "Databases").click();

    // Shift+click Integration (disabled) — use force since it's disabled
    await nodeLabel(page, "Integration").click({
      modifiers: ["Shift"],
      force: true,
    });

    // Databases should remain selected (it was the anchor)
    await expect(databases).toHaveAttribute("aria-selected", "true");

    // Integration is disabled, so aria-selected is not set
    await expect(integration).not.toHaveAttribute("aria-selected", "true");
  });

  test("clicking disabled node does not select it", async ({ page }) => {
    const integration = page.getByRole("treeitem", { name: "Integration" });
    await nodeLabel(page, "Integration").click({ force: true });

    // disabled nodes don't get aria-selected="true"
    await expect(integration).not.toHaveAttribute("aria-selected", "true");
  });

  test("Ctrl+click in shallow mode selects parent and direct children", async ({
    page,
  }) => {
    await page.getByTestId("set-shallow").click();

    const analytics = page.getByRole("treeitem", {
      name: "Analytics",
      exact: true,
    });

    // Plain click AI to clear, then Ctrl+click Analytics
    await nodeLabel(page, "AI / Machine learning").click();
    await nodeLabel(page, "Analytics", { exact: true }).click({
      modifiers: ["ControlOrMeta"],
    });

    // Analytics and its direct children should be selected
    await expect(analytics).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Analytics Engine" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Cloud SQL Query" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Db2 Warehouse on Cloud" }),
    ).toHaveAttribute("aria-selected", "true");

    // But NOT grandchildren (Apache Spark, Hadoop)
    const selectedIds = await page.getByTestId("selected-ids").textContent();
    expect(selectedIds).not.toContain(",3,"); // Apache Spark
    expect(selectedIds).not.toContain(",4,"); // Hadoop
  });

  test("Ctrl+click in deep mode selects parent and all descendants", async ({
    page,
  }) => {
    await page.getByTestId("set-deep").click();

    const analytics = page.getByRole("treeitem", {
      name: "Analytics",
      exact: true,
    });

    // Plain click to clear selection
    await nodeLabel(page, "AI / Machine learning").click();

    // Ctrl+click Analytics
    await nodeLabel(page, "Analytics", { exact: true }).click({
      modifiers: ["ControlOrMeta"],
    });

    // Analytics and visible descendants should be aria-selected
    await expect(analytics).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Analytics Engine" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Cloud SQL Query" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("treeitem", { name: "IBM Db2 Warehouse on Cloud" }),
    ).toHaveAttribute("aria-selected", "true");

    // Deep mode also selects non-visible descendants (Apache Spark=3, Hadoop=4)
    const selectedIdsText = await page
      .getByTestId("selected-ids")
      .textContent();
    expect(selectedIdsText).not.toBeNull();
    const ids = JSON.parse(selectedIdsText as string);
    expect(ids).toContain(3); // Apache Spark (not visible, parent collapsed)
    expect(ids).toContain(4); // Hadoop (not visible, parent collapsed)
  });

  test("plain click resets selection and sets new anchor", async ({ page }) => {
    const ai = page.getByRole("treeitem", { name: "AI / Machine learning" });
    const analytics = page.getByRole("treeitem", {
      name: "Analytics",
      exact: true,
    });
    const blockchain = page.getByRole("treeitem", { name: "Blockchain" });

    // Ctrl+click to build up multi-selection
    await nodeLabel(page, "AI / Machine learning").click();
    await nodeLabel(page, "Analytics", { exact: true }).click({
      modifiers: ["ControlOrMeta"],
    });

    await expect(ai).toHaveAttribute("aria-selected", "true");
    await expect(analytics).toHaveAttribute("aria-selected", "true");

    // Plain click on Blockchain resets everything
    await nodeLabel(page, "Blockchain").click();

    await expect(ai).toHaveAttribute("aria-selected", "false");
    await expect(analytics).toHaveAttribute("aria-selected", "false");
    await expect(blockchain).toHaveAttribute("aria-selected", "true");
  });
});
