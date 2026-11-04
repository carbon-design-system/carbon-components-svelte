import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

declare global {
  interface Window {
    __sfUpdates?: Record<string, number>;
    __sfReadyMs?: number;
    __sfForm?: { validate(): Promise<boolean> };
    __row10?: HTMLInputElement;
  }
}

const open = async (page: Page, search: string) => {
  await page.goto(`/schema-form-stress.html?${search}`);
  await page.waitForFunction(() => window.__sfReadyMs !== undefined);
};

const field = (page: Page, path: string) =>
  page.locator(`[data-schema-path="${path}"]`);

/**
 * Types `count` characters into the focused input through `insertText`,
 * which fires real `input` events, and times each one until the next task.
 * That is the work a keystroke causes: the store, the widgets that
 * re-render, and Svelte's flush. It leaves out the browser's own paint.
 */
const typingTimes = (page: Page, count: number) =>
  page.evaluate(async (count) => {
    const times: number[] = [];
    const channel = new MessageChannel();
    const nextTask = () =>
      new Promise<void>((resolve) => {
        channel.port1.onmessage = () => resolve();
        channel.port2.postMessage(null);
      });
    for (let i = 0; i < count; i++) {
      const start = performance.now();
      document.execCommand("insertText", false, "x");
      // biome-ignore lint/performance/noAwaitInLoops: each keystroke is timed on its own, after the last one settled.
      await nextTask();
      times.push(performance.now() - start);
    }
    return times;
  }, count);

const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

test.describe("SchemaForm at scale", () => {
  test("renders 200 fields and re-renders only the field being typed in", async ({
    page,
  }, info) => {
    await open(page, "sections=10&per=20");
    const rendered = await page.evaluate(() => window.__sfReadyMs ?? 0);
    const controls = await page.locator("[data-schema-path]").count();
    expect(controls).toBe(200);
    info.annotations.push({
      type: "render",
      description: `${Math.round(rendered)} ms for ${controls} fields`,
    });
    console.log(`200 fields: first render ${Math.round(rendered)} ms`);
    expect(rendered).toBeLessThan(5000);

    // s4.f8 is a text field (index 8 % 4 === 0).
    const input = field(page, "s4.f8").locator("input");
    const id = await input.getAttribute("id");
    await input.focus();
    await page.evaluate(() => (window.__sfUpdates = {}));
    const times = await typingTimes(page, 30);

    const updates = await page.evaluate(() => window.__sfUpdates ?? {});
    const others = Object.entries(updates).filter(([key]) => key !== id);
    expect(updates[id as string]).toBeGreaterThanOrEqual(30);
    expect(others).toEqual([]);
    expect(await input.inputValue()).toBe("x".repeat(30));

    console.log(
      `200 fields: keystroke median ${median(times).toFixed(2)} ms, worst ${Math.max(...times).toFixed(2)} ms`,
    );
    expect(median(times)).toBeLessThan(16);
  });

  test("types as fast in 200 fields as in 20", async ({ page }) => {
    await open(page, "sections=1&per=20");
    const small = field(page, "s0.f0").locator("input");
    await small.focus();
    const smallTimes = await typingTimes(page, 40);

    await open(page, "sections=10&per=20");
    const big = field(page, "s9.f0").locator("input");
    await big.focus();
    const bigTimes = await typingTimes(page, 40);

    console.log(
      `keystroke median: 20 fields ${median(smallTimes).toFixed(2)} ms, 200 fields ${median(bigTimes).toFixed(2)} ms`,
    );
    // Ten times the fields costs far less than ten times the work.
    expect(median(bigTimes)).toBeLessThan(median(smallTimes) * 5 + 4);
  });

  test("validates 200 fields on submit", async ({ page }) => {
    await open(page, "sections=10&per=20");
    const ms = await page.evaluate(async () => {
      const start = performance.now();
      const valid = await window.__sfForm?.validate();
      return { ms: performance.now() - start, valid };
    });
    console.log(`200 fields: validate ${ms.ms.toFixed(1)} ms`);
    expect(ms.valid).toBe(true);
    expect(ms.ms).toBeLessThan(100);
  });

  test.describe("an array of 50 rows", () => {
    test("renders and edits one row without touching the others", async ({
      page,
    }) => {
      await open(page, "sections=0&rows=50");
      const rendered = await page.evaluate(() => window.__sfReadyMs ?? 0);
      console.log(
        `50 rows (150 fields): first render ${Math.round(rendered)} ms`,
      );
      await expect(page.locator(".bx--schema-form__row")).toHaveCount(50);
      expect(rendered).toBeLessThan(5000);

      const input = field(page, "rows.25.name").locator("input");
      const id = await input.getAttribute("id");
      await input.focus();
      await page.evaluate(() => (window.__sfUpdates = {}));
      const times = await typingTimes(page, 20);
      const updates = await page.evaluate(() => window.__sfUpdates ?? {});
      expect(Object.keys(updates)).toEqual([id]);
      console.log(`50 rows: keystroke median ${median(times).toFixed(2)} ms`);
      expect(median(times)).toBeLessThan(16);
    });

    test("adds, moves and removes a row quickly and keeps the others' DOM", async ({
      page,
    }) => {
      await open(page, "sections=0&rows=50");
      const rows = page.locator(".bx--schema-form__row");
      // Remember a row's input to see that it is moved, not remounted.
      await page.evaluate(() => {
        const input = document.querySelector(
          '[data-schema-path="rows.10.name"] input',
        ) as HTMLInputElement;
        window.__row10 = input;
      });

      const time = async (action: () => Promise<void>) => {
        const start = Date.now();
        await action();
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => resolve(0))),
        );
        return Date.now() - start;
      };

      const add = await time(() =>
        page.getByRole("button", { name: "Add item" }).click(),
      );
      await expect(rows).toHaveCount(51);
      const move = await time(() =>
        page.getByRole("button", { name: /^Move down \(Item 11\)/ }).click(),
      );
      const remove = await time(() =>
        page
          .getByRole("button", { name: "Remove Item 1", exact: true })
          .click(),
      );
      await expect(rows).toHaveCount(50);
      console.log(
        `50 rows: add ${add} ms, move ${move} ms, remove ${remove} ms`,
      );

      // Row 10 moved down one and the first row went: it is now row 10 again,
      // and the same element.
      const same = await page.evaluate(
        () =>
          (document.querySelector(
            '[data-schema-path="rows.10.name"] input',
          ) as HTMLInputElement) === window.__row10,
      );
      expect(same).toBe(true);
      expect(Math.max(add, move, remove)).toBeLessThan(1000);
    });
  });
});
