import { expect, test } from "@playwright/test";

test.describe("Data visualization", () => {
  test("viz tokens follow the theme", async ({ page }) => {
    await page.goto("/viz.html");
    const token = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--cds-viz-cat-01")
          .trim(),
      );

    expect(await token()).toBe("#6929c4");
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    expect(await token()).toBe("#8a3ffc");
  });

  test("FunnelBars sizes bars from the stage values", async ({ page }) => {
    await page.goto("/viz.html");
    const table = page.getByRole("table", {
      name: /Signup funnel, last 30 days/,
    });
    const widths = await table
      .locator(".bx--viz-funnel-bars__bar")
      .evaluateAll((bars) =>
        bars.map((bar) => bar.getBoundingClientRect().width),
      );

    expect(widths).toHaveLength(4);
    expect(widths[1] / widths[0]).toBeCloseTo(0.6, 1);
    expect(widths[3] / widths[0]).toBeCloseTo(0.09, 1);
  });

  test("selectable FunnelBars is one tab stop with arrow key navigation", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const funnel = page.getByTestId("selectable-funnel");

    await funnel.getByRole("button", { name: "Activated" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(funnel.getByRole("button", { name: "Paid" })).toBeFocused();
    await expect(page.getByTestId("selected")).toHaveText("activate");

    await page.keyboard.press("Enter");
    await expect(page.getByTestId("selected")).toHaveText("paid");
    await expect(funnel.getByRole("button", { name: "Paid" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await funnel.getByRole("row", { name: /Signup/ }).click();
    await expect(page.getByTestId("selected")).toHaveText("signup");
  });

  test("LineChart follows its container and shows a tooltip for the focused point", async ({
    page,
  }) => {
    await page.goto("/viz.html");
    const chart = page.getByRole("application", { name: "Revenue by region" });

    // The nominal server width is replaced by the measured one.
    await expect
      .poll(async () => (await chart.getAttribute("viewBox")) ?? "")
      .not.toBe("0 0 640 288");
    const box = await chart.boundingBox();
    expect((await chart.getAttribute("viewBox")) ?? "").toBe(
      `0 0 ${Math.round(box?.width ?? 0)} 288`,
    );

    await chart.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const tooltip = page.locator(".bx--viz-chart-tooltip");
    await expect(tooltip).toContainText("Feb 1, 2026");
    await expect(tooltip).toContainText("EMEA");

    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
  });
});
