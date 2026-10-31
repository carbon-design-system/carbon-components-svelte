import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const BANNER = ".bx--shell-banner";

function tops(page: Page) {
  return page.evaluate(() => {
    const top = (selector: string) =>
      document.querySelector(selector)?.getBoundingClientRect().top ?? null;
    return {
      banner: document
        .querySelector(".bx--shell-banner")
        ?.getBoundingClientRect().height,
      header: top(".bx--header"),
      sideNav: top(".bx--side-nav"),
      panel: top(".bx--header-panel"),
      content: top(".bx--content"),
      queue: top(".bx--notification-queue"),
    };
  });
}

test.describe("above the header", () => {
  test("moves the header, side nav, panel, content and queue down by its height", async ({
    page,
  }) => {
    await page.goto("/shell-banner.html?panel&toast");
    await expect(page.locator(BANNER)).toBeVisible();
    await expect(page.locator(".bx--notification-queue")).toBeVisible();

    const { banner, header, sideNav, panel, content, queue } = await tops(page);
    expect(banner).toBe(40);
    expect(header).toBe(40);
    expect(sideNav).toBe(40 + 48);
    expect(panel).toBe(40 + 48);
    expect(content).toBe(40 + 48);
    expect(queue).toBe(40 + 48);
  });

  test("follows the banner when its text wraps at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/shell-banner.html?wrap&dismissible");
    await expect(page.locator(BANNER)).toBeVisible();

    const { banner, header, sideNav, content } = await tops(page);
    expect(banner).toBeGreaterThan(40);
    expect(header).toBe(banner);
    expect(sideNav).toBe((banner ?? 0) + 48);
    expect(content).toBe((banner ?? 0) + 48);
  });

  test("wraps a long action under the text at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/shell-banner.html?longAction&dismissible");
    await expect(page.locator(BANNER)).toBeVisible();

    const sizes = await page.evaluate(() => {
      const box = (selector: string) =>
        (document.querySelector(selector) as Element).getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        text: box(".bx--shell-banner__text").width,
        textBottom: box(".bx--shell-banner__text").bottom,
        actionTop: box(".bx--inline-notification__action-button").top,
        close: box(".bx--inline-notification__close-button").right,
      };
    });
    expect(sizes.scrollWidth).toBe(320);
    expect(sizes.close).toBeLessThanOrEqual(320);
    // The text keeps its width; the action moves to the next line.
    expect(sizes.text).toBeGreaterThan(150);
    expect(sizes.actionTop).toBeGreaterThanOrEqual(sizes.textBottom);
  });

  test("returns the shell to the top when it is dismissed", async ({
    page,
  }) => {
    await page.goto("/shell-banner.html?dismissible");
    await page.getByRole("button", { name: "Dismiss banner" }).click();
    // The space is held until the pointer leaves it.
    await page.mouse.move(600, 500);

    await expect(page.locator(BANNER)).toHaveCount(0);
    const { header, sideNav, content } = await tops(page);
    expect(header).toBe(0);
    expect(sideNav).toBe(48);
    expect(content).toBe(48);
    expect(
      await page.evaluate(() =>
        document.documentElement.style.getPropertyValue("--ccs-shell-offset"),
      ),
    ).toBe("");
  });

  test("keeps the skip link first, below the banner", async ({ page }) => {
    await page.goto("/shell-banner.html");
    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    // The focused link keeps the 1px negative margin of its hidden state.
    const box = await skip.boundingBox();
    expect(box?.y).toBe(40 - 1);
  });

  test("holds its space under the pointer after a click closes it", async ({
    page,
  }) => {
    await page.goto("/shell-banner.html?dismissible");
    const close = page.getByRole("button", { name: "Dismiss banner" });
    const box = await close.boundingBox();
    if (!box) throw new Error("no close button");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x, box.y + 2);

    // Closed for assistive technology, and the header has not moved.
    const banner = page.locator(".bx--shell-banner--held");
    await expect(banner).toHaveAttribute("aria-hidden", "true");
    await expect(
      page.getByRole("region", { name: "Impersonation" }),
    ).toHaveCount(0);
    expect((await tops(page)).header).toBe(40);

    // Leaving releases the space.
    await page.mouse.move(600, 500);
    await expect(page.locator(BANNER)).toHaveCount(0);
    expect((await tops(page)).header).toBe(0);
  });

  test("collapses at once when the keyboard closes it", async ({ page }) => {
    await page.goto("/shell-banner.html?dismissible");
    await page.getByRole("button", { name: "Dismiss banner" }).focus();
    await page.keyboard.press("Enter");

    await expect(page.locator(BANNER)).toHaveCount(0);
    expect((await tops(page)).header).toBe(0);
  });

  test("releases a held space when the page scrolls", async ({ page }) => {
    await page.goto("/shell-banner.html?dismissible");
    await page.getByRole("button", { name: "Dismiss banner" }).click();
    await expect(page.locator(".bx--shell-banner--held")).toHaveCount(1);

    await page.mouse.wheel(0, 200);
    await expect(page.locator(BANNER)).toHaveCount(0);
  });

  test("stays dismissed after a reload", async ({ page }) => {
    await page.goto("/shell-banner.html?dismissible&dismissId=release-2");
    await page.getByRole("button", { name: "Dismiss banner" }).click();
    await page.mouse.move(600, 500);
    await expect(page.locator(BANNER)).toHaveCount(0);

    await page.reload();
    await expect(page.locator(".bx--header")).toBeVisible();
    await expect(page.locator(BANNER)).toHaveCount(0);
    expect((await tops(page)).header).toBe(0);

    await page.goto("/shell-banner.html?dismissible&dismissId=release-3");
    await expect(page.locator(BANNER)).toBeVisible();
  });
});

test.describe("in the content", () => {
  for (const [name, query] of [
    ["rail", ""],
    ["resizable", "&resizable"],
  ] as const) {
    test(`aligns with Content beside a ${name} side nav`, async ({ page }) => {
      await page.goto(`/shell-banner.html?placement=content${query}`);
      await expect(page.locator(BANNER)).toBeVisible();

      const edges = await page.evaluate(() => {
        const left = (selector: string) =>
          document.querySelector(selector)?.getBoundingClientRect().left;
        return {
          content: left(".bx--content"),
          banner: left(".bx--shell-banner"),
          nav: document.querySelector(".bx--side-nav")?.getBoundingClientRect()
            .right,
        };
      });
      expect(edges.banner).toBe(edges.content);
      expect(edges.banner).toBe(edges.nav);
    });
  }

  test("sticks under the header while the page scrolls", async ({ page }) => {
    await page.goto("/shell-banner.html?placement=content&sticky");
    await page.mouse.wheel(0, 600);

    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            document.querySelector(".bx--shell-banner")?.getBoundingClientRect()
              .top,
        ),
      )
      .toBe(48);
  });

  test("sticks under an above-header banner too", async ({ page }) => {
    await page.goto("/shell-banner.html?placement=content&sticky");
    await page.evaluate(() => {
      document.documentElement.style.setProperty("--ccs-shell-offset", "40px");
    });
    await page.mouse.wheel(0, 600);

    await expect
      .poll(async () =>
        page.evaluate(
          () =>
            document.querySelector(".bx--shell-banner")?.getBoundingClientRect()
              .top,
        ),
      )
      .toBe(88);
  });
});

test.describe("RTL", () => {
  test("draws the accent on the right edge", async ({ page }) => {
    await page.goto("/shell-banner.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const widths = await page.evaluate(() => {
      const style = getComputedStyle(
        document.querySelector(".bx--shell-banner") as Element,
      );
      return [style.borderLeftWidth, style.borderRightWidth];
    });
    expect(widths).toEqual(["0px", "3px"]);
  });

  test("centers the thin tab on the viewport", async ({ page }) => {
    await page.goto("/shell-banner.html?thin&dismissible");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const center = await page.evaluate(() => {
      const box = document
        .querySelector(".bx--shell-banner__body")
        ?.getBoundingClientRect();
      return box ? box.left + box.width / 2 - innerWidth / 2 : null;
    });
    expect(Math.abs(center ?? Number.NaN)).toBeLessThanOrEqual(1);
  });
});

test.describe("forced colors", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
  });

  test("keeps the banner's edge and its height", async ({ page }) => {
    await page.goto("/shell-banner.html");
    await expect(page.locator(BANNER)).toBeVisible();

    const { outline, accent, height } = await page.evaluate(() => {
      const banner = document.querySelector(".bx--shell-banner") as Element;
      const style = getComputedStyle(banner);
      return {
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
        accent: style.borderLeftWidth,
        height: banner.getBoundingClientRect().height,
      };
    });
    expect(outline).toBe("solid 1px");
    expect(accent).toBe("3px");
    expect(height).toBe(40);
  });

  test("keeps the close icon of a high contrast banner visible", async ({
    page,
  }) => {
    await page.goto("/shell-banner.html?highContrast&dismissible");
    await expect(page.locator(BANNER)).toBeVisible();

    const { fill, canvas } = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "ButtonText";
      document.body.append(probe);
      const buttonText = getComputedStyle(probe).backgroundColor;
      probe.remove();
      const icon = document.querySelector(
        ".bx--shell-banner .bx--inline-notification__close-icon",
      ) as Element;
      return { fill: getComputedStyle(icon).fill, canvas: buttonText };
    });
    expect(fill).toBe(canvas);
  });

  test("draws the thin strip as a border", async ({ page }) => {
    await page.goto("/shell-banner.html?thin");
    await expect(page.locator(BANNER)).toBeVisible();

    const strip = await page.evaluate(() => {
      const style = getComputedStyle(
        document.querySelector(".bx--shell-banner") as Element,
      );
      return [style.borderBottomStyle, style.borderBottomWidth];
    });
    expect(strip).toEqual(["solid", "4px"]);
  });
});

test.describe("accessibility", () => {
  for (const [name, query] of [
    ["above the header", "dismissible&wrap"],
    ["in the content", "placement=content&dismissible&kind=error"],
    ["thin", "thin&dismissible"],
    ["high contrast", "highContrast&dismissible"],
  ] as const) {
    test(`${name} has no detectable violations`, async ({ page }) => {
      await page.goto(`/shell-banner.html?${query}`);
      await expect(page.locator(BANNER)).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("has no detectable violations in Gray 100", async ({ page }) => {
    await page.goto("/shell-banner.html?dismissible");
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });

    const results = await new AxeBuilder({ page }).include(BANNER).analyze();
    expect(results.violations).toEqual([]);
  });
});
