import { expect, test } from "@playwright/test";

test.describe("CheckboxGroup", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/checkbox-group.html");
  });

  test("renders with legend", async ({ page }) => {
    await expect(
      page.getByRole("group", { name: "Choose options" }),
    ).toBeVisible();
  });

  test("selects multiple checkboxes", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Option A" }).click();
    await page.getByRole("checkbox", { name: "Option C" }).click();

    await expect(page.getByTestId("selected-values")).toContainText("a");
    await expect(page.getByTestId("selected-values")).toContainText("c");
  });

  test("can be located by data-testid", async ({ page }) => {
    const group = page.getByTestId("checkbox-group-options");
    await expect(group).toBeVisible();
    await group.getByRole("checkbox", { name: "Option B" }).click();
    await expect(page.getByTestId("selected-values")).toContainText("b");
  });

  test("deselecting removes from selection", async ({ page }) => {
    await page.getByRole("checkbox", { name: "Option A" }).click();
    await expect(page.getByTestId("selected-values")).toContainText("a");

    await page.getByRole("checkbox", { name: "Option A" }).click();
    await expect(page.getByTestId("selected-values")).not.toBeVisible();
  });
});
