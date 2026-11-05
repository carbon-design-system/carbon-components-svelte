import { expect, test } from "./helpers/host";

test.describe("pointerDrag capture", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pointer-drag-capture.html");
  });

  test('capture: "press" retargets the click to the drag source', async ({
    page,
  }) => {
    await page.locator("#press-link").click();

    await expect(page.getByTestId("clicks")).toHaveText("press:press");
    await expect(page).not.toHaveURL(/#press-link/);
  });

  test('capture: "drag" leaves a click on a link alone', async ({ page }) => {
    await page.locator("#drag-link").click();

    await expect(page.getByTestId("clicks")).toHaveText("drag:drag-link");
    await expect(page).toHaveURL(/#drag-link/);
    await expect(page.getByTestId("drags")).toHaveText("0");
  });

  test('capture: "drag" swallows the click that ends a drag', async ({
    page,
  }) => {
    const box = await page.locator("#drag-link").boundingBox();
    if (!box) throw new Error("missing box");
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 40, y + 20, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("drags")).toHaveText("1");
    await expect(page.getByTestId("clicks")).toHaveText("");
    await expect(page).not.toHaveURL(/#drag-link/);

    await page.locator("#drag-link").click();
    await expect(page.getByTestId("clicks")).toHaveText("drag:drag-link");
  });
});
