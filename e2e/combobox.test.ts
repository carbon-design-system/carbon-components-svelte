import { expect, test } from "@playwright/test";

test.describe("ComboBox", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/combobox.html");
  });

  test("renders with placeholder", async ({ page }) => {
    await expect(page.getByPlaceholder("Select contact method")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    // With labelText="Contact", the combobox is findable via its associated label.
    // The label's for attribute points to the input; use locator to get the input.
    const combobox = page.getByLabel("Contact").locator("input");
    await expect(combobox).toBeVisible();
    await combobox.fill("Email");
    await expect(combobox).toHaveValue("Email");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await expect(combobox).toBeVisible();
    await combobox.click();
    await combobox.fill("Slack");
    await expect(combobox).toHaveValue("Slack");
  });

  test("opens menu on click and filters items", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    const menu = page.locator(".bx--list-box__menu");
    await expect(menu).toBeVisible();
    await combobox.fill("Fax");
    await expect(page.getByRole("option", { name: "Fax" })).toBeVisible();
  });

  test("selects item from dropdown", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await page.getByRole("option", { name: "Email" }).click();
    await expect(combobox).toHaveValue("Email");
  });

  test("filters items by typing", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await combobox.fill("Sl");
    await expect(page.getByRole("option", { name: "Slack" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Email" })).not.toBeVisible();
  });

  test("opens menu with Enter and selects with Arrow Down + Enter", async ({
    page,
  }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(combobox).toHaveValue("Slack");
  });

  test("closes menu with Escape", async ({ page }) => {
    const combobox = page.getByTestId("combobox-contact");
    await combobox.click();
    await expect(page.locator(".bx--list-box__menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".bx--list-box__menu")).not.toBeVisible();
  });
});
