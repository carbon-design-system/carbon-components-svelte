import { expect, test } from "@playwright/test";

test.describe("SideNav active item scroll", () => {
  test("scrolls the active item into view inside the side nav", async ({
    page,
  }) => {
    await page.goto("/side-nav-active-item-scroll.html");
    const active = page.getByRole("link", { name: "Item 35" });
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(active).toBeInViewport();
  });

  test("leaves the skip link as the first Tab stop", async ({ page }) => {
    await page.goto("/side-nav-active-item-scroll.html");
    await expect(page.getByRole("link", { name: "Item 35" })).toBeInViewport();

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toBeFocused();
  });

  test("aligns the active item to the top with block start", async ({
    page,
  }) => {
    await page.goto("/side-nav-active-item-scroll.html?active=20&block=start");
    const active = page.getByRole("link", { name: "Item 20" });
    await expect(active).toBeInViewport();

    const offset = await active.evaluate((link) => {
      const scroller = link.closest(".bx--side-nav__items");
      const item = link.closest("li");
      if (!scroller || !item) return Number.NaN;
      return (
        item.getBoundingClientRect().top - scroller.getBoundingClientRect().top
      );
    });
    expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  });
});
