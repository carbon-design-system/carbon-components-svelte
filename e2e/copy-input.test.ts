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
});
