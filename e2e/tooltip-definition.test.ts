import { expect, test } from "./helpers/host";

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

test.describe("TooltipDefinition in body text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tooltip-definition-inline.html");
  });

  test("takes the surrounding font", async ({ page }) => {
    const fonts = await page.evaluate(() => {
      const read = (el: Element | null) => {
        if (!el) throw new Error("missing element");
        const s = getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          fontWeight: s.fontWeight,
          letterSpacing: s.letterSpacing,
          lineHeight: s.lineHeight,
        };
      };
      return {
        text: read(document.querySelector('[data-testid="body-text"]')),
        term: read(document.querySelector(".bx--tooltip__trigger--definition")),
      };
    });

    expect(fonts.text.fontSize).toBe("14px");
    expect(fonts.term).toEqual(fonts.text);
  });

  test("toggles with Enter and reflects it in aria-expanded", async ({
    page,
  }) => {
    const term = page.getByRole("button", { name: "service level objective" });
    await term.focus();
    await expect(term).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Enter");
    await expect(term).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Space");
    await expect(term).toHaveAttribute("aria-expanded", "true");
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

  // Regression test: the portal used to be `pointer-events: none`, so moving
  // the pointer from the trigger onto the portalled tooltip fell through to
  // whatever was underneath. That left the trigger's hover state stuck
  // "left" with no counterpart on the portal to cancel the pending close,
  // so the tooltip closed after leaveDelayMs, the trigger reappeared under
  // the pointer, and the tooltip reopened — flickering open/closed.
  test("stays open when the pointer moves from the trigger onto the portalled tooltip", async ({
    page,
  }) => {
    await page.getByTestId("open-modal").click();
    await page.getByRole("button", { name: "Definition in modal" }).hover();

    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();

    await tooltip.hover();
    // Longer than the default 300ms leaveDelayMs, so a stale close timer
    // would have fired and hidden the tooltip by now.
    await page.waitForTimeout(500);

    await expect(tooltip).toBeVisible();
  });
});
