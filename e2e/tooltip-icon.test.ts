import { expect, test } from "@playwright/test";

test.describe("TooltipIcon", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-icon.html");
  });

  test("renders tooltip icon", async ({ page }) => {
    await expect(page.getByTestId("tooltip-icon")).toBeVisible();
  });

  test("shows tooltip on focus", async ({ page }) => {
    await page.getByTestId("tooltip-icon").focus();

    await expect(page.getByText("Icon tooltip text")).toBeAttached();
  });

  test("shows tooltip on hover", async ({ page }) => {
    await page.getByTestId("tooltip-icon").hover();

    await expect(page.getByText("Icon tooltip text")).toBeAttached();
  });
});

test.describe("TooltipIcon portaled inside Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-icon-modal.html");
  });

  test("uses floating portal attached to document.body", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await expect(
      page.getByRole("dialog", { name: "Modal for tooltip test" }),
    ).toBeVisible();

    await page.getByTestId("tooltip-icon-modal").hover();

    await expect(page.getByText("Portaled icon tooltip")).toBeVisible();

    const portalOnBody = await page.evaluate(() => {
      const portal = document.querySelector("[data-floating-portal]");
      return portal?.parentElement === document.body;
    });
    expect(portalOnBody).toBe(true);
  });

  test("does not render assistive text span inside the trigger when portaled", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();

    const trigger = page.getByTestId("tooltip-icon-modal");
    await expect(trigger.locator(".bx--assistive-text")).toHaveCount(0);
  });

  test("marks trigger as portal-active", async ({ page }) => {
    await page.getByTestId("open-modal").click();

    await expect(page.getByTestId("tooltip-icon-modal")).toHaveClass(
      /bx--tooltip--portal-active/,
    );
  });

  test("sets icon tooltip type on portalled shell", async ({ page }) => {
    await page.getByTestId("open-modal").click();
    await page.getByTestId("tooltip-icon-modal").hover();

    await expect(
      page.locator(
        '[data-floating-portal] .bx--tooltip-portal[data-tooltip-type="icon"]',
      ),
    ).toBeVisible();
  });
});

test.describe("TooltipIcon (controlled open & exclusivity)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-icon-reactive.html");
  });

  test("opens and closes from bind:open", async ({ page }) => {
    const trigger = page.getByTestId("tooltip-controlled");

    await page.getByTestId("toggle-controlled").click();
    await expect(trigger).toHaveClass(/bx--tooltip--visible/);
    await expect(trigger).not.toHaveClass(/bx--tooltip--hidden/);

    await page.getByTestId("toggle-controlled").click();
    await expect(trigger).toHaveClass(/bx--tooltip--hidden/);
    await expect(trigger).not.toHaveClass(/bx--tooltip--visible/);
  });

  test("dispatches open and close when toggled", async ({ page }) => {
    await expect(page.getByTestId("open-event-count")).toHaveText("0");
    await expect(page.getByTestId("close-event-count")).toHaveText("0");

    await page.getByTestId("toggle-controlled").click();
    await expect(page.getByTestId("open-event-count")).toHaveText("1");

    await page.getByTestId("toggle-controlled").click();
    await expect(page.getByTestId("close-event-count")).toHaveText("1");
  });

  test("only one non-portal tooltip is visible when moving hover between icons", async ({
    page,
  }) => {
    const a = page.getByTestId("tooltip-a");
    const b = page.getByTestId("tooltip-b");

    await a.hover();
    await expect(a).toHaveClass(/bx--tooltip--visible/);
    await expect(b).toHaveClass(/bx--tooltip--hidden/);

    await b.hover();
    await expect(b).toHaveClass(/bx--tooltip--visible/);
    await expect(a).toHaveClass(/bx--tooltip--hidden/);
  });
});
