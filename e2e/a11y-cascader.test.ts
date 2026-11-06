import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page, name: string) =>
  page.getByRole("combobox", { name, exact: true });

const item = (page: Page, name: string) =>
  page.getByRole("treeitem", { name, exact: true });

async function violations(page: Page) {
  // The menu can sit over later fields, so the whole page is checked.
  const results = await new AxeBuilder({ page }).include("#app").analyze();
  return results.violations;
}

async function openColumns(page: Page) {
  await field(page, "Location").click();
  await item(page, "Europe").click();
  await item(page, "France").click();
  await expect(item(page, "Paris")).toBeVisible();
}

test.describe("Cascader a11y", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cascader.html?latency=120");
    await expect(page.getByTestId("single-value")).toBeVisible();
    // A pointer resting over the menu would move the cursor.
    await page.mouse.move(1000, 10);
  });

  test("has no violations closed, with three columns open, or checked", async ({
    page,
  }) => {
    expect(await violations(page)).toEqual([]);

    await openColumns(page);
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    await field(page, "Locations").click();
    await item(page, "Europe").click();
    await item(page, "France").click();
    await item(page, "Paris").click();
    await expect(item(page, "France")).toHaveAttribute("aria-checked", "mixed");
    expect(await violations(page)).toEqual([]);
  });

  test("search results, a loading column and a failed one have no violations", async ({
    page,
  }) => {
    await field(page, "Find a city").click();
    await page.keyboard.type("par");
    await expect(page.getByRole("option")).toHaveCount(1);
    expect(await violations(page)).toEqual([]);
    await page.keyboard.press("Escape");

    const lazy = field(page, "Team");
    await lazy.click();
    await item(page, "Engineering").click();
    await expect(page.getByText("Loading...")).toBeVisible();
    expect(await violations(page)).toEqual([]);
    await expect(item(page, "Engineering team 1")).toBeVisible();
    await item(page, "Sales").click();
    await expect(page.getByText("Could not load Sales").first()).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("the drill-in column at 320px has no violations", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await field(page, "Automatic").click();
    await item(page, "Europe").click();
    await expect(page.getByRole("button", { name: /^Back/ })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });

  test("Gray 100 keeps the contrast of an open menu", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    await openColumns(page);
    expect(await violations(page)).toEqual([]);
  });
});

test.describe("Cascader right to left", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cascader.html?latency=120");
    await expect(page.getByTestId("single-value")).toBeVisible();
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await page.mouse.move(1000, 10);
  });

  test("columns run from the right, and Left opens the next one", async ({
    page,
  }) => {
    const single = field(page, "Location");
    await single.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(item(page, "Paris")).toBeVisible();

    const lefts = await page
      .getByRole("group")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().left),
      );
    expect(lefts).toHaveLength(3);
    expect(lefts[0]).toBeGreaterThan(lefts[1]);
    expect(lefts[1]).toBeGreaterThan(lefts[2]);

    await page.keyboard.press("ArrowRight");
    await expect
      .poll(async () => {
        const id = await single.getAttribute("aria-activedescendant");
        return id
          ? (await page.locator(`[id="${id}"]`).textContent())?.trim()
          : "";
      })
      .toBe("France");
    expect(await violations(page)).toEqual([]);
  });

  test("the chevron points toward the next column", async ({ page }) => {
    await field(page, "Location").click();
    const flips = await item(page, "Europe").evaluate((node) => {
      const svg = node.querySelector(".bx--cascader__chevron > svg");
      return svg ? getComputedStyle(svg).transform : "";
    });
    expect(flips).not.toBe("none");
  });
});

test.describe("Cascader forced colors", () => {
  test("the cursor row fills with Highlight and the open path has an edge", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/cascader.html?latency=120");
    await expect(page.getByTestId("single-value")).toBeVisible();
    await page.mouse.move(1000, 10);
    const single = field(page, "Location");
    await single.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(item(page, "France")).toHaveClass(/highlighted/);

    const system = await page.evaluate(() => {
      const probe = document.createElement("div");
      document.body.append(probe);
      const read = (property: string, value: string) => {
        probe.style.setProperty(property, value);
        const computed = getComputedStyle(probe).getPropertyValue(property);
        probe.style.removeProperty(property);
        return computed;
      };
      const result = {
        highlight: read("background-color", "Highlight"),
        highlightText: read("color", "HighlightText"),
      };
      probe.remove();
      return result;
    });

    // The row's fill runs a short transition, so wait for it to land.
    await expect
      .poll(() =>
        item(page, "France").evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
      )
      .toBe(system.highlight);
    const fill = await item(page, "France").evaluate((node) => {
      const chevron = node.querySelector(".bx--cascader__chevron > svg");
      return chevron ? getComputedStyle(chevron).fill : "";
    });
    expect(fill).toBe(system.highlightText);

    const europe = await item(page, "Europe").evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        width: style.borderInlineStartWidth,
        style: style.borderInlineStartStyle,
      };
    });
    expect(europe.style).toBe("solid");
    expect(Number.parseFloat(europe.width)).toBeGreaterThan(0);
  });
});
