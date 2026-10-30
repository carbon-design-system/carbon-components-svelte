import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import { expect, test } from "./helpers/host";

const text = async (page: Page, testId: string) =>
  (await page.getByTestId(testId).textContent()) ?? "";
const order = (page: Page) => text(page, "order");
const boxOf = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("missing box");
  return box;
};
const handle = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: /./ });

test.describe("Kanban keyboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kanban.html");
  });

  test("moves a card across columns with the keyboard alone", async ({
    page,
  }) => {
    // The board is one tab stop, after the checkbox.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(handle(page, "Design the login page")).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(handle(page, "Write the API spec")).toBeFocused();

    await page.keyboard.press("Space");
    await expect(page.getByRole("status")).toContainText(
      "Write the API spec picked up. Position 2 of 3 in To do",
    );
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("status")).toContainText(
      "In progress, position 2 of 2",
    );
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("status")).toContainText("position 1 of 2");
    // Nothing moves until the drop.
    expect(await order(page)).toBe("todo:a,b,c | doing:d | review:e | done:f");

    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText(
      "Write the API spec dropped. Position 1 of 2 in In progress",
    );
    expect(await order(page)).toBe("todo:a,c | doing:b,d | review:e | done:f");
    // The card is a new element in a new column, and still has focus.
    await expect(handle(page, "Write the API spec")).toBeFocused();
    expect(JSON.parse(await text(page, "moves"))).toEqual([
      {
        id: "b",
        from: "todo",
        to: "doing",
        index: 0,
        fromIndex: 1,
        source: "keyboard",
      },
    ]);
  });

  test("a truncated tag adds no tab stop to its card", async ({ page }) => {
    await page.goto("/kanban.html?long");
    await expect(
      page.locator('[data-kanban-item="g"] .bx--tag__label-tooltip'),
    ).toHaveCount(1);
    await page.getByTestId("cancel").focus();
    const stops: string[] = [];
    for (let step = 0; step < 5; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: each Tab depends on the last
      await page.keyboard.press("Tab");
      const stop = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el?.closest("[data-testid=board]")) return null;
        return el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "";
      });
      if (stop === null) break;
      stops.push(stop);
    }
    // The current card's grip only. Its menu opens with Shift+F10.
    expect(stops).toEqual(["Design the login page"]);
  });

  test("Escape puts the card back", async ({ page }) => {
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("status")).toContainText("Move cancelled");
    expect(await order(page)).toBe("todo:a,b,c | doing:d | review:e | done:f");
    await expect(page.getByTestId("moves")).toHaveText("[]");
    await expect(handle(page, "Set up CI")).toBeFocused();
  });

  test("swaps ArrowLeft and ArrowRight in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Space");
    expect(await order(page)).toBe("todo:a,b | doing:d,c | review:e | done:f");
  });

  async function moveLeft(page: Page, name: string, columns: number) {
    await handle(page, name).focus();
    await page.keyboard.press("Space");
    for (let i = 0; i < columns; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: key presses are ordered
      await page.keyboard.press("ArrowLeft");
    }
    await page.keyboard.press("Space");
  }

  test("lets a column pass its limit in warn mode and says so", async ({
    page,
  }) => {
    await moveLeft(page, "Ship the changelog", 2);
    await moveLeft(page, "Fix the focus ring", 1);
    await expect(status(page)).toContainText(
      "In progress is over its limit: 3 of 2",
    );
    await expect(page.getByText("3 / 2")).toBeVisible();
    expect(await order(page)).toBe(
      "todo:a,b,c | doing:e,f,d | review: | done:",
    );
  });

  test("keeps a card out of a full column in block mode", async ({ page }) => {
    await page.goto("/kanban.html?limitMode=block");
    await moveLeft(page, "Ship the changelog", 2);
    await handle(page, "Fix the focus ring").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowLeft");
    await expect(status(page)).toContainText(
      "In progress is full. Its limit is 2.",
    );
    await page.keyboard.press("Space");
    expect(await order(page)).toBe("todo:a,b,c | doing:f,d | review:e | done:");
    // The menu offers no way in either.
    await handle(page, "Fix the focus ring").focus();
    await page.keyboard.press("Shift+F10");
    await expect(
      page.getByRole("menuitem", { name: "Move to In progress" }),
    ).toBeDisabled();
  });

  test("a cancelled move event leaves the board alone", async ({ page }) => {
    await page.getByTestId("cancel").check();
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    expect(await order(page)).toBe("todo:a,b,c | doing:d | review:e | done:f");
    await expect(page.getByTestId("moves")).toContainText('"id":"c"');
    await expect(page.getByRole("status")).toContainText("Move cancelled");
  });

  test("moves a card from its menu without dragging", async ({ page }) => {
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Shift+F10");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.getByRole("menuitem", { name: "Move to Review" }).click();
    expect(await order(page)).toBe("todo:a,b | doing:d | review:e,c | done:f");
    await expect(handle(page, "Set up CI")).toBeFocused();
    expect(JSON.parse(await text(page, "moves"))[0]).toMatchObject({
      to: "review",
      index: 1,
      source: "menu",
    });
  });

  test("the move menu returns focus to its card", async ({ page }) => {
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Shift+F10");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(handle(page, "Set up CI")).toBeFocused();
    // Arrow keys go on from the card.
    await page.keyboard.press("ArrowUp");
    await expect(handle(page, "Write the API spec")).toBeFocused();
    // Tab closes the menu and leaves the board.
    await page.keyboard.press("ContextMenu");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("menu")).toBeHidden();
    expect(
      await page.evaluate(
        () => !document.activeElement?.closest("[data-testid=board]"),
      ),
    ).toBe(true);
  });

  test("collapses a column to a strip", async ({ page }) => {
    await page.goto("/kanban.html?collapsible");
    await page.getByRole("button", { name: "Collapse Review" }).click();
    await expect(
      page.getByRole("button", { name: "Expand Review" }),
    ).toHaveAttribute("aria-expanded", "false");
    await expect(handle(page, "Fix the focus ring")).toBeHidden();
    // Arrow keys skip it.
    await handle(page, "Build the board").focus();
    await page.keyboard.press("ArrowRight");
    await expect(handle(page, "Ship the changelog")).toBeFocused();
  });
});

test.describe("Kanban pointer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kanban.html");
  });

  test("drags a card to another column", async ({ page }) => {
    const card = page.locator('[data-kanban-item="b"]');
    const target = page.locator('[data-kanban-item="d"]');
    const from = await boxOf(card);
    const to = await boxOf(target);
    await page.mouse.move(from.x + from.width / 2, from.y + 10);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height - 4, {
      steps: 8,
    });
    await expect(page.locator(".bx--kanban__indicator")).toBeVisible();
    await expect(page.locator(".bx--kanban__ghost")).toBeVisible();
    await page.mouse.up();
    await expect(page.locator(".bx--kanban__ghost")).toHaveCount(0);
    expect(await order(page)).toBe("todo:a,c | doing:d,b | review:e | done:f");
    expect(JSON.parse(await text(page, "moves"))[0]).toMatchObject({
      id: "b",
      to: "doing",
      index: 1,
      source: "pointer",
    });
  });

  test("a press that does not move is not a drag", async ({ page }) => {
    const box = await boxOf(page.locator('[data-kanban-item="b"]'));
    await page.mouse.click(box.x + box.width / 2, box.y + 10);
    await expect(page.locator(".bx--kanban__ghost")).toHaveCount(0);
    await expect(page.getByTestId("moves")).toHaveText("[]");
  });

  test("dropping outside every column cancels", async ({ page }) => {
    const box = await boxOf(page.locator('[data-kanban-item="b"]'));
    await page.mouse.move(box.x + 100, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, 700, { steps: 6 });
    await page.mouse.up();
    expect(await order(page)).toBe("todo:a,b,c | doing:d | review:e | done:f");
    await expect(page.getByRole("status")).toContainText("Move cancelled");
  });

  test("a menu button press does not start a drag", async ({ page }) => {
    await page
      .locator('[data-kanban-item="c"]')
      .getByRole("button", { name: "Move Set up CI" })
      .click();
    await expect(page.getByRole("menu")).toBeVisible();
  });
});

test.describe("Kanban layout", () => {
  // These checks can move to the layout helpers of #5240 once it merges.
  test("keeps the board and its columns inside their boxes at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/kanban.html?long");
    // A count's hidden label in a column past the fold does not widen
    // the page.
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(size.scroll).toBe(size.client);
    // A long tag does not widen its column.
    const widths = await page
      .locator("[data-kanban-column]")
      .evaluateAll((columns) =>
        columns.map((column) => column.getBoundingClientRect().width),
      );
    expect(new Set(widths)).toEqual(new Set([288]));
  });

  test("draws one box deep in forced colors, with the focus ring widest", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/kanban.html");
    await handle(page, "Write the API spec").focus();
    const outline = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const style = getComputedStyle(el);
          return `${style.outlineStyle} ${style.outlineWidth}`;
        });
    // No box around a column, and none around a card's menu button.
    expect(await outline('[data-kanban-column="todo"]')).toMatch(/^none/);
    expect(await outline('[data-kanban-item="a"] .bx--kanban__menu')).toMatch(
      /^none/,
    );
    // Cards keep a 1px edge; the focused card's ring is 2px.
    expect(await outline('[data-kanban-item="a"] .bx--kanban__card')).toBe(
      "solid 1px",
    );
    expect(await outline('[data-kanban-item="b"] .bx--kanban__card')).toBe(
      "solid 2px",
    );
  });
});

test.describe("Kanban count in RTL", () => {
  test('keeps "3 / 4" in reading order in right-to-left text', async ({
    page,
  }) => {
    await page.goto("/kanban.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    // The count first, then the limit, from left to right.
    const [first, last] = await page
      .locator('[data-kanban-column="todo"] .bx--kanban__count bdi')
      .evaluate((bdi) => {
        const text = bdi.firstChild as Text;
        const at = (index: number) => {
          const range = document.createRange();
          range.setStart(text, index);
          range.setEnd(text, index + 1);
          return range.getBoundingClientRect().left;
        };
        return [at(0), at((text.textContent ?? "").length - 1)];
      });
    expect(
      await page.locator('[data-kanban-column="todo"] bdi').textContent(),
    ).toBe("3 / 4");
    expect(first).toBeLessThan(last);
  });
});

test.describe("Kanban header alignment", () => {
  // These checks can move to the layout helpers of #5240 once it merges.
  const measure = (page: Page) =>
    page.locator('[data-kanban-column="todo"]').evaluate((column) => {
      // Where an element's first visible text starts.
      const textStart = (selector: string) => {
        const el = column.querySelector(selector) as Element;
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) =>
            node.textContent?.trim()
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_SKIP,
        });
        const range = document.createRange();
        range.selectNodeContents(walker.nextNode() as Text);
        return range.getClientRects()[0].left;
      };
      const box = (selector: string) =>
        column.querySelector(selector)?.getBoundingClientRect() ?? null;
      const title = box(".bx--kanban__title");
      const count = box(".bx--kanban__count");
      const toggle = box(".bx--kanban__toggle svg");
      return {
        title: textStart(".bx--kanban__title"),
        cardTitle: textStart(".bx--kanban__card-title"),
        toggleIcon: toggle?.left ?? null,
        gripIcon: box(".bx--kanban__handle svg")?.left ?? null,
        // Centers of the title's first 18px line, the count and the chevron.
        lineCenter: (title?.top ?? 0) + 9,
        countCenter: (count?.top ?? 0) + (count?.height ?? 0) / 2,
        toggleCenter: toggle ? toggle.top + toggle.height / 2 : null,
      };
    });

  test("lines the header up with the cards below it", async ({ page }) => {
    await page.goto("/kanban.html?collapsible");
    const withToggle = await measure(page);
    // The chevron and the grip share a 16px icon box, and the title
    // starts over the card titles.
    expect(withToggle.toggleIcon).toBeCloseTo(withToggle.gripIcon ?? 0, 0);
    expect(
      Math.abs(withToggle.title - withToggle.cardTitle),
    ).toBeLessThanOrEqual(0.5);
    // The chevron and the count center on the title's first line.
    expect(withToggle.toggleCenter).toBeCloseTo(withToggle.lineCenter, 0);
    expect(withToggle.countCenter).toBeCloseTo(withToggle.lineCenter, 0);

    await page.goto("/kanban.html");
    const plain = await measure(page);
    // With no toggle, the title starts over the grip's icon box.
    expect(Math.abs(plain.title - (plain.gripIcon ?? 0))).toBeLessThanOrEqual(
      0.5,
    );
  });
});

test.describe("Kanban card icons", () => {
  // These checks can move to the layout helpers of #5240 once it merges.
  test("centers the grip and the menu icon on the title's first line", async ({
    page,
  }) => {
    await page.goto("/kanban.html");
    for (const id of ["a", "b", "c"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one card at a time
      const centers = await page
        .locator(`[data-kanban-item="${id}"]`)
        .evaluate((item) => {
          const center = (selector: string) => {
            const box = item.querySelector(selector)?.getBoundingClientRect();
            return box ? box.top + box.height / 2 : Number.NaN;
          };
          const title = item.querySelector(".bx--kanban__card-title");
          const line = Number.parseFloat(
            getComputedStyle(title as Element).lineHeight,
          );
          const top = title?.getBoundingClientRect().top ?? Number.NaN;
          return {
            line: top + line / 2,
            grip: center(".bx--kanban__handle svg"),
            menu: center(".bx--kanban__menu svg"),
          };
        });
      expect(Math.abs(centers.grip - centers.line)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(centers.menu - centers.line)).toBeLessThanOrEqual(0.5);
    }
    // A one-line card keeps a 48px height, so the pitch stays 56px.
    const card = await boxOf(
      page.locator('[data-kanban-item="c"] .bx--kanban__card'),
    );
    expect(card.height).toBe(48);
  });
});

test.describe("Kanban focus ring", () => {
  test("draws one ring on a focused or picked card", async ({ page }) => {
    await page.goto("/kanban.html");
    await handle(page, "Write the API spec").focus();
    const rings = () =>
      page
        .locator('[data-kanban-item="b"]')
        .evaluate((item) =>
          [
            item.querySelector(".bx--kanban__card"),
            item.querySelector("button"),
          ].map((el) => getComputedStyle(el as Element).outlineStyle),
        );
    // The card draws the ring; the grip inside it draws none.
    expect(await rings()).toEqual(["solid", "none"]);
    await page.keyboard.press("Space");
    expect(await rings()).toEqual(["solid", "none"]);
  });
});

test.describe("Kanban modes", () => {
  test("keeps the drop line and the picked card visible in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/kanban.html");
    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    const line = page.locator(".bx--kanban__indicator");
    await expect(line).toBeVisible();
    const highlight = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Highlight";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    const canvas = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "Canvas";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    const lineColor = await line.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(lineColor).toBe(highlight);
    expect(lineColor).not.toBe(canvas);
    const picked = page.locator('[data-kanban-item="c"] .bx--kanban__card');
    const outline = await picked.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.outlineStyle, style.outlineWidth, style.outlineColor];
    });
    expect(outline).toEqual(["solid", "2px", highlight]);
    // Cards keep an edge without their fill.
    const edge = await page
      .locator('[data-kanban-item="a"] .bx--kanban__card')
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(edge).toBe("solid");
  });

  test("mirrors the board and still places the card under the pointer in RTL", async ({
    page,
  }) => {
    await page.goto("/kanban.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const first = await boxOf(page.locator('[data-kanban-column="todo"]'));
    const second = await boxOf(page.locator('[data-kanban-column="doing"]'));
    expect(first.x).toBeGreaterThan(second.x);

    const card = await boxOf(page.locator('[data-kanban-item="c"]'));
    const grabX = card.x + 40;
    const grabY = card.y + 10;
    await page.mouse.move(grabX, grabY);
    await page.mouse.down();
    await page.mouse.move(second.x + 100, second.y + 120, { steps: 6 });
    const ghost = await boxOf(page.locator(".bx--kanban__ghost"));
    expect(ghost.x).toBeCloseTo(second.x + 100 - 40, 0);
    const line = await boxOf(page.locator(".bx--kanban__indicator"));
    expect(line.x).toBeGreaterThanOrEqual(second.x);
    expect(line.x + line.width).toBeLessThanOrEqual(second.x + second.width);
    await page.mouse.up();
    expect(await order(page)).toBe("todo:a,b | doing:d,c | review:e | done:f");
  });

  test("drops the card transitions under reduced motion", async ({ page }) => {
    const duration = () =>
      page
        .locator('[data-kanban-item="a"] .bx--kanban__card')
        .evaluate((el) => getComputedStyle(el).transitionDuration);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/kanban.html");
    expect(await duration()).not.toBe("0s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await duration()).toBe("0s");
  });

  test("a column past the fold keeps its height as its cards render", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/kanban-large.html?columns=8&cards=40");
    const column = page.locator('[data-kanban-column="c7"]');
    const list = column.locator(".bx--kanban__list");
    const height = () =>
      list.evaluate((el) => el.getBoundingClientRect().height);
    // A card skipped by `content-visibility` lays out no children.
    const rendered = (cardId: string) =>
      expect
        .poll(() =>
          page
            .locator(`[data-kanban-item="${cardId}"] .bx--kanban__card-title`)
            .evaluate((el) => el.getBoundingClientRect().width),
        )
        .toBeGreaterThan(0);
    await expect(page.locator('[data-kanban-item="c7-0"]')).toHaveCSS(
      "content-visibility",
      "auto",
    );
    const before = await height();

    await page.locator(".bx--kanban__scroller").evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await rendered("c7-0");
    const inView = await height();
    await column.locator(".bx--kanban__body").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await rendered("c7-39");

    // Each card's guess matches a one-line card of its shape, so the
    // column does not grow or shrink as cards first render.
    expect(Math.abs(inView - before)).toBeLessThanOrEqual(1);
    expect(Math.abs((await height()) - before)).toBeLessThanOrEqual(1);
  });

  test("scrolls the board and a column near their edges while dragging", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 700, height: 700 });
    await page.goto("/kanban-large.html?columns=4&cards=40");
    const scroller = page.locator(".bx--kanban__scroller");
    const body = page.locator('[data-kanban-column="c0"] .bx--kanban__body');
    const box = await boxOf(page.locator('[data-kanban-item="c0-1"]'));
    await page.mouse.move(box.x + 100, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 110, box.y + 20, { steps: 3 });
    const bodyBox = await boxOf(body);
    await page.mouse.move(box.x + 110, bodyBox.y + bodyBox.height - 8, {
      steps: 4,
    });
    await expect
      .poll(() => body.evaluate((el) => el.scrollTop), { timeout: 4000 })
      .toBeGreaterThan(100);
    await page.mouse.move(695, bodyBox.y + 200, { steps: 6 });
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollLeft), { timeout: 4000 })
      .toBeGreaterThan(100);
    await page.mouse.up();
  });
});

test.describe("Kanban a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/kanban.html?collapsible");
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await handle(page, "Set up CI").focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    const picked = await new AxeBuilder({ page }).include("#app").analyze();
    expect(picked.violations).toEqual([]);
  });
});

base.describe("Kanban touch", () => {
  base.use({ hasTouch: true, viewport: { width: 1280, height: 720 } });

  type Point = { x: number; y: number };

  async function finger(page: Page) {
    const session = await page.context().newCDPSession(page);
    const send = (type: string, point?: Point) =>
      session.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: point ? [point] : [],
      });
    return {
      down: (point: Point) => send("touchStart", point),
      up: () => send("touchEnd"),
      async moveTo(from: Point, to: Point, steps = 10) {
        for (let i = 1; i <= steps; i++) {
          // biome-ignore lint/performance/noAwaitInLoops: touch moves are ordered
          await send("touchMove", {
            x: from.x + ((to.x - from.x) * i) / steps,
            y: from.y + ((to.y - from.y) * i) / steps,
          });
        }
      },
    };
  }

  const center = (box: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });

  base("a long press lifts a card and a finger moves it", async ({ page }) => {
    await page.goto("/kanban.html");
    const from = center(await boxOf(page.locator('[data-kanban-item="c"]')));
    const target = await boxOf(page.locator('[data-kanban-item="e"]'));
    const to = {
      x: target.x + target.width / 2,
      y: target.y + target.height - 4,
    };
    const touch = await finger(page);
    await touch.down(from);
    await page.waitForTimeout(400);
    await expect(page.locator(".bx--kanban__ghost")).toBeVisible();
    await touch.moveTo(from, to);
    await touch.up();
    await expect(page.locator(".bx--kanban__ghost")).toHaveCount(0);
    expect(await order(page)).toBe("todo:a,b | doing:d | review:e,c | done:f");
  });

  base("the handle lifts a card at once", async ({ page }) => {
    await page.goto("/kanban.html");
    const from = center(await boxOf(handle(page, "Set up CI")));
    const target = await boxOf(page.locator('[data-kanban-item="d"]'));
    const to = { x: target.x + 100, y: target.y + target.height - 4 };
    const touch = await finger(page);
    await touch.down(from);
    await touch.moveTo(from, to);
    await touch.up();
    expect(await order(page)).toBe("todo:a,b | doing:d,c | review:e | done:f");
  });

  base("a quick swipe on a card body does not lift it", async ({ page }) => {
    await page.goto("/kanban.html");
    const from = center(await boxOf(page.locator('[data-kanban-item="c"]')));
    const touch = await finger(page);
    await touch.down(from);
    await touch.moveTo(from, { x: from.x + 120, y: from.y }, 6);
    await touch.up();
    await expect(page.locator(".bx--kanban__ghost")).toHaveCount(0);
    expect(await order(page)).toBe("todo:a,b,c | doing:d | review:e | done:f");
  });
});
