import { expect, test } from "@playwright/test";

test.describe("CopyInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copy-input.html");
  });

  test("positions the toggle and copy button tooltips the same distance from their trigger", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: "Show value" });
    const copyButton = page.getByRole("button", { name: "Copy to clipboard" });
    const tooltip = page.locator(".bx--tooltip-portal__content");

    const toggleRect = await toggle.boundingBox();
    await toggle.hover();
    await expect(tooltip).toBeVisible();
    const toggleTooltipRect = await tooltip.boundingBox();

    // Move away and let the copy button's tooltip leave-delay clear before
    // measuring its own gap.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);

    const copyRect = await copyButton.boundingBox();
    await copyButton.hover();
    await expect(tooltip).toBeVisible();
    const copyTooltipRect = await tooltip.boundingBox();

    const toggleGap = toggleTooltipRect.y - (toggleRect.y + toggleRect.height);
    const copyGap = copyTooltipRect.y - (copyRect.y + copyRect.height);

    expect(toggleGap).toBe(copyGap);
  });

  test("never shows both tooltips at once when moving quickly between the toggle and the copy button", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: "Show value" });
    const copyButton = page.getByRole("button", { name: "Copy to clipboard" });
    const tooltip = page.locator(".bx--tooltip-portal__content");

    await toggle.hover();
    await expect(tooltip).toHaveText("Show value");

    // Handoff to the copy button should be instant, not wait out the
    // toggle's own leave delay while the copy button's tooltip is already
    // showing (which would render both at once).
    await copyButton.hover();
    await expect(tooltip).toHaveText("Copy to clipboard");
    await expect(tooltip).toHaveCount(1);

    // And the reverse direction.
    await toggle.hover();
    await expect(tooltip).toHaveText("Show value");
    await expect(tooltip).toHaveCount(1);
  });
});
