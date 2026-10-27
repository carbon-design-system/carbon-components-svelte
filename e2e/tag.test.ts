import { expect, test } from "./helpers/host";

test.describe("Tag", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tag.html");
  });

  test("renders tag", async ({ page }) => {
    await expect(page.getByText("Carbon")).toBeVisible();
    await expect(page.getByText("Static tag")).toBeVisible();
  });

  test("filterable tag has close button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Clear filter" }),
    ).toBeVisible();
  });

  test("can be located by data-testid", async ({ page }) => {
    const tag = page.getByTestId("tag-filter");
    await expect(tag).toBeVisible();
    await expect(tag).toContainText("Carbon");
  });

  test("close button removes filterable tag", async ({ page }) => {
    await expect(page.getByTestId("tag-filter")).toBeVisible();

    await page.getByRole("button", { name: "Clear filter" }).click();

    await expect(page.getByTestId("tag-filter")).not.toBeVisible();
  });

  test("keeps the same space beside the icon in RTL as in LTR", async ({
    page,
  }) => {
    // Distance from the inline-start edge to the icon, and from the label to
    // the inline-end edge.
    const gaps = (testId: string) =>
      page.getByTestId(testId).evaluate((tag) => {
        const rtl = getComputedStyle(tag).direction === "rtl";
        const box = tag.getBoundingClientRect();
        const icon = tag
          .querySelector(".bx--tag__custom-icon")
          ?.getBoundingClientRect();
        const label = tag
          .querySelector(".bx--tag__label")
          ?.getBoundingClientRect();
        if (!icon || !label) throw new Error("no icon or label");
        return rtl
          ? [box.right - icon.right, label.left - box.left]
          : [icon.left - box.left, box.right - label.right];
      });

    await page.evaluate(() => document.fonts.ready);

    for (const testId of ["tag-icon", "tag-icon-lg"]) {
      // biome-ignore lint/performance/noAwaitInLoops: one tag at a time
      const ltr = await gaps(testId);
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      expect(await gaps(testId), testId).toEqual(ltr);
      await page.evaluate(() => {
        document.documentElement.dir = "ltr";
      });
    }
  });
});
