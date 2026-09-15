import { expect, test } from "@playwright/test";

test.describe("DataTable sticky header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-table-sticky-header.html");
  });

  test("does not overflow the document horizontally", async ({ page }) => {
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("aligns header cells with body cells per column", async ({ page }) => {
    const headerCell = page.getByRole("columnheader", { name: "Service" });
    const bodyCell = page.getByRole("cell", {
      name: "payments-api-0",
      exact: true,
    });

    const headerBox = await headerCell.boundingBox();
    const bodyBox = await bodyCell.boundingBox();

    expect(Math.abs((headerBox?.x ?? 0) - (bodyBox?.x ?? 0))).toBeLessThan(1);
  });

  test("keeps the header pinned to the container top while scrolling", async ({
    page,
  }) => {
    const container = page
      .getByTestId("data-table-sticky-root")
      .locator(".bx--data-table_inner-container");
    const headerCell = page.getByRole("columnheader", { name: "Region" });

    const containerTop = (await container.boundingBox())?.y ?? 0;
    const initialHeaderTop = (await headerCell.boundingBox())?.y ?? 0;

    expect(Math.abs(initialHeaderTop - containerTop)).toBeLessThan(2);

    await container.evaluate((el) => {
      el.scrollTop = 300;
    });

    const scrolledHeaderTop = (await headerCell.boundingBox())?.y ?? 0;

    expect(Math.abs(scrolledHeaderTop - containerTop)).toBeLessThan(2);
  });
});
