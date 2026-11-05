import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const status = (page: Page) =>
  page.locator("[role=status][aria-live=assertive]");

const texts = (locator: Locator) =>
  locator.evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim()),
  );

async function at(locator: Locator, fx = 0.5, fy = 0.5) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return { x: box.x + box.width * fx, y: box.y + box.height * fy };
}

/** Items slide for 150 ms after a drop, which moves what a drag aims at. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );

/**
 * Press `from`, cross the threshold, and move to a spot on `to`, without
 * releasing. The target is read after the scroll, so it is where it appears.
 */
async function dragTo(
  page: Page,
  from: Locator,
  to: Locator,
  fx = 0.5,
  fy = 0.5,
) {
  await from.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await settled(page);
  const start = await at(from);
  const point = await at(to, fx, fy);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 3, start.y + 8, { steps: 2 });
  await page.mouse.move(point.x, point.y, { steps: 10 });
}

test.describe("tree", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  const tree = (page: Page) => page.getByTestId("tree");
  const row = (page: Page, name: string) =>
    tree(page).getByRole("treeitem", { name, exact: false });
  const grip = (page: Page, name: string) =>
    tree(page).getByRole("button", { name: `Move ${name}` });
  const label = (page: Page, text: string) =>
    tree(page).locator(".bx--tree-node__label", { hasText: text }).first();
  /** The text of each rendered row, with its depth. */
  const outline = (page: Page) =>
    tree(page)
      .locator("[role=treeitem]")
      .evaluateAll((items) =>
        items.map((item) => {
          const own = item.querySelector(":scope > .bx--tree-node__label");
          const copy = (own ?? item).cloneNode(true) as HTMLElement;
          for (const button of copy.querySelectorAll("button")) button.remove();
          const text = copy.textContent?.replace(/\s+/g, " ").trim();
          return `${item.getAttribute("aria-level")}:${text}`;
        }),
      );

  test("drops a row inside another and says so", async ({ page }) => {
    const databases = label(page, "Databases");
    await dragTo(page, grip(page, "Blockchain"), databases);

    await expect(databases).toHaveAttribute("data-dnd-over", "");
    await expect(page.locator(".bx--dnd__indicator")).toBeHidden();
    await page.mouse.up();

    await expect.poll(() => outline(page)).toContain("2:Databases for MongoDB");
    expect((await outline(page)).slice(-2)).toEqual([
      "2:Databases for MongoDB",
      "2:Blockchain",
    ]);
    await expect(status(page)).toHaveText(
      "Dropped Blockchain inside Databases.",
    );
  });

  test("draws a line before a row and drops there", async ({ page }) => {
    const spark = label(page, "Apache Spark");
    await dragTo(page, grip(page, "Blockchain"), spark, 0.5, 0.1);

    const indicator = page.locator(".bx--dnd__indicator");
    await expect(indicator).toBeVisible();
    const line = await indicator.boundingBox();
    const target = await spark.boundingBox();
    expect(Math.abs((line?.y ?? 0) - (target?.y ?? 0))).toBeLessThan(3);
    await page.mouse.up();

    expect((await outline(page)).slice(0, 4)).toEqual([
      "1:AI / Machine learning",
      "1:Analytics",
      "2:Blockchain",
      "2:Apache Spark",
    ]);
  });

  test("refuses a drop inside the row's own subtree", async ({ page }) => {
    const before = await outline(page);
    await dragTo(
      page,
      grip(page, "Analytics"),
      label(page, "IBM Cloud SQL Query"),
    );

    await expect(page.locator(".bx--dnd__indicator")).toBeHidden();
    await expect(page.locator("[data-dnd-over]")).toHaveCount(0);
    await page.mouse.up();

    expect(await outline(page)).toEqual(before);
  });

  test("a click on a row still selects it", async ({ page }) => {
    await label(page, "Blockchain").click();
    await expect(row(page, "Blockchain").first()).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("moves by keyboard from a focused row with Alt+M", async ({ page }) => {
    const blockchain = tree(page).locator("[data-tree-row-id=blockchain]");
    await blockchain.focus();
    await page.keyboard.press("Alt+KeyM");
    await expect(status(page)).toHaveText("Picked up Blockchain.");

    // After Databases' last child, then inside it.
    await page.keyboard.press("ArrowUp");
    await expect(status(page)).toHaveText("Blockchain moved after Databases.");
    await page.keyboard.press("ArrowUp");
    await expect(status(page)).toHaveText(
      "Blockchain moved after Databases for MongoDB.",
    );
    await page.keyboard.press("Space");
    await expect(status(page)).toContainText(
      "Dropped Blockchain after Databases for MongoDB.",
    );
    expect((await outline(page)).slice(-2)).toEqual([
      "2:Databases for MongoDB",
      "2:Blockchain",
    ]);
    // Focus follows the moved row.
    await expect(
      tree(page).locator("[data-tree-row-id=blockchain]"),
    ).toBeFocused();
  });

  test("a handle lifts with Space and Escape puts the row back", async ({
    page,
  }) => {
    const before = await outline(page);
    const handle = tree(page).getByRole("button", { name: "Move Blockchain" });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Escape");

    await expect(status(page)).toHaveText(
      "Cancelled. Blockchain is back in its place.",
    );
    expect(await outline(page)).toEqual(before);
  });

  test("has no axe violations idle or lifted", async ({ page }) => {
    const scan = () =>
      new AxeBuilder({ page })
        .include('[data-testid="tree"]')
        .disableRules(["color-contrast"])
        .analyze();
    expect((await scan()).violations).toEqual([]);
    const handle = tree(page).getByRole("button", { name: "Move Blockchain" });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowUp");
    expect((await scan()).violations).toEqual([]);
  });
});

test.describe("tree direction, touch and forced colors", () => {
  const tree = (page: Page) => page.getByTestId("tree");
  const grip = (page: Page, name: string) =>
    tree(page).getByRole("button", { name: `Move ${name}` });
  const label = (page: Page, text: string) =>
    tree(page).locator(".bx--tree-node__label", { hasText: text }).first();

  test("draws the line across the row in right-to-left", async ({ page }) => {
    await page.goto("/dnd.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const spark = label(page, "Apache Spark");
    await dragTo(page, grip(page, "Blockchain"), spark, 0.5, 0.1);

    const line = await page.locator(".bx--dnd__indicator").boundingBox();
    const row = await spark.boundingBox();
    expect(line?.x).toBeCloseTo(row?.x ?? 0, 0);
    expect(line?.width).toBeCloseTo(row?.width ?? 0, 0);
    await page.mouse.up();
  });

  test("keeps the inside target and the line visible in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/dnd.html");
    const databases = label(page, "Databases");
    await dragTo(page, grip(page, "Blockchain"), databases);

    const outline = await databases.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.outlineStyle, style.outlineWidth];
    });
    expect(outline).toEqual(["solid", "2px"]);

    await page.mouse.move(
      (await at(databases)).x,
      (await databases.boundingBox())!.y + 1,
      { steps: 3 },
    );
    const indicator = page.locator(".bx--dnd__indicator");
    await expect(indicator).toBeVisible();
    const color = await indicator.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
    await page.mouse.up();
  });

  test("drags a handle by touch", async ({ browser }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Touch is driven through CDP",
    );
    const context = await browser.newContext({
      hasTouch: true,
      baseURL: testInfo.project.use.baseURL,
    });
    const page = await context.newPage();
    await page.goto("/dnd.html");
    const cdp = await context.newCDPSession(page);
    const touch = (type: string, x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });

    const handle = grip(page, "Blockchain");
    await handle.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const from = await at(handle);
    const to = await at(label(page, "Databases"));
    await touch("touchStart", from.x, from.y);
    for (let step = 1; step <= 12; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
      await touch(
        "touchMove",
        from.x + 2,
        from.y + ((to.y - from.y) * step) / 12,
      );
    }
    await expect(page.locator(".bx--dnd__ghost")).toBeVisible();
    await touch("touchEnd", from.x, from.y);
    await expect(status(page)).toContainText("Dropped Blockchain");
    await context.close();
  });
});

test.describe("connected lists as a board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  const column = (page: Page, name: string) =>
    page
      .getByTestId("board")
      .getByText(name, { exact: true })
      .locator("xpath=following-sibling::div[1]");
  const cards = (page: Page, name: string) =>
    texts(column(page, name).getByRole("link"));

  test("drags a card into an empty column", async ({ page }) => {
    const grip = page.getByRole("button", { name: "Move Rotate API keys" });
    await dragTo(page, grip, column(page, "Done"));
    await expect(page.locator(".bx--dnd__indicator")).toBeVisible();
    await page.mouse.up();

    expect(await cards(page, "Done")).toEqual(["Rotate API keys"]);
    expect(await cards(page, "In progress")).toEqual([]);
    await expect(status(page)).toContainText("Dropped Rotate API keys at Done");
  });

  test("a click on a link in a card still works", async ({ page }) => {
    await page
      .getByTestId("board")
      .getByRole("link", { name: "Export the audit log" })
      .click();
    await expect(page).toHaveURL(/#audit$/);
  });

  test("moves a card to the next column with the arrow keys", async ({
    page,
  }) => {
    const handle = page.getByRole("button", { name: "Move Enforce MFA" });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await expect(status(page)).toContainText(
      "moved to In progress, position 1 of 2",
    );
    await page.keyboard.press("ArrowRight");
    await expect(status(page)).toContainText("moved to Done, position 1 of 1");
    await page.keyboard.press("Space");

    expect(await cards(page, "Done")).toEqual(["Enforce MFA for admins"]);
  });
});

test.describe("wrapping grid", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  const order = (page: Page) =>
    texts(page.getByTestId("grid").locator(".bx--tile"));

  test("drops a tile on another row and column", async ({ page }) => {
    const tiles = page.getByTestId("grid").locator(".bx--tile");
    // The first tile to the left half of the fifth, on the second row.
    await dragTo(page, tiles.nth(0), tiles.nth(4), 0.2, 0.5);
    await expect(page.locator(".bx--dnd__indicator")).toBeVisible();
    await page.mouse.up();

    const list = await order(page);
    expect(list.indexOf("Overview")).toBe(3);
  });

  test("the arrow keys move along both axes of the wrap", async ({ page }) => {
    const first = page.getByTestId("grid").locator(".bx--tile").first();
    await first.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowDown");
    await expect(status(page)).toContainText("position 4 of 9");
    await page.keyboard.press("ArrowRight");
    await expect(status(page)).toContainText("position 5 of 9");
    await page.keyboard.press("ArrowUp");
    await expect(status(page)).toContainText("position 2 of 9");
    await page.keyboard.press("Space");

    expect((await order(page)).indexOf("Overview")).toBe(1);
  });
});

test.describe("neighbors step aside", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  const items = (page: Page) =>
    page.getByTestId("gap").locator(".bx--contained-list-item");

  test("shifts the items between the old and new place, and draws no line", async ({
    page,
  }) => {
    const rows = items(page);
    await rows.nth(0).evaluate((el) => el.scrollIntoView({ block: "center" }));
    const home = await rows.nth(2).boundingBox();
    await dragTo(page, rows.nth(0), rows.nth(2), 0.5, 0.8);

    await expect(page.locator(".bx--dnd__indicator")).toBeHidden();
    // Items 2 and 3 step up; the lifted item's outline moves to the new place.
    await expect(page.locator("[data-dnd-shifted]")).toHaveCount(3);
    await settled(page);
    const moved = await rows.nth(0).boundingBox();
    expect(Math.abs((moved?.y ?? 0) - (home?.y ?? 0))).toBeLessThan(2);
    await page.mouse.up();

    expect(await texts(rows)).toEqual([
      "Unit tests",
      "Build",
      "Lint",
      "Security scan",
      "Deploy",
    ]);
    await expect(page.locator("[data-dnd-shifted]")).toHaveCount(0);
  });

  test("works along a row, and swaps with the direction", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const tags = page.getByTestId("gap").locator(".bx--tag");
    const first = tags.first();
    await first.focus();
    await page.keyboard.press("Space");
    // In RTL the left arrow points to the inline end.
    await page.keyboard.press("ArrowLeft");
    await expect(status(page)).toContainText("position 2 of 4");
    await page.keyboard.press("Space");

    expect((await texts(tags))[1]).toBe("Open");
  });

  test("does not animate under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const rows = items(page);
    await dragTo(page, rows.nth(0), rows.nth(2), 0.5, 0.8);
    const duration = await page
      .locator("[data-dnd-shifted]")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe("0s");
    await page.mouse.up();
  });
});

test.describe("neighbors step aside in a long list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  test("shifts every row between the two places, then lands cleanly", async ({
    page,
  }) => {
    const list = page.getByTestId("many").locator("ul");
    await list.locator("li").first().focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("End");

    await expect(status(page)).toContainText("position 300 of 300");
    // 299 rows step up, and the lifted row's outline moves to the end.
    await expect(page.locator("[data-dnd-shifted]")).toHaveCount(300);
    await page.keyboard.press("Space");
    await expect(page.locator("[data-dnd-shifted]")).toHaveCount(0);

    const last = list.locator("li").last();
    await expect(last).toHaveText("Many 1");
    await expect(list.locator("li").first()).toHaveText("Many 2");
    await expect(last).toBeFocused();
  });
});

for (const theme of ["white", "g100"]) {
  test.describe(`axe on ${theme}`, () => {
    test("board, grid and neighbors have no violations, idle or lifted", async ({
      page,
    }) => {
      await page.goto("/dnd.html");
      if (theme === "g100")
        await page.evaluate(() => {
          document.documentElement.classList.add("bx--g100");
        });
      const scan = async (testid: string) =>
        (
          await new AxeBuilder({ page })
            .include(`[data-testid="${testid}"]`)
            .analyze()
        ).violations;

      for (const testid of ["tree", "board", "grid", "gap"])
        expect(await scan(testid), `${testid} idle`).toEqual([]);

      const handle = page.getByRole("button", { name: "Move Enforce MFA" });
      await handle.focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowRight");
      expect(await scan("board"), "board lifted").toEqual([]);
      await page.keyboard.press("Escape");

      const tile = page.getByTestId("grid").locator(".bx--tile").first();
      await tile.focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      expect(await scan("grid"), "grid lifted").toEqual([]);
      await page.keyboard.press("Escape");

      const row = page
        .getByTestId("gap")
        .locator(".bx--contained-list-item")
        .first();
      await row.focus();
      await page.keyboard.press("Space");
      await page.keyboard.press("ArrowDown");
      expect(await scan("gap"), "gap lifted").toEqual([]);
      await page.keyboard.press("Escape");
    });
  });
}

test.describe("nested scroll containers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dnd.html");
  });

  test("scrolls the inner box first, then the outer one", async ({ page }) => {
    const inner = page.getByTestId("inner");
    const outer = page.getByTestId("outer");
    await outer.evaluate((el) => el.scrollTo(0, 0));
    await inner.scrollIntoViewIfNeeded();
    const first = inner.locator("li").first();
    const start = await at(first);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 3, start.y + 8, { steps: 2 });

    // Park the pointer at the bottom edge of the outer box, below the inner
    // one: both boxes press against it, and the inner is the nearer.
    const box = await outer.boundingBox();
    if (!box) throw new Error("missing box");
    await page.mouse.move(start.x, box.y + box.height - 6, { steps: 6 });

    await expect
      .poll(() => inner.evaluate((el) => el.scrollTop), { timeout: 5000 })
      .toBeGreaterThan(100);
    // The outer box waits while the inner one has room.
    const innerRoom = await inner.evaluate(
      (el) => el.scrollHeight - el.clientHeight - el.scrollTop,
    );
    if (innerRoom > 200) {
      expect(await outer.evaluate((el) => el.scrollTop)).toBe(0);
    }
    await expect
      .poll(
        () =>
          inner.evaluate(
            (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1,
          ),
        { timeout: 8000 },
      )
      .toBe(true);
    // Then the inner box has run out and the outer one takes over.
    await expect
      .poll(() => outer.evaluate((el) => el.scrollTop), { timeout: 8000 })
      .toBeGreaterThan(100);
    await page.mouse.up();
  });
});
