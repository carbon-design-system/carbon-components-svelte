import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const order = (page: Page) =>
  page
    .getByTestId("order")
    .textContent()
    .then((text) => (text ?? "").split(","));
const events = (page: Page) =>
  page
    .getByTestId("events")
    .textContent()
    .then((text) => JSON.parse(text ?? "[]"));
const tab = (page: Page, n: number) =>
  page.getByRole("tab", { name: `File ${n}.ts`, exact: true });

/** The tabs, by number, that a drag has stepped aside. */
const shifted = (page: Page) =>
  page
    .locator(".bx--tabs__nav-item")
    .evaluateAll((items) =>
      items.flatMap((item, i) =>
        item.style.transform &&
        !item.classList.contains("bx--tabs__nav-item--dragging")
          ? [i + 1]
          : [],
      ),
    );

/** Switch the theme and let the color transitions it starts finish. */
async function setTheme(page: Page, theme: "white" | "g100") {
  await page.evaluate(async (t) => {
    document.documentElement.classList.toggle("bx--g100", t === "g100");
    await Promise.all(document.getAnimations().map((a) => a.finished));
  }, theme);
}

async function box(page: Page, n: number) {
  const rect = await tab(page, n).boundingBox();
  if (!rect) throw new Error(`Tab ${n} has no box`);
  return rect;
}

/**
 * Press on the center of `from`, move to the inline `side` of `to` (its
 * `start` is the right in RTL), and release.
 */
async function drag(
  page: Page,
  from: number,
  to: number,
  { side = "center", release = true, rtl = false } = {},
) {
  const a = await box(page, from);
  const b = await box(page, to);
  const left = b.x + 4;
  const right = b.x + b.width - 4;
  const x =
    side === "center"
      ? b.x + b.width / 2
      : (side === "start") === rtl
        ? right
        : left;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 8, a.y + a.height / 2, {
    steps: 2,
  });
  await page.mouse.move(x, b.y + b.height / 2, { steps: 8 });
  if (release) await page.mouse.up();
}

test.describe("Document tabs: reorder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/document-tabs.html?count=5&width=900&dismissible");
  });

  test("a drag past a later tab fires a cancelable reorder", async ({
    page,
  }) => {
    await drag(page, 1, 3, { side: "end" });
    await expect
      .poll(() => order(page))
      .toEqual(["doc-2", "doc-3", "doc-1", "doc-4", "doc-5"]);
    expect(await events(page)).toEqual([
      {
        type: "reorder",
        id: "doc-1",
        label: "File 1.ts",
        oldIndex: 0,
        newIndex: 2,
        source: "pointer",
      },
    ]);
  });

  test("a drag back to an earlier gap counts the new index", async ({
    page,
  }) => {
    await drag(page, 4, 2, { side: "start" });
    await expect
      .poll(() => order(page))
      .toEqual(["doc-1", "doc-4", "doc-2", "doc-3", "doc-5"]);
    expect((await events(page))[0]).toMatchObject({ oldIndex: 3, newIndex: 1 });
  });

  test("a drag keeps the selected tab selected and does not select", async ({
    page,
  }) => {
    await drag(page, 3, 1, { side: "start" });
    await expect
      .poll(() => order(page))
      .toEqual(["doc-3", "doc-1", "doc-2", "doc-4", "doc-5"]);
    await expect(tab(page, 1)).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, 3)).toHaveAttribute("aria-selected", "false");
  });

  test("tabs step aside for the held tab, then settle back on cancel", async ({
    page,
  }) => {
    const before = await box(page, 4);
    await drag(page, 1, 4, { side: "start", release: false });
    await expect(page.locator(".bx--tabs__nav-item--dragging")).toHaveCount(1);
    // The held tab is about to land before tab 4, so tabs 2 and 3 move up.
    await expect.poll(() => shifted(page)).toEqual([2, 3]);
    await page.keyboard.press("Escape");
    await page.mouse.up();
    // Off the tab, so its hover style does not move it.
    await page.mouse.move(0, 400);
    await expect(page.locator(".bx--tabs__nav-item--dragging")).toHaveCount(0);
    expect(await shifted(page)).toEqual([]);
    // The focused tab can differ by a fraction of a pixel; a leftover
    // transform would be a whole tab's width.
    await expect
      .poll(async () => Math.abs((await box(page, 4)).x - before.x))
      .toBeLessThan(1);
  });

  test("Escape cancels a drag", async ({ page }) => {
    await drag(page, 1, 4, { side: "end", release: false });
    await page.keyboard.press("Escape");
    await page.mouse.up();
    expect(await order(page)).toEqual([
      "doc-1",
      "doc-2",
      "doc-3",
      "doc-4",
      "doc-5",
    ]);
    expect(await events(page)).toEqual([]);
  });

  test("a click without movement still selects", async ({ page }) => {
    await tab(page, 3).click();
    await expect(tab(page, 3)).toHaveAttribute("aria-selected", "true");
    expect(await events(page)).toEqual([]);
  });

  test("the dismiss button still dismisses and does not start a drag", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Dismiss File 2.ts" }).click();
    expect(await events(page)).toEqual([{ type: "dismiss", id: "doc-2" }]);
    await expect
      .poll(() => order(page))
      .toEqual(["doc-1", "doc-3", "doc-4", "doc-5"]);
  });

  test("a drop on its own place fires nothing", async ({ page }) => {
    await drag(page, 2, 2);
    expect(await events(page)).toEqual([]);
  });

  test("Ctrl+Shift+Arrow moves the focused tab and announces it", async ({
    page,
  }) => {
    await tab(page, 2).focus();
    await page.keyboard.press("Control+Shift+ArrowRight");
    await expect
      .poll(() => order(page))
      .toEqual(["doc-1", "doc-3", "doc-2", "doc-4", "doc-5"]);
    await expect(tab(page, 2)).toBeFocused();
    await expect(page.getByRole("status")).toContainText(
      "Moved File 2.ts to position 3 of 5",
    );
    expect((await events(page))[0]).toMatchObject({
      oldIndex: 1,
      newIndex: 2,
      source: "keyboard",
    });

    await page.keyboard.press("Meta+Shift+Home");
    await expect
      .poll(() => order(page))
      .toEqual(["doc-2", "doc-1", "doc-3", "doc-4", "doc-5"]);
    await expect(tab(page, 2)).toBeFocused();
    await page.keyboard.press("Control+Shift+End");
    await expect
      .poll(() => order(page))
      .toEqual(["doc-1", "doc-3", "doc-4", "doc-5", "doc-2"]);
  });

  test("a move past the end does nothing", async ({ page }) => {
    await tab(page, 1).focus();
    await page.keyboard.press("Control+Shift+ArrowLeft");
    expect(await events(page)).toEqual([]);
  });

  test("plain arrows still move focus and selection", async ({ page }) => {
    await tab(page, 1).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, 2)).toBeFocused();
    expect(await events(page)).toEqual([]);
  });

  test("every tab names the hint", async ({ page }) => {
    const hint = await tab(page, 1).getAttribute("aria-describedby");
    await expect(page.locator(`#${hint}`)).toContainText("move this tab");
  });
});

test.describe("Document tabs: the app decides", () => {
  test("a handler that moves nothing leaves the tabs and says nothing", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=4&width=900&unbound");
    await drag(page, 1, 3, { side: "end" });
    await tab(page, 2).focus();
    await page.keyboard.press("Control+Shift+ArrowRight");
    expect(await order(page)).toEqual(["doc-1", "doc-2", "doc-3", "doc-4"]);
    expect(await events(page)).toHaveLength(2);
    await expect(page.getByRole("status")).toHaveText("");
  });

  test("preventDefault refuses the move", async ({ page }) => {
    await page.goto("/document-tabs.html?count=4&width=900&cancel");
    await drag(page, 1, 3, { side: "end" });
    expect(await order(page)).toEqual(["doc-1", "doc-2", "doc-3", "doc-4"]);
    expect(await events(page)).toHaveLength(1);
  });

  test("without `reorderable` there is no drag and no keys", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=4&width=900&reorderable=0");
    await drag(page, 1, 3, { side: "end" });
    await tab(page, 2).focus();
    await page.keyboard.press("Control+Shift+ArrowRight");
    expect(await events(page)).toEqual([]);
    await expect(page.locator(".bx--tabs--reorderable")).toHaveCount(0);
  });
});

test.describe("Document tabs: RTL", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/document-tabs.html?count=5&width=900&dir=rtl");
  });

  test("the first tab sits at the right and drags toward the left", async ({
    page,
  }) => {
    const first = await box(page, 1);
    const third = await box(page, 3);
    expect(first.x).toBeGreaterThan(third.x);
    await drag(page, 1, 3, { side: "end", rtl: true });
    await expect
      .poll(() => order(page))
      .toEqual(["doc-2", "doc-3", "doc-1", "doc-4", "doc-5"]);
  });

  test("ArrowLeft moves toward the inline end", async ({ page }) => {
    await tab(page, 2).focus();
    await page.keyboard.press("Control+Shift+ArrowLeft");
    await expect
      .poll(() => order(page))
      .toEqual(["doc-1", "doc-3", "doc-2", "doc-4", "doc-5"]);
  });

  test("tabs step toward the inline start, which is the right", async ({
    page,
  }) => {
    const second = await box(page, 2);
    await drag(page, 1, 4, { side: "start", release: false, rtl: true });
    await expect.poll(() => shifted(page)).toEqual([2, 3]);
    // The tab slides, so its box moves over the next frames.
    await expect
      .poll(async () => (await box(page, 2)).x)
      .toBeGreaterThan(second.x);
    await page.mouse.up();
  });
});

test.describe("Document tabs: touch", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "CDP touch input");

  async function touchDrag(
    page: Page,
    from: { x: number; y: number },
    to: { x: number; y: number },
    holdMs: number,
  ) {
    const cdp = await page.context().newCDPSession(page);
    const send = (type: string, point?: { x: number; y: number }) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: point ? [point] : [],
      });
    await send("touchStart", from);
    await page.waitForTimeout(holdMs);
    for (let i = 1; i <= 8; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: moves are sequential
      await send("touchMove", {
        x: from.x + ((to.x - from.x) * i) / 8,
        y: from.y,
      });
      await page.waitForTimeout(16);
    }
    await send("touchEnd");
  }

  test("a swipe scrolls the list and a hold then drag reorders", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 700, height: 400 },
    });
    const page = await context.newPage();
    await page.goto("/document-tabs.html?count=12&width=700&dismissible");
    const points = async () => {
      const first = await box(page, 1);
      const third = await box(page, 3);
      return {
        from: { x: first.x + first.width / 2 - 20, y: first.y + 20 },
        to: { x: third.x + third.width - 6, y: first.y + 20 },
      };
    };

    // A swipe toward the start of the list scrolls it.
    const swipe = await points();
    await touchDrag(page, swipe.to, swipe.from, 50);
    expect(await events(page)).toEqual([]);
    await expect
      .poll(() => page.getByRole("tablist").evaluate((node) => node.scrollLeft))
      .toBeGreaterThan(0);
    // Let the fling settle, then put the list back.
    await page.getByRole("tablist").evaluate(
      (node) =>
        new Promise<void>((resolve) => {
          let last = -1;
          const check = () => {
            if (node.scrollLeft === last) {
              node.scrollLeft = 0;
              resolve();
            } else {
              last = node.scrollLeft;
              setTimeout(check, 100);
            }
          };
          check();
        }),
    );
    await expect(
      page.locator(".bx--tab--overflow-nav-button--previous"),
    ).toHaveClass(/bx--tab--overflow-nav-button--hidden/);

    // A press that rests, then moves, drags.
    const { from, to } = await points();
    await touchDrag(page, from, to, 500);
    await expect
      .poll(() => order(page))
      .toEqual([
        "doc-2",
        "doc-3",
        "doc-1",
        ...Array.from({ length: 9 }, (_, i) => `doc-${i + 4}`),
      ]);
    expect((await events(page))[0]).toMatchObject({ source: "pointer" });
    await context.close();
  });
});

/** The tabs, by label, that are not whole inside the tab list. */
const outOfView = (page: Page) =>
  page.getByRole("tablist").evaluate((nav) => {
    const edge = nav.getBoundingClientRect();
    return Array.from(nav.querySelectorAll("[role=tab]"))
      .filter((link) => {
        const rect = link.closest("li")?.getBoundingClientRect();
        return (
          !rect || rect.left < edge.left - 1 || rect.right > edge.right + 1
        );
      })
      .map((link) => link.textContent?.trim());
  });

const moreTabs = (page: Page) =>
  page.getByRole("button", { name: "More tabs" });

const menuLabels = (page: Page) =>
  page
    .getByRole("menu", { name: "More tabs" })
    .getByRole("menuitem")
    .evaluateAll((items) => items.map((item) => item.textContent?.trim()));

test.describe("Document tabs: more tabs menu", () => {
  test("shows only once the list overflows", async ({ page }) => {
    await page.goto("/document-tabs.html?count=3&width=900");
    await expect(moreTabs(page)).toHaveCount(0);
    await page.goto("/document-tabs.html?count=14&width=600");
    await expect(moreTabs(page)).toBeVisible();
    await page.goto("/document-tabs.html?count=14&width=600&menu=0");
    await expect(moreTabs(page)).toHaveCount(0);
  });

  test("lists the tabs that are out of view, and follows the scroll", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=14&width=600");
    await expect(moreTabs(page)).toBeVisible();

    await moreTabs(page).click();
    await expect.poll(() => menuLabels(page)).toEqual(await outOfView(page));
    await page.keyboard.press("Escape");

    await page.locator(".bx--tab--overflow-nav-button--next").click();
    await expect
      .poll(() => page.getByRole("tablist").evaluate((nav) => nav.scrollLeft))
      .toBeGreaterThan(100);
    await page.waitForTimeout(500);
    await moreTabs(page).click();
    const hidden = await outOfView(page);
    expect(hidden).toContain("File 1.ts");
    await expect.poll(() => menuLabels(page)).toEqual(hidden);
  });

  test("choosing a hidden tab selects it, shows it and focuses it", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=14&width=600");
    await moreTabs(page).click();
    await page.getByRole("menuitem", { name: "File 12.ts" }).click();

    const chosen = tab(page, 12);
    await expect(chosen).toHaveAttribute("aria-selected", "true");
    await expect(chosen).toBeFocused();
    await expect.poll(() => outOfView(page)).not.toContain("File 12.ts");
    await expect(page.getByRole("tabpanel")).toContainText(
      "File 12.ts content",
    );
  });

  test("works from the keyboard alone", async ({ page, browserName }) => {
    // Safari does not Tab to buttons unless a system setting is on.
    test.skip(browserName === "webkit", "WebKit does not Tab to buttons");
    await page.goto("/document-tabs.html?count=14&width=600");
    // Until the tabs register, every one is a stop. Wait for the roving one,
    // and for the button the overflow adds after the list.
    await expect(tab(page, 2)).toHaveAttribute("tabindex", "-1");
    await expect(moreTabs(page)).toBeVisible();
    await tab(page, 1).focus();

    // The tab list is one stop, so the next Tab reaches the button.
    await page.keyboard.press("Tab");
    await expect(moreTabs(page)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu", { name: "More tabs" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(moreTabs(page)).toBeFocused();

    await page.keyboard.press("Enter");
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect(tab(page, 14)).toBeFocused();
    await expect(tab(page, 14)).toHaveAttribute("aria-selected", "true");
  });

  test("sits at the inline end, which is the left in RTL", async ({ page }) => {
    await page.goto("/document-tabs.html?count=14&width=600&dir=rtl");
    const button = await moreTabs(page).boundingBox();
    const first = await box(page, 1);
    expect(button?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(first.x);
    await moreTabs(page).click();
    const menu = await page.getByRole("menu").boundingBox();
    expect(menu?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(first.x);
    await expect.poll(() => menuLabels(page)).toEqual(await outOfView(page));
  });

  for (const query of [
    "",
    "&type=container",
    "&size=sm",
    "&type=container&size=xl",
  ]) {
    test(`is as tall as the tabs (${query || "line"})`, async ({ page }) => {
      await page.goto(`/document-tabs.html?count=14&width=600${query}`);
      const button = await moreTabs(page).boundingBox();
      const list = await page.getByRole("tablist").boundingBox();
      expect(button?.height).toBeCloseTo(list?.height ?? 0, 0);
    });
  }

  test("stays quick and correct with 50 tabs", async ({ page }) => {
    await page.goto("/document-tabs.html?count=50&width=600");
    await moreTabs(page).click();
    await expect.poll(() => menuLabels(page)).toEqual(await outOfView(page));
    expect((await menuLabels(page)).length).toBeGreaterThan(40);
    await page.keyboard.press("Escape");
  });

  for (const theme of ["white", "g100"] as const) {
    test(`has no axe violations with the menu open on ${theme}`, async ({
      page,
    }) => {
      await page.goto("/document-tabs.html?count=14&width=600&dismissible=0");
      await setTheme(page, theme);
      await moreTabs(page).click();
      await expect(page.getByRole("menu", { name: "More tabs" })).toBeVisible();
      // The page's debug text sits outside any landmark; the menu portals out.
      const results = await new AxeBuilder({ page })
        .include("#app")
        .include("[data-floating-portal]")
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
});

test.describe("Document tabs: variants", () => {
  for (const [name, query] of [
    ["contained", "type=container"],
    ["contained, sized", "type=container&size=lg"],
    ["line, sized", "size=sm"],
  ] as const) {
    test(`reorders ${name} tabs`, async ({ page }) => {
      await page.goto(`/document-tabs.html?count=5&width=900&${query}`);
      await drag(page, 1, 3, { side: "end" });
      await expect
        .poll(() => order(page))
        .toEqual(["doc-2", "doc-3", "doc-1", "doc-4", "doc-5"]);
    });
  }
});

test.describe("Document tabs: appearance", () => {
  test("forced colors keep the held tab ringed and the gap open", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=5&width=900&dismissible");
    await page.emulateMedia({ forcedColors: "active" });
    await drag(page, 1, 4, { side: "start", release: false });
    // The focus ring of the held tab wins over the dashed one, and a system
    // color paints either.
    const held = await page
      .locator(".bx--tabs__nav-item--dragging")
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.outlineStyle, style.outlineWidth];
      });
    expect(held[0]).not.toBe("none");
    expect(held[1]).toBe("2px");
    // The gap is made by moving tabs, so no color is needed to see it.
    await expect.poll(() => shifted(page)).toEqual([2, 3]);
    await page.mouse.up();
  });

  for (const [motion, slides] of [
    ["no-preference", true],
    ["reduce", false],
  ] as const) {
    test(`tabs ${slides ? "slide" : "snap"} aside under ${motion} motion`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await page.goto("/document-tabs.html?count=5&width=900&dismissible");
      await drag(page, 1, 4, { side: "start", release: false });
      await expect.poll(() => shifted(page)).toEqual([2, 3]);
      const transition = await page
        .locator(".bx--tabs__nav-item")
        .nth(1)
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            properties: style.transitionProperty,
            duration: style.transitionDuration,
          };
        });
      if (slides) {
        expect(transition.properties).toContain("transform");
        expect(transition.duration).not.toMatch(/^0s(, 0s)*$/);
      } else {
        expect(transition.duration).toMatch(/^0s(, 0s)*$/);
      }
      await page.mouse.up();
    });
  }

  test("the held tab is filled and lifted while the pointer is over it", async ({
    page,
  }) => {
    await page.goto("/document-tabs.html?count=5&width=900&dismissible");
    await drag(page, 1, 4, { side: "start", release: false });
    // The selected tab is the one held: its hover and selected rules must not
    // strip the fill that keeps the neighbors from showing through.
    const held = await page
      .locator(".bx--tabs__nav-item--dragging")
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.backgroundColor, style.boxShadow];
      });
    expect(held[0]).not.toBe("rgba(0, 0, 0, 0)");
    expect(held[1]).not.toBe("none");
    await page.mouse.up();
  });

  for (const theme of ["white", "g100"] as const) {
    test(`has no axe violations on ${theme}`, async ({ page }) => {
      await page.goto("/document-tabs.html?count=6&width=900&dismissible");
      await setTheme(page, theme);
      await expect(page.getByTestId("document-tabs")).toBeVisible();
      // A dismiss button inside the tablist breaks `aria-required-children`
      // on master as well, for any dismissible `Tabs`. The tabs here don't
      // add to it; the plain list below is held to every rule.
      const results = await new AxeBuilder({ page })
        .include("#app")
        .disableRules(["aria-required-children"])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`has no axe violations on ${theme} without the dismiss buttons`, async ({
      page,
    }) => {
      await page.goto("/document-tabs.html?count=6&width=900&dismissible=0");
      await setTheme(page, theme);
      await expect(page.getByTestId("document-tabs")).toBeVisible();
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
