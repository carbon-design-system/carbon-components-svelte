import { expect, test } from "./helpers/host";

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

    // First avatar inherits lg (3rem = 48px); the second keeps sm (1.5rem = 24px).
    expect(await avatars.nth(0).evaluate(width)).toBeCloseTo(48, 0);
    expect(await avatars.nth(1).evaluate(width)).toBeCloseTo(24, 0);
  });

  test("shows only one avatar tooltip at a time", async ({ page }) => {
    const avatars = page.getByTestId("coord").locator(".bx--user-avatar");
    // Tooltips are portalled out of the group and only coordinate within
    // it, so query this group's tooltips by name.
    const alpha = page.getByRole("tooltip", { name: "Alpha" });
    const beta = page.getByRole("tooltip", { name: "Beta" });

    await avatars.nth(0).hover();
    await expect(alpha).toBeVisible();

    // Hovering a different avatar replaces the open tooltip rather than
    // stacking a second one.
    await avatars.nth(1).hover();
    await expect(beta).toBeVisible();
    await expect(alpha).toBeHidden();
  });

  test("caps the overflow label at 99+", async ({ page }) => {
    const overflow = page
      .getByTestId("big")
      .locator(".bx--user-avatar-group__overflow");
    await expect(overflow).toHaveText("99+");
  });

  test("reverses stacking order so the first avatar paints on top, even wrapped in a tooltip", async ({
    page,
  }) => {
    // Every avatar sets `tooltipText`, wrapping the registered element in a
    // `TooltipDefinition`; the z-index must land on that direct-child
    // wrapper, not the nested (non-positioned) avatar span.
    const items = page
      .getByTestId("stack-first")
      .locator(".bx--user-avatar-group--overlap > *");

    const zIndex = (el: Element) =>
      Number.parseInt(getComputedStyle(el).zIndex, 10);
    const first = await items.nth(0).evaluate(zIndex);
    const second = await items.nth(1).evaluate(zIndex);
    const third = await items.nth(2).evaluate(zIndex);

    expect(first).toBeGreaterThan(second);
    expect(second).toBeGreaterThan(third);

    // The "+N" overflow chip (max={2} hides the third avatar) isn't a
    // registered item; it should render behind every real avatar.
    const overflow = await items.nth(3).evaluate(zIndex);
    expect(overflow).toBeLessThan(third);
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

  test("sizes avatars and their initials on Carbon's scale", async ({
    page,
  }) => {
    const avatars = await page
      .getByTestId("sizes")
      .locator(".bx--user-avatar")
      .evaluateAll((els) =>
        els.map((el) => {
          const text = el.querySelector(".bx--user-avatar__text");
          return {
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height,
            fontSize: text ? getComputedStyle(text).fontSize : "",
          };
        }),
      );
    expect(avatars).toEqual([
      { width: 24, height: 24, fontSize: "12px" },
      { width: 32, height: 32, fontSize: "14px" },
      { width: 48, height: 48, fontSize: "20px" },
      { width: 64, height: 64, fontSize: "28px" },
    ]);
  });

  test("lightens the fill and darkens the initials in a dark theme", async ({
    page,
  }) => {
    const colors = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(".bx--user-avatar")
        .evaluateAll((els) =>
          els.map((el) => ({
            background: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
          })),
        );
    // Red 60 and strong Cyan 80 with white initials; Red 50 and strong
    // Cyan 30 with Gray 100 initials.
    expect(await colors("white")).toEqual([
      { background: "rgb(218, 30, 40)", color: "rgb(255, 255, 255)" },
      { background: "rgb(0, 58, 109)", color: "rgb(255, 255, 255)" },
    ]);
    expect(await colors("g100")).toEqual([
      { background: "rgb(250, 77, 86)", color: "rgb(22, 22, 22)" },
      { background: "rgb(130, 207, 255)", color: "rgb(22, 22, 22)" },
    ]);
  });

  test("draws the overlap ring in the surface color of a layer", async ({
    page,
  }) => {
    const layer = page.getByTestId("layer");
    const surface = await layer.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    const ring = await layer
      .locator(".bx--user-avatar")
      .first()
      .evaluate((el) => getComputedStyle(el).boxShadow);
    expect(ring.startsWith(surface)).toBe(true);
  });

  test("overlaps from the inline start in RTL", async ({ page }) => {
    const items = page.getByTestId("rtl").locator(".bx--user-avatar");
    const first = await items.nth(0).boundingBox();
    const second = await items.nth(1).boundingBox();
    if (!first || !second) throw new Error("avatars not laid out");
    // The second avatar sits to the left and tucks 8px under the first.
    expect(second.x + second.width - first.x).toBeCloseTo(8, 0);
  });
});
