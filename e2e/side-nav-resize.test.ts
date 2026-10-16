import { expect, test } from "./helpers/host";

test.describe("SideNav resize", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/side-nav-resize.html");
  });

  test("highlights the handle once the pointer rests on it", async ({
    page,
  }) => {
    const handle = page.getByRole("separator", {
      name: "Resize side navigation",
    });
    const box = await handle.boundingBox();
    if (!box) throw new Error("missing box");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(handle).toHaveClass(/bx--side-nav__resize-handle--hover/);
    await expect(handle).toHaveCSS("cursor", "col-resize");

    await page.mouse.move(800, 400);
    await expect(handle).not.toHaveClass(/bx--side-nav__resize-handle--hover/);
  });

  test("drags past the content and fires resize once", async ({ page }) => {
    const handle = page.getByRole("separator", {
      name: "Resize side navigation",
    });
    const box = await handle.boundingBox();
    if (!box) throw new Error("missing box");
    const y = box.y + box.height / 2;

    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 100, y, { steps: 5 });
    await page.mouse.move(box.x + box.width / 2 + 600, y + 200, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId("width")).toHaveText("480");
    await expect(page.getByTestId("resize-count")).toHaveText("1");
  });
});
