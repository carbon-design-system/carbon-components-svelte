import { expect, test } from "@playwright/test";

test.describe("Popover", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popover.html");
  });

  test("does not show content when closed", async ({ page }) => {
    const popover = page.getByTestId("popover");
    await expect(popover).not.toHaveClass(/bx--popover--open/);
  });

  test("shows content when trigger is clicked", async ({ page }) => {
    await page.getByTestId("open-popover").click();

    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);
    await expect(page.getByTestId("popover-content")).toHaveText(
      "Popover content",
    );
  });

  test("closes when close button is clicked", async ({ page }) => {
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);

    await page.getByTestId("close-popover").click();
    await expect(page.getByTestId("popover")).not.toHaveClass(
      /bx--popover--open/,
    );
  });

  test("closes when clicking outside container", async ({ page }) => {
    await page.getByTestId("open-popover").click();
    await expect(page.getByTestId("popover")).toHaveClass(/bx--popover--open/);

    await page.getByTestId("outside").click();
    await expect(page.getByTestId("popover")).not.toHaveClass(
      /bx--popover--open/,
    );
  });
});
