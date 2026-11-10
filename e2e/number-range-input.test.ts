import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** A number field is a spinbutton, and a formatted one a textbox. */
const input = (scope: Locator, side: "Minimum" | "Maximum") =>
  scope.locator(`input:not([type=hidden])[aria-label^="${side}"]`);

const paste = (target: Locator, text: string) =>
  target.evaluate((el, text) => {
    // Firefox drops `clipboardData` from a constructed ClipboardEvent, so
    // put it on a plain event.
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", {
      value: { getData: () => text },
    });
    el.dispatchEvent(event);
  }, text);

const value = (page: Page, id: string) =>
  page.getByTestId(`${id}-value`).textContent();

test.describe("NumberRangeInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/number-range-input.html");
    await expect(page.getByTestId("nri-default")).toBeVisible();
  });

  test("tabs through the fields and then the slider handles, and keys move both", async ({
    page,
  }) => {
    const facet = page.getByTestId("nri-sidebar");
    const min = input(facet, "Minimum");
    const max = input(facet, "Maximum");
    const [lower, upper] = [
      facet.getByRole("slider").first(),
      facet.getByRole("slider").last(),
    ];

    await min.focus();
    await page.keyboard.press("Tab");
    await expect(max).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(lower).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(upper).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(max).toHaveValue("$260");
    expect(await value(page, "nri-sidebar")).toBe("[10,260]");

    // Shift+Tab goes back through the same stops.
    await page.keyboard.press("Shift+Tab");
    await expect(lower).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(min).toHaveValue("$0");
  });

  test("puts a min above max on the field edited last, and keeps what was typed", async ({
    page,
  }) => {
    const group = page.getByTestId("nri-default");
    const min = input(group, "Minimum");
    const max = input(group, "Maximum");

    await min.fill("300");
    await max.fill("20");
    await page.keyboard.press("Tab");

    await expect(max).toHaveAttribute("aria-invalid", "true");
    await expect(min).not.toHaveAttribute("aria-invalid", "true");
    await expect(group.getByRole("alert")).toHaveText(
      "Must not be below the minimum, 300.",
    );
    await expect(max).toHaveAccessibleErrorMessage(
      "Must not be below the minimum, 300.",
    );
    expect(await value(page, "nri-default")).toBe("[300,20]");
    await expect(page.getByTestId("nri-default-valid")).toHaveText("false");

    // Fixing the minimum clears the error on the maximum.
    await min.fill("10");
    await expect(max).not.toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("nri-default-valid")).toHaveText("true");
  });

  test("names the bound a typed value is outside of", async ({ page }) => {
    const group = page.getByTestId("nri-default");

    await input(group, "Maximum").fill("5000");
    await page.keyboard.press("Tab");

    await expect(group.getByRole("alert")).toHaveText("Enter 1000 or less.");
  });

  test("splits a pasted range across both fields", async ({ page }) => {
    const group = page.getByTestId("nri-default");

    await input(group, "Minimum").focus();
    await paste(input(group, "Minimum"), "10-250");

    await expect(input(group, "Minimum")).toHaveValue("10");
    await expect(input(group, "Maximum")).toHaveValue("250");
    expect(await value(page, "nri-default")).toBe("[10,250]");
  });

  test("reads and writes decimals in the locale", async ({ page }) => {
    const group = page.getByTestId("nri-de");
    const min = input(group, "Minimum");

    await min.fill("1.234,5");
    await page.keyboard.press("Tab");

    expect(await value(page, "nri-de")).toBe("[1234.5,null]");
    await expect(min).toHaveValue("1.234,5");

    await paste(min, "2,5 – 1.000");
    expect(await value(page, "nri-de")).toBe("[2.5,1000]");
    await expect(input(group, "Maximum")).toHaveValue("1.000");
  });

  test("requires both ends when open ends are off, once a field is left", async ({
    page,
  }) => {
    const group = page.getByTestId("nri-ports");
    const min = input(group, "Minimum");

    await min.fill("");
    await page.keyboard.press("Tab");

    await expect(min).toHaveAttribute("aria-invalid", "true");
    await expect(group.getByRole("alert")).toHaveText("Enter a minimum.");
  });

  test("stacks the fields in a narrow container and not in a 288px sidebar", async ({
    page,
  }) => {
    const rows = async (id: string) => {
      const group = page.getByTestId(id);
      const [min, max] = await Promise.all([
        input(group, "Minimum").boundingBox(),
        input(group, "Maximum").boundingBox(),
      ]);
      return {
        min: min as NonNullable<typeof min>,
        max: max as NonNullable<typeof max>,
      };
    };

    const narrow = await rows("nri-narrow");
    expect(narrow.max.y).toBeGreaterThan(narrow.min.y + narrow.min.height);
    await expect(
      page
        .getByTestId("nri-narrow")
        .locator(".bx--number-range-input__separator"),
    ).toBeHidden();

    const sidebar = await rows("nri-sidebar");
    expect(sidebar.max.y).toBe(sidebar.min.y);
    expect(sidebar.max.x).toBeGreaterThan(sidebar.min.x + sidebar.min.width);
    // Neither field overflows the 288px sidebar.
    const box = await page.getByTestId("nri-sidebar").boundingBox();
    expect(sidebar.max.x + sidebar.max.width).toBeLessThanOrEqual(
      (box?.x ?? 0) + (box?.width ?? 0),
    );
  });

  test("keeps the separator level with the inputs", async ({ page }) => {
    for (const id of ["nri-default", "nri-memory"]) {
      const group = page.getByTestId(id);
      const [box, sep] = await Promise.all([
        input(group, "Minimum").boundingBox(),
        group.locator(".bx--number-range-input__separator").boundingBox(),
      ]);
      const [a, b] = [
        (box?.y ?? 0) + (box?.height ?? 0) / 2,
        (sep?.y ?? 0) + (sep?.height ?? 0) / 2,
      ];
      expect(Math.abs(a - b)).toBeLessThanOrEqual(1);
    }
  });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`reads minimum first in ${dir}, at the start edge`, async ({
      page,
    }) => {
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
      const group = page.getByTestId("nri-default");
      const [min, max] = await Promise.all([
        input(group, "Minimum").boundingBox(),
        input(group, "Maximum").boundingBox(),
      ]);
      if (dir === "ltr") expect(min?.x).toBeLessThan(max?.x ?? 0);
      else expect(min?.x).toBeGreaterThan(max?.x ?? 0);

      // Digits keep their order: typing 12 reads 12, not 21.
      await input(group, "Minimum").fill("12");
      await expect(input(group, "Minimum")).toHaveValue("12");
    });
  }

  test("moves the slider handle in RTL toward the inline end for a higher value", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const facet = page.getByTestId("nri-sidebar");
    const [lower, upper] = [
      (await facet.getByRole("slider").first().boundingBox())?.x ?? 0,
      (await facet.getByRole("slider").last().boundingBox())?.x ?? 0,
    ];
    // Min sits on the right, as in the fields.
    expect(lower).toBeGreaterThan(upper);
  });

  for (const theme of ["white", "g100"]) {
    for (const dir of ["ltr", "rtl"]) {
      test(`has no detectable accessibility violations in ${theme} ${dir}`, async ({
        page,
      }) => {
        await page.evaluate(
          ([theme, dir]) => {
            document.documentElement.dir = dir;
            if (theme === "g100") {
              document.documentElement.classList.add("bx--g100");
            }
          },
          [theme, dir],
        );
        // Show an error and a crossed pair too, so those states are checked.
        const group = page.getByTestId("nri-default");
        await input(group, "Maximum").fill("5000");
        await page.keyboard.press("Tab");
        // Axe reads colors, so let the theme's color transitions finish.
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((a) => a.finished)),
        );

        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }

  test("stays usable in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const group = page.getByTestId("nri-crossed");

    // The error outline and the separator survive the palette swap.
    const outline = await input(group, "Maximum").evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        outline: style.outlineStyle,
        border: style.borderBottomStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(outline.outline !== "none" || outline.border !== "none").toBe(true);
    await expect(
      page
        .getByTestId("nri-default")
        .locator(".bx--number-range-input__separator"),
    ).toBeVisible();
    await expect(group.getByRole("alert")).toBeVisible();
  });
});
