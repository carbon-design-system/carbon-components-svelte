import { expect, test } from "./helpers/host";

test.describe("print", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/print.html");
    await page.waitForSelector(".bx--modal.is-visible");
  });

  test("shows the application on screen", async ({ page }) => {
    await Promise.all(
      [
        ".bx--header",
        ".bx--side-nav",
        ".bx--table-toolbar",
        ".bx--pagination",
        ".bx--modal",
      ].map((selector) =>
        expect.soft(page.locator(selector).first(), selector).toBeVisible(),
      ),
    );

    await expect(
      page.getByTestId("accordion-content"),
      "closed accordion content",
    ).toBeHidden();
    await expect(page.locator("thead th").first()).toHaveCSS(
      "position",
      "sticky",
    );
    const tableHeight = await page
      .getByTestId("table")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(tableHeight).toBeLessThan(600);
  });

  test("prints the page's content without the application around it", async ({
    page,
  }) => {
    await page.emulateMedia({ media: "print" });

    const hidden = [
      ".bx--header",
      ".bx--side-nav",
      ".bx--side-nav__overlay",
      ".bx--skip-to-content",
      ".bx--table-toolbar",
      ".bx--pagination",
      ".bx--modal",
      ".bx--skeleton__text",
    ];
    await Promise.all(
      hidden.map((selector) =>
        expect
          .soft(page.locator(selector).first(), selector)
          .toHaveCSS("display", "none"),
      ),
    );

    // A closed accordion item prints its content.
    await expect(page.getByTestId("accordion-content")).toBeVisible();

    // A pinned header prints once, in place.
    await expect(page.locator("thead th").first()).toHaveCSS(
      "position",
      "static",
    );

    // A sticky-header table prints every row, not the 240px it scrolls in.
    await expect(page.locator("tbody tr")).toHaveCount(30);
    const tableHeight = await page
      .getByTestId("table")
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(tableHeight).toBeGreaterThan(1000);

    // A link's target is on the page, as paper has no hover.
    const href = await page
      .getByTestId("external-link")
      .evaluate((el) => getComputedStyle(el, "::after").content);
    expect(href).toBe('" (https://carbon.example.com/docs)"');

    await expect(page.getByTestId("code")).toHaveCSS("overflow-x", "visible");
  });
});
