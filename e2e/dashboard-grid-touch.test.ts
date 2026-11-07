import { expect, test } from "@playwright/test";

test.use({ hasTouch: true, viewport: { width: 1280, height: 500 } });

test.describe("DashboardGrid touch", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "CDP touch");

  test("drags by the handle and resizes by the corner, and the body still scrolls", async ({
    page,
  }) => {
    await page.goto("/dashboard-grid.html");
    const client = await page.context().newCDPSession(page);

    async function touch(
      from: { x: number; y: number },
      to: { x: number; y: number },
    ) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [from],
      });
      for (let step = 1; step <= 10; step++) {
        // biome-ignore lint/performance/noAwaitInLoops: one touch step at a time
        await client.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            {
              x: from.x + ((to.x - from.x) * step) / 10,
              y: from.y + ((to.y - from.y) * step) / 10,
            },
          ],
        });
      }
      await client.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    }

    // A finger on the body scrolls it: nothing starts a drag there.
    const body = await page.getByTestId("table").boundingBox();
    if (!body) throw new Error("missing box");
    await touch(
      { x: body.x + 200, y: Math.min(body.y + 200, 480) },
      { x: body.x + 200, y: 120 },
    );
    await expect(page.getByTestId("log")).toHaveText("");
    // The table scrolls inside its widget, and the widget stays put.
    expect(
      await page
        .getByTestId("table")
        .locator(".bx--dashboard-grid__body")
        .evaluate((el) => el.scrollTop),
    ).toBeGreaterThan(0);

    // Resize first: a move pushes widgets down, out of the short viewport.
    const alerts = await page.getByTestId("alerts").boundingBox();
    if (!alerts) throw new Error("missing box");
    await touch(
      { x: alerts.x + alerts.width - 5, y: alerts.y + alerts.height - 5 },
      { x: alerts.x + alerts.width - 120, y: alerts.y + alerts.height + 60 },
    );
    await expect(page.getByTestId("log")).toContainText("resize:pointer:lg:");

    const handle = await page
      .getByRole("button", { name: "Move Revenue" })
      .boundingBox();
    const orders = await page.getByTestId("orders").boundingBox();
    if (!handle || !orders) throw new Error("missing box");
    await touch(
      { x: handle.x + 10, y: handle.y + 10 },
      { x: orders.x + 60, y: orders.y + 30 },
    );
    await expect(page.getByTestId("log")).toContainText("move:pointer:lg:");
  });
});
