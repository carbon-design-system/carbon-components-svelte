import { expect, test } from "./helpers/host";

// `theme="system"` follows the system color scheme with CSS alone: White
// for light, Gray 100 for dark.
const SCHEMES = {
  light: {
    background: "rgb(255, 255, 255)",
    text: "rgb(22, 22, 22)",
    field: "rgb(244, 244, 244)",
  },
  dark: {
    background: "rgb(22, 22, 22)",
    text: "rgb(244, 244, 244)",
    field: "rgb(38, 38, 38)",
  },
} as const;

for (const colorScheme of ["light", "dark"] as const) {
  const expected = SCHEMES[colorScheme];

  test.describe(`system theme with a ${colorScheme} system`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ colorScheme });
    });

    test("<html theme=system> follows the system", async ({ page }) => {
      await page.goto("/theme-zone.html?page=system");
      await expect(page.locator("html")).toHaveAttribute("theme", "system");
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        expected.background,
      );
      await expect(page.locator("body")).toHaveCSS("color", expected.text);
      if (colorScheme === "dark") {
        await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
      }
    });

    for (const pageTheme of ["white", "g100"]) {
      test(`a system zone follows the system on a ${pageTheme} page`, async ({
        page,
      }) => {
        await page.goto(`/theme-zone.html?page=${pageTheme}`);
        const zone = page.getByTestId("system");
        await expect(zone).toHaveCSS("background-color", expected.background);
        await expect(zone).toHaveCSS("color", expected.text);
        await expect(zone).toHaveCSS("color-scheme", colorScheme);
        await expect(page.getByLabel("System field")).toHaveCSS(
          "background-color",
          expected.field,
        );
      });
    }

    test("follows a change to the system color scheme", async ({ page }) => {
      await page.goto("/theme-zone.html?page=system");
      const other = colorScheme === "light" ? "dark" : "light";
      await page.emulateMedia({ colorScheme: other });
      await expect(page.locator("body")).toHaveCSS(
        "background-color",
        SCHEMES[other].background,
      );
    });
  });
}
