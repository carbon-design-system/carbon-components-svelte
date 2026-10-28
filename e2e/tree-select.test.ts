import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function treeItemTexts(page: Page) {
  const texts = await page.getByRole("treeitem").allTextContents();
  return texts.map((text) => text.trim());
}

test.describe("TreeSelect", () => {
  test("a keyboard alone opens, walks, searches and selects", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    const field = page.getByRole("combobox", { name: "Single search" });
    await field.focus();

    await page.keyboard.type("ham");
    await expect(field).toHaveAttribute("aria-expanded", "true");
    await expect
      .poll(() => treeItemTexts(page))
      .toEqual(["Europe", "Germany", "Hamburg"]);

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(field).toHaveValue("Hamburg");
    await expect(field).toHaveAttribute("aria-expanded", "false");
    await expect(field).toBeFocused();
  });

  test("the highlight stays in view while the arrow keys walk a large tree", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    const field = page.getByRole("combobox", { name: "Big single" });
    await field.focus();
    await page.keyboard.press("ArrowDown");
    // biome-ignore lint/performance/noAwaitInLoops: each key waits for the window to follow
    for (let i = 0; i < 40; i++) await page.keyboard.press("ArrowDown");

    const active = await field.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    const row = page.locator(`[id="${active}"]`);
    await expect(row).toBeVisible();
    const inView = await row.evaluate((el) => {
      const menu = el.closest(".bx--list-box__menu");
      if (!menu) return false;
      const a = el.getBoundingClientRect();
      const b = menu.getBoundingClientRect();
      return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    });
    expect(inView).toBe(true);
    // 610 rows are showing; the menu mounts a window of them.
    expect(await page.getByRole("treeitem").count()).toBeLessThan(40);
  });

  test("a tree of 5,000 nodes checks a branch and searches within a frame budget", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    const field = page.getByRole("combobox", { name: "Big", exact: true });
    await field.click();
    await page.getByRole("treeitem", { name: "Group 0", exact: true }).click();
    await expect(page.getByTestId("big-count")).toHaveText("501");

    const ms = await page.evaluate(async () => {
      const input = document.querySelector<HTMLInputElement>(
        "[data-testid=big] input",
      );
      if (!input) throw new Error("no input");
      const start = performance.now();
      input.value = "Leaf 7.7.48";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return performance.now() - start;
    });
    expect(ms).toBeLessThan(250);
    await expect
      .poll(() => treeItemTexts(page))
      .toEqual(["Group 7", "Group 7.7", "Leaf 7.7.48"]);
  });

  test("a portalled menu in a Modal keeps focus in the field and Escape closes only the menu", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    await page.getByTestId("open-modal").click();
    const field = page.getByRole("combobox", { name: "In a modal" });
    await field.focus();
    await page.keyboard.press("ArrowDown");

    const tree = page.getByRole("tree");
    await expect(tree).toBeVisible();
    expect(
      await tree.evaluate((el) => !!el.closest("[data-floating-portal]")),
    ).toBe(true);
    await expect(field).toBeFocused();

    await page.keyboard.press("Space");
    await page.keyboard.press("Escape");
    await expect(tree).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(field).toBeFocused();
    await expect(field).toContainText("Europe");
  });

  test("a lazy node shows a spinner, loads its children, and keeps them", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    const field = page.getByRole("combobox", { name: "Lazy" });
    await field.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    const parent = page.getByRole("treeitem", {
      name: "Cloud accounts",
      exact: true,
    });
    await expect(parent).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("treeitem", { name: "Cloud accounts 2" }),
    ).toBeVisible();
    await expect(parent).not.toHaveAttribute("aria-busy");
  });
});
