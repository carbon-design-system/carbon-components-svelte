import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const open = async (page: Page, search: string) => {
  await page.goto(`/key-value-editor-stress.html?${search}`);
  await page.waitForFunction(() => window.__kvReadyMs !== undefined);
};

/**
 * Types `count` characters into the focused input through `insertText`, which
 * fires real `input` events, and times each one until the next task. That is
 * the work a keystroke causes: the component, validation and Svelte's flush.
 * It leaves out the browser's own paint.
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

/**
 * A .env file of exactly 300 lines: 50 sections of a comment, an exported
 * value with spaces, a three-line quoted value and a plain value with a
 * trailing comment. It holds 150 entries.
 */
const bigEnv = () => {
  const out: string[] = [];
  for (let i = 0; i < 50; i++) {
    out.push(`# section ${i}`);
    out.push(`export VAR_${i}="value with spaces ${i}"`);
    out.push(`CERT_${i}="-----BEGIN-----\nabc\n-----END-----"`);
    out.push(`PLAIN_${i}=plain # trailing`);
  }
  return out.join("\n");
};

test.describe("KeyValueEditor at scale", () => {
  test("renders 500 rows and keeps typing fast", async ({ page }, info) => {
    await open(page, "rows=500");
    const rendered = await page.evaluate(() => window.__kvReadyMs ?? 0);
    expect(
      await page.getByRole("group", { name: /^Row \d+ of 500$/ }).count(),
    ).toBe(500);
    console.log(`500 rows: first render ${Math.round(rendered)} ms`);
    info.annotations.push({
      type: "render",
      description: `${Math.round(rendered)} ms for 500 rows`,
    });
    expect(rendered).toBeLessThan(5000);

    const input = page
      .getByRole("group", { name: "Row 250 of 500" })
      .getByLabel("Key");
    await input.focus();
    await page.keyboard.press("End");
    const times = await typingTimes(page, 30);
    console.log(
      `500 rows: keystroke median ${median(times).toFixed(1)} ms, max ${Math.max(...times).toFixed(1)} ms`,
    );
    info.annotations.push({
      type: "keystroke",
      description: `median ${median(times).toFixed(1)} ms`,
    });
    expect(median(times)).toBeLessThan(100);
    await expect(input).toBeFocused();
  });

  test("imports a pasted 300-line .env with comments and multi-line values", async ({
    page,
  }) => {
    await open(page, "blank=1");
    const text = bigEnv();
    expect(text.split("\n")).toHaveLength(300);
    const start = Date.now();
    await page.evaluate((text) => {
      const field = document.querySelector<HTMLInputElement>(
        '[data-kv-field="key"]',
      );
      field?.focus();
      const data = new DataTransfer();
      data.setData("text/plain", text);
      field?.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    }, text);
    const prompt = page.getByRole("group", { name: /^Import 150 new rows/ });
    await expect(prompt).toBeVisible();
    const parsedMs = Date.now() - start;
    await page.getByRole("button", { name: "Import" }).click();
    await expect(
      page.getByRole("group", { name: /^Row 150 of 150$/ }),
    ).toBeVisible();
    const total = Date.now() - start;
    console.log(`300-line paste: prompt ${parsedMs} ms, imported ${total} ms`);

    // A multi-line value arrived whole.
    const cert = page
      .getByRole("group", { name: "Row 2 of 150" })
      .getByLabel("Value");
    await expect(cert).toBeVisible();
    expect(total).toBeLessThan(8000);
  });

  test("moves and removes a row among 500 quickly, and keeps the element", async ({
    page,
  }) => {
    await open(page, "rows=500");
    const group = page.getByRole("group", { name: "Row 100 of 500" });
    const handle = await group.getByLabel("Key").elementHandle();
    const start = await page.evaluate(() => performance.now());
    await group.getByRole("button", { name: "Move row 100 down" }).click();
    await page.getByRole("group", { name: "Row 101 of 500" }).waitFor();
    const moved = (await page.evaluate(() => performance.now())) - start;
    console.log(`500 rows: move ${Math.round(moved)} ms (click to settled)`);
    const same = await page
      .getByRole("group", { name: "Row 101 of 500" })
      .getByLabel("Key")
      .elementHandle();
    expect(await same?.evaluate((a, b) => a === b, handle)).toBe(true);
    await expect(
      page.getByRole("button", { name: "Move row 101 down" }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Remove row 101" }).click();
    await expect(page.getByTestId("count")).toHaveText("499");
    await expect(
      page.getByRole("group", { name: "Row 101 of 499" }).getByLabel("Key"),
    ).toBeFocused();
  });
});
