import { expect, test } from "@playwright/test";

test.describe("Dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dropdown.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByText("Choose an option")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const trigger = page.getByLabel("Contact");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const trigger = page.getByTestId("dropdown-contact").getByRole("button");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.getByRole("option", { name: "Email" }).click();
    await expect(trigger).toContainText("Email");
  });

  test("opens menu on click", async ({ page }) => {
    const trigger = page.getByTestId("dropdown-contact").getByRole("button");
    await trigger.click();
    const menu = page.locator(".bx--list-box__menu");
    await expect(menu).toBeVisible();
  });

  test("selects item from dropdown", async ({ page }) => {
    const trigger = page.getByTestId("dropdown-contact").getByRole("button");
    await trigger.click();
    await page.getByRole("option", { name: "Slack" }).click();
    await expect(trigger).toContainText("Slack");
  });
});
