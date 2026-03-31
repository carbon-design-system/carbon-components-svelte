import { expect, test } from "@playwright/test";

test.describe("RadioButtonGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/radio-button-group.html");
  });

  test("renders with legend", async ({ page }) => {
    await expect(page.getByRole("group", { name: "Choose one" })).toBeVisible();
  });

  test("selects radio button", async ({ page }) => {
    await page
      .getByRole("radio", { name: "Option Two" })
      .click({ force: true });
    await expect(page.getByTestId("selected-value")).toContainText("two");
  });

  test("can be located by data-testid", async ({ page }) => {
    const group = page.getByTestId("radio-group-choice");
    await expect(group).toBeVisible();
    await group
      .getByRole("radio", { name: "Option Three" })
      .click({ force: true });
    await expect(page.getByTestId("selected-value")).toContainText("three");
  });

  test("only one option can be selected at a time", async ({ page }) => {
    await page
      .getByRole("radio", { name: "Option One" })
      .evaluate((el) => el.click());
    await page
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el) => el.click());

    await expect(
      page.getByRole("radio", { name: "Option One" }),
    ).not.toBeChecked();
    await expect(page.getByRole("radio", { name: "Option Two" })).toBeChecked();
  });
});
