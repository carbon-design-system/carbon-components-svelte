import { expect, test } from "./helpers/host";

test.describe("StructuredList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/structured-list.html");
  });

  test("renders structured list", async ({ page }) => {
    await expect(page.getByTestId("structured-list")).toBeVisible();
    await expect(page.getByRole("radiogroup")).toBeVisible();
    await expect(page.getByText("Row A")).toBeVisible();
    await expect(page.getByText("Row B")).toBeVisible();
  });

  test("selects row when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-value")).toHaveText("none");

    await page.getByText("Row A").click();

    await expect(page.getByTestId("selected-value")).toHaveText("a");
  });

  test("selects row via Tab + Space keyboard navigation", async ({ page }) => {
    await expect(page.getByTestId("selected-value")).toHaveText("none");

    const firstRadio = page.getByRole("radio").first();
    await firstRadio.focus();
    await expect(firstRadio).toBeFocused();

    await page.keyboard.press("Space");

    await expect(page.getByTestId("selected-value")).toHaveText("a");
  });

  test("fills the selected row and draws row lines as in v11", async ({
    page,
  }) => {
    await page.getByText("Row A").click();
    await page.mouse.move(0, 0);
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    const token = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--cds-layer-selected)";
      probe.style.color = "var(--cds-text-primary)";
      document.body.append(probe);
      const { backgroundColor, color } = getComputedStyle(probe);
      probe.remove();
      return { selected: backgroundColor, text: color };
    });
    const rows = page.locator(".bx--structured-list-row");
    const [head, rowA, rowB] = [rows.nth(0), rows.nth(1), rows.nth(2)];

    await expect(head).toHaveCSS("border-top-style", "none");
    await expect(head).toHaveCSS("border-bottom-style", "none");
    // The fill fades in, so these retry.
    await expect(rowA).toHaveCSS("background-color", token.selected);
    await expect(rowA).toHaveCSS("border-top-color", token.selected);
    await expect(rowA.locator(".bx--structured-list-td").first()).toHaveCSS(
      "color",
      token.text,
    );
    // The line under the selected row is the next row's top border.
    await expect(rowB).toHaveCSS("border-top-color", token.selected);
    await expect(rowB).toHaveCSS("border-bottom-style", "solid");
  });
});
