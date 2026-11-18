import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

type Stress = { select(ids: string[]): void; all(): void };
type Probe = { __stress: Stress };

/** Run `action` in the page, and return the milliseconds until two frames have painted. */
function settle(page: Page, action: string) {
  return page.evaluate(async (code) => {
    const stress = (window as unknown as Probe).__stress;
    const start = performance.now();
    new Function("stress", code)(stress);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    return performance.now() - start;
  }, action);
}

test.describe("PropertyInspector with 100 objects and 40 properties", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/property-inspector-stress.html");
    await expect(page.getByRole("heading", { name: "Group 0" })).toBeVisible();
  });

  test("selects every object, and changes the selection, quickly", async ({
    page,
  }) => {
    const all = await settle(page, "stress.all()");
    const fewer = await settle(
      page,
      "stress.select(Array.from({ length: 99 }, (_, i) => 's' + i))",
    );
    const more = await settle(page, "stress.all()");
    console.log(
      `select 1 -> 100: ${all.toFixed(1)} ms, 100 -> 99: ${fewer.toFixed(1)} ms, 99 -> 100: ${more.toFixed(1)} ms`,
    );
    expect(Math.max(all, fewer, more)).toBeLessThan(500);
    await expect(
      page.getByRole("spinbutton", { name: "Property 0" }),
    ).toHaveAttribute("placeholder", "Mixed");
  });

  test("touches few nodes when the selection changes but the values do not", async ({
    page,
  }) => {
    await settle(page, "stress.all()");
    const mutations = await page.evaluate(async () => {
      const stress = (window as unknown as Probe).__stress;
      let count = 0;
      const observer = new MutationObserver((records) => {
        count += records.length;
      });
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
      // The same 100 objects, as a new array.
      stress.all();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      observer.disconnect();
      return count;
    });
    console.log(`DOM mutations for an equal selection: ${mutations}`);
    expect(mutations).toBeLessThan(20);
  });

  test("keeps frames short while scrubbing a mixed number across 100 objects", async ({
    page,
  }) => {
    await settle(page, "stress.all()");
    const label = page.getByText("Property 0", { exact: true }).first();
    const box = await label.boundingBox();
    if (!box) throw new Error("no label");
    const y = box.y + box.height / 2;

    await page.evaluate(() => {
      const frames: number[] = [];
      let last = performance.now();
      let running = true;
      const tick = (now: number) => {
        frames.push(now - last);
        last = now;
        if (running) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      Object.assign(window, {
        stopFrames() {
          running = false;
          return frames;
        },
      });
    });
    await page.mouse.move(box.x + 4, y);
    await page.mouse.down();
    // 400px at 4px a step, in 100 moves.
    for (let step = 1; step <= 100; step++) {
      await page.mouse.move(box.x + 4 + step * 4, y);
    }
    await page.mouse.up();
    const frames = await page.evaluate(() =>
      (window as unknown as { stopFrames(): number[] }).stopFrames(),
    );
    const sorted = [...frames].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    console.log(
      `scrub frames: ${frames.length}, p50 ${p50.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms, max ${sorted[sorted.length - 1].toFixed(1)} ms`,
    );
    expect(p95).toBeLessThan(100);
    // One drag is one change, however many frames it took.
    await expect(page.getByTestId("applied")).not.toHaveText("0");
  });
});
