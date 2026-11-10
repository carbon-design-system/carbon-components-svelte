import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const preview = (page: import("@playwright/test").Page) =>
  page.locator(".bx--theme-builder__preview .bx--theme-zone").first();

test.describe("ThemeBuilder", () => {
  test("an edit reaches the preview and its derived tokens, not the page", async ({
    page,
  }) => {
    await page.goto("/theme-builder.html");
    const field = page.getByRole("textbox", {
      name: "button-primary",
      exact: true,
    });
    await field.fill("#8a3ffc");

    const zone = preview(page);
    await expect(zone).toHaveCSS("--cds-button-primary", "#8a3ffc");
    // Carbon steps the hover color from the brand.
    const hover = await zone.evaluate((el) =>
      getComputedStyle(el)
        .getPropertyValue("--cds-button-primary-hover")
        .trim(),
    );
    expect(hover).toMatch(/^#[0-9a-f]{6}$/);
    expect(hover).not.toBe("#0050e6");

    const page$ = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--cds-button-primary")
        .trim(),
    );
    expect(page$).not.toBe("#8a3ffc");
    await expect(page.getByTestId("state")).toContainText(
      '"button-primary":"#8a3ffc"',
    );
  });

  test("a nested ThemeZone keeps the overrides when given the style", async ({
    page,
  }) => {
    await page.goto("/theme-builder.html");
    await page
      .getByRole("textbox", { name: "button-primary", exact: true })
      .fill("#8a3ffc");
    const nested = page.locator(".bx--theme-builder__nested");
    await expect(nested).toHaveCSS("--cds-button-primary", "#8a3ffc");
  });

  test("reset puts a token back, and a bad value is not applied", async ({
    page,
  }) => {
    await page.goto("/theme-builder.html");
    const field = page.getByRole("textbox", {
      name: "button-primary",
      exact: true,
    });
    await field.fill("red; background: url(x)");
    await expect(page.getByTestId("state")).toContainText('"tokens":{}');
    await field.fill("#8a3ffc");
    await page.getByRole("button", { name: "Reset button-primary" }).click();
    await expect(page.getByTestId("state")).toContainText('"tokens":{}');
  });

  test("a share link restores the theme", async ({ page }) => {
    await page.goto("/theme-builder.html#b=g100&button-primary=8a3ffc");
    await expect(
      page.getByRole("combobox", { name: "Base theme" }),
    ).toHaveValue("g100");
    await expect(preview(page)).toHaveCSS("--cds-button-primary", "#8a3ffc");
  });

  test("the contrast summary names a new failure", async ({ page }) => {
    await page.goto("/theme-builder.html");
    await page
      .getByRole("textbox", { name: "button-primary", exact: true })
      .fill("#f1c21b");
    await expect(page.locator(".bx--theme-builder__summary")).toContainText(
      "fail",
      {
        timeout: 5000,
      },
    );
    await expect(
      page.getByRole("row", { name: /^text-on-color on button-primary \d/ }),
    ).toContainText("Fail");
  });

  for (const theme of ["white", "bx--g100"]) {
    test(`has no axe violations (${theme})`, async ({ page }) => {
      await page.goto("/theme-builder.html");
      if (theme !== "white") {
        await page.evaluate((cls) => {
          document.documentElement.classList.add(cls);
        }, theme);
      }
      await expect(page.locator(".bx--theme-builder")).toBeVisible();
      await page.getByRole("button", { name: "Layer (38)" }).click();
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("forced colors shows the note and keeps the editor usable", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/theme-builder.html");
    await expect(page.locator(".bx--theme-builder__forced-note")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "button-primary", exact: true }),
    ).toBeVisible();
  });

  test("mirrors in RTL", async ({ page }) => {
    await page.goto("/theme-builder.html");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const editor = page.locator(".bx--theme-builder__editor");
    const zone = page.locator(".bx--theme-builder__preview");
    const [e, p] = await Promise.all([
      editor.boundingBox(),
      zone.boundingBox(),
    ]);
    // The editor leads, so in RTL it sits to the right of the preview.
    expect(e?.x).toBeGreaterThan(p?.x ?? 0);
  });
});
