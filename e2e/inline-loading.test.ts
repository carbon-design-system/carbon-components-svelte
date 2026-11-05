import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const CHECK = ".bx--inline-loading__checkmark";

function style(page: Page, region: string, selector: string) {
  return page.evaluate(
    ([region, selector]) => {
      const el = document.querySelector(
        `[data-testid="${region}"] ${selector}`,
      );
      if (!el) throw new Error(`no ${selector}`);
      const s = getComputedStyle(el);
      return {
        fill: s.fill,
        stroke: s.stroke,
        dasharray: s.strokeDasharray,
        offset: s.strokeDashoffset,
        timing: s.animationTimingFunction,
      };
    },
    [region, selector] as const,
  );
}

/** The running animations on the check path, with their timing. */
function checkAnimations(page: Page, region: string) {
  return page.evaluate(
    ([region, check]) => {
      const path = document.querySelector(`[data-testid="${region}"] ${check}`);
      if (!path) throw new Error("no check");
      return path.getAnimations().map((animation) => ({
        name: (animation as CSSAnimation).animationName,
        duration: (animation.effect as KeyframeEffect).getComputedTiming()
          .duration,
        state: animation.playState,
      }));
    },
    [region, CHECK] as const,
  );
}

test.describe("InlineLoading finished check", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inline-loading.html");
    await expect(
      page.locator('[data-testid="live"] .bx--loading'),
    ).toBeVisible();
  });

  test("draws the check on when the status turns finished", async ({
    page,
  }) => {
    await page.getByTestId("finish").click();

    // `$duration--moderate-02` on the entrance curve.
    expect(await checkAnimations(page, "live")).toEqual([
      { name: "stroke", duration: 240, state: "running" },
    ]);
    expect((await style(page, "live", CHECK)).timing).toBe(
      "cubic-bezier(0, 0, 0.38, 0.9)",
    );
  });

  test("ends with the whole check drawn", async ({ page }) => {
    await page.getByTestId("finish").click();
    await expect
      .poll(async () => (await checkAnimations(page, "live"))[0]?.state)
      .toBe("finished");

    expect((await style(page, "live", CHECK)).offset).toBe("0px");
  });

  test("shows a check that renders finished without drawing it", async ({
    page,
  }) => {
    expect(await checkAnimations(page, "initial")).toEqual([]);
    expect((await style(page, "initial", CHECK)).offset).toBe("0px");
  });

  test("draws nothing under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByTestId("finish").click();
    await expect(page.locator(`[data-testid="live"] ${CHECK}`)).toBeVisible();

    expect(await checkAnimations(page, "live")).toEqual([]);
    const { dasharray, offset } = await style(page, "live", CHECK);
    expect({ dasharray, offset }).toEqual({ dasharray: "none", offset: "0px" });
  });

  test("paints the disc with the success color and keeps its name", async ({
    page,
  }) => {
    await page.getByTestId("finish").click();
    const icon = page.locator(
      '[data-testid="live"] svg.bx--inline-loading__checkmark-container',
    );
    await expect(icon).toHaveAttribute("role", "img");
    await expect(icon.locator("title")).toHaveText("finished");

    const success = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.color = "var(--cds-support-success)";
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    expect((await style(page, "live", "circle")).fill).toBe(success);
  });

  test("cuts the check out of the disc in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    // The theme's check color differs from `Canvas` in Gray 100.
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    await page.getByTestId("finish").click();
    await expect(page.locator(`[data-testid="live"] ${CHECK}`)).toBeVisible();

    const canvas = await page.evaluate(() => {
      const probe = document.createElement("i");
      probe.style.color = "Canvas";
      document.body.append(probe);
      const { color } = getComputedStyle(probe);
      probe.remove();
      return color;
    });
    expect((await style(page, "live", CHECK)).stroke).toBe(canvas);
  });

  test("keeps the size of the icon and the row", async ({ page }) => {
    const measure = () =>
      page.evaluate(() => {
        const box = (selector: string) => {
          const el = document.querySelector(
            `[data-testid="live"] ${selector}`,
          ) as Element;
          const { width, height } = el.getBoundingClientRect();
          return { width, height };
        };
        return {
          icon: box(".bx--inline-loading__animation"),
          row: box(".bx--inline-loading"),
        };
      });
    const spinning = await measure();
    await page.getByTestId("finish").click();
    await expect(page.locator(`[data-testid="live"] ${CHECK}`)).toBeVisible();

    expect(await measure()).toEqual(spinning);
    expect(
      await page
        .locator(
          '[data-testid="live"] svg.bx--inline-loading__checkmark-container',
        )
        .boundingBox(),
    ).toMatchObject({ width: 16, height: 16 });
  });
});
