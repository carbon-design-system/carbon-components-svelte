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

test.describe("TooltipDefinition portaled inside Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-definition-modal.html");
  });

  test("uses floating portal attached to document.body", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(
      page.getByRole("dialog", { name: "Modal for tooltip test" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Definition in modal" }).hover();

    await expect(page.getByRole("tooltip")).toHaveText(
      "Portaled definition text",
    );

    const portalOnBody = await page.evaluate(() => {
      const portal = document.querySelector("[data-floating-portal]");
      return portal?.parentElement === document.body;
    });
    expect(portalOnBody).toBe(true);
  });

  test("does not render inline tooltip inside overflow container", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    await page.getByRole("button", { name: "Definition in modal" }).hover();
    await expect(page.getByRole("tooltip")).toBeVisible();

    await expect(
      page.locator('[data-testid="overflow-box"] [role="tooltip"]'),
    ).toHaveCount(0);
  });

  test("marks trigger as portal-active", async ({ page }) => {
    await page.getByTestId("open-modal").click();

    await expect(
      page.getByRole("button", { name: "Definition in modal" }),
    ).toHaveClass(/bx--tooltip--portal-active/);
  });

  test("sets definition tooltip type on portalled shell", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await page.getByRole("button", { name: "Definition in modal" }).hover();

    await expect(
      page.locator(
        '[data-floating-portal] .bx--tooltip-portal[data-tooltip-type="definition"]',
      ),
    ).toBeVisible();
  });
});
