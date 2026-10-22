import type { Locator } from "@playwright/test";
import { expect, test } from "./helpers/host";

const opacity = (el: Locator) =>
  el.evaluate((node) => getComputedStyle(node).opacity);

test.describe("CopyInput reveal toggle", () => {
  test("puts the toggle's tooltip as far from it as the copy button's", async ({
    page,
  }) => {
    await page.goto("/copy-input.html");
    const field = page.getByTestId("toggle-md");
    const toggle = field.getByRole("button", { name: "Show value" });
    const copyButton = field.getByRole("button", { name: "Copy to clipboard" });
    const tooltip = page.locator(".bx--tooltip-portal__content");

    const toggleRect = await toggle.boundingBox();
    await toggle.hover();
    await expect(tooltip).toBeVisible();
    const toggleTooltipRect = await tooltip.boundingBox();

    // Move away and let the tooltip clear before measuring the copy button's
    // own gap.
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);

    const copyRect = await copyButton.boundingBox();
    await copyButton.hover();
    await expect(tooltip).toBeVisible();
    const copyTooltipRect = await tooltip.boundingBox();

    if (!toggleRect || !toggleTooltipRect || !copyRect || !copyTooltipRect)
      throw new Error("box");
    const toggleGap = toggleTooltipRect.y - (toggleRect.y + toggleRect.height);
    const copyGap = copyTooltipRect.y - (copyRect.y + copyRect.height);
    expect(toggleGap).toBe(copyGap);
  });

  // The toggle sits right before the copy button, at every size, and the
  // value stops before both.
  for (const dir of ["ltr", "rtl"]) {
    test(`sits beside the copy button (${dir})`, async ({ page }) => {
      await page.goto(`/copy-input.html?dir=${dir}`);
      for (const size of ["sm", "md", "xl", "fluid"]) {
        const field = page.getByTestId(`toggle-${size}`);
        const [input, toggle, copy] = await Promise.all([
          field.locator("input").first(),
          field.getByRole("button", { name: "Show value" }),
          field.getByRole("button", { name: "Copy to clipboard" }),
        ]);
        const [toggleBox, copyBox] = await Promise.all([
          toggle.boundingBox(),
          copy.boundingBox(),
        ]);
        if (!toggleBox || !copyBox) throw new Error(size);
        const gap =
          dir === "rtl"
            ? toggleBox.x - (copyBox.x + copyBox.width)
            : copyBox.x - (toggleBox.x + toggleBox.width);
        expect.soft(Math.abs(gap), `${size} gap`).toBeLessThanOrEqual(1);
        expect.soft(toggleBox.width, `${size} width`).toBe(copyBox.width);

        // The value's end padding clears both buttons.
        const padding = await input.evaluate((el, d) => {
          const style = getComputedStyle(el);
          return Number.parseFloat(
            d === "rtl" ? style.paddingLeft : style.paddingRight,
          );
        }, dir);
        expect
          .soft(padding, `${size} padding`)
          .toBeGreaterThanOrEqual(toggleBox.width + copyBox.width);
      }
    });
  }
});

test.describe('CopyInput copyButtonVisibility="hover-focus"', () => {
  test("shows the copy button on hover and on keyboard focus", async ({
    page,
  }) => {
    await page.goto("/copy-input.html");
    const field = page.getByTestId("copy-on-hover");
    const input = field.getByRole("textbox", { name: "Webhook secret" });
    const copy = field.getByRole("button", { name: "Copy to clipboard" });

    await page.mouse.move(0, 0);
    await expect.poll(() => opacity(copy)).toBe("0");

    await input.hover();
    await expect.poll(() => opacity(copy)).toBe("1");
    await page.mouse.move(0, 0);
    await expect.poll(() => opacity(copy)).toBe("0");

    // Tab reaches the hidden button, and it shows while focus is inside.
    await input.focus();
    await expect.poll(() => opacity(copy)).toBe("1");
    await page.keyboard.press("Tab");
    await expect(copy).toBeFocused();
    await expect.poll(() => opacity(copy)).toBe("1");
  });

  test("always shows the copy button where nothing can hover", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/copy-input.html");
    expect(
      await page.evaluate(() => matchMedia("(any-hover: none)").matches),
    ).toBe(true);
    const copy = page
      .getByTestId("copy-on-hover")
      .getByRole("button", { name: "Copy to clipboard" });
    await expect.poll(() => opacity(copy)).toBe("1");
    await context.close();
  });
});
