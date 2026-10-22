import { expect, test } from "./helpers/host";

test.describe("SelectableTile", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/selectable-tile.html");
  });

  test("renders selectable tiles", async ({ page }) => {
    await expect(page.getByTestId("selectable-tile-group")).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Choose one or more" }),
    ).toBeVisible();
    await expect(page.getByTestId("selectable-tile-x")).toContainText(
      "Option X",
    );
    await expect(page.getByTestId("selectable-tile-y")).toContainText(
      "Option Y",
    );
  });

  test("selects and deselects tiles when clicked", async ({ page }) => {
    await expect(page.getByTestId("selected-values")).toHaveText("none");

    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x");

    await page.getByTestId("selectable-tile-y").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x,y");

    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("y");
  });

  test("shows the checkbox in every state", async ({ page }) => {
    const checkbox = (testId: string) =>
      page
        .getByTestId(testId)
        .locator(".bx--tile__checkmark")
        .evaluate((el) => ({
          opacity: getComputedStyle(el).opacity,
          fill: getComputedStyle(el.querySelector("svg") as Element).fill,
          checked: el.querySelector('[data-icon-path="inner-path"]') !== null,
        }));

    const unselected = await checkbox("selectable-tile-x");
    expect(unselected).toMatchObject({ opacity: "1", checked: false });

    await page.getByTestId("selectable-tile-x").click();
    await expect(page.getByTestId("selected-values")).toHaveText("x");
    const selected = await checkbox("selectable-tile-x");
    expect(selected).toMatchObject({ opacity: "1", checked: true });
    expect(selected.fill).not.toBe(unselected.fill);

    const disabled = await checkbox("selectable-tile-disabled");
    expect(disabled).toMatchObject({ opacity: "1", checked: false });
    expect(disabled.fill).not.toBe(unselected.fill);
  });
});
