import { expect, test } from "./helpers/host";
import { expectNoNestedBorders, expectSingleRing } from "./helpers/layout";

test.describe("ContentSwitcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/content-switcher.html");
  });

  test("renders switches", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "First" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Second" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Third" })).toBeVisible();
  });

  test("selects switch on click", async ({ page }) => {
    await page.getByRole("tab", { name: "Second" }).click();
    await expect(page.getByTestId("selected-index")).toContainText("1");
  });

  test("can be located by data-testid", async ({ page }) => {
    const switcher = page.getByTestId("content-switcher");
    await expect(switcher).toBeVisible();
    await switcher.getByRole("tab", { name: "Third" }).click();
    await expect(page.getByTestId("selected-index")).toContainText("2");
  });

  test("first switch is selected by default", async ({ page }) => {
    await expect(page.getByRole("tab", { name: "First" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("rounds the selected fill inside a 1px outline, as in v11", async ({
    page,
  }) => {
    const switcher = page.getByTestId("content-switcher");
    const second = page.getByRole("tab", { name: "Second" });
    await second.click();
    await page.mouse.move(0, 0);
    await expect(second).toHaveAttribute("aria-selected", "true");

    const inverse = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--cds-border-inverse)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    await expect(switcher).toHaveCSS("outline", `${inverse} solid 1px`);
    await expect(switcher).toHaveCSS("outline-offset", "-1px");
    // The middle switch's fill is its rounded ::after, not the button.
    await expect(second).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    expect(
      await second.evaluate(
        (el) => getComputedStyle(el, "::after").borderRadius,
      ),
    ).toBe("4px");
  });

  // Forced colors paint the transparent 2px outline that the focus reset
  // leaves on each resting switch. Every unselected switch drew a box, with
  // a double line between switches, and the 1px focus ring was thinner.
  test("forced colors: one line between switches, and a ring only on focus", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    const switcher = page.getByTestId("content-switcher");
    const third = page.getByRole("tab", { name: "Third" });
    await expect(third).toBeVisible();

    await expectNoNestedBorders(switcher);
    await expectSingleRing([switcher]);
    // The divider between Second and Third reads CanvasText.
    const [divider, text] = await third.evaluate((el) => {
      const probe = document.createElement("div");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return [getComputedStyle(el, "::before").backgroundColor, color];
    });
    expect(divider).toBe(text);

    await third.focus();
    await expectSingleRing([switcher]);
    await expect(third).toHaveCSS("outline-width", "2px");
  });
});
