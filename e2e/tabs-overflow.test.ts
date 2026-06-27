import { expect, test } from "@playwright/test";

const NEXT = ".bx--tab--overflow-nav-button--next";
const PREV = ".bx--tab--overflow-nav-button--previous";
const HIDDEN = "bx--tab--overflow-nav-button--hidden";

test.describe("Tabs overflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tabs-overflow.html");
  });

  test("shows scroll buttons when the tab list overflows", async ({ page }) => {
    // At the start, the forward button is visible and the backward one hidden.
    await expect(page.locator(NEXT)).not.toHaveClass(new RegExp(HIDDEN));
    await expect(page.locator(PREV)).toHaveClass(new RegExp(HIDDEN));
  });

  test("forward button scrolls the list and reveals the backward button", async ({
    page,
  }) => {
    const nav = page.getByRole("tablist");
    expect(await nav.evaluate((n) => n.scrollLeft)).toBe(0);

    await page.locator(NEXT).click();

    await expect
      .poll(async () => nav.evaluate((n) => n.scrollLeft))
      .toBeGreaterThan(0);
    await expect(page.locator(PREV)).not.toHaveClass(new RegExp(HIDDEN));
  });

  test("keyboard navigation keeps the focused tab visible", async ({
    page,
  }) => {
    await page.getByRole("tab", { name: "Tab label 1", exact: true }).focus();

    // Arrow through several variable-width tabs; the focused tab must stay
    // within the scroll viewport rather than drifting off-screen.
    for (let i = 0; i < 6; i++) {
      // biome-ignore lint/performance/noAwaitInLoops: arrow presses are sequential
      await page.keyboard.press("ArrowRight");
    }

    const focused = page.locator("[role=tab]:focus");
    await expect(focused).toHaveAttribute("aria-selected", "true");

    const visible = await focused.evaluate((tab) => {
      const nav = tab.closest(".bx--tabs__nav") as HTMLElement;
      const navRect = nav.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      return (
        tabRect.left >= navRect.left - 1 && tabRect.right <= navRect.right + 1
      );
    });
    expect(visible).toBe(true);
  });
});
