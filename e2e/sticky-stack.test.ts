import { expect, test } from "./helpers/host";

const top = (page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((node: Element) => node.getBoundingClientRect().top);
const height = (page, testId: string) =>
  page
    .getByTestId(testId)
    .evaluate((node: Element) => node.getBoundingClientRect().height);

test.describe("sticky stacked offsets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sticky-stack.html");
    await page.evaluate(() => document.fonts.ready);
  });

  test("a PageHeader sticks below the Header and a Toolbar below both", async ({
    page,
  }) => {
    const headerHeight = await height(page, "page-header");
    const toolbarHeight = await height(page, "toolbar");
    await expect
      .poll(() =>
        page.evaluate(() =>
          document.documentElement.style.getPropertyValue(
            "--ccs-sticky-offset",
          ),
        ),
      )
      .toBe(`${48 + headerHeight + toolbarHeight}px`);

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(() => top(page, "page-header")).toBe(48);
    await expect.poll(() => top(page, "toolbar")).toBe(48 + headerHeight);
    await expect(page.getByTestId("page-header")).toHaveClass(
      /bx--page-header--stuck/,
    );
    await expect(page.getByTestId("toolbar")).toHaveClass(
      /bx--table-toolbar--stuck/,
    );
  });

  test("a link lands below the bars with scroll-padding-top", async ({
    page,
  }) => {
    await page.addStyleTag({
      content: "html { scroll-padding-top: var(--ccs-sticky-offset); }",
    });
    const readOffset = () =>
      page.evaluate(() =>
        Number.parseFloat(
          document.documentElement.style.getPropertyValue(
            "--ccs-sticky-offset",
          ),
        ),
      );
    // Once the bars are measured, past the Header's 48px.
    await expect.poll(readOffset).toBeGreaterThan(48 + 48);
    const offset = await readOffset();

    await page.getByTestId("link").click();
    await expect
      .poll(() =>
        page
          .locator("#region-6")
          .evaluate((node) => Math.round(node.getBoundingClientRect().top)),
      )
      .toBe(Math.round(offset));
  });
});
