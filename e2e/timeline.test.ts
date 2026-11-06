import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const open = async (page: Page, query = "") => {
  await page.goto(`/timeline.html?${query}`);
  await expect(page.locator(".bx--timeline").first()).toBeVisible();
};

const box = async (page: Page, selector: string) => {
  const rect = await page.locator(selector).first().boundingBox();
  if (!rect) throw new Error(`no box for ${selector}`);
  return rect;
};

const axe = (page: Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();

test.describe("Timeline", () => {
  test.describe("axe", () => {
    test("white", async ({ page }) => {
      await open(page);
      expect((await axe(page)).violations).toEqual([]);
    });

    test("gray 100", async ({ page }) => {
      await open(page);
      await page.evaluate(() =>
        document.documentElement.classList.add("bx--g100"),
      );
      expect((await axe(page)).violations).toEqual([]);
    });

    test("rtl", async ({ page }) => {
      await open(page);
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      expect((await axe(page)).violations).toEqual([]);
    });

    test("with the earlier events shown", async ({ page }) => {
      await open(page);
      await page.getByRole("button", { name: "Show 3 earlier events" }).click();
      expect((await axe(page)).violations).toEqual([]);
    });
  });

  test("lists days as headings over their own lists of events", async ({
    page,
  }) => {
    await open(page);

    const shape = await page.getByTestId("deploys").evaluate((root) => {
      const days = [
        ...root.querySelectorAll(":scope > .bx--timeline > ol > li"),
      ];
      return days.map((day) => [
        day.querySelector(":scope > h3")?.textContent?.trim(),
        day.querySelectorAll(":scope > ol > li").length,
      ]);
    });

    expect(shape).toEqual([
      ["Today", 3],
      ["Yesterday", 2],
      ["Oct 7", 1],
      ["Oct 2, 2025", 1],
    ]);
  });

  test("says each status in words, not only in a shape", async ({ page }) => {
    await open(page);

    const items = page.getByTestId("deploys").locator(".bx--timeline__item");
    await expect(
      items.filter({ hasText: "Deploy v2.4.0 failed" }),
    ).toContainText("Error");
    await expect(items.filter({ hasText: "Rolled back" })).toContainText(
      "Warning",
    );
    await expect(
      page.getByTestId("order").locator("[aria-current=step]"),
    ).toContainText("In progress");
  });

  test("shows and hides the earlier events from the keyboard, with focus kept", async ({
    page,
  }) => {
    await open(page);
    const changelog = page.getByTestId("changelog");
    const items = changelog.locator(".bx--timeline__item");

    await expect(items).toHaveCount(3);
    const more = changelog.getByRole("button", {
      name: "Show 3 earlier events",
    });
    await more.focus();
    await page.keyboard.press("Enter");

    await expect(items).toHaveCount(6);
    const fewer = changelog.getByRole("button", { name: "Show fewer events" });
    await expect(fewer).toBeFocused();

    await page.keyboard.press("Space");
    await expect(items).toHaveCount(3);
    await expect(
      changelog.getByRole("button", { name: "Show 3 earlier events" }),
    ).toBeFocused();
  });

  test("keeps a long history's DOM to what it shows", async ({ page }) => {
    await page.goto("/timeline.html?count=500&limit=20");
    await expect(
      page.getByTestId("big").locator(".bx--timeline__item"),
    ).toHaveCount(20);
    await page.getByRole("button", { name: "Show 480 earlier events" }).click();
    await expect(
      page.getByTestId("big").locator(".bx--timeline__item"),
    ).toHaveCount(500);
  });

  test("500 live events share three timers, one a cadence", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const active = new Set<number>();
      const set = window.setInterval.bind(window);
      const clear = window.clearInterval.bind(window);
      Object.assign(window, {
        __active: active,
        setInterval: (...args: Parameters<typeof setInterval>) => {
          const id = set(...args) as unknown as number;
          active.add(id);
          return id;
        },
        clearInterval: (id: number) => {
          active.delete(id);
          return clear(id);
        },
      });
    });
    await page.goto("/timeline.html?count=500&live&group=none");
    await expect(page.getByTestId("big").locator("time")).toHaveCount(500);

    const intervals = await page.evaluate(
      () => (window as never as { __active: Set<number> }).__active.size,
    );
    // The 1 s, 1 min and 1 h cadences, plus at most one from the dev server.
    expect(intervals).toBeLessThanOrEqual(4);
  });

  test("a tick of 500 live times costs well under a frame", async ({
    page,
  }) => {
    await page.goto("/timeline.html?count=500&live&group=none");
    await expect(page.getByTestId("big").locator("time")).toHaveCount(500);

    const cost = await page.evaluate(async () => {
      const samples: number[] = [];
      for (let index = 0; index < 5; index++) {
        const start = performance.now();
        document.dispatchEvent(new Event("visibilitychange"));
        await new Promise((resolve) => setTimeout(resolve, 0));
        void document.body.offsetHeight;
        samples.push(performance.now() - start);
      }
      return Math.min(...samples);
    });
    expect(cost).toBeLessThan(16);
  });

  test.describe("alternate layout", () => {
    const sides = (page: Page) =>
      page.getByTestId("alternate").evaluate((root) =>
        [...root.querySelectorAll(".bx--timeline__item")]
          .slice(0, 2)
          .map((item) => {
            const rect = (selector: string) =>
              (
                item.querySelector(selector) as HTMLElement
              ).getBoundingClientRect();
            const time = rect(".bx--timeline__time");
            const marker = rect(".bx--timeline__marker");
            const title = rect(".bx--timeline__title");
            return {
              timeBeforeMarker: time.right <= marker.left,
              titleAfterMarker: title.left >= marker.right,
              titleBeforeMarker: title.right <= marker.left,
              timeAfterMarker: time.left >= marker.right,
            };
          }),
      );

    test("takes turns on each side of the rail when wide", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, "only=alternate");

      const [odd, even] = await sides(page);
      expect(odd).toMatchObject({
        timeBeforeMarker: true,
        titleAfterMarker: true,
      });
      expect(even).toMatchObject({
        titleBeforeMarker: true,
        timeAfterMarker: true,
      });
    });

    test("mirrors in RTL", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, "only=alternate");
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );

      const [odd, even] = await sides(page);
      expect(odd).toMatchObject({
        timeAfterMarker: true,
        titleBeforeMarker: true,
      });
      expect(even).toMatchObject({
        titleAfterMarker: true,
        timeBeforeMarker: true,
      });
    });

    test("falls back to one side when the timeline is narrow", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 480, height: 900 });
      await open(page, "only=alternate");

      const [odd, even] = await sides(page);
      for (const side of [odd, even]) {
        expect(side).toMatchObject({
          titleAfterMarker: true,
          timeBeforeMarker: false,
        });
      }
    });

    test("asks the timeline's width, not the window's", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await open(page, "only=alternate");
      await page.getByTestId("alternate").evaluate((node) => {
        node.style.width = "24rem";
      });

      const [odd] = await sides(page);
      expect(odd).toMatchObject({
        titleAfterMarker: true,
        timeBeforeMarker: false,
      });
    });
  });

  test("keeps a day heading at the top until its day has passed", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 260 });
    await open(page, "only=deploys");
    const heading = (name: string) =>
      page.getByRole("heading", { name, level: 3 });

    await page.evaluate(() => {
      document.body.style.paddingBottom = "1200px";
      window.scrollTo(0, 150);
    });
    await expect
      .poll(async () =>
        Math.round((await heading("Today").boundingBox())?.y ?? -1),
      )
      .toBe(0);

    // Past the last event of its day, the next heading takes the top.
    const oct = await heading("Oct 7").boundingBox();
    await page.evaluate((top) => window.scrollBy(0, top + 5), oct?.y ?? 0);
    await expect
      .poll(async () =>
        Math.round((await heading("Oct 7").boundingBox())?.y ?? -1),
      )
      .toBe(0);
    expect((await heading("Today").boundingBox())?.y ?? 0).toBeLessThan(0);
  });

  test("tightens the space between events at size sm", async ({ page }) => {
    await open(page);

    // The same order in both, so the first two events are the same height.
    const pitch = (testId: string) =>
      page.getByTestId(testId).evaluate((root) => {
        const [first, second] = [
          ...root.querySelectorAll(".bx--timeline__item"),
        ];
        return (
          second.getBoundingClientRect().top - first.getBoundingClientRect().top
        );
      });

    const sm = await pitch("dense");
    const md = await pitch("order");
    expect(sm).toBeLessThan(md);
  });

  test("shows nothing in motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await page.getByRole("button", { name: "Show 3 earlier events" }).click();

    // The button's own hover transition is Carbon's; the timeline adds none.
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .map(
          (animation) => (animation.effect as KeyframeEffect).target as Element,
        )
        .filter((target) => !target.closest(".bx--btn"))
        .map((target) => String(target.className)),
    );
    expect(running).toEqual([]);
  });

  test("draws the rail and the markers in CanvasText under forced colors, one shape per status", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);

    const canvasText = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });

    const read = await page.getByTestId("deploys").evaluate((root) => {
      const item = root.querySelector(".bx--timeline__item") as HTMLElement;
      const rail = getComputedStyle(item, "::before");
      const fills = [...root.querySelectorAll(".bx--timeline__marker svg")].map(
        (svg) => getComputedStyle(svg).fill,
      );
      const shapes = [...root.querySelectorAll(".bx--timeline__item")].map(
        (li) =>
          li
            .querySelector(".bx--timeline__marker svg path")
            ?.getAttribute("d") ?? "dot",
      );
      return {
        railColor: rail.borderInlineStartColor,
        railStyle: rail.borderInlineStartStyle,
        fills,
        classes: [...root.querySelectorAll(".bx--timeline__item")].map((li) =>
          [...li.classList].find(
            (name) => name.includes("--") && name !== "bx--timeline__item",
          ),
        ),
        shapes,
      };
    });

    expect(read.railStyle).toBe("solid");
    expect(read.railColor).toBe(canvasText);
    expect(read.fills.length).toBeGreaterThan(3);
    for (const fill of read.fills) expect(fill).toBe(canvasText);

    // Success, error, warning and info draw four different glyphs.
    const byStatus = new Map<string | undefined, string>();
    read.classes.forEach((name, index) =>
      byStatus.set(name, read.shapes[index]),
    );
    const glyphs = ["success", "error", "warning", "info"].map((status) =>
      byStatus.get(`bx--timeline__item--${status}`),
    );
    expect(new Set(glyphs).size).toBe(4);
  });

  test("a plain dot is a border, which forced colors repaint", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);

    const dot = await page
      .getByTestId("order")
      .locator(".bx--timeline__dot")
      .evaluate((node) => {
        const probe = document.createElement("div");
        probe.style.color = "CanvasText";
        document.body.append(probe);
        const canvasText = getComputedStyle(probe).color;
        probe.remove();
        const style = getComputedStyle(node);
        return {
          width: style.borderTopWidth,
          color: style.borderTopColor,
          canvasText,
        };
      });
    expect(dot.width).toBe("4px");
    expect(dot.color).toBe(dot.canvasText);
  });

  test("lets the rail through the right side in RTL", async ({ page }) => {
    await open(page);
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );

    const order = await box(page, "[data-testid=order]");
    const marker = await box(page, "[data-testid=order] .bx--timeline__marker");
    const title = await box(page, "[data-testid=order] .bx--timeline__title");
    expect(marker.x + marker.width).toBeGreaterThan(order.x + order.width - 20);
    expect(title.x + title.width).toBeLessThan(marker.x);
  });
});
