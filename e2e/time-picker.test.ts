import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Words with client rects on more than one line.
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

test.describe("TimePicker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/time-picker.html");
  });

  test("renders time picker", async ({ page }) => {
    await expect(page.getByTestId("time-picker")).toBeVisible();
    await expect(page.getByLabel("Meeting time")).toBeVisible();
  });

  test("can fill time input", async ({ page }) => {
    const input = page.getByLabel("Meeting time");
    await input.fill("02:30");
    await expect(input).toHaveValue("02:30");
  });

  test("can select AM/PM from dropdown", async ({ page }) => {
    const select = page.getByLabel("AM/PM");
    await select.selectOption("am");
    await expect(select).toHaveValue("am");
  });

  // The input and selects stay on one row where it fits and wrap onto a
  // second in a container too narrow for one. A wrapped select keeps the
  // width it has on one row, a row gap separates the rows, and no word in
  // the label or message is split across lines.
  test.describe("in a narrow container", () => {
    const measure = (page: Page, id: string) =>
      page.getByTestId(id).evaluate((box) => {
        const edge = box.getBoundingClientRect().right;
        const rect = (el: Element) => el.getBoundingClientRect();
        const input = box.querySelector(".bx--time-picker__input-field");
        const selects = [...box.querySelectorAll(".bx--select-input")];
        const items = [input, ...selects].map((el) => rect(el as Element));
        const overflow = Math.max(
          0,
          ...[...box.querySelectorAll("*")].map((el) => rect(el).right - edge),
        );

        const tops = [...new Set(items.map((r) => Math.round(r.top)))];
        const firstRowBottom = Math.max(
          ...items
            .filter((r) => Math.round(r.top) === tops[0])
            .map((r) => r.bottom),
        );
        return {
          rows: tops.length,
          // Distance between the bottom of the first row and the top of the
          // second.
          gap:
            tops.length > 1
              ? Math.round(Math.min(...tops.slice(1)) - firstRowBottom)
              : 0,
          selectWidths: selects.map((el) => Math.round(rect(el).width)),
          overflow: Math.round(overflow),
        };
      });

    test("the split-word check flags a squeezed word", async ({ page }) => {
      await page.evaluate(() => {
        const box = document.createElement("div");
        box.dataset.testid = "squeezed";
        box.style.cssText = "width: 20px; word-break: break-word";
        box.textContent = "Starts";
        document.body.append(box);
      });
      expect(await page.getByTestId("squeezed").evaluate(splitWords)).toEqual([
        "Starts",
      ]);
    });

    // Rows by container width: the selects wrap only when one row can't fit.
    const rowsByWidth = [
      [200, 2],
      [240, 2],
      [320, 1],
      [390, 1],
      [400, 1],
    ] as const;

    test("wraps only where one row does not fit", async ({ page }) => {
      const wide = await measure(page, "time-picker-400");
      const results = await Promise.all(
        rowsByWidth.map(async ([width, rows]) => {
          const id = `time-picker-${width}`;
          const layout = await measure(page, id);
          const split = await page.getByTestId(id).evaluate(splitWords);
          return { width, rows, layout, split };
        }),
      );

      for (const { width, rows, layout, split } of results) {
        expect(layout, `${width}px`).toEqual({
          rows,
          // Between the bottom of the first row and the top of the second.
          gap: rows === 2 ? 8 : 0,
          // A select keeps its width on the second row.
          selectWidths: wide.selectWidths,
          overflow: 0,
        });
        expect(split, `${width}px split words`).toEqual([]);
      }
    });
  });
});
