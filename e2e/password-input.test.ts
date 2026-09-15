import { expect, test } from "@playwright/test";

test.describe("PasswordInput", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/password-input.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const input = page.getByLabel("Password");
    await expect(input).toBeVisible();
    await input.fill("secret123");
    await expect(input).toHaveValue("secret123");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const input = page.getByTestId("password-input");
    await expect(input).toBeVisible();
    await input.fill("mypassword");
    await expect(input).toHaveValue("mypassword");
  });

  test("visibility toggle button shows/hides password", async ({ page }) => {
    const input = page.getByTestId("password-input");
    await input.fill("secret");
    await expect(input).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(input).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(input).toHaveAttribute("type", "password");
  });
});

test.describe("PasswordInput at narrow widths", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto("/password-input.html");
  });

  test("does not cause horizontal overflow", async ({ page }) => {
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    expect(overflow).toBeLessThanOrEqual(360);
  });

  test("shows the tooltip fully within the viewport on hover", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: "Show password" });
    await toggle.hover();

    const tooltip = page.getByText("Show password");
    await expect(tooltip).toBeVisible();

    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
  });

  test("shows the tooltip fully within the viewport on focus", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: "Show password" });
    await toggle.focus();

    const tooltip = page.getByText("Show password");
    await expect(tooltip).toBeVisible();

    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(360);
    }
  });
});
