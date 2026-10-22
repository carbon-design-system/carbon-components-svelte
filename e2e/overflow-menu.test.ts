import { expect, test } from "./helpers/host";

test.describe("OverflowMenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/overflow-menu.html");
  });

  test("opens menu on click", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();

    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 2" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Action 3" }),
    ).toBeVisible();
  });

  test("selects menu item", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Action 2" }).click();

    await expect(page.getByTestId("selected-action")).toContainText("Action 2");
  });

  test("closes on outside click", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();

    await page.getByTestId("outside-area").click();

    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).not.toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const trigger = page.getByTestId("overflow-menu");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
  });

  test("opens menu with Enter key", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
  });

  test("closes menu with Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Actions" }).click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).not.toBeVisible();
  });

  test("focus returns to trigger after Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    await trigger.click();
    await expect(
      page.getByRole("menuitem", { name: "Action 1" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("positions the menu below and flush with the trigger's left edge", async ({
    page,
  }) => {
    const trigger = page.getByTestId("overflow-menu");
    await trigger.click();

    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    const triggerBox = await trigger.boundingBox();
    const menuBox = await menu.boundingBox();
    if (!triggerBox || !menuBox) throw new Error("missing bounding box");

    // direction="bottom" (default), not flipped: menu top sits at the
    // trigger's bottom edge, menu left aligns with the trigger's left edge.
    expect(menuBox.y).toBeCloseTo(triggerBox.y + triggerBox.height, 0);
    expect(menuBox.x).toBeCloseTo(triggerBox.x, 0);
  });

  test("shows the trigger's tooltip above it on hover and focus, not while open", async ({
    page,
  }) => {
    const trigger = page.getByRole("button", { name: "Actions" });
    const tooltip = page.locator(".bx--tooltip-portal");
    await expect(trigger.locator("title")).toHaveCount(0);

    await trigger.hover();
    await expect(tooltip).toHaveText("Actions");
    await expect(tooltip).toHaveAttribute("data-direction", "top");
    const triggerBox = await trigger.boundingBox();
    const tooltipBox = await tooltip.boundingBox();
    if (!triggerBox || !tooltipBox) throw new Error("missing bounding box");
    expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(triggerBox.y);
    expect(tooltipBox.x + tooltipBox.width / 2).toBeCloseTo(
      triggerBox.x + triggerBox.width / 2,
      0,
    );

    await trigger.click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(tooltip).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(tooltip).toHaveCount(0);

    await page.mouse.move(0, 0);
    await trigger.blur();
    await trigger.focus();
    await expect(tooltip).toHaveText("Actions");
  });
});
