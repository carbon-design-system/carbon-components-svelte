import { expect, test } from "./helpers/host";

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
});
