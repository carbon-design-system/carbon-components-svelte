import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const sentence = (page: Page, testId: string) =>
  page.getByTestId(testId).evaluate((el) =>
    [...el.childNodes]
      .filter(
        (node) =>
          !(node as Element).classList?.contains("bx--visually-hidden") &&
          !(node as Element).classList?.contains("bx--truncated-list__measure"),
      )
      .map((node) => node.textContent)
      .join("")
      .replace(/\s+/g, " ")
      .trim(),
  );

const itemCount = (page: Page, testId: string) =>
  page.getByTestId(testId).locator(":scope > bdi").count();

const setWidth = (page: Page, testId: string, width: number) =>
  page.getByTestId(testId).evaluate(async (el, width) => {
    (el as HTMLElement).style.inlineSize = `${width}px`;
    // The fit lands before the next paint; wait out two.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  }, width);

const overflows = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((el) => el.scrollWidth > el.clientWidth + 1);

test.describe("TruncatedList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/truncated-list.html");
    await expect(page.getByTestId("count")).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const axe = () => new AxeBuilder({ page }).include("#app").analyze();
    expect((await axe()).violations).toEqual([]);

    await page.getByTestId("count").getByRole("button").click();
    await expect(page.getByRole("list")).toBeVisible();
    expect((await axe()).violations).toEqual([]);

    await page.keyboard.press("Escape");
    await page.getByTestId("expand").getByRole("button").click();
    expect((await axe()).violations).toEqual([]);
  });

  test("reads the hidden items without opening the toggletip", async ({
    page,
  }) => {
    const tree = await page.getByTestId("count").evaluate((el) => {
      const hidden = el.querySelector(".bx--visually-hidden");
      return hidden?.textContent;
    });

    expect(tree).toBe(
      "Alan Turing, Edsger Dijkstra, Barbara Liskov, Margaret Hamilton, Donald Knuth, and Katherine Johnson",
    );
    await expect(
      page.getByTestId("count").getByRole("button"),
    ).toHaveAccessibleName("6 more");
  });

  test("opens the hidden items, and Escape closes it and keeps focus", async ({
    page,
  }) => {
    const button = page.getByTestId("count").getByRole("button");
    // Safari does not focus a button on click, so Toggletip's Escape handler
    // would not see the key; open from the keyboard, as it would be there.
    await button.focus();
    await page.keyboard.press("Enter");

    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("listitem")).toHaveCount(6);

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  test("opens by keyboard", async ({ page }) => {
    await page.getByTestId("count").getByRole("button").focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("listitem").first()).toHaveText("Alan Turing");
  });

  test("a thousand items list in a scrolling toggletip with a tab stop", async ({
    page,
  }) => {
    await page.getByTestId("thousand").getByRole("button").click();

    const list = page.getByRole("list");
    await expect(page.getByRole("listitem")).toHaveCount(997);
    await expect(list).toHaveAttribute("tabindex", "0");
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(
      true,
    );
  });

  test("expands in place and collapses with focus on the button", async ({
    page,
  }) => {
    const expand = page.getByTestId("expand");
    await expand.getByRole("button", { name: "6 more" }).click();

    await expect(
      expand.getByRole("button", { name: "Show less" }),
    ).toBeFocused();
    expect(await sentence(page, "expand")).toContain("Katherine Johnson");

    await page.keyboard.press("Enter");
    await expect(expand.getByRole("button", { name: "6 more" })).toBeFocused();
  });

  test("title mode puts the hidden items in the title", async ({ page }) => {
    await expect(
      page.getByTestId("title").locator(".bx--truncated-list__more"),
    ).toHaveAttribute("title", /^Alan Turing, Edsger Dijkstra,/);
  });

  test("count mode does not move once mounted", async ({ page }) => {
    const box = () =>
      page.getByTestId("count").evaluate((el) => {
        const r = el.getBoundingClientRect();
        return [r.x, r.y, r.width, r.height].map(Math.round);
      });
    const before = await box();
    await page.waitForTimeout(300);

    expect(await box()).toEqual(before);
  });

  test.describe("fit=width", () => {
    test("never overflows, and shows fewer items as the box narrows", async ({
      page,
    }) => {
      const counts: number[] = [];
      for (let width = 560; width >= 200; width -= 20) {
        // biome-ignore lint/performance/noAwaitInLoops: widths run in order
        await setWidth(page, "box", width);
        await expect
          .poll(() => overflows(page, "fit"), { timeout: 2000 })
          .toBe(false);
        counts.push(await itemCount(page, "fit"));
      }

      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
      }
      expect(counts[0]).toBeGreaterThan(counts.at(-1) as number);
    });

    test("shows the most items that fit", async ({ page }) => {
      for (const width of [200, 260, 333, 410]) {
        // biome-ignore lint/performance/noAwaitInLoops: widths run in order
        await setWidth(page, "box", width);
        await expect
          .poll(() => overflows(page, "fit"), { timeout: 2000 })
          .toBe(false);
        const shown = await itemCount(page, "fit");

        // One more item would not fit: the same box with the next count.
        const wouldFit = await page.getByTestId("fit").evaluate((el, shown) => {
          const measurer = el.querySelector(
            ".bx--truncated-list__measure",
          ) as HTMLElement;
          const names = [
            "Ada Lovelace",
            "Grace Hopper",
            "Alan Turing",
            "Edsger Dijkstra",
            "Barbara Liskov",
            "Margaret Hamilton",
            "Donald Knuth",
            "Katherine Johnson",
          ];
          const next = shown + 1;
          if (next > names.length) return false;
          const rest = names.length - next;
          measurer.textContent = new Intl.ListFormat("en").format(
            rest > 0
              ? [...names.slice(0, next), `${rest} more`]
              : names.slice(0, next),
          );
          const fits =
            measurer.getBoundingClientRect().width <=
            el.getBoundingClientRect().width;
          measurer.textContent = "";
          return fits;
        }, shown);
        expect(wouldFit).toBe(false);
      }
    });

    test("settles after a resize with no oscillation", async ({ page }) => {
      await page.evaluate(() => {
        const target = document.querySelector("[data-testid=fit]");
        (window as unknown as { changes: number }).changes = 0;
        new MutationObserver((records) => {
          (window as unknown as { changes: number }).changes += records.length;
        }).observe(target as Element, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });

      await setWidth(page, "box", 250);
      await page.waitForTimeout(600);
      const settled = await page.evaluate(
        () => (window as unknown as { changes: number }).changes,
      );
      await page.waitForTimeout(600);

      expect(
        await page.evaluate(
          () => (window as unknown as { changes: number }).changes,
        ),
      ).toBe(settled);
      // One resize, one fit: a handful of text changes, not a loop.
      expect(settled).toBeLessThan(30);
      expect(errors).toEqual([]);
    });

    test("returns to the same count at the same width", async ({ page }) => {
      await setWidth(page, "box", 300);
      await expect.poll(() => overflows(page, "fit")).toBe(false);
      const first = await sentence(page, "fit");

      for (const width of [120, 560, 200, 440]) {
        // biome-ignore lint/performance/noAwaitInLoops: widths run in order
        await setWidth(page, "box", width);
        await page.waitForTimeout(50);
      }
      await setWidth(page, "box", 300);

      await expect.poll(() => sentence(page, "fit")).toBe(first);
    });

    test("keeps a first item that does not fit, clipped", async ({ page }) => {
      expect(await itemCount(page, "fit-long")).toBe(1);
      expect(await sentence(page, "fit-long")).toContain("Ada Lovelace");
      // The clipped line holds the whole list in its title.
      await expect(page.getByTestId("fit-long")).toHaveAttribute(
        "title",
        /^Ada Lovelace, Grace Hopper,.* and Katherine Johnson$/,
      );
      await expect(page.getByTestId("fit")).not.toHaveAttribute("title");
      expect(
        await page
          .getByTestId("fit-long")
          .evaluate((el) => getComputedStyle(el).textOverflow),
      ).toBe("ellipsis");
    });

    test("fits next to a sibling in a flex row", async ({ page }) => {
      expect(await overflows(page, "fit-row")).toBe(false);
      const [list, button] = await Promise.all([
        page.getByTestId("fit-row").boundingBox(),
        page.getByRole("button", { name: "Share" }).boundingBox(),
      ]);
      expect((list?.x ?? 0) + (list?.width ?? 0)).toBeLessThanOrEqual(
        button?.x ?? 0,
      );
    });

    test("fits a thousand items in one frame's worth of work", async ({
      page,
    }) => {
      const ms = await page
        .getByTestId("box-thousand")
        .evaluate(async (box) => {
          const start = performance.now();
          (box as HTMLElement).style.inlineSize = "300px";
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          return performance.now() - start;
        });

      expect(ms).toBeLessThan(100);
      expect(await overflows(page, "fit-thousand")).toBe(false);
    });

    test("opens its toggletip outside the clipping line", async ({ page }) => {
      await setWidth(page, "box", 250);
      await page.getByTestId("fit").getByRole("button").click();

      const list = page.getByRole("list");
      await expect(list).toBeVisible();
      expect(
        await page
          .getByTestId("fit")
          .evaluate(
            (el, list) => el.contains(list),
            await list.elementHandle(),
          ),
      ).toBe(false);
    });
  });

  test.describe("locales", () => {
    test.use({ viewport: { width: 720, height: 900 } });

    test("each reads in its own words and direction", async ({ page }) => {
      expect(await sentence(page, "locale-en-GB")).toBe(
        "Ada Lovelace, Grace Hopper and 6 more",
      );
      expect(await sentence(page, "locale-de")).toBe(
        "Anna Müller, Jonas Schmidt und 2 weitere",
      );
      // A flex box drops the space the markup leaves before the button.
      expect((await sentence(page, "locale-ja")).replace("、 ", "、")).toBe(
        "山田 太郎、佐藤 花子、他3件",
      );
      expect((await sentence(page, "locale-zh")).replace("和 ", "和")).toBe(
        "王伟、李娜和另外3人",
      );
      expect(await sentence(page, "locale-ar")).toContain("و");
      await expect(page.getByTestId("locale-ar")).toHaveAttribute("dir", "rtl");
      await expect(page.getByTestId("locale-ja")).toHaveAttribute("dir", "ltr");
    });

    test("an Arabic list fits from the right edge", async ({ page }) => {
      await expect.poll(() => overflows(page, "fit-ar")).toBe(false);
      const [box, list] = await Promise.all([
        page.getByTestId("box-ar").boundingBox(),
        page.getByTestId("fit-ar").boundingBox(),
      ]);
      expect(Math.round((list?.x ?? 0) + (list?.width ?? 0))).toBe(
        Math.round((box?.x ?? 0) + (box?.width ?? 0)),
      );
    });
  });

  test.describe("RTL page", () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
    });

    test("the toggletip opens beside its button, inside the viewport", async ({
      page,
    }) => {
      const button = page.getByTestId("count").getByRole("button");
      await button.click();

      const [trigger, popover, viewport] = await Promise.all([
        button.boundingBox(),
        page.locator(".bx--popover--open").boundingBox(),
        page.viewportSize(),
      ]);
      expect(popover?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((popover?.x ?? 0) + (popover?.width ?? 0)).toBeLessThanOrEqual(
        viewport?.width ?? 0,
      );
      expect(popover?.y ?? 0).toBeGreaterThan(
        (trigger?.y ?? 0) + (trigger?.height ?? 0) - 1,
      );
    });

    test("a width fit still never overflows", async ({ page }) => {
      for (const width of [160, 240, 380]) {
        // biome-ignore lint/performance/noAwaitInLoops: widths run in order
        await setWidth(page, "box", width);
        await expect.poll(() => overflows(page, "fit")).toBe(false);
      }
    });

    test("has no detectable accessibility violations", async ({ page }) => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test.describe("forced colors", () => {
    test.beforeEach(async ({ page, browserName }) => {
      test.skip(
        browserName === "webkit",
        "WebKit has no forced-colors emulation",
      );
      await page.emulateMedia({ forcedColors: "active" });
    });

    test("the more button reads as a link, underlined", async ({ page }) => {
      const style = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((el) => {
            const s = getComputedStyle(el);
            return [s.color, s.textDecorationLine, s.backgroundColor];
          });

      const [more, link] = await Promise.all([
        style("[data-testid=count] button"),
        style("[data-testid=linked] a"),
      ]);

      expect(more[0]).toBe(link[0]);
      expect(more[1]).toBe("underline");
    });

    test("the focused button keeps a ring", async ({ page }) => {
      await page.getByTestId("count").getByRole("button").focus();

      const outline = await page
        .getByTestId("count")
        .getByRole("button")
        .evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe("none");
    });
  });
});
