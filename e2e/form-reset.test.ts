import { expect, test } from "@playwright/test";

test.describe("Form reset", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/form-reset.html");
  });

  test("a reset button syncs Checkbox to the cleared box", async ({ page }) => {
    const bound = page.getByTestId("bound");

    await page.getByText("Agree", { exact: true }).click();
    await expect(bound).toContainText('"agree":true');

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(bound).toContainText('"agree":false');
    await expect(
      page.getByRole("checkbox", { name: "Agree" }),
    ).not.toBeChecked();
  });
});
