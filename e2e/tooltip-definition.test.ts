import { expect, test } from "@playwright/test";

test.describe("TooltipDefinition", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-definition.html");
  });

  test("renders trigger", async ({ page }) => {
    await expect(page.getByTestId("tooltip-definition")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Definition trigger" }),
    ).toBeVisible();
  });

  test("shows tooltip on focus", async ({ page }) => {
    await page.getByRole("button", { name: "Definition trigger" }).focus();

    await expect(page.getByRole("tooltip")).toHaveText(
      "Definition tooltip text",
    );
  });

  test("shows tooltip on hover", async ({ page }) => {
    await page.getByRole("button", { name: "Definition trigger" }).hover();

    await expect(page.getByRole("tooltip")).toHaveText(
      "Definition tooltip text",
    );
  });
});
