import { expect, test } from "@playwright/test";

test.describe("ToggleButtonGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/toggle-button-group.html");
  });

  test("shows the pressed indicator on a non-first segment", async ({
    page,
  }) => {
    const italic = page.getByRole("button", { name: "Italic" });
    await italic.click();
    await italic.blur();

    // Regression: the divider between adjacent segments and the pressed
    // indicator both used `box-shadow`, and the divider's higher
    // specificity silently won on every segment but the first.
    await expect(italic).toHaveCSS("box-shadow", /inset/);
  });

  test("aligns a start/end tooltip flush with the anchor's edge", async ({
    page,
  }) => {
    const verticalGroup = page.getByRole("toolbar", {
      name: "Vertical icon-only",
    });
    const bold = verticalGroup.getByRole("button", { name: "Bold" });
    const underline = verticalGroup.getByRole("button", { name: "Underline" });

    // Regression: a hardcoded +1px nudge meant for Button/CopyButton/
    // CodeSnippet's icon-in-padded-button geometry doesn't apply to this
    // component's plain square icon-only cell, and made an "end"-aligned
    // tooltip overshoot the anchor's bottom edge by 1px.
    await bold.hover();
    const boldBox = await bold.boundingBox();
    const startTooltip = page.locator(".bx--tooltip-portal");
    await expect(startTooltip).toBeVisible();
    const startBox = await startTooltip.boundingBox();
    expect(Math.round(startBox.y)).toBe(Math.round(boldBox.y));

    await page.mouse.move(0, 0);
    await underline.hover();
    const underlineBox = await underline.boundingBox();
    const endTooltip = page.locator(".bx--tooltip-portal");
    await expect(endTooltip).toBeVisible();
    const endBox = await endTooltip.boundingBox();
    expect(Math.round(endBox.y + endBox.height)).toBe(
      Math.round(underlineBox.y + underlineBox.height),
    );
  });
});
