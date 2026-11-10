import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const editor = (page: Page) =>
  page.getByRole("textbox", { name: "Long", exact: true });

/**
 * Types `count` characters and returns how long each took to reach the next
 * frame after its `beforeinput`, which includes the browser's own edit, the
 * editor's history capture, normalizing and value update, and layout.
 */
async function typingLatencies(page: Page, count: number) {
  await page.evaluate(() => {
    const root = document.querySelector("[role=textbox]") as HTMLElement;
    const w = window as unknown as { __latencies: number[] };
    w.__latencies = [];
    root.addEventListener(
      "beforeinput",
      () => {
        const start = performance.now();
        // Two frames: the edit and the render that follows it.
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            w.__latencies.push(performance.now() - start),
          ),
        );
      },
      true,
    );
  });
  for (let i = 0; i < count; i++) {
    // biome-ignore lint/performance/noAwaitInLoops: one key at a time
    await page.keyboard.type("x");
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(200);
  const latencies = await page.evaluate(
    () => (window as unknown as { __latencies: number[] }).__latencies,
  );
  latencies.sort((a, b) => a - b);
  return {
    count: latencies.length,
    p50: latencies[Math.floor(latencies.length / 2)],
    p95: latencies[Math.floor(latencies.length * 0.95)],
    max: latencies[latencies.length - 1],
  };
}

test.describe("RichTextEditor with 10,000 words", () => {
  for (const shape of ["small", "blocks", "single", "list"]) {
    test(`keeps typing responsive in ${shape} form`, async ({
      page,
    }, testInfo) => {
      await page.goto(`/rich-text-editor-long.html?shape=${shape}`);
      await expect(editor(page)).toHaveAttribute("contenteditable", "true");
      const words = await editor(page).evaluate(
        (el) => (el.textContent ?? "").split(/\s+/).filter(Boolean).length,
      );
      if (shape !== "small") expect(words).toBeGreaterThan(8000);

      // Into the middle of the document, where a full-document pass would
      // cost the most.
      await editor(page).evaluate((root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          nodes.push(n as Text);
        }
        const mid = nodes[Math.floor(nodes.length / 2)];
        root.focus();
        window.getSelection()?.collapse(mid, 3);
      });
      const result = await typingLatencies(page, 40);
      testInfo.annotations.push({
        type: "latency",
        description: `${shape}: p50 ${result.p50.toFixed(1)} ms, p95 ${result.p95.toFixed(1)} ms, max ${result.max.toFixed(1)} ms`,
      });
      console.log(
        `[${testInfo.project.name}] ${shape}: ${words} words, p50 ${result.p50.toFixed(1)} ms, p95 ${result.p95.toFixed(1)} ms, max ${result.max.toFixed(1)} ms`,
      );

      expect(result.count).toBe(40);
      // Generous: a pass over the whole document per key would be several
      // times this.
      expect(result.p95).toBeLessThan(100);
    });
  }

  test("undoes a whole document replace and mounts in reasonable time", async ({
    page,
  }) => {
    const start = Date.now();
    await page.goto("/rich-text-editor-long.html?shape=blocks");
    await expect(editor(page)).toHaveAttribute("contenteditable", "true");
    expect(Date.now() - start).toBeLessThan(5000);

    await editor(page).click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Delete");
    await expect(editor(page)).toHaveText("");
    const key = (await page.evaluate(() =>
      /Mac/i.test(navigator.platform) ? "Meta" : "Control",
    )) as string;
    await page.keyboard.press(`${key}+z`);
    await expect(editor(page).locator("h2").first()).toHaveText("Section 0");
  });
});
