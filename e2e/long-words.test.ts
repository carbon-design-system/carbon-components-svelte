import { expect, test } from "@playwright/test";

// A word longer than its line (a compound word, a URL) breaks inside the
// word instead of running past its component and column.
test.describe("long words stay inside their column", () => {
  for (const id of ["column", "wide"])
    test(id, async ({ page }) => {
      await page.goto("/long-words.html");
      const column = page.getByTestId(id);
      await expect(column).toBeVisible();

      const spills = await column.evaluate((col) => {
        const edge = col.getBoundingClientRect().right;
        const out: string[] = [];
        const walker = document.createTreeWalker(col, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const right = range.getBoundingClientRect().right;
          if (right > edge + 1)
            out.push(
              `${node.parentElement?.className}: ${Math.round(right - edge)}px`,
            );
        }
        return out;
      });
      expect(spills).toEqual([]);
    });
});
