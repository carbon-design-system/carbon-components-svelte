import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const picker = (page: Page) => page.getByTestId("basic");
const area = (page: Page) =>
  picker(page).getByRole("slider", { name: "Saturation and brightness" });
const hue = (page: Page) => picker(page).getByRole("slider", { name: "Hue" });

async function box(page: Page, selector: string) {
  const rect = await picker(page).locator(selector).boundingBox();
  if (!rect) throw new Error(`no ${selector}`);
  return rect;
}

test.describe("ColorPicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/color-picker.html");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await area(page).focus();
    await page.keyboard.press("ArrowLeft");
    await picker(page).getByRole("option", { name: "Green 50" }).click();
    const changed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(changed.violations).toEqual([]);
  });

  test("tracks a pointer drag and changes once when it ends", async ({
    page,
  }) => {
    const rect = await box(page, ".bx--color-picker__area");

    await page.mouse.move(
      rect.x + rect.width * 0.1,
      rect.y + rect.height * 0.9,
    );
    await page.mouse.down();
    await page.mouse.move(
      rect.x + rect.width * 0.5,
      rect.y + rect.height * 0.5,
      {
        steps: 8,
      },
    );
    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 50%, brightness 50%/,
    );
    await expect(page.getByTestId("changes")).toHaveText("0");
    await page.mouse.move(rect.x + rect.width * 2, rect.y - 40, { steps: 4 });
    await page.mouse.up();

    // The pointer left the area: the value clamps at the corner it is
    // still dragging to, and the area keeps the drag.
    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 100%, brightness 100%/,
    );
    await expect(page.getByTestId("changes")).toHaveText("1");
    await expect(area(page)).toBeFocused();
  });

  test("drags the hue slider", async ({ page }) => {
    const rect = await box(page, ".bx--color-picker__slider--hue");

    await page.mouse.move(rect.x + 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2, {
      steps: 6,
    });
    await page.mouse.up();

    await expect(hue(page)).toHaveAttribute("aria-valuenow", /^(179|180|181)$/);
  });

  test("drags on touch, starting from the thumb", async ({ page }) => {
    test.skip(
      test.info().project.name !== "chromium",
      "Drives touch through the Chrome protocol",
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 1,
    });
    const rect = await box(page, ".bx--color-picker__area");
    const thumb = await area(page).boundingBox();
    if (!thumb) throw new Error("no thumb");
    const send = (type: string, x: number, y: number) =>
      cdp.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: type === "touchEnd" ? [] : [{ x, y }],
      });

    await send(
      "touchStart",
      thumb.x + thumb.width / 2,
      thumb.y + thumb.height / 2,
    );
    for (let step = 1; step <= 6; step += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: touch moves go in order
      await send(
        "touchMove",
        rect.x + rect.width * (1 - step / 12),
        rect.y + rect.height * (step / 12 + 0.1),
      );
    }
    await send("touchEnd", 0, 0);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });

    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 50%, brightness 4\d%/,
    );
    await expect(page.getByTestId("changes")).toHaveText("1");
  });

  test("moves with the keyboard alone", async ({ page }) => {
    await area(page).focus();
    await page.keyboard.press("Shift+ArrowDown");
    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 94%, brightness 90%/,
    );

    // Tab reaches the hue slider, the format switch, the field and then
    // one swatch, whatever the number of swatches.
    const stops: string[] = [];
    for (let i = 0; i < 6; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: each Tab follows the last
      await page.keyboard.press("Tab");
      stops.push(
        await page.evaluate(() => {
          const el = document.activeElement;
          return (
            el?.getAttribute("aria-label") ??
            el?.getAttribute("id") ??
            el?.tagName ??
            ""
          );
        }),
      );
    }
    expect(stops.filter((name) => name === "Hue")).toHaveLength(1);
    expect(
      stops.filter((name) =>
        /^(Red|Orange|Yellow|Green|Teal|Blue|Purple|Magenta|Gray|White)/.test(
          name,
        ),
      ),
    ).toHaveLength(1);
  });

  test("keeps a thumb at the end of its range inside the picker", async ({
    page,
  }) => {
    await area(page).focus();
    await page.keyboard.press("End");
    for (let i = 0; i < 10; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: each key follows the last
      await page.keyboard.press("PageUp");
    }
    await hue(page).focus();
    await page.keyboard.press("End");

    const outside = await picker(page)
      .locator(".bx--color-picker")
      .evaluate((root) => {
        const box = root.getBoundingClientRect();
        return [...root.querySelectorAll(".bx--color-picker__thumb")].map(
          (thumb) => {
            const rect = thumb.getBoundingClientRect();
            return Math.max(
              box.left - rect.left,
              rect.right - box.right,
              box.top - rect.top,
              0,
            );
          },
        );
      });
    expect(outside).toEqual([0, 0]);
  });

  test("mirrors the area, the sliders and the arrow keys in RTL", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rect = await box(page, ".bx--color-picker__area");

    // 5% from the left edge is 95% of the way from the inline start.
    await page.mouse.click(
      rect.x + rect.width * 0.05,
      rect.y + rect.height / 2,
    );
    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 95%/,
    );

    const thumb = await area(page).boundingBox();
    if (!thumb) throw new Error("no thumb");
    expect(thumb.x + thumb.width / 2).toBeLessThan(rect.x + rect.width * 0.1);

    await page.keyboard.press("ArrowRight");
    await expect(area(page)).toHaveAttribute(
      "aria-valuetext",
      /^Saturation 94%/,
    );

    await hue(page).focus();
    const before = await hue(page).getAttribute("aria-valuenow");
    await page.keyboard.press("ArrowLeft");
    expect(Number(await hue(page).getAttribute("aria-valuenow"))).toBe(
      Number(before) + 1,
    );
    await page.evaluate(() => {
      document.documentElement.removeAttribute("dir");
    });
  });

  test("keeps the colors in forced colors mode", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    try {
      const colors = await page.evaluate(() => {
        const read = (selector: string) => {
          const node = document.querySelector(selector);
          if (!node) throw new Error(`no ${selector}`);
          return getComputedStyle(node);
        };
        return {
          area: read(".bx--color-picker__area").backgroundColor,
          hueImage: read(".bx--color-picker__slider--hue").backgroundImage,
          hueBefore: getComputedStyle(
            document.querySelector(".bx--color-picker__slider--hue") as Element,
            "::before",
          ).backgroundImage,
          preview: read(".bx--color-picker__preview-face").backgroundColor,
          swatch: read(".bx--color-picker__swatch-face").backgroundColor,
          canvas: (() => {
            const probe = document.createElement("div");
            probe.style.backgroundColor = "Canvas";
            document.body.append(probe);
            const color = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return color;
          })(),
        };
      });

      expect(colors.area).toBe("rgb(0, 89, 255)");
      expect(colors.preview).toBe("rgb(15, 98, 254)");
      expect(colors.swatch).not.toBe(colors.canvas);
      expect(colors.hueBefore).toContain("linear-gradient");

      // The thumbs keep their colors, but the focus ring is `Highlight`.
      await area(page).focus();
      const ring = await area(page).evaluate((thumb) => {
        const probe = document.createElement("div");
        probe.style.color = "Highlight";
        document.body.append(probe);
        const highlight = getComputedStyle(probe).color;
        probe.remove();
        return { outline: getComputedStyle(thumb).outlineColor, highlight };
      });
      expect(ring.outline).toBe(ring.highlight);

      // The value still reads as text, and the chosen swatch carries a mark.
      await expect(
        picker(page).getByRole("textbox", { name: "Hex" }),
      ).toHaveValue("#0f62fe");
      await picker(page).getByRole("option", { name: "Red 60" }).click();
      await expect(
        picker(page).locator(".bx--color-picker__swatch--selected svg").first(),
      ).toBeVisible();
      await expect(
        picker(page).locator(".bx--color-picker__swatch--selected").first(),
      ).toHaveCSS("border-top-color", ring.highlight);
    } finally {
      await page.emulateMedia({ forcedColors: "none" });
    }
  });

  test("draws the Gray 100 theme", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
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
});
