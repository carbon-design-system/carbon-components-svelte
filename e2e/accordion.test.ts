import { expect, test } from "./helpers/host";

test.describe("Accordion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/accordion.html");
  });

  test("renders accordion items", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Section 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Section 2" })).toBeVisible();
  });

  test("expands item on click", async ({ page }) => {
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.getByText("Content for section 1")).toBeVisible();
  });

  test("collapses item on second click", async ({ page }) => {
    const button = page.getByRole("button", { name: "Section 1" });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("can be located by data-testid", async ({ page }) => {
    const accordion = page.getByTestId("accordion");
    await expect(accordion).toBeVisible();
    const item1 = page.getByTestId("accordion-item-1");
    await item1.getByRole("button").click();
    await expect(page.getByText("Content for section 1")).toBeVisible();
  });

  test("mirrors the arrow and title in RTL", async ({ page }) => {
    const measure = () =>
      page.evaluate(async () => {
        await document.fonts.ready;
        const result: Record<string, { left: number; right: number }> = {};
        for (const id of [
          "accordion",
          "accordion-start",
          "accordion-heading-end",
        ]) {
          const root = document.querySelector(`[data-testid=${id}]`);
          const arrow = root?.querySelector(".bx--accordion__arrow");
          const title = root?.querySelector(".bx--accordion__title");
          if (!arrow || !title) throw new Error(`${id} not found`);
          // The title box spans the free width, so measure its text.
          const range = document.createRange();
          range.selectNodeContents(title);
          const end = root?.querySelector(".bx--accordion__heading-end");
          const rects = {
            arrow: arrow.getBoundingClientRect(),
            title: range.getBoundingClientRect(),
            ...(end && { end: end.getBoundingClientRect() }),
          };
          for (const [name, rect] of Object.entries(rects)) {
            result[`${id} ${name}`] = {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
            };
          }
        }
        return result;
      });

    const ltr = await measure();
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const rtl = await measure();
    const width = page.viewportSize()?.width ?? 0;

    for (const [name, box] of Object.entries(ltr)) {
      expect
        .soft(Math.abs(rtl[name].left - (width - box.right)), name)
        .toBeLessThanOrEqual(1);
    }
  });

  test("lines up the chevrons of items with and without headingEnd", async ({
    page,
  }) => {
    const arrows = page
      .getByTestId("accordion-heading-end")
      .locator(".bx--accordion__arrow");
    const [first, second] = await Promise.all([
      arrows.nth(0).boundingBox(),
      arrows.nth(1).boundingBox(),
    ]);
    expect(first?.x).toBe(second?.x);

    const end = await page
      .getByTestId("accordion-heading-end")
      .locator(".bx--accordion__heading-end")
      .boundingBox();
    expect(end?.x).toBeGreaterThan((first?.x ?? 0) + (first?.width ?? 0));
  });
});
