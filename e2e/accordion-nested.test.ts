import { expect, test } from "@playwright/test";

test.describe("Accordion nested", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/accordion-nested.html");
  });

  test("keeps a closed inner item closed when the outer item opens", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Outer" }).click();

    const innerButton = page.getByRole("button", { name: "Inner" });
    await expect(innerButton).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Nested content")).not.toBeVisible();
  });

  test("inner item still opens independently once the outer item is open", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Outer" }).click();

    const innerButton = page.getByRole("button", { name: "Inner" });
    await innerButton.click();

    await expect(innerButton).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Nested content")).toBeVisible();
  });
});
