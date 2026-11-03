import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectAligned, expectSingleRing } from "./helpers/layout";

const field = (page: Page, id: string) => page.getByTestId(id);
const segments = (page: Page, id: string) =>
  field(page, id).getByRole("spinbutton");

test.beforeEach(async ({ page }) => {
  await page.goto("/duration-input.html");
  await expect(field(page, "duration-default")).toBeVisible();
});

test.describe("DurationInput keyboard", () => {
  test("carries a minute past 59 into the hour", async ({ page }) => {
    const [hours, minutes] = [
      segments(page, "duration-default").nth(0),
      segments(page, "duration-default").nth(1),
    ];
    // 1h 30m. Walk the minutes to 59, then one more.
    await minutes.focus();
    await page.keyboard.press("End");
    await expect(minutes).toHaveValue("59");
    await page.keyboard.press("ArrowUp");

    await expect(hours).toHaveValue("02");
    await expect(minutes).toHaveValue("00");
    await expect(page.getByTestId("duration-value")).toHaveText("7200000");
  });

  test("types a duration without leaving the keyboard", async ({ page }) => {
    const group = segments(page, "duration-default");
    await group.first().focus();
    await page.keyboard.press("Backspace");
    await page.keyboard.type("2:45");
    await expect(group.nth(2)).toBeFocused();
    await page.keyboard.type("09");

    await expect
      .poll(() => group.evaluateAll((nodes) => nodes.map((n) => n.value)))
      .toEqual(["02", "45", "09"]);
    await expect(page.getByTestId("duration-value")).toHaveText(
      String((2 * 3600 + 45 * 60 + 9) * 1000),
    );
  });

  test("steps the smallest segment by `step` and stops at `max`", async ({
    page,
  }) => {
    const [hours, minutes] = [
      segments(page, "duration-step").nth(0),
      segments(page, "duration-step").nth(1),
    ];
    await minutes.focus();
    await page.keyboard.press("ArrowUp");
    await expect(minutes).toHaveValue("30");
    // Ten quarter hours is past the two-hour `max`.
    await page.keyboard.press("PageUp");
    await expect(hours).toHaveValue("02");
    await expect(minutes).toHaveValue("00");
  });

  test("reads a typed duration in the text variant", async ({ page }) => {
    const input = field(page, "duration-text").getByRole("textbox");
    await input.fill("1.5h");
    await input.press("Enter");

    await expect(input).toHaveValue("1h 30m");
    await expect(page.getByTestId("duration-text-value")).toHaveText("5400000");
    await expect(field(page, "duration-text").getByRole("status")).toHaveText(
      "1 hour, 30 minutes",
    );
  });

  test("keeps Tab order across the segments", async ({ page }) => {
    const group = segments(page, "duration-default");
    await group.first().focus();
    await page.keyboard.press("Tab");
    await expect(group.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(group.nth(2)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(group.nth(1)).toBeFocused();
  });
});

test.describe("DurationInput in a Modal", () => {
  test("takes typed digits, and Escape closes the modal", async ({ page }) => {
    await page.getByTestId("duration-open").click();
    const group = segments(page, "duration-modal");
    await expect(group.first()).toBeVisible();

    await group.first().focus();
    await page.keyboard.type("1");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("30");
    await expect(page.getByTestId("duration-modal-value")).toHaveText(
      "5400000",
    );

    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(0);
  });
});

test.describe("DurationInput units", () => {
  test("writes localized unit labels", async ({ page }) => {
    const units = field(page, "duration-german").locator(
      ".bx--duration-input__unit",
    );
    await expect(units).toHaveText(["Std.", "Min.", "Sek."]);
    await expect(segments(page, "duration-german").first()).toHaveAttribute(
      "aria-valuetext",
      "1 Stunde, 2 Minuten und 3 Sekunden",
    );
  });

  test("spans days to milliseconds", async ({ page }) => {
    await expect
      .poll(() =>
        segments(page, "duration-days").evaluateAll((nodes) =>
          nodes.map((n) => n.value),
        ),
      )
      .toEqual(["01", "02", "03", "04", "005"]);
  });
});

test.describe("DurationInput a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none in Gray 100", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("has none inside an open Modal", async ({ page }) => {
    await page.getByTestId("duration-open").click();
    await expect(segments(page, "duration-modal").first()).toBeVisible();
    // Axe reads colors, so wait out the modal's fade in.
    await expect(page.locator(".bx--modal.is-visible")).toHaveCount(1);
    await expect
      .poll(() =>
        page
          .locator(".bx--modal-container")
          .evaluate(
            (node) =>
              getComputedStyle(node).backgroundColor +
              document.getAnimations().length,
          ),
      )
      .toBe("rgb(244, 244, 244)0");
    const results = await new AxeBuilder({ page })
      .include("[data-testid=duration-modal]")
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

test.describe("DurationInput layout", () => {
  test("keeps the segments in reading order under RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const boxes = await segments(page, "duration-default").evaluateAll(
      (nodes) => nodes.map((node) => node.getBoundingClientRect().left),
    );

    expect(boxes).toEqual([...boxes].sort((a, b) => a - b));
  });

  test("lines the segments up on one baseline", async ({ page }) => {
    await expectAligned(
      [
        segments(page, "duration-days").nth(0),
        segments(page, "duration-days").nth(1),
        segments(page, "duration-days").nth(4),
      ],
      { edge: "baseline" },
    );
  });

  test("draws one focus ring under forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const segment = segments(page, "duration-default").nth(1);
    await segment.focus();

    const outline = await segment.evaluate((node) => {
      const style = getComputedStyle(node);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).toBe("solid");
    expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
    await expectSingleRing(field(page, "duration-default"));
  });

  test("shows the invalid and warning messages under the group", async ({
    page,
  }) => {
    await expect(
      field(page, "duration-invalid").getByRole("alert"),
    ).toBeVisible();
    await expect(
      field(page, "duration-warn").getByText(
        "Short lifetimes raise server load",
      ),
    ).toBeVisible();
  });
});
