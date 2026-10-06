import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("TableOfContents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/table-of-contents.html");
    await expect(page.getByTestId("selected-id")).toHaveText("overview");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();

    expect(results.violations).toEqual([]);
  });

  test("moves the active bar onto a clicked item", async ({ page }) => {
    const link = page.getByRole("link", { name: "Key moments" });
    await link.click();

    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(page.getByTestId("selected-id")).toHaveText("key-moments");

    const item = await link.locator("..").boundingBox();
    const bar = page.locator(".bx--toc__bar");
    await expect
      .poll(async () => (await bar.boundingBox())?.y)
      .toBeCloseTo(item?.y ?? Number.NaN, 0);
    expect((await bar.boundingBox())?.height).toBeCloseTo(
      item?.height ?? Number.NaN,
      0,
    );
  });

  test("outlines a link on keyboard focus but not on click", async ({
    page,
  }) => {
    const outline = (name: string) =>
      page
        .getByRole("link", { name })
        .evaluate((el) => getComputedStyle(el).outlineStyle);

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Overview" })).toBeFocused();
    expect(await outline("Overview")).toBe("solid");

    // Mousedown focuses the link; check it before the hash jump moves focus.
    const link = page.getByRole("link", { name: "Key moments" });
    const box = await link.boundingBox();
    await page.mouse.move(
      (box?.x ?? 0) + (box?.width ?? 0) / 2,
      (box?.y ?? 0) + (box?.height ?? 0) / 2,
    );
    await page.mouse.down();
    await expect(link).toBeFocused();
    expect(await outline("Key moments")).toBe("none");
    await page.mouse.up();
  });

  test("tracks the section scrolled to the top", async ({ page }) => {
    await page.evaluate(() => {
      const top = document.getElementById("tutorials")?.offsetTop ?? 0;
      window.scrollTo(0, top);
    });

    await expect(page.getByTestId("selected-id")).toHaveText("tutorials");
    await expect(page.getByRole("link", { name: "Tutorials" })).toHaveAttribute(
      "aria-current",
      "location",
    );
  });

  test("activates the last section at the end of the page", async ({
    page,
  }) => {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );

    await expect(page.getByTestId("selected-id")).toHaveText("articles");
  });

  test("keeps the active item in view in a scrolling sidebar", async ({
    page,
  }) => {
    const aside = page.locator("aside");
    await aside.evaluate((el: HTMLElement) => {
      el.style.maxHeight = "4rem";
      el.style.overflowY = "auto";
    });

    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(page.getByTestId("selected-id")).toHaveText("articles");

    const link = page.getByRole("link", { name: "Articles" });
    await expect
      .poll(async () => {
        const box = await aside.boundingBox();
        const item = await link.boundingBox();
        if (!box || !item) return false;
        return (
          item.y >= box.y - 1 && item.y + item.height <= box.y + box.height + 1
        );
      })
      .toBe(true);
  });

  test.describe("in an iframe", () => {
    test("scrolls the frame but not the page around it", async ({ page }) => {
      await page.goto("/table-of-contents-framed.html");
      const frame = page.frameLocator("iframe");
      await expect(frame.getByTestId("selected-id")).toHaveText("overview");

      await frame.getByRole("link", { name: "Tutorials" }).click();

      await expect(frame.getByTestId("selected-id")).toHaveText("tutorials");
      const frameScroll = await page
        .locator("iframe")
        .evaluate((el: HTMLIFrameElement) => el.contentWindow?.scrollY ?? 0);
      expect(frameScroll).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  });
});
