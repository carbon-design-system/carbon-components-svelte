import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

test.describe("InputGroup a11y", () => {
  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/input-group.html");

    // A legend names the set of fields.
    const price = page.getByRole("group", { name: "Price" });
    await expect(
      price.getByRole("spinbutton", { name: "Amount" }),
    ).toBeVisible();
    await expect(
      price.getByRole("combobox", { name: "Currency" }),
    ).toBeVisible();
    // Without a legend, the group adds no unnamed "group" to the tree.
    await expect(page.getByRole("group")).toHaveCount(1);
    await expect(
      page.getByTestId("group-disabled").getByRole("button", { name: "Apply" }),
    ).toBeDisabled();

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});
