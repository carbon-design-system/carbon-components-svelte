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
      .getByTestId("radio-group-choice")
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el: HTMLInputElement) => el.click());
    await expect(page.getByTestId("selected-value")).toContainText("two");
  });

  test("can be located by data-testid", async ({ page }) => {
    const group = page.getByTestId("radio-group-choice");
    await expect(group).toBeVisible();
    await group
      .getByRole("radio", { name: "Option Three" })
      .evaluate((el: HTMLInputElement) => el.click());
    await expect(page.getByTestId("selected-value")).toContainText("three");
  });

  test("only one option can be selected at a time", async ({ page }) => {
    const group = page.getByTestId("radio-group-choice");
    await group
      .getByRole("radio", { name: "Option One" })
      .evaluate((el) => el.click());
    await group
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el) => el.click());

    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).not.toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).toBeChecked();
  });

  test("allowDeselect clears the selection when clicking the already-selected radio's label", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-deselect");
    const firstLabel = group.locator("label.bx--radio-button__label").first();
    const firstRadio = group.getByRole("radio", { name: "Option One" });

    await expect(firstRadio).toBeChecked();
    await firstLabel.click();

    await expect(firstRadio).not.toBeChecked();
    await expect(page.getByTestId("deselect-selected-value")).toContainText(
      "Selected: ",
    );
  });

  test("allowDeselect still selects a different radio via its label", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-deselect");
    const secondLabel = group.locator("label.bx--radio-button__label").nth(1);

    await secondLabel.click();

    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).not.toBeChecked();
  });

  test("readonly group with no name keeps the preselected radio checked after a cancelled click", async ({
    page,
  }) => {
    const group = page.getByTestId("radio-group-readonly");

    await group
      .getByRole("radio", { name: "Option Two" })
      .evaluate((el: HTMLInputElement) => el.click());

    await expect(
      group.getByRole("radio", { name: "Option Two" }),
    ).not.toBeChecked();
    await expect(
      group.getByRole("radio", { name: "Option One" }),
    ).toBeChecked();
  });
});
