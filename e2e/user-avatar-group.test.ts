import { expect, test } from "@playwright/test";

test.describe("UserAvatarGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/user-avatar-group.html");
  });

  test("renders visible avatars and a +N overflow avatar", async ({ page }) => {
    const list = page.getByTestId("overlap").locator(".bx--user-avatar-group");
    await expect(list).toBeVisible();

    // Five slotted avatars + one overflow avatar are in the DOM.
    await expect(list.locator(".bx--user-avatar")).toHaveCount(6);
    // Two avatars past `max` of 3 are hidden as overflow.
    await expect(list.locator('[data-overflow="true"]')).toHaveCount(2);
    await expect(page.getByText("+2")).toBeVisible();
  });

  test("overflow avatar tooltip lists the hidden names", async ({ page }) => {
    await page
      .getByTestId("overlap")
      .locator(".bx--user-avatar-group__overflow")
      .hover();

    await expect(page.getByRole("tooltip")).toHaveText(
      "Bertram Gilfoyle, Jared Dunn",
    );
  });

  test("overlaps avatars with a negative margin and a ring", async ({
    page,
  }) => {
    const second = page.locator(".bx--user-avatar-group--overlap > *").nth(1);
    const marginLeft = await second.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).marginLeft),
    );
    expect(marginLeft).toBeLessThan(0);

    // A separation ring is drawn with box-shadow on the avatar circle.
    const boxShadow = await page
      .getByTestId("overlap")
      .locator(".bx--user-avatar")
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe("none");
  });

  test("tightens the overlap with a negative gap", async ({ page }) => {
    const second = page
      .getByTestId("tighter")
      .locator(".bx--user-avatar-group--overlap > *")
      .nth(1);
    const marginLeft = await second.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).marginLeft),
    );
    // gap="-1rem" overlaps by 16px, tighter than the default 8px stack.
    expect(marginLeft).toBeCloseTo(-16, 0);
  });

  test("cascades the group size to avatars that do not set their own", async ({
    page,
  }) => {
    const avatars = page.getByTestId("cascade").locator(".bx--user-avatar");
    const width = (el: Element) => el.getBoundingClientRect().width;

    // First avatar inherits lg (2.5rem = 40px); the second keeps sm (1.5rem = 24px).
    expect(await avatars.nth(0).evaluate(width)).toBeCloseTo(40, 0);
    expect(await avatars.nth(1).evaluate(width)).toBeCloseTo(24, 0);
  });

  test("shows only one avatar tooltip at a time", async ({ page }) => {
    const avatars = page.getByTestId("coord").locator(".bx--user-avatar");

    await avatars.nth(0).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Alpha");

    // Hovering a different avatar replaces the open tooltip rather than
    // stacking a second one.
    await avatars.nth(1).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Beta");
    await expect(page.getByRole("tooltip")).toHaveCount(1);
  });

  test("caps the overflow label at 99+", async ({ page }) => {
    const overflow = page
      .getByTestId("big")
      .locator(".bx--user-avatar-group__overflow");
    await expect(overflow).toHaveText("99+");
  });

  test("spaces avatars apart when a gap is set", async ({ page }) => {
    const list = page.getByTestId("spaced").locator(".bx--user-avatar-group");
    await expect(list).not.toHaveClass(/bx--user-avatar-group--overlap/);

    // No overflow avatar when max is 0.
    await expect(list.locator(".bx--user-avatar")).toHaveCount(2);

    // The gap comes from the Stack scale, not a negative margin.
    const gap = await list.evaluate((el) =>
      Number.parseFloat(getComputedStyle(el).columnGap),
    );
    expect(gap).toBeGreaterThan(0);

    const boxShadow = await list
      .locator(".bx--user-avatar")
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).toBe("none");
  });
});
