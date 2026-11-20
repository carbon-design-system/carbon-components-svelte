import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const KEY = "carbon:tips";

// Opening a fixture starts with empty storage.
async function open(page: Page) {
  await page.goto("/inline-tip.html");
  await expect(page.getByTestId("tip")).toBeVisible();
}

function stored(page: Page) {
  return page.evaluate((key) => localStorage.getItem(key), KEY);
}

function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    return (
      el?.getAttribute("aria-label") ||
      el?.textContent?.trim().replace(/\s+/g, " ") ||
      el?.tagName ||
      ""
    );
  });
}

test.describe("InlineTip", () => {
  test.describe("a11y", () => {
    for (const theme of ["white", "g100"]) {
      test(`has no detectable violations in ${theme}`, async ({ page }) => {
        await open(page);
        await page.evaluate(async (theme) => {
          document.documentElement.setAttribute("theme", theme);
          // axe reads colors, so let a running color transition finish.
          await Promise.all(document.getAnimations().map((a) => a.finished));
        }, theme);

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }

    test("has no detectable violations collapsed, and on the last tip", async ({
      page,
    }) => {
      await open(page);
      await page
        .getByRole("button", {
          name: "Work faster with keyboard shortcuts",
          exact: true,
        })
        .click();
      await page
        .getByTestId("banner")
        .getByRole("button", { name: "Previous tip" })
        .click();

      const results = await new AxeBuilder({ page }).include("#app").analyze();

      expect(results.violations).toEqual([]);
    });
  });

  test.describe("keyboard", () => {
    test("reaches every control in order", async ({ page, browserName }) => {
      test.skip(
        browserName === "webkit",
        "WebKit's default Tab order skips plain buttons and links",
      );
      await open(page);
      const order: string[] = [];
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press("Tab");
        order.push(await focused(page));
      }

      expect(order).toEqual([
        "Learn more",
        "Turn on sync",
        "Dismiss tip: Sync your settings",
        "Work faster with keyboard shortcuts",
        "Dismiss tip: Work faster with keyboard shortcuts",
        "Learn more",
        "Previous tip",
        "Next tip",
        "Dismiss all tips",
      ]);
    });

    test("carries on from where a dismissed tip stood", async ({
      page,
      browserName,
    }) => {
      test.skip(
        browserName === "webkit",
        "WebKit's default Tab order skips plain buttons",
      );
      await open(page);
      await page
        .getByRole("button", { name: "Dismiss tip: Sync your settings" })
        .focus();

      await page.keyboard.press("Enter");
      await expect(page.getByTestId("tip")).toHaveCount(0);

      await page.keyboard.press("Tab");
      expect(await focused(page)).toBe("Work faster with keyboard shortcuts");
    });

    test("collapses with Enter and Space and keeps focus on the title", async ({
      page,
    }) => {
      await open(page);
      const toggle = page.getByRole("button", {
        name: "Work faster with keyboard shortcuts",
        exact: true,
      });
      await toggle.focus();

      await page.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toBeFocused();

      await page.keyboard.press("Space");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(toggle).toBeFocused();
    });

    test("steps the banner with the keyboard and wraps", async ({ page }) => {
      await open(page);
      const banner = page.getByTestId("banner");
      await banner.getByRole("button", { name: "Next tip" }).focus();

      await page.keyboard.press("Enter");
      await expect(banner.getByRole("heading")).toHaveText("Export a view");
      await expect(
        banner.getByRole("button", { name: "Next tip" }),
      ).toBeFocused();

      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await expect(banner.getByRole("heading")).toHaveText("Filter by owner");
    });
  });

  test.describe("a remembered dismissal", () => {
    test("survives a reload, and Show tips again brings the tips back", async ({
      page,
    }) => {
      await open(page);
      await page
        .getByRole("button", { name: "Dismiss tip: Sync your settings" })
        .click();
      await page
        .getByRole("button", { name: "Dismiss all tips" })
        .first()
        .click();
      await expect(page.getByTestId("tip")).toHaveCount(0);
      expect(JSON.parse((await stored(page)) as string)).toContain(
        "settings-sync",
      );

      await page.reload();
      await expect(page.getByTestId("collapsible")).toBeVisible();
      await expect(page.getByTestId("tip")).toHaveCount(0);
      await expect(page.getByTestId("banner")).toHaveCount(0);

      await page.getByTestId("reset").click();
      await expect(page.getByTestId("tip")).toBeVisible();
      await expect(page.getByTestId("banner")).toBeVisible();
      expect(await stored(page)).toBe("[]");
    });

    test("follows a dismissal made in another tab", async ({
      page,
      context,
    }) => {
      await open(page);
      const other = await context.newPage();
      await other.goto("/inline-tip.html");
      await expect(other.getByTestId("tip")).toBeVisible();

      await other
        .getByRole("button", { name: "Dismiss tip: Sync your settings" })
        .click();

      await expect(page.getByTestId("tip")).toHaveCount(0);
      await other.close();
    });
  });

  test.describe("a banner of twenty tips", () => {
    test("renders one tip at a time and steps through all of them", async ({
      page,
    }) => {
      await open(page);
      const banner = page.getByTestId("banner-many");
      await expect(banner.getByRole("heading")).toHaveCount(1);
      await expect(banner.getByText("1 of 20", { exact: true })).toBeVisible();

      const next = banner.getByRole("button", { name: "Next tip" });
      for (let i = 0; i < 19; i++) await next.click();
      await expect(banner.getByRole("heading")).toHaveText("Tip 20");
      await expect(banner.getByText("20 of 20", { exact: true })).toBeVisible();

      await next.click();
      await expect(banner.getByRole("heading")).toHaveText("Tip 1");
    });
  });

  test.describe("collapse", () => {
    const body = "[data-testid=collapsible] .bx--inline-tip__body";

    test("animates the body closed and takes it out of the tab order", async ({
      page,
    }) => {
      await open(page);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const duration = await page.$eval(
        body,
        (el) => getComputedStyle(el).transitionDuration,
      );
      expect(duration).not.toContain("0s,");
      expect(Number.parseFloat(duration)).toBeGreaterThan(0);

      await page
        .getByRole("button", {
          name: "Work faster with keyboard shortcuts",
          exact: true,
        })
        .click();

      await expect
        .poll(() => page.$eval(body, (el) => el.getBoundingClientRect().height))
        .toBe(0);
      expect(
        await page.$eval(body, (el) => getComputedStyle(el).visibility),
      ).toBe("hidden");
    });

    test("snaps shut for reduced motion", async ({ page }) => {
      await open(page);
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(
        await page.$eval(body, (el) => getComputedStyle(el).transitionDuration),
      ).toBe("0s");

      await page
        .getByRole("button", {
          name: "Work faster with keyboard shortcuts",
          exact: true,
        })
        .click();

      // No poll: the height is zero on the next frame.
      expect(
        await page.$eval(body, (el) => el.getBoundingClientRect().height),
      ).toBe(0);
    });
  });

  test.describe("RTL", () => {
    test("mirrors the icon, the controls and the illustration", async ({
      page,
    }) => {
      await open(page);
      const box = (selector: string) =>
        page.$eval(selector, (el) => {
          const { left, right } = el.getBoundingClientRect();
          return { left, right };
        });
      const sides = async () => ({
        tip: await box("[data-testid=collapsible]"),
        icon: await box("[data-testid=collapsible] .bx--inline-tip__icon"),
        art: await box(
          "[data-testid=collapsible] .bx--inline-tip__illustration",
        ),
        close: await box("[data-testid=collapsible] .bx--inline-tip__close"),
      });

      const ltr = await sides();
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const rtl = await sides();

      // Each part sits as far from the right edge as it sat from the left one.
      expect(rtl.tip.right - rtl.icon.right).toBeCloseTo(
        ltr.icon.left - ltr.tip.left,
        0,
      );
      expect(rtl.close.left - rtl.tip.left).toBeCloseTo(
        ltr.tip.right - ltr.close.right,
        0,
      );
      expect(rtl.art.left - rtl.tip.left).toBeCloseTo(
        ltr.tip.right - ltr.art.right,
        0,
      );
    });

    test("keeps the counter's digits in reading order", async ({ page }) => {
      await open(page);
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );

      const order = await page.$eval(
        "[data-testid=banner] .bx--carousel__counter",
        (el) => {
          const text = el.firstChild as Text;
          const at = (index: number) => {
            const range = document.createRange();
            range.setStart(text, index);
            range.setEnd(text, index + 1);
            return range.getBoundingClientRect().left;
          };
          const content = text.data;
          return {
            one: at(content.indexOf("1")),
            three: at(content.indexOf("3")),
          };
        },
      );

      expect(order.one).toBeLessThan(order.three);
    });

    test("points previous and next toward their sides", async ({ page }) => {
      await open(page);
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const banner = page.getByTestId("banner");

      const prev = await banner
        .getByRole("button", { name: "Previous tip" })
        .boundingBox();
      const next = await banner
        .getByRole("button", { name: "Next tip" })
        .boundingBox();

      expect((next?.x ?? 0) < (prev?.x ?? 0)).toBe(true);
    });
  });

  test.describe("forced colors", () => {
    test.beforeEach(({ browserName }) => {
      test.skip(browserName === "webkit", "WebKit does not force colors");
    });

    test("keeps the border, the accent bar, the icons and the focus ring", async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: "active" });
      await open(page);

      const read = await page.evaluate(() => {
        const probe = (name: string) => {
          const el = document.createElement("div");
          el.style.backgroundColor = name;
          document.body.append(el);
          const color = getComputedStyle(el).backgroundColor;
          el.remove();
          return color;
        };
        const tip = getComputedStyle(
          document.querySelector("[data-testid=tip]") as Element,
        );
        const close = document.querySelector(
          "[data-testid=tip] .bx--inline-tip__close",
        ) as HTMLElement;
        const icon = getComputedStyle(
          document.querySelector(
            "[data-testid=tip] .bx--inline-tip__icon svg",
          ) as Element,
        );
        close.focus();
        const ring = getComputedStyle(close);
        return {
          canvas: probe("Canvas"),
          canvasText: probe("CanvasText"),
          highlight: probe("Highlight"),
          border: tip.borderTopColor,
          accent: tip.borderLeftColor,
          iconFill: icon.fill,
          ringStyle: ring.outlineStyle,
          ringWidth: Number.parseFloat(ring.outlineWidth),
          ringColor: ring.outlineColor,
        };
      });

      expect(read.border).toBe(read.canvasText);
      expect(read.accent).toBe(read.highlight);
      expect(read.iconFill).not.toBe(read.canvas);
      expect(read.ringStyle).not.toBe("none");
      expect(read.ringWidth).toBeGreaterThan(0);
      expect(read.ringColor).not.toBe(read.canvas);
    });
  });
});
