import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const order = (page: Page) => page.getByTestId("order");
const log = (page: Page) => page.getByTestId("log");

async function center(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

/** Drag `handle` to the lower half of `target`, in steps. */
async function dragTo(
  page: Page,
  handle: Locator,
  target: Locator,
  where: "before" | "after" = "after",
) {
  const from = await center(handle);
  const to = await center(target);
  const y = where === "after" ? to.box.y + to.box.height * 0.75 : to.box.y + 2;
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 2, from.y + 10, { steps: 2 });
  await page.mouse.move(to.x, y, { steps: 8 });
}

test.describe("sortable keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortable.html");
  });

  test("moves an item and announces each step", async ({ page }) => {
    const handles = page.getByTestId("list").getByRole("button");
    const status = page.getByRole("status");

    await handles.first().focus();
    await page.keyboard.press("Space");
    await expect(status).toHaveText("Picked up Alpha, position 1 of 5.");
    await page.keyboard.press("ArrowDown");
    await expect(status).toHaveText("Alpha moved to position 2 of 5.");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");

    await expect(order(page)).toHaveText("Bravo,Charlie,Alpha,Delta,Echo");
    await expect(log(page)).toHaveText("alpha:->-:0>2:keyboard");
    await expect(status).toHaveText("Dropped Alpha at position 3 of 5.");
    await expect(handles.nth(2)).toBeFocused();
  });

  test("Escape puts the item back", async ({ page }) => {
    const handles = page.getByTestId("list").getByRole("button");

    await handles.nth(1).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("End");
    await page.keyboard.press("Escape");

    await expect(order(page)).toHaveText("Alpha,Bravo,Charlie,Delta,Echo");
    await expect(log(page)).toHaveText("");
    await expect(page.getByRole("status")).toHaveText(
      "Cancelled. Bravo is back at position 2 of 5.",
    );
    await expect(handles.nth(1)).toBeFocused();
  });

  test("Home and End jump, and the ends clamp", async ({ page }) => {
    const handles = page.getByTestId("list").getByRole("button");

    await handles.nth(2).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(order(page)).toHaveText("Alpha,Bravo,Delta,Echo,Charlie");

    await handles.nth(4).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("Home");
    await page.keyboard.press("Space");
    await expect(order(page)).toHaveText("Charlie,Alpha,Bravo,Delta,Echo");
  });

  test("the list is one tab stop and arrows move focus while idle", async ({
    page,
  }) => {
    const handles = page.getByTestId("list").getByRole("button");

    await expect(handles.nth(0)).toHaveAttribute("tabindex", "0");
    await expect(handles.nth(1)).toHaveAttribute("tabindex", "-1");
    await handles.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(handles.nth(1)).toBeFocused();
    await expect(handles.nth(1)).toHaveAttribute("tabindex", "0");
    await expect(handles.nth(0)).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("End");
    await expect(handles.nth(4)).toBeFocused();
  });

  test("the sort event can be canceled", async ({ page }) => {
    const handles = page.getByTestId("list").getByRole("button");
    await page.getByTestId("veto").check();

    await handles.first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");

    await expect(log(page)).toHaveText("alpha:->-:0>1:keyboard");
    await expect(order(page)).toHaveText("Alpha,Bravo,Charlie,Delta,Echo");
    await expect(page.getByRole("status")).toHaveText(
      "Cancelled. Alpha is back at position 1 of 5.",
    );
  });

  test("the item is the target when there is no handle", async ({ page }) => {
    const rows = page.getByTestId("items-list").getByRole("listitem");

    await rows.nth(2).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Space");

    await expect(order(page)).toHaveText("Alpha,Charlie,Bravo,Delta,Echo");
    await expect(rows.nth(1)).toBeFocused();
  });

  test("moves between connected lists with the cross-axis arrows", async ({
    page,
  }) => {
    const todo = page.getByTestId("column-todo").getByRole("button");
    const done = page.getByTestId("column-done").getByRole("button");

    await todo.nth(1).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toHaveText(
      "Review PR moved to done, position 2 of 2.",
    );
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    await expect(log(page)).toHaveText("t2:todo>empty:1>0");
    await expect(todo).toHaveCount(2);
    await expect(done).toHaveCount(1);
    await expect(
      page.getByTestId("column-empty").getByRole("button"),
    ).toBeFocused();
  });

  test("swaps the arrows of a horizontal list in RTL", async ({ page }) => {
    const tiles = page.getByTestId("tiles").getByRole("button");
    const tileOrder = page.getByTestId("tiles").getByRole("listitem");

    await tiles.first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(tileOrder.nth(1)).toContainText("One");

    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await tiles.nth(1).focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Space");
    await expect(tileOrder.nth(2)).toContainText("One");
  });
});

test.describe("sortable pointer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sortable.html");
  });

  test("drags a handle, shows the indicator, and drops", async ({ page }) => {
    const list = page.getByTestId("list");
    const items = list.getByRole("listitem");
    const indicator = page.locator(".bx--sortable__indicator");

    await dragTo(page, items.nth(0).getByRole("button"), items.nth(2));
    await expect(indicator).toBeVisible();
    await expect(page.locator(".bx--sortable__ghost")).toHaveText("Alpha");
    await expect(items.nth(0)).toHaveAttribute("data-sortable-lifted", "");
    const line = await indicator.boundingBox();
    const above = await items.nth(3).boundingBox();
    if (!line || !above) throw new Error("missing box");
    expect(Math.abs(line.y + 1 - above.y)).toBeLessThan(3);

    await page.mouse.up();
    await expect(order(page)).toHaveText("Bravo,Charlie,Alpha,Delta,Echo");
    await expect(log(page)).toHaveText("alpha:->-:0>2:pointer");
    await expect(indicator).toHaveCount(0);
    await expect(page.locator(".bx--sortable__ghost")).toHaveCount(0);
  });

  test("dropping where the item started does nothing", async ({ page }) => {
    const items = page.getByTestId("list").getByRole("listitem");

    await dragTo(page, items.nth(1).getByRole("button"), items.nth(1));
    await page.mouse.up();

    await expect(order(page)).toHaveText("Alpha,Bravo,Charlie,Delta,Echo");
    await expect(log(page)).toHaveText("");
  });

  test("a link inside an item still navigates", async ({ page }) => {
    await page.getByTestId("link-bravo").click();
    await expect(page.getByTestId("links")).toHaveText("1");
    await expect(page).toHaveURL(/#bravo$/);

    await page.getByTestId("whole-link-charlie").click();
    await expect(page.getByTestId("links")).toHaveText("2");
    await expect(page).toHaveURL(/#whole-charlie$/);
  });

  test("a drag that starts on a link in a handle-less item reorders", async ({
    page,
  }) => {
    const rows = page.getByTestId("items-list").getByRole("listitem");
    const from = await center(page.getByTestId("whole-link-alpha"));
    const to = await center(rows.nth(3));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y + 10, { steps: 10 });
    await page.mouse.up();

    await expect(order(page)).toHaveText("Bravo,Charlie,Delta,Alpha,Echo");
    await expect(page.getByTestId("links")).toHaveText("0");
    await expect(page).not.toHaveURL(/#whole-alpha/);
  });

  test("moves an item into an empty connected list", async ({ page }) => {
    const card = page.getByTestId("column-todo").getByRole("listitem").nth(0);
    const empty = page.getByTestId("column-empty");

    const from = await center(card.getByRole("button"));
    const to = await center(empty);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 4, from.y + 4, { steps: 2 });
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await expect(page.locator(".bx--sortable__indicator")).toBeVisible();
    await page.mouse.up();

    await expect(log(page)).toHaveText("t1:todo>empty:0>0");
    await expect(empty.getByRole("listitem")).toHaveCount(1);
  });

  test("Escape is not needed: releasing outside every list cancels", async ({
    page,
  }) => {
    const items = page.getByTestId("list").getByRole("listitem");
    const from = await center(items.nth(0).getByRole("button"));

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x + 600, from.y + 400, { steps: 8 });
    await expect(page.locator(".bx--sortable__indicator")).toBeHidden();
    await page.mouse.up();

    await expect(log(page)).toHaveText("");
  });
});

test.describe("sortable direction and touch", () => {
  test("drops in RTL on the side the pointer is on", async ({ page }) => {
    await page.goto("/sortable.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const tiles = page.getByTestId("tiles").getByRole("listitem");

    const one = await center(tiles.nth(0).getByRole("button"));
    const two = await center(tiles.nth(1));
    expect(two.x).toBeLessThan(one.x);
    await page.mouse.move(one.x, one.y);
    await page.mouse.down();
    await page.mouse.move(one.x - 4, one.y + 4, { steps: 2 });
    // Two's left half is the far side in RTL, so this drops after it.
    await page.mouse.move(two.box.x + 4, two.y, { steps: 8 });
    const indicator = await page
      .locator(".bx--sortable__indicator")
      .boundingBox();
    if (!indicator) throw new Error("missing indicator");
    expect(indicator.width).toBeLessThan(4);
    // Centered in the 8px gap between Two and Three.
    expect(Math.abs(indicator.x + 1 - (two.box.x - 4))).toBeLessThan(2);
    await page.mouse.up();

    await expect(tiles.nth(0)).toContainText("Two");
    await expect(tiles.nth(1)).toContainText("One");
  });

  test("drags from a handle by touch and scrolls from the item", async ({
    browser,
    browserName,
  }, testInfo) => {
    test.skip(browserName !== "chromium", "Touch is driven through CDP");
    const context = await browser.newContext({
      hasTouch: true,
      baseURL: testInfo.project.use.baseURL,
    });
    const page = await context.newPage();
    await page.goto("/sortable.html");
    const cdp = await context.newCDPSession(page);
    const touch = (type: string, x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });

    const items = page.getByTestId("list").getByRole("listitem");
    const from = await center(items.nth(0).getByRole("button"));
    const to = await center(items.nth(3));
    await touch("touchStart", from.x, from.y);
    for (let step = 1; step <= 12; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
      await touch(
        "touchMove",
        from.x + 2,
        from.y + ((to.y + 10 - from.y) * step) / 12,
      );
    }
    await expect(page.locator(".bx--sortable__ghost")).toBeVisible();
    await touch("touchEnd", from.x, from.y);
    await expect(order(page)).toHaveText("Bravo,Charlie,Delta,Alpha,Echo");

    const rows = page.getByTestId("items-list").getByRole("listitem");
    const row = await center(rows.nth(0));
    await touch("touchStart", row.x, row.y);
    for (let step = 1; step <= 8; step++)
      // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
      await touch("touchMove", row.x, row.y + step * 12);
    await touch("touchEnd", row.x, row.y);
    await expect(page.locator(".bx--sortable__ghost")).toHaveCount(0);
    await expect(order(page)).toHaveText("Bravo,Charlie,Delta,Alpha,Echo");
    await context.close();
  });
});

test.describe("sortable motion", () => {
  test("slides the moved items after a drop", async ({ page }) => {
    await page.goto("/sortable.html");
    const handles = page.getByTestId("list").getByRole("button");

    await handles.first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");

    await expect
      .poll(() => page.evaluate(() => document.getAnimations().length))
      .toBeGreaterThan(0);
  });

  test("skips the slide when reduced motion is preferred", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/sortable.html");
    const handles = page.getByTestId("list").getByRole("button");

    await handles.first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Space");

    await expect(order(page)).toHaveText("Bravo,Alpha,Charlie,Delta,Echo");
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe("sortable accessibility", () => {
  test("has no axe violations idle or lifted", async ({ page }) => {
    await page.goto("/sortable.html");
    const handles = page.getByTestId("list").getByRole("button");

    const idle = await new AxeBuilder({ page }).include("#app").analyze();
    expect(idle.violations).toEqual([]);

    await handles.first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    const lifted = await new AxeBuilder({ page }).include("#app").analyze();
    expect(lifted.violations).toEqual([]);
  });

  test("describes each handle", async ({ page }) => {
    await page.goto("/sortable.html");
    const handle = page.getByTestId("list").getByRole("button").first();

    await expect(handle).toHaveAttribute(
      "aria-roledescription",
      "sortable item",
    );
    await expect(handle).toHaveAccessibleName("Reorder Alpha");
    await expect(handle).toHaveAccessibleDescription(
      "Press Space to pick up. Use the arrow keys to move, Space to drop, and Escape to cancel.",
    );
  });

  test("keeps the drop indicator visible in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/sortable.html");
    const items = page.getByTestId("list").getByRole("listitem");

    await dragTo(page, items.nth(0).getByRole("button"), items.nth(2));
    const indicator = page.locator(".bx--sortable__indicator");
    await expect(indicator).toBeVisible();
    const color = await indicator.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const canvas = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Canvas";
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    });
    expect(color).not.toBe(canvas);
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
    await page.mouse.up();
  });
});
