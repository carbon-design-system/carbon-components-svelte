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

  // A word is split when its range has client rects on more than one line.
  const splitWords = (root: Element) => {
    const out: string[] = [];
    const range = document.createRange();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      for (const match of (node.textContent ?? "").matchAll(/\S+/g)) {
        range.setStart(node, match.index ?? 0);
        range.setEnd(node, (match.index ?? 0) + match[0].length);
        const tops = new Set(
          [...range.getClientRects()]
            .filter((rect) => rect.width > 0)
            .map((rect) => Math.round(rect.top)),
        );
        if (tops.size > 1) out.push(match[0]);
      }
    }
    return out;
  };

  test("the split-word detector flags a word broken across lines", async ({
    page,
  }) => {
    await page.goto("/long-words.html");
    const flagged = await page.evaluate((source) => {
      const el = document.createElement("div");
      el.style.cssText = "width: 3ch; word-break: break-all";
      el.textContent = "Regions";
      document.body.append(el);
      const out = new Function(`return (${source})`)()(el);
      el.remove();
      return out;
    }, splitWords.toString());
    expect(flagged).toEqual(["Regions"]);
  });

  // A word that fits its row stays whole, and the row stays in its box: the
  // control beside it gives way, not the label.
  for (const id of ["rows-dropdown", "rows-multiselect", "rows-words"])
    test(`an inline label in ${id} keeps its words whole inside its box`, async ({
      page,
    }) => {
      await page.goto("/long-words.html");
      const box = page.getByTestId(id);
      await expect(box).toBeVisible();
      const spill = await box.evaluate((root) => {
        const edge = root.getBoundingClientRect().right;
        const control = root.querySelector(".bx--list-box");
        return Math.round((control?.getBoundingClientRect().right ?? 0) - edge);
      });
      expect(spill).toBeLessThanOrEqual(0);
      expect(await box.evaluate(splitWords)).toEqual([]);
    });
});
