import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("StarRating a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/star-rating.html");

    await expect(
      page
        .getByRole("radiogroup", { name: "Overall rating" })
        .getByRole("radio", { name: "1 out of 5 stars" }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Average 3.5 out of 5 stars" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Quality" }),
    ).toHaveAccessibleDescription("Choose a rating");
    await expect(
      page.getByRole("radiogroup", { name: "Value" }),
    ).toHaveAccessibleDescription("A one-star review asks for a comment");
    await expect(
      page
        .getByRole("radiogroup", { name: "Delivery" })
        .getByRole("radio")
        .first(),
    ).toBeDisabled();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
