import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const REGIONS = ["toggled", "mounted", "inline"] as const;
type Region = (typeof REGIONS)[number];

/**
 * Starts work that lasts `duration` ms with `delay={300}`, then samples each
 * frame for `window` ms: the time of each frame where a region paints a
 * spinning spinner. CSS hides a waiting spinner, so this reads what the
 * user sees, not what is in the DOM.
 */
async function sampleSpinners(page: Page, duration: number, window: number) {
  await page.getByTestId("duration").fill(String(duration));
  return page.evaluate(
    ({ regions, window }) =>
      new Promise<Record<string, number[]>>((resolve) => {
        const seen: Record<string, number[]> = {};
        for (const region of regions) seen[region] = [];
        const start = performance.now();
        function sample() {
          const now = performance.now() - start;
          for (const region of regions) {
            const svg = document.querySelector(
              `[data-testid="${region}"] .bx--loading:not(.bx--loading--stop) svg`,
            );
            if (svg && getComputedStyle(svg).visibility === "visible") {
              seen[region].push(Math.round(now));
            }
          }
          if (now < window) requestAnimationFrame(sample);
          else resolve(seen);
        }
        document.querySelector<HTMLElement>('[data-testid="run"]')?.click();
        requestAnimationFrame(sample);
      }),
    { regions: [...REGIONS], window },
  );
}

test.describe("Loading delay", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/loading-delay.html");
  });

  test("never paints a spinner for work that ends within the delay", async ({
    page,
  }) => {
    const seen = await sampleSpinners(page, 50, 1000);

    for (const region of REGIONS) {
      expect.soft(seen[region], region).toEqual([]);
    }
  });

  test("paints the spinner only once the delay passes", async ({ page }) => {
    const seen = await sampleSpinners(page, 1500, 800);

    for (const region of REGIONS satisfies readonly Region[]) {
      expect.soft(seen[region].length, region).toBeGreaterThan(0);
      expect.soft(Math.min(...seen[region]), region).toBeGreaterThan(250);
    }
  });
});
