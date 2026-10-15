import { expect, test } from "./helpers/host";

test.describe("RadioTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/radio-tile.html");
  });

  test("renders radio tiles", async ({ page }) => {
    await expect(page.getByTestId("radio-tile-group")).toBeVisible();
    await expect(page.getByRole("group", { name: "Choose one" })).toBeVisible();
    await expect(page.getByTestId("radio-tile-a")).toContainText("Option A");
    await expect(page.getByTestId("radio-tile-b")).toContainText("Option B");
  });

  test("selects tile when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-value")).toHaveText("none");

    await page.getByTestId("radio-tile-a").click();
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    await page.getByTestId("radio-tile-b").click();
    await expect(page.getByTestId("selected-value")).toHaveText("b");
  });

  test("moves the selection with arrow keys in a group without a name", async ({
    page,
  }) => {
    await page.getByTestId("radio-tile-a").click();
    await expect(page.getByTestId("selected-value")).toHaveText("a");

    await page.keyboard.press("ArrowDown");
    await expect(page.getByTestId("selected-value")).toHaveText("b");
    await expect(page.getByRole("radio", { name: "Option B" })).toBeChecked();
  });

  test("compacts a small tile and pulls in its checkmark", async ({ page }) => {
    const tile = page.getByTestId("radio-tile-sm");
    const metrics = await tile.evaluate((node) => {
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      const check = node
        .querySelector(".bx--tile__checkmark")
        ?.getBoundingClientRect();
      return {
        top: style.paddingTop,
        left: style.paddingLeft,
        right: style.paddingRight,
        minHeight: style.minHeight,
        minWidth: style.minWidth,
        checkTop: check ? check.top - box.top - node.clientTop : -1,
        checkRight: check ? box.right - node.clientLeft - check.right : -1,
      };
    });

    expect(metrics).toEqual({
      top: "12px",
      left: "16px",
      right: "32px",
      minHeight: "0px",
      minWidth: "0px",
      checkTop: 12,
      checkRight: 12,
    });
  });
});
