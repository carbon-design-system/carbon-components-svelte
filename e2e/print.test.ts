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
    await expect(
      page.getByTestId("expandable-tile"),
      "collapsed tile",
    ).not.toHaveCSS("max-height", "none");
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

    // A collapsed ExpandableTile prints its content below the fold.
    const tile = page.getByTestId("expandable-tile");
    await expect(tile).toHaveAttribute("aria-expanded", "false");
    await expect(tile).toHaveCSS("max-height", "none");
    await expect(page.getByTestId("below-fold")).toBeVisible();
    const tileBox = await tile.boundingBox();
    const belowBox = await page.getByTestId("below-fold").boundingBox();
    expect(belowBox.y + belowBox.height).toBeLessThanOrEqual(
      tileBox.y + tileBox.height,
    );

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

  for (const [theme, screen] of [
    ["g90", "rgb(38, 38, 38)"],
    ["g100", "rgb(22, 22, 22)"],
  ]) {
    test(`prints ${theme} on White's text and surface`, async ({ page }) => {
      await page.evaluate(
        (t) => document.documentElement.setAttribute("theme", t),
        theme,
      );
      const heading = page.getByRole("heading", { name: "Service report" });
      const body = page.locator("body");
      await expect(heading, "on screen").toHaveCSS(
        "color",
        "rgb(244, 244, 244)",
      );
      await expect(body, "on screen").toHaveCSS("background-color", screen);

      await page.emulateMedia({ media: "print" });
      await expect(heading).toHaveCSS("color", "rgb(22, 22, 22)");
      await expect(body).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
    });
  }
});
