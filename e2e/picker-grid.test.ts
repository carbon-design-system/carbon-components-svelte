import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

const grid = (page: Page, testId: string) => page.getByTestId(testId);
const listbox = (page: Page, testId: string) =>
  grid(page, testId).getByRole("listbox");
const search = (page: Page, testId = "basic") =>
  grid(page, testId).getByRole("combobox");

/** The label of the option the keyboard cursor is on. */
async function highlighted(page: Page, testId = "basic") {
  const id = await search(page, testId).getAttribute("aria-activedescendant");
  if (!id) return null;
  return page.locator(`[id="${id}"]`).getAttribute("aria-label");
}

/** Whether the option lies inside the scrolling grid, not just in the DOM. */
function insideList(option: Locator) {
  return option.evaluate((node) => {
    const cell = node.getBoundingClientRect();
    const list = node.closest("[role=listbox]")?.getBoundingClientRect();
    return !!list && cell.top >= list.top - 1 && cell.bottom <= list.bottom + 1;
  });
}

function columnsOf(list: Locator) {
  return list.evaluate((node) => {
    const row = node.querySelector(".bx--picker-grid__row");
    return row
      ? getComputedStyle(row).gridTemplateColumns.split(" ").length
      : 0;
  });
}

test.describe("PickerGrid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/picker-grid.html");
    await expect(listbox(page, "basic")).toBeVisible();
  });

  test("renders a window of 240 items, not all of them", async ({ page }) => {
    const options = listbox(page, "basic").getByRole("option");
    expect(await options.count()).toBeGreaterThan(8);
    expect(await options.count()).toBeLessThan(80);
    await expect(options.first()).toHaveAttribute("aria-setsize", "242");
    await expect(
      listbox(page, "basic").getByRole("group").first(),
    ).toHaveAccessibleName("Recent");
  });

  test("lists recents first, and groups the rest by category", async ({
    page,
  }) => {
    const groups = listbox(page, "basic").getByRole("group");
    await expect(groups.first()).toHaveAccessibleName("Recent");
    await expect(groups.first().getByRole("option")).toHaveCount(2);
    await expect(
      groups.first().getByRole("option").first(),
    ).toHaveAccessibleName("Plane 1");
    expect(await columnsOf(listbox(page, "basic"))).toBe(8);
  });

  test("keeps focus in the search field while the arrow keys move the cursor", async ({
    page,
  }) => {
    await search(page).focus();
    const first = await highlighted(page);
    await page.keyboard.press("ArrowRight");
    const second = await highlighted(page);
    expect(second).not.toBe(first);
    await page.keyboard.press("ArrowDown");
    await expect(search(page)).toBeFocused();
    expect(await highlighted(page)).not.toBe(second);
  });

  test("leaves the caret keys to the field until Down or Up engages the grid", async ({
    page,
  }) => {
    await search(page).fill("an");
    const before = await highlighted(page);
    await page.keyboard.press("ArrowLeft");
    expect(await highlighted(page)).toBe(before);
    await page.keyboard.press("ArrowDown");
    const down = await highlighted(page);
    await page.keyboard.press("ArrowRight");
    expect(await highlighted(page)).not.toBe(down);
  });

  test("Home and End go to the ends of the row, Ctrl to the ends of the grid", async ({
    page,
  }) => {
    await search(page).focus();
    await page.keyboard.press("End");
    const rowEnd = await highlighted(page);
    await page.keyboard.press("Home");
    const rowStart = await highlighted(page);
    expect(rowEnd).not.toBe(rowStart);
    await page.keyboard.press("Control+End");
    expect(await highlighted(page)).toMatch(/Tent 8|Phone 8|Ring 8|Lamp 8/);
    await expect(
      listbox(page, "basic").locator(".bx--picker-grid__cell--highlighted"),
    ).toBeVisible();
    await page.keyboard.press("Control+Home");
    expect(await highlighted(page)).toBe("Plane 1");
  });

  test("PageDown and PageUp move the cursor a page and keep it in view", async ({
    page,
  }) => {
    await search(page).focus();
    const list = listbox(page, "basic");
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageDown");
    expect(await list.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    const cell = list.locator(".bx--picker-grid__cell--highlighted");
    expect(await insideList(cell)).toBe(true);
    await page.keyboard.press("PageUp");
    await page.keyboard.press("PageUp");
    expect(await insideList(cell)).toBe(true);
    expect(await highlighted(page)).toBe("Plane 1");
  });

  test("Enter chooses the cursor's cell and makes it the newest recent", async ({
    page,
  }) => {
    await search(page).fill("train");
    await expect(listbox(page, "basic").getByRole("option")).toHaveCount(7);
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText("travel-5");
    await expect(page.getByTestId("recent")).toHaveText(/^travel-5,/);
    await expect(page.getByTestId("events")).toHaveText("travel-5");
  });

  test("searches by label and keywords, best match first, and announces the count", async ({
    page,
  }) => {
    await search(page).fill("apple 2");
    const options = listbox(page, "basic").getByRole("option");
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveAccessibleName("Apple 2");
    await expect(grid(page, "basic").getByRole("status")).toHaveText(
      "1 result",
    );
    await search(page).fill("zzz");
    await expect(
      grid(page, "basic").getByText("No results", { exact: true }).first(),
    ).toBeVisible();
    await expect(listbox(page, "basic")).toBeHidden();
  });

  test("opens scrolled to the chosen item", async ({ page }) => {
    const option = listbox(page, "chosen").getByRole("option", {
      name: "Key 7",
      selected: true,
    });
    await expect(option).toBeVisible();
    expect(await insideList(option)).toBe(true);
  });

  test("shows an empty state for no items", async ({ page }) => {
    await expect(
      grid(page, "empty").getByText("Nothing to choose from"),
    ).toBeVisible();
  });

  test("jumps to a category and follows the scroll", async ({ page }) => {
    const bar = grid(page, "basic").getByRole("toolbar", {
      name: "Categories",
    });
    await bar.getByRole("button", { name: "Travel" }).click();
    await expect(bar.getByRole("button", { name: "Travel" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(search(page)).toBeFocused();
    await expect(
      listbox(page, "basic").getByRole("group", { name: "Travel" }),
    ).toBeVisible();
    await listbox(page, "basic").evaluate((node) => {
      node.scrollTop = 0;
    });
    await expect(bar.getByRole("button", { name: "Recent" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("multiple selection toggles and keeps the order the user chose", async ({
    page,
  }) => {
    const options = listbox(page, "multi");
    await expect(options).toHaveAttribute("aria-multiselectable", "true");
    await expect(page.getByTestId("selected-ids")).toHaveText(
      "animals-1,travel-2",
    );
    await options.getByRole("option", { name: "Fox 1" }).click();
    await expect(page.getByTestId("selected-ids")).toHaveText(
      "animals-1,travel-2,animals-2",
    );
    await options.getByRole("option", { name: "Fox 1" }).click();
    await expect(page.getByTestId("selected-ids")).toHaveText(
      "animals-1,travel-2",
    );
  });

  test("a grid with no search is the tab stop, and typing jumps to a label", async ({
    page,
  }) => {
    const list = listbox(page, "plain");
    await list.focus();
    await page.keyboard.type("tram");
    const id = await list.getAttribute("aria-activedescendant");
    await expect(page.locator(`[id="${id}"]`)).toHaveAccessibleName("Tram 1");
    await page.keyboard.press(" ");
    await expect(list.getByRole("option", { selected: true })).toHaveCount(1);
  });

  test("fits its columns to its width", async ({ page }) => {
    expect(await columnsOf(listbox(page, "narrow"))).toBeLessThan(6);
    expect(await columnsOf(listbox(page, "narrow"))).toBeGreaterThan(2);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
    await search(page).fill("an");
    await page.keyboard.press("ArrowDown");
    const searching = await new AxeBuilder({ page }).include("#app").analyze();
    expect(searching.violations).toEqual([]);
  });
});

test.describe("PickerGrid right to left", () => {
  test("mirrors the grid and swaps the inline arrow keys", async ({ page }) => {
    await page.goto("/picker-grid.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const cells = listbox(page, "basic").getByRole("option");
    const [first, second] = await Promise.all([
      cells.nth(0).boundingBox(),
      cells.nth(1).boundingBox(),
    ]);
    expect(first && second && first.x > second.x).toBe(true);

    await search(page).focus();
    const start = await highlighted(page);
    // The field is empty, so the arrows move the cursor: Left goes forward.
    await page.keyboard.press("ArrowRight");
    expect(await highlighted(page)).toBe(start);
    await page.keyboard.press("ArrowLeft");
    expect(await highlighted(page)).not.toBe(start);
    await page.keyboard.press("ArrowRight");
    expect(await highlighted(page)).toBe(start);
  });

  test("swaps the arrows between the category buttons too", async ({
    page,
  }) => {
    await page.goto("/picker-grid.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const bar = grid(page, "basic").getByRole("toolbar");
    await bar.getByRole("button", { name: "Recent" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(bar.getByRole("button", { name: "Animals" })).toBeFocused();
  });
});

test.describe("PickerGrid themes and media", () => {
  test("has no accessibility violations on Gray 100", async ({ page }) => {
    await page.goto("/picker-grid.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await search(page).focus();
    await page.keyboard.press("ArrowDown");
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() =>
      document.documentElement.classList.remove("bx--g100"),
    );
  });

  test("keeps the chosen and the highlighted cells apart under forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/picker-grid.html");
    const list = listbox(page, "chosen");
    await search(page, "chosen").focus();
    await page.keyboard.press("ArrowLeft");
    const probe = (selector: string) =>
      list
        .locator(selector)
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor,
            color: style.color,
            outline: `${style.outlineStyle} ${style.outlineWidth}`,
            check: !!node.querySelector(".bx--picker-grid__check svg"),
            fill: node.querySelector("svg")
              ? getComputedStyle(
                  node.querySelector(".bx--picker-grid__check svg") as Element,
                ).fill
              : "",
          };
        });
    const chosen = await probe(".bx--picker-grid__cell--selected");
    const cursor = await probe(
      ".bx--picker-grid__cell--highlighted:not(.bx--picker-grid__cell--selected)",
    );
    expect(chosen.check).toBe(true);
    expect(chosen.outline).toMatch(/none|0px/);
    // The check mark reads against the Highlight fill.
    expect(chosen.fill).toBe(chosen.color);
    expect(cursor.check).toBe(false);
    expect(cursor.outline).toBe("solid 2px");
    expect(cursor.background).not.toBe(chosen.background);
    await expectSingleRing(list);
    await page.emulateMedia({ forcedColors: "none" });
  });

  test("starts no animation when the user prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/picker-grid.html");
    await search(page).focus();
    await page.keyboard.press("PageDown");
    await grid(page, "basic").getByRole("button", { name: "Travel" }).click();
    const animations = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const target = (animation.effect as KeyframeEffect | null)?.target;
          return target?.closest(".bx--picker-grid");
        }).length,
    );
    expect(animations).toBe(0);
    expect(
      await listbox(page, "basic").evaluate(
        (node) => getComputedStyle(node).scrollBehavior,
      ),
    ).toBe("auto");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("exposes each option by name, in named groups", async ({ page }) => {
    await page.goto("/picker-grid.html");
    const tree = await grid(page, "basic").ariaSnapshot();
    expect(tree).toContain('combobox "Search things"');
    expect(tree).toContain('toolbar "Categories"');
    expect(tree).toContain('listbox "Things"');
    expect(tree).toContain('group "Recent"');
    expect(tree).toContain('option "Plane 1"');
    expect(tree).not.toMatch(/\bimg\b/);
  });
});
