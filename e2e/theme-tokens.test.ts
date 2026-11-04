import { expect, test } from "./helpers/host";

test.describe("Theme tokens on contextual tokens", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/theme-tokens.html");
    await expect(page.getByTestId("tile")).toBeVisible();
  });

  test("layer-01 and field-01 restyle components outside a Layer", async ({
    page,
  }) => {
    await expect(page.getByTestId("tile")).toHaveCSS(
      "background-color",
      "rgb(255, 0, 0)",
    );
    await expect(page.getByLabel("Field")).toHaveCSS(
      "background-color",
      "rgb(0, 128, 0)",
    );
  });
});
