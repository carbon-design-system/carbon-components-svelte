import { expect, test } from "@playwright/test";

test.describe("Accordion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/accordion.html");
  });

  test("renders accordion items", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Section 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Section 2" })).toBeVisible();
  });

  test("expands item on click", async ({ page }) => {
    await page.getByRole("button", { name: "Section 1" }).click();
    await expect(page.getByText("Content for section 1")).toBeVisible();
  });

  test("collapses item on second click", async ({ page }) => {
    const button = page.getByRole("button", { name: "Section 1" });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("can be located by data-testid", async ({ page }) => {
    const accordion = page.getByTestId("accordion");
    await expect(accordion).toBeVisible();
    const item1 = page.getByTestId("accordion-item-1");
    await item1.getByRole("button").click();
    await expect(page.getByText("Content for section 1")).toBeVisible();
  });
});
