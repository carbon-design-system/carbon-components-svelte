import { expect, test } from "./helpers/host";

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

  for (const [testId, columns] of [
    ["grid-wide", 5],
    ["grid-narrow", 3],
  ] as const) {
    test(`wraps into ${columns} even columns (${testId})`, async ({ page }) => {
      const layout = await page.getByTestId(testId).evaluate((node) => {
        const buttons = [...node.querySelectorAll(".bx--toggle-button")];
        const lefts = new Set(
          buttons.map((b) => Math.round(b.getBoundingClientRect().left)),
        );
        const widths = new Set(
          buttons.map((b) => Math.round(b.getBoundingClientRect().width)),
        );
        const right = node.getBoundingClientRect().right;
        const overflow = Math.max(
          ...buttons.map((b) => b.getBoundingClientRect().right - right),
        );
        return { columns: lefts.size, widths: widths.size, overflow };
      });

      expect(layout.columns).toBe(columns);
      expect(layout.widths).toBe(1);
      expect(layout.overflow).toBeLessThanOrEqual(0.5);
    });
  }

  test("moves between grid rows with Up and Down", async ({ page }) => {
    // Five columns, so the sixth button sits below the first.
    const grid = page.getByTestId("grid-wide");
    await grid.getByRole("button", { name: "9:00 AM" }).focus();

    await page.keyboard.press("ArrowDown");
    await expect(grid.getByRole("button", { name: "2:00 PM" })).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(grid.getByRole("button", { name: "9:00 AM" })).toBeFocused();
  });
});
