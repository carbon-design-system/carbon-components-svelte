import { expect, test } from "./helpers/host";

test.describe("ContainedList", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contained-list.html");
  });

  test("renders contained list", async ({ page }) => {
    await expect(page.getByTestId("contained-list")).toBeVisible();
    await expect(page.getByText("List title")).toBeVisible();
    await expect(page.getByText("Item 1")).toBeVisible();
    await expect(page.getByText("Item 2")).toBeVisible();
  });

  test("clicking interactive item triggers handler", async ({ page }) => {
    await expect(page.getByTestId("clicked-item")).toHaveText("none");

    await page.getByRole("button", { name: "Item 1" }).click();
    await expect(page.getByTestId("clicked-item")).toHaveText("1");

    await page.getByRole("button", { name: "Item 2" }).click();
    await expect(page.getByTestId("clicked-item")).toHaveText("2");
  });

  test("link item has no native underline", async ({ page }) => {
    const link = page.getByTestId("link-item");
    await expect(link).toHaveCSS("text-decoration-line", "none");
  });

  test("search slot stays under the header while the list scrolls", async ({
    page,
  }) => {
    const scroller = page.getByTestId("search-scroller");
    const offset = () =>
      scroller.evaluate((el) => {
        const search = el.querySelector(".bx--search");
        return Math.round(
          (search?.getBoundingClientRect().top ?? 0) -
            el.getBoundingClientRect().top,
        );
      });
    const before = await offset();
    await scroller.evaluate((el) => {
      el.scrollTop = 300;
    });
    expect(await offset()).toBe(before);
  });
});
