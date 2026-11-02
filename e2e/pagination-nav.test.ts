import { expect, test } from "./helpers/host";
import { expectNoPageOverflow } from "./helpers/layout";

test.describe("PaginationNav", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pagination-nav.html");
  });

  test("renders pagination nav", async ({ page }) => {
    await expect(page.getByTestId("pagination-nav")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Page 1", exact: true }),
    ).toBeVisible();
  });

  test("next page button advances page", async ({ page }) => {
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("previous page button goes back", async ({ page }) => {
    await page.getByRole("button", { name: "Next page" }).click();
    await page.getByRole("button", { name: "Previous page" }).click();
    await expect(
      page.getByRole("button", { name: "Page 1", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("clicking page number selects it", async ({ page }) => {
    await page.getByRole("button", { name: "Page 3" }).click();
    await expect(page.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("wraps its pages at a 320 px width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await expectNoPageOverflow(page);
    const next = await page
      .getByRole("button", { name: "Next page" })
      .boundingBox();
    expect(next?.x).toBeGreaterThanOrEqual(0);
    expect((next?.x ?? 0) + (next?.width ?? 0)).toBeLessThanOrEqual(320);
  });
});
