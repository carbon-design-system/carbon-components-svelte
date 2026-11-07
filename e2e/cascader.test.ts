import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page, name: string) =>
  page.getByRole("combobox", { name, exact: true });

const item = (page: Page, name: string) =>
  page.getByRole("treeitem", { name, exact: true });

async function activeText(page: Page, combobox: Locator) {
  const id = await combobox.getAttribute("aria-activedescendant");
  if (!id) return null;
  return (await page.locator(`[id="${id}"]`).textContent())?.trim();
}

test.describe("Cascader", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cascader.html?latency=120");
    await expect(page.getByTestId("single-value")).toBeVisible();
  });

  test("a keyboard alone opens, walks the columns and chooses a leaf", async ({
    page,
  }) => {
    const single = field(page, "Location");
    await single.focus();
    await page.keyboard.press("ArrowDown");
    await expect(single).toHaveAttribute("aria-expanded", "true");
    await expect.poll(() => activeText(page, single)).toBe("Europe");

    await page.keyboard.press("ArrowRight");
    await expect.poll(() => activeText(page, single)).toBe("France");
    await page.keyboard.press("ArrowDown");
    // Iceland is disabled, so the cursor stops on Germany.
    await expect.poll(() => activeText(page, single)).toBe("Germany");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => activeText(page, single)).toBe("Paris");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => activeText(page, single)).toBe("France");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(single).toHaveAttribute("aria-expanded", "false");
    await expect(single).toContainText("Europe / France / Lyon");
    await expect(page.getByTestId("single-value")).toHaveText(
      '["eu","fr","lyon"]',
    );
    await expect(single).toBeFocused();
  });

  test("the pointer opens a column per click and chooses a leaf", async ({
    page,
  }) => {
    const single = field(page, "Location");
    await single.click();
    await item(page, "North America").click();
    await expect(item(page, "United States")).toBeVisible();
    await item(page, "United States").click();
    await item(page, "San Francisco").click();

    await expect(single).toContainText(
      "North America / United States / San Francisco",
    );
    await expect(single).toHaveAttribute("aria-expanded", "false");
  });

  test("columns sit side by side, each named by its parent", async ({
    page,
  }) => {
    await field(page, "Location").click();
    await item(page, "Europe").click();
    await item(page, "France").click();

    const groups = page.getByRole("group");
    await expect(groups).toHaveCount(3);
    const boxes = await groups.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().left),
    );
    expect(boxes[0]).toBeLessThan(boxes[1]);
    expect(boxes[1]).toBeLessThan(boxes[2]);
    await expect(page.getByRole("group", { name: "France" })).toBeVisible();
  });

  test("Escape closes the menu and a click outside does too", async ({
    page,
  }) => {
    const single = field(page, "Location");
    await single.click();
    await expect(single).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(single).toHaveAttribute("aria-expanded", "false");

    await single.click();
    await page.getByTestId("lazy-value").click();
    await expect(single).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape in a modal closes the menu, not the modal", async ({ page }) => {
    await page.getByRole("button", { name: "Open modal" }).click();
    const inModal = field(page, "In a modal");
    await inModal.click();
    await expect(inModal).toHaveAttribute("aria-expanded", "true");
    await expect(item(page, "Europe")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(inModal).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("dialog", { name: "Pick" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Pick" })).toBeHidden();
  });

  test("changeOnSelect chooses a branch, and Right still opens it", async ({
    page,
  }) => {
    const any = field(page, "Any level");
    await any.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(any).toContainText("Europe");
    await expect(any).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => activeText(page, any)).toBe("France");
  });

  test("multiple mode checks leaves and shows a mixed parent", async ({
    page,
  }) => {
    const multi = field(page, "Locations");
    await multi.click();
    await item(page, "Europe").click();
    await item(page, "France").click();
    await item(page, "Paris").click();

    await expect(item(page, "France")).toHaveAttribute("aria-checked", "mixed");
    await expect(item(page, "Europe")).toHaveAttribute("aria-checked", "mixed");
    await expect(multi).toContainText("Europe / France / Paris");
    await expect(page.getByTestId("multi-value")).toHaveText(
      '[["eu","fr","paris"]]',
    );

    await item(page, "Lyon").click();
    await item(page, "Nice").click();
    await expect(item(page, "France")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("multi-value")).toHaveText('[["eu","fr"]]');
  });

  test("a search lists paths, marks the match and chooses with Enter", async ({
    page,
  }) => {
    const search = field(page, "Find a city");
    await search.click();
    await page.keyboard.type("par");

    const options = page.getByRole("option");
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText(/Europe \/ France \/ Paris/);
    await expect(
      options.first().locator("span.bx--highlight__mark"),
    ).toHaveText("Par");
    await page.keyboard.press("Enter");

    await expect(search).toHaveValue("Europe / France / Paris");
    await expect(search).toHaveAttribute("aria-expanded", "false");
  });

  test("lazy children load on open, with a loading column and a retry", async ({
    page,
  }) => {
    const lazy = field(page, "Team");
    await lazy.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tree")).toHaveAttribute("aria-busy", "true");
    await expect(page.getByText("Loading...")).toBeVisible();
    await expect(item(page, "Engineering team 1")).toBeVisible();
    await expect.poll(() => activeText(page, lazy)).toBe("Engineering team 1");
    await expect(page.getByRole("tree")).not.toHaveAttribute("aria-busy");

    // Sales fails: the column says so, and Right on the parent tries again.
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("Could not load Sales").first()).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("Loading...")).toBeVisible();
  });

  test("a failed load says so and loads again on a click", async ({ page }) => {
    const lazy = field(page, "Team");
    await lazy.click();
    await item(page, "Sales").click();
    await expect(page.getByText("Could not load Sales").first()).toBeVisible();

    await page.getByText("Try again").click();
    await expect(page.getByText("Loading...")).toBeVisible();
  });

  test("a narrow screen shows one column with a way back", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const auto = field(page, "Automatic");
    await auto.scrollIntoViewIfNeeded();
    await auto.click();
    await item(page, "Europe").click();

    const back = page.getByRole("button", { name: "Back to Automatic" });
    // The first column's header has no way back; the second column does.
    await expect(item(page, "France")).toBeVisible();
    await expect(item(page, "Europe")).toBeHidden();
    await expect(back).toBeVisible();
    const menu = page.locator(".bx--cascader__menu");
    const box = await menu.boundingBox();
    expect(box && box.width).toBeLessThanOrEqual(320);

    await back.click();
    await expect(item(page, "Europe")).toBeVisible();
    await expect(item(page, "France")).toBeHidden();
  });
});

test.describe("Cascader at scale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/cascader.html?latency=60");
    await expect(page.getByTestId("single-value")).toBeVisible();
  });

  test("4 levels of 50, loaded on demand, with the keyboard alone", async ({
    page,
  }) => {
    const wide = field(page, "Wide, lazy");
    await wide.focus();
    await page.keyboard.press("ArrowDown");
    for (let level = 2; level <= 4; level++) {
      await page.keyboard.press("ArrowRight");
      await expect(item(page, `Level ${level} item 0`)).toBeVisible();
    }
    // A column of 50: End, PageUp and typeahead stay inside it.
    await page.keyboard.press("End");
    await expect.poll(() => activeText(page, wide)).toBe("Level 4 item 49");
    await page.keyboard.press("PageUp");
    await expect.poll(() => activeText(page, wide)).toBe("Level 4 item 39");
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");

    await expect(wide).toContainText(
      "Level 1 item 0 / Level 2 item 0 / Level 3 item 0 / Level 4 item 0",
    );
    await expect(page.getByRole("tree")).toHaveCount(0);
  });

  test("a column of 50 mounts 50 items, and four columns 200", async ({
    page,
  }) => {
    const wide = field(page, "Wide, lazy");
    await wide.focus();
    await page.keyboard.press("ArrowDown");
    for (let level = 2; level <= 4; level++) {
      await page.keyboard.press("ArrowRight");
      await item(page, `Level ${level} item 0`).waitFor();
    }

    expect(await page.getByRole("treeitem").count()).toBe(200);
    const moves = await page.evaluate(async () => {
      const samples: number[] = [];
      for (let i = 0; i < 30; i++) {
        const start = performance.now();
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
            cancelable: true,
          }),
        );
        await new Promise((resolve) => requestAnimationFrame(resolve));
        samples.push(performance.now() - start);
      }
      return samples.sort((a, b) => a - b)[Math.floor(samples.length * 0.9)];
    });
    expect(moves).toBeLessThan(50);
  });

  test("125,000 items in memory: a search and a branch check stay quick", async ({
    page,
  }) => {
    const big = field(page, "Big, in memory");
    await big.click();
    await page.keyboard.type("item 49.49.49");
    await expect(page.getByRole("option")).toHaveCount(1);

    const multi = field(page, "Big, in memory, many");
    // A pointer resting over the opening menu would move the cursor.
    await page.mouse.move(0, 0);
    await multi.focus();
    await page.keyboard.press("ArrowDown");
    const elapsed = await page.evaluate(async () => {
      const start = performance.now();
      document.activeElement?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          cancelable: true,
        }),
      );
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return performance.now() - start;
    });
    // Checking a group checks 2,550 nodes, and walks the 125,000.
    expect(elapsed).toBeLessThan(400);
    await expect(multi).toContainText("Group 0");
    await expect(item(page, "Group 0")).toHaveAttribute("aria-checked", "true");
  });
});
