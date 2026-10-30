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

  test("a click on the highlighted first row's expander expands it", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    const field = page.getByRole("combobox", { name: "Lazy" });
    await field.click();
    // A collapsed first row: an expanded one's rotated chevron paints
    // above the highlight ring and hides the problem.
    const cloud = page.getByRole("treeitem", {
      name: "Cloud accounts",
      exact: true,
    });
    const toggle = cloud.locator(".bx--tree-select__toggle");
    await toggle.hover();
    await expect(cloud).toHaveClass(/bx--list-box__menu-item--highlighted/);

    const box = await toggle.boundingBox();
    if (!box) throw new Error("no expander");
    expect(box.width).toBe(24);
    expect(box.height).toBe(24);

    // A plain mouse press, so nothing retries until the row lets it through.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(cloud).toHaveAttribute("aria-expanded", "true");
    await expect(field).toHaveAttribute("aria-expanded", "true");
    await expect(field).not.toContainText("Cloud accounts");
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
    // The spinner is a ring: the expander's icon fill must not reach it.
    const fills = await parent
      .locator(".bx--loading circle")
      .evaluateAll((circles) =>
        circles.map((circle) => getComputedStyle(circle).fill),
      );
    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) expect(fill).toBe("rgba(0, 0, 0, 0)");
    await expect(
      page.getByRole("treeitem", { name: "Cloud accounts 2" }),
    ).toBeVisible();
    await expect(parent).not.toHaveAttribute("aria-busy");
  });
});

test.describe("TreeSelect states", () => {
  test("a search field's status icon sits clear of its clear button", async ({
    page,
  }) => {
    await page.goto("/tree-select-states.html");
    for (const state of ["invalid", "warn"]) {
      const scope = page.getByTestId(`search-${state}`);
      // biome-ignore lint/performance/noAwaitInLoops: two reads per state
      const icon = await scope
        .locator(".bx--list-box__invalid-icon")
        .boundingBox();
      const clear = await scope
        .locator(".bx--list-box__selection")
        .boundingBox();
      if (!(icon && clear)) throw new Error(`${state}: missing icon`);
      expect
        .soft(icon.x + icon.width, state)
        .toBeLessThanOrEqual(clear.x + 0.5);
    }
  });
});

test.describe("TreeSelect rows", () => {
  test("a checkbox row centers its checkbox on the expander", async ({
    page,
  }) => {
    await page.goto("/tree-select.html");
    await page.getByRole("combobox", { name: "Multi", exact: true }).click();
    const row = page.getByRole("treeitem", { name: "Europe", exact: true });
    const centers = await row.evaluate((el) => {
      const center = (selector: string) => {
        const box = el.querySelector(selector)?.getBoundingClientRect();
        return box ? box.top + box.height / 2 : Number.NaN;
      };
      return {
        checkbox: center(".bx--checkbox-label"),
        expander: center(".bx--tree-select__toggle > svg"),
      };
    });
    expect(Math.abs(centers.checkbox - centers.expander)).toBeLessThanOrEqual(
      0.5,
    );
  });
});
