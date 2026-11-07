import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

/** Record the time between animation frames until `stop` is called. */
async function startRecording(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      __frames: number[];
      __recording: boolean;
    };
    w.__frames = [];
    w.__recording = true;
    let last = performance.now();
    const tick = (now: number) => {
      w.__frames.push(now - last);
      last = now;
      if (w.__recording) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function stopRecording(page: Page) {
  const frames = await page.evaluate(() => {
    const w = window as unknown as {
      __frames: number[];
      __recording: boolean;
    };
    w.__recording = false;
    return w.__frames.slice(1);
  });
  const sorted = [...frames].sort((a, b) => a - b);
  const at = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  return { count: sorted.length, p50: at(0.5), p95: at(0.95), worst: at(1) };
}

test.describe("DashboardGrid with 50 widgets", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard-grid-large.html");
    await expect(page.getByTestId("grid")).toBeVisible();
  });

  test("renders every widget in its cell", async ({ page }) => {
    await expect(page.locator("[data-dashboard-grid-item]")).toHaveCount(50);
    const rows = await page
      .getByTestId("grid")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateRows.split(" ").length,
      );
    // 50 widgets, four to a row of two grid rows: 13 widget rows.
    expect(rows).toBe(26);
  });

  for (const slowdown of [1, 4]) {
    test(`drags a widget across the grid with edge scroll at ${slowdown}x CPU`, async ({
      page,
      browserName,
    }) => {
      test.skip(browserName !== "chromium", "CPU throttling is Chromium only");
      const client = await page.context().newCDPSession(page);
      await client.send("Emulation.setCPUThrottlingRate", { rate: slowdown });

      const handle = page.getByRole("button", {
        name: "Move Widget 1",
        exact: true,
      });
      const box = await handle.boundingBox();
      if (!box) throw new Error("no handle");
      await page.mouse.move(box.x + 8, box.y + 8);
      await page.mouse.down();
      await page.mouse.move(box.x + 8, box.y + 12);
      await startRecording(page);
      // Down the grid to the bottom edge of the page, where it scrolls.
      for (let step = 1; step <= 60; step++) {
        // biome-ignore lint/performance/noAwaitInLoops: one pointer step at a time
        await page.mouse.move(
          box.x + 8 + (step % 20) * 20,
          Math.min(box.y + 8 + step * 12, 796),
        );
        await page.waitForTimeout(8);
      }
      await page.waitForTimeout(1200);
      const stats = await stopRecording(page);
      await page.mouse.up();
      await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });

      test.info().annotations.push({
        type: `frames ${slowdown}x`,
        description: JSON.stringify(stats),
      });
      console.log(`frame deltas at ${slowdown}x`, JSON.stringify(stats));
      expect(stats.count).toBeGreaterThan(30);
      // A frame is 16.7ms. Allow a lot, for a busy CI machine.
      expect(stats.p50).toBeLessThan(slowdown === 1 ? 25 : 45);

      await expect(page.getByTestId("changes")).toHaveText("1");
      const after = JSON.parse(
        (await page.getByTestId("layouts").textContent()) ?? "{}",
      ).lg;
      expect(after).toHaveLength(50);
      const first = after.find((i: { id: string }) => i.id === "w1");
      expect(first.y).toBeGreaterThan(0);
    });
  }

  test("a keyboard move across 50 widgets lands within two frames", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "Move Widget 1", exact: true })
      .focus();
    await page.keyboard.press("Enter");
    const took = await page.evaluate(async () => {
      const samples: number[] = [];
      for (let n = 0; n < 8; n++) {
        const start = performance.now();
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowRight",
            bubbles: true,
            cancelable: true,
          }),
        );
        // biome-ignore lint/performance/noAwaitInLoops: one step per two frames
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        samples.push(performance.now() - start);
      }
      return samples.sort((a, b) => a - b)[4];
    });
    console.log("keyboard step to second frame (median ms)", took);
    expect(took).toBeLessThan(60);
  });
});
