import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const SCROLLER = '[role="region"]';

const state = (page: Page) =>
  page.evaluate((selector) => {
    const scroller = document.querySelector(selector) as HTMLElement;
    const box = scroller.getBoundingClientRect();
    // The header a reader sees at the top: the one whose box covers the top
    // edge of the scroller.
    const heading = [...document.querySelectorAll('[role="heading"]')].find(
      (node) => {
        const rect = (
          node.closest('[role="listitem"]') as HTMLElement
        ).getBoundingClientRect();
        return rect.top <= box.top + 1 && rect.bottom > box.top + 1;
      },
    );
    return {
      top: scroller.scrollTop,
      heading: heading?.textContent?.trim() ?? "",
      rows: document.querySelectorAll('[role="listitem"]').length,
      current: document
        .querySelector('[aria-current="true"]')
        ?.getAttribute("aria-label"),
    };
  }, SCROLLER);

const letter = (page: Page, key: string) =>
  page.getByRole("button", { name: new RegExp(`^Jump to ${key},`) });

test.describe("IndexedList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/indexed-list.html");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
  });

  test("renders a screenful of 10,000 rows, not all of them", async ({
    page,
  }) => {
    const { rows } = await state(page);
    expect(rows).toBeGreaterThan(5);
    expect(rows).toBeLessThan(40);
    const last = page.locator('[role="list"] [role="listitem"]').last();
    await expect(last).toHaveAttribute("aria-setsize", /^\d{5}$/);
  });

  test("keeps the section header at the top while its rows scroll", async ({
    page,
  }) => {
    for (const top of [100, 733, 4200, 20001]) {
      await page.evaluate(
        ([selector, top]) => {
          (
            document.querySelector(selector as string) as HTMLElement
          ).scrollTop = top as number;
        },
        [SCROLLER, top],
      );
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
      const { heading } = await state(page);
      expect(heading).toMatch(/^[A-Z#]$/);
    }
  });

  // Listening for `scroll` in the capture phase runs before the component's
  // handler, so the rows are still the previous window: what the compositor
  // paints when it scrolls ahead of the page.
  test("keeps rows under the viewport in a fast scroll, either way", async ({
    page,
  }) => {
    const scroller = page.locator(SCROLLER);
    const box = await scroller.boundingBox();
    if (!box) throw new Error("no list");
    await scroller.evaluate((el) => {
      el.scrollTop = 200_000;
    });
    await page.evaluate((selector) => {
      const el = document.querySelector(selector) as HTMLElement;
      const gaps: number[] = [];
      (window as unknown as { gaps: number[] }).gaps = gaps;
      document.addEventListener(
        "scroll",
        (event) => {
          if (event.target !== el) return;
          const rows = [
            ...el.querySelectorAll('[role="list"] > [role="listitem"]'),
          ].filter((row) => !row.querySelector('[role="heading"]'));
          const rect = el.getBoundingClientRect();
          const top = rows[0].getBoundingClientRect().top - rect.top;
          const bottom =
            rows[rows.length - 1].getBoundingClientRect().bottom - rect.top;
          gaps.push(Math.max(0, top) + Math.max(0, el.clientHeight - bottom));
        },
        true,
      );
    }, SCROLLER);
    await page.mouse.move(box.x + 40, box.y + 40);
    for (const delta of [400, -400, 800, -800]) {
      await page.evaluate(() => {
        (window as unknown as { gaps: number[] }).gaps.length = 0;
      });
      for (let step = 0; step < 30; step++) {
        await page.mouse.wheel(0, delta);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(100);
      const gaps = await page.evaluate(
        () => (window as unknown as { gaps: number[] }).gaps,
      );
      expect(gaps.length).toBeGreaterThan(5);
      // Only the frame that turns around, before the window has a direction.
      expect(gaps.filter((gap) => gap > 0.5).length).toBeLessThanOrEqual(1);
    }
  });

  test("a tap on a letter puts that section at the top", async ({ page }) => {
    await letter(page, "M").click();
    await expect.poll(() => state(page).then((s) => s.heading)).toBe("M");
    expect((await state(page)).current).toMatch(/^Jump to M,/);
    await expect(page.getByRole("status")).toHaveText(
      /^Section M, \d+ contacts/,
    );
  });

  test("a letter names its section and count", async ({ page }) => {
    await expect(letter(page, "Z")).toHaveAttribute(
      "aria-label",
      /^Jump to Z, \d+ contacts$/,
    );
  });
});

test.describe("IndexedList with few items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/indexed-list.html?count=40&locale=sv");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("disables letters with no items and skips them by keyboard", async ({
    page,
  }) => {
    const disabled = page.locator(
      '.bx--indexed-list__index-button[aria-disabled="true"]',
    );
    expect(await disabled.count()).toBeGreaterThan(3);
    // One tab stop on the rail, on an enabled letter.
    const stops = page.locator('.bx--indexed-list__index-button[tabindex="0"]');
    await expect(stops).toHaveCount(1);
    await expect(stops).not.toHaveAttribute("aria-disabled", "true");

    await stops.focus();
    const labels = new Set<string>();
    for (let step = 0; step < 12; step++) {
      await page.keyboard.press("ArrowDown");
      const label = await page.evaluate(
        () => document.activeElement?.getAttribute("aria-label") ?? "",
      );
      expect(
        await page.evaluate(
          () =>
            document.activeElement?.getAttribute("aria-disabled") ?? "false",
        ),
      ).toBe("false");
      labels.add(label);
    }
    expect(labels.size).toBeGreaterThan(2);
  });

  test("Enter jumps and moves focus to the section header", async ({
    page,
  }) => {
    const target = page
      .locator('.bx--indexed-list__index-button:not([aria-disabled="true"])')
      .nth(3);
    await target.focus();
    const label = await target.getAttribute("aria-label");
    const key = label?.match(/^Jump to (.+?),/)?.[1];
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: key })).toBeFocused();
  });

  test("typing a letter goes to its section", async ({ page }) => {
    await page.locator('.bx--indexed-list__index-button[tabindex="0"]').focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("End");
    // Å is the last Swedish letter with a name in the data; typing it focuses it.
    const last = page.locator(
      '.bx--indexed-list__index-button:not([aria-disabled="true"])',
    );
    const lastKey = (await last.last().getAttribute("aria-label"))?.match(
      /^Jump to (.+?),/,
    )?.[1] as string;
    await page.keyboard.press("Home");
    await page.keyboard.type(lastKey);
    await expect(
      page.locator(".bx--indexed-list__index-button:focus"),
    ).toHaveAttribute("aria-label", new RegExp(`^Jump to ${lastKey},`));
  });
});

test.describe("IndexedList rail", () => {
  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.removeAttribute("dir");
    });
  });

  test("shows every letter when there is room and fewer, with dots, when not", async ({
    page,
  }) => {
    await page.goto("/indexed-list.html?height=800");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
    const labels = () =>
      page
        .locator(".bx--indexed-list__index-label")
        .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
    // 27 letters at 24px fit in 800px.
    expect(await labels()).not.toContain("•");

    await page.goto("/indexed-list.html?height=200");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
    const short = await labels();
    expect(short).toContain("•");
    expect(short[0]).toBe("A");
    // Every letter stays a button for the keyboard and screen readers.
    await expect(page.locator(".bx--indexed-list__index-button")).toHaveCount(
      27,
    );
  });

  test("sits at the inline end: left in RTL, with Arabic letters", async ({
    page,
  }) => {
    await page.goto("/indexed-list.html?locale=ar&count=600");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(
      page.locator(".bx--indexed-list__index-label").first(),
    ).toHaveText("ا");
    const side = () =>
      page.evaluate(() => {
        const rail = document
          .querySelector(".bx--indexed-list__index")
          ?.getBoundingClientRect() as DOMRect;
        const list = document
          .querySelector(".bx--indexed-list__scroller")
          ?.getBoundingClientRect() as DOMRect;
        return rail.left > list.left ? "end" : "start";
      });
    expect(await side()).toBe("end");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    expect(await side()).toBe("start");
    // The bubble opens on the side the list is on.
    const box = await page
      .locator(".bx--indexed-list__index-list")
      .boundingBox();
    if (!box) throw new Error("no rail");
    await page.mouse.move(box.x + box.width / 2, box.y + 40);
    await page.mouse.down();
    const bubble = page.locator(".bx--indexed-list__bubble");
    await expect(bubble).toBeVisible();
    const bubbleBox = await bubble.boundingBox();
    expect(bubbleBox && bubbleBox.x).toBeGreaterThan(box.x + box.width);
    await page.mouse.up();
    await expect(bubble).toHaveCount(0);
  });

  test("scrubs across the rail with a finger, the bubble following", async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Touch input goes through CDP");
    await page.goto("/indexed-list.html");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
    const cdp = await context.newCDPSession(page);
    const box = await page
      .locator(".bx--indexed-list__index-list")
      .boundingBox();
    if (!box) throw new Error("no rail");
    const x = box.x + box.width / 2;
    const touch = (type: string, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y, id: 1 }],
      });

    await touch("touchStart", box.y + 5);
    const bubble = page.locator(".bx--indexed-list__bubble");
    await expect(bubble).toHaveText("A");
    const seen: string[] = [];
    for (let step = 1; step <= 20; step++) {
      await touch("touchMove", box.y + 5 + ((box.height - 10) * step) / 20);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(resolve)),
      );
      seen.push((await state(page)).heading);
    }
    // The headings walked forward through the alphabet, the list under the finger.
    expect(new Set(seen).size).toBeGreaterThan(8);
    expect(seen[seen.length - 1]).toBe("#");
    expect(await bubble.textContent()).toMatch(/^\s*#\s*$/);
    await touch("touchEnd", 0);
    await expect(bubble).toHaveCount(0);
    // The page did not scroll with the drag.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("forced colors still tell the current letter from a dimmed one", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    try {
      await page.goto("/indexed-list.html?count=40&locale=sv&height=700");
      await expect(page.getByRole("heading").first()).toBeVisible();
      const style = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((node) => {
            const css = getComputedStyle(node);
            return {
              color: css.color,
              outline: css.outlineStyle,
              underline: css.textDecorationLine,
              background: css.backgroundColor,
            };
          });
      const current = await style(
        '[aria-current="true"] .bx--indexed-list__index-label',
      );
      const dimmed = await style(
        '[aria-disabled="true"] .bx--indexed-list__index-label',
      );
      const plain = await style(
        ".bx--indexed-list__index-button:not([aria-disabled]):not([aria-current]) .bx--indexed-list__index-label",
      );
      expect(current.underline).toContain("underline");
      expect(current.color).not.toBe(plain.color);
      expect(current.background).toBe("rgba(0, 0, 0, 0)");
      expect(dimmed.color).not.toBe(plain.color);
      expect(plain.outline).toBe("none");
    } finally {
      await page.emulateMedia({ forcedColors: "none" });
    }
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/indexed-list.html");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
    await letter(page, "K").click();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("has none in Gray 100, short, or right to left", async ({ page }) => {
    await page.goto("/indexed-list.html?count=300&locale=ar&height=240");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.dir = "rtl";
    });
    try {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    } finally {
      await page.evaluate(() => {
        document.documentElement.classList.remove("bx--g100");
      });
    }
  });

  test("works with the keyboard alone, from the page back to it", async ({
    page,
  }) => {
    await page.goto("/indexed-list.html");
    await expect(page.getByRole("heading", { name: "A" })).toBeVisible();
    await page.getByRole("region").focus();
    // The scrolling list scrolls by key.
    await page.keyboard.press("PageDown");
    await expect
      .poll(() => state(page).then((s) => s.top))
      .toBeGreaterThan(300);
    // Tab leaves the list for the rail, one stop, on the letter at the top.
    await page.keyboard.press("Tab");
    const stop = page.locator(".bx--indexed-list__index-button:focus");
    await expect(stop).toHaveAttribute("aria-label", /^Jump to [A-Z],/);
    await page.keyboard.press("End");
    await expect(stop).toHaveAttribute("aria-label", /^Jump to #,/);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "#" })).toBeFocused();
    // The rows here hold nothing to focus, so Tab goes on from the header to
    // the rail's one stop, and then out of the list.
    await page.keyboard.press("Tab");
    await expect(
      page.locator(".bx--indexed-list__index-button:focus"),
    ).toHaveCount(1);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "After the list" }),
    ).toBeFocused();
    // Shift+Tab walks back to the rail's one tab stop.
    await page.keyboard.press("Shift+Tab");
    await expect(
      page.locator(".bx--indexed-list__index-button:focus"),
    ).toHaveCount(1);
  });
});
