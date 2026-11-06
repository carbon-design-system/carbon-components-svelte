import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const list = (page: Page) => page.getByRole("listbox", { name: /Datasets/ });
const options = (page: Page) => list(page).getByRole("option");
const chosen = (page: Page) =>
  page.getByRole("complementary", { name: /Selected/ });
const status = (page: Page) => page.locator("[data-announcer] [role=status]");

/** Open the cursor row's level and wait for its rows, as a person would. */
async function drill(page: Page, firstRow: string) {
  await page.keyboard.press("ArrowRight");
  await expect(options(page).first()).toContainText(firstRow);
}

async function open(page: Page, query = "") {
  await page.goto(`/add-select.html?${query}`);
  await expect(options(page).first()).toBeVisible();
}

test.describe("AddSelect over a 10,000 item catalog", () => {
  test("drills in through 3 levels by keyboard and chooses across levels", async ({
    page,
  }) => {
    await open(page);
    await expect(options(page)).toHaveCount(10);
    await list(page).focus();

    // Finance > Raw > the first datasets.
    await page.keyboard.press("ArrowRight");
    const crumbs = page.getByRole("navigation", { name: "Levels" });
    await expect(crumbs).toContainText("Finance");
    await expect(options(page).first()).toContainText("Raw");
    await page.keyboard.press("ArrowRight");
    await expect(crumbs).toContainText("Raw");
    await expect(options(page).first()).toContainText("Daily orders");

    // Choose two datasets, with a range.
    await page.keyboard.press("Space");
    await page.keyboard.press("Shift+ArrowDown");
    await expect(chosen(page).getByRole("listitem")).toHaveCount(2);
    await expect(chosen(page)).toContainText("Finance / Raw");

    // Back up two levels with Left Arrow; the cursor lands on the folder left.
    await page.keyboard.press("ArrowLeft");
    await expect(options(page).first()).toContainText("Raw");
    await page.keyboard.press("ArrowLeft");
    await expect(options(page).first()).toContainText("Finance");
    await expect(page.locator(".bx--add-select__option--active")).toContainText(
      "Finance",
    );

    // A choice in another domain.
    await page.keyboard.press("ArrowDown");
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await page.keyboard.press("Space");
    await expect(chosen(page).getByRole("listitem")).toHaveCount(3);
    await expect(status(page)).toContainText("3 selected");

    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByTestId("events")).toContainText("confirm");
    expect(
      JSON.parse((await page.getByTestId("value").textContent()) ?? "[]"),
    ).toHaveLength(3);
  });

  test("Left Arrow does nothing at the top, and Escape is left to the page", async ({
    page,
  }) => {
    await open(page);
    await list(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(options(page).first()).toContainText("Finance");
    const defaultPrevented = await page.evaluate(() => {
      const target = document.querySelector('[role="listbox"]');
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      target?.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(defaultPrevented).toBe(false);
  });

  test("a search across levels shows where each result lives and pages", async ({
    page,
  }) => {
    await open(page);
    // At the top level a search already covers the one level; open a level
    // to be offered the wider search.
    await list(page).focus();
    await drill(page, "Raw");
    await page.getByRole("searchbox").fill("daily orders");
    await page.getByRole("button", { name: "Search all levels" }).click();
    await expect(options(page).first()).toContainText(" / ");
    await expect(status(page)).toContainText("90 results");
    await expect(page.locator(".bx--add-select__count").first()).toHaveText(
      "40 of 90 items",
    );

    // End loads the next page as the cursor nears the end of what is loaded.
    await list(page).focus();
    await page.keyboard.press("End");
    await expect(page.locator(".bx--add-select__count").first()).toHaveText(
      "80 of 90 items",
    );
    await expect(page.locator(".bx--add-select__option--active")).toBeVisible();
  });

  test("windows both columns: thousands loaded and chosen mount a few rows", async ({
    page,
  }) => {
    await open(page, "data=items");
    await list(page).focus();
    await drill(page, "Raw");
    await page.getByRole("searchbox").fill("a");
    await page.getByRole("button", { name: "Search all levels" }).click();
    await expect(page.locator(".bx--add-select__count").first()).toContainText(
      "of 9,433",
    );
    await list(page).focus();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("End");
      await page.waitForTimeout(20);
    }
    await page.keyboard.press("Control+a");
    await expect(
      page.locator(".bx--add-select__selected .bx--add-select__count"),
    ).not.toHaveText("0");
    const mounted = await page.evaluate(() => ({
      options: document.querySelectorAll('[role="option"]').length,
      chosen: document.querySelectorAll(".bx--add-select__chosen-item").length,
    }));
    expect(mounted.options).toBeLessThan(40);
    expect(mounted.chosen).toBeLessThan(40);
  });

  test("a newer search replaces an older one that is still loading", async ({
    page,
  }) => {
    await open(page, "latency=400");
    const search = page.getByRole("searchbox");
    await search.pressSequentially("marketing", { delay: 30 });
    await search.fill("");
    await search.pressSequentially("sales", { delay: 30 });
    await expect(options(page)).toHaveCount(1);
    await expect(options(page).first()).toContainText("Sales");
    await expect(list(page)).not.toHaveAttribute("aria-busy", "true");
  });

  test("keeps the rows of the level just left from being chosen from", async ({
    page,
  }) => {
    await open(page, "latency=500");
    await list(page).focus();
    await page.keyboard.press("ArrowRight");
    // While the next level loads, no row of the top level may remain.
    await expect(options(page)).toHaveCount(0);
    await expect(options(page).first()).toContainText("Raw");
  });

  test("filters with chips and clears them", async ({ page }) => {
    await open(page, "data=items");
    await list(page).focus();
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await expect(options(page).first()).toContainText("Daily orders");
    await page.getByRole("button", { name: "View", exact: true }).click();
    await expect.poll(() => options(page).count()).toBeGreaterThan(0);
    for (const row of await options(page).all()) {
      await expect(row).toContainText("View");
    }
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(
      page.getByRole("button", { name: "Clear filters" }),
    ).toHaveCount(0);
  });

  test("searches 10,000 items in memory within a frame or two", async ({
    page,
  }) => {
    await open(page, "data=items");
    const search = page.getByRole("searchbox");
    await list(page).focus();
    await page.keyboard.press("ArrowRight");
    await search.fill("e");
    await page.getByRole("button", { name: "Search all levels" }).click();
    const elapsed = await page.evaluate(async () => {
      const input = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[role="searchbox"]',
      );
      if (!input) throw new Error("no search field");
      const start = performance.now();
      input.value = "orders weekly";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise<void>((resolve) => {
        const watch = () => {
          const count = document.querySelector(".bx--add-select__count");
          if (count?.textContent?.includes("of 90")) resolve();
          else requestAnimationFrame(watch);
        };
        // The debounce is 150 ms; measure what comes after it.
        setTimeout(watch, 150);
      });
      return performance.now() - start - 150;
    });
    expect(elapsed).toBeLessThan(250);
  });

  test("shows an error with a retry, and recovers on the next query", async ({
    page,
  }) => {
    await open(page, "fail=boom");
    await page.getByRole("searchbox").fill("boom");
    await expect(
      page.getByText("The items could not be loaded.").first(),
    ).toBeVisible();
    await expect(page.locator("[data-announcer] [role=alert]")).toContainText(
      "could not be loaded",
    );
    await page.getByRole("searchbox").fill("sales");
    await expect(options(page).first()).toContainText("Sales");
  });

  test("hosted in a SidePanel, Escape closes the panel", async ({ page }) => {
    await open(page, "shell=panel");
    await list(page).focus();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("AddSelect single", () => {
  test("replaces the choice and confirms one key", async ({ page }) => {
    await open(page, "multi=0");
    await expect(chosen(page)).toHaveCount(0);
    await list(page).focus();
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");
    await expect(
      page.locator('[role="option"][aria-selected="true"]'),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Add" }).click();
    expect(await page.getByTestId("confirmed").textContent()).toBe('"t0-0-1"');
  });
});

test.describe("AddSelect accessibility", () => {
  test("has no detectable violations idle, with a selection, loading and failing", async ({
    page,
  }) => {
    await open(page, "latency=300&fail=boom");
    const scan = async () =>
      (await new AxeBuilder({ page }).include("#app").analyze()).violations;
    expect(await scan()).toEqual([]);

    await list(page).focus();
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await page.keyboard.press("Space");
    await expect(chosen(page).getByRole("listitem")).toHaveCount(1);
    // The confirm button fades in; scan once it has settled.
    await expect(page.getByRole("button", { name: "Add" })).toHaveCSS(
      "background-color",
      "rgb(15, 98, 254)",
    );
    expect(await scan()).toEqual([]);

    await page.getByRole("searchbox").fill("sales");
    expect(await scan()).toEqual([]);
    await page.getByRole("searchbox").fill("boom");
    await expect(
      page.getByText("The items could not be loaded.").first(),
    ).toBeVisible();
    expect(await scan()).toEqual([]);
  });
});

test.describe("AddSelect themes", () => {
  test("RTL: Left Arrow opens a level, Right Arrow goes back, the chevron mirrors", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await list(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(options(page).first()).toContainText("Raw");
    await page.keyboard.press("ArrowRight");
    await expect(options(page).first()).toContainText("Finance");
    const transform = await page
      .locator(".bx--add-select__row-action--drill svg")
      .first()
      .evaluate((svg) => getComputedStyle(svg).transform);
    expect(transform).not.toBe("none");
  });

  test("a chosen row differs from an unchosen one in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);
    await list(page).focus();
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    const [on, off] = await page.evaluate(() => {
      const rows = [
        ...document.querySelectorAll<HTMLElement>('[role="option"]'),
      ];
      return [rows[0], rows[2]].map(
        (row) => getComputedStyle(row).backgroundColor,
      );
    });
    expect(on).not.toBe(off);
  });

  test("in Gray 100 a chosen row is distinct and text keeps contrast", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    await list(page).focus();
    await drill(page, "Raw");
    await drill(page, "Daily orders");
    await page.keyboard.press("Space");
    const results = await new AxeBuilder({ page })
      .include("#app")
      .withRules(["color-contrast"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
