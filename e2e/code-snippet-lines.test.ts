import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./helpers/host";

const sourceLines = [
  'import { Button } from "carbon-components-svelte";',
  "",
  "export function save(items) {",
  "  const total = items.length;",
];

test.describe("CodeSnippet line features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/code-snippet-lines.html");
  });

  test("selecting the code selects the source, with no gutter in it", async ({
    page,
  }) => {
    const selected = await page
      .getByTestId("snippet-lines")
      .evaluate((root) => {
        const pre = root.querySelector("pre") as HTMLPreElement;
        const range = document.createRange();
        range.selectNodeContents(pre);
        const selection = getSelection() as Selection;
        selection.removeAllRanges();
        selection.addRange(range);
        return { selection: selection.toString(), text: pre.textContent };
      });
    // The blank line survives, and so do the leading spaces.
    expect(selected.selection.split("\n").slice(0, 4)).toEqual(sourceLines);
    expect(selected.selection).not.toMatch(/^\s*\d/);
    expect(selected.text?.split("\n").slice(0, 4)).toEqual(sourceLines);
  });

  test("a diff's marker column is not selected", async ({ page }) => {
    const selected = await page.getByTestId("snippet-diff").evaluate((root) => {
      const pre = root.querySelector("pre") as HTMLPreElement;
      const range = document.createRange();
      range.selectNodeContents(pre);
      const selection = getSelection() as Selection;
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
    expect(selected.split("\n")[1]).toBe("  const total = items.length;");
  });

  test("draws the gutter and the highlight", async ({ page }) => {
    const lines = page
      .getByTestId("snippet-lines")
      .locator(".bx--snippet__line");
    await expect(lines).toHaveCount(7);
    await expect(lines.nth(2)).toHaveClass(/bx--snippet__line--highlighted/);
    expect(
      await lines
        .nth(0)
        .evaluate((line) => getComputedStyle(line, "::before").content),
    ).toContain("1");
    // Each line is one 1rem row, highlighted or not.
    const heights = await lines.evaluateAll((all) =>
      all.map((line) => line.getBoundingClientRect().height),
    );
    expect(new Set(heights)).toEqual(new Set([16]));
  });

  test("wraps under the code, not the number", async ({ page }) => {
    const wrapped = page
      .getByTestId("snippet-lines-wrapped")
      .locator(".bx--snippet__line")
      .nth(4);
    const [lineHeight, left, textLeft] = await wrapped.evaluate((line) => {
      const range = document.createRange();
      range.selectNodeContents(line.lastChild as Node);
      const rects = [...range.getClientRects()];
      return [
        line.getBoundingClientRect().height,
        // The last row of text, then the first.
        Math.round(rects[rects.length - 1].left),
        Math.round(rects[0].left),
      ];
    });
    expect(lineHeight).toBeGreaterThan(16);
    // Both rows start at the code's column, not under the number.
    expect(left).toBe(textLeft);
  });

  test("counts expandable rows from the code, with or without a gutter", async ({
    page,
  }) => {
    const plain = page.getByTestId("snippet-rows-15-plain");
    const numbered = page.getByTestId("snippet-rows-15");
    await expect(plain.locator("pre")).toBeVisible();
    const [plainHeight, numberedHeight] = await Promise.all([
      plain
        .locator("pre")
        .evaluate((pre) => pre.getBoundingClientRect().height),
      numbered
        .locator("pre")
        .evaluate((pre) => pre.getBoundingClientRect().height),
    ]);
    expect(Math.abs(numberedHeight - plainHeight)).toBeLessThan(1);
    await expect(
      numbered.getByRole("button", { name: "Show more" }),
    ).toHaveCount(0);
    await expect(
      page
        .getByTestId("snippet-rows-16")
        .getByRole("button", { name: "Show more" }),
    ).toBeVisible();
  });

  test("describes the highlighted lines to assistive tech", async ({
    page,
  }) => {
    const textbox = page.getByTestId("snippet-lines").getByRole("textbox");
    await expect(textbox).toHaveAccessibleDescription(
      "Lines 3, 5 to 6 highlighted.",
    );
    const diff = page.getByTestId("snippet-diff").getByRole("textbox");
    await expect(diff).toHaveAccessibleDescription(
      "Line 3 added. Line 2 removed.",
    );
  });

  test("keeps the gutter out of the textbox's accessible value", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "chromium",
      "The accessibility tree is read through CDP",
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Accessibility.enable");
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    const textbox = nodes.find((node) => node.role?.value === "textbox");
    const value = String(textbox?.value?.value);
    expect(value.split("\n").slice(0, 4)).toEqual(sourceLines);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include("#app")
      .exclude('[data-testid="big"]')
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("marks a line by more than color in forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const highlighted = page
      .getByTestId("snippet-lines")
      .locator(".bx--snippet__line--highlighted")
      .first();
    const border = await highlighted.evaluate((line) => {
      const style = getComputedStyle(line);
      return [style.borderInlineStartWidth, style.borderInlineStartStyle];
    });
    expect(border).toEqual(["4px", "solid"]);
    // The diff's markers are text, so they stay.
    const marker = await page
      .getByTestId("snippet-diff")
      .locator(".bx--snippet__line--added")
      .evaluate((line) => getComputedStyle(line, "::before").content);
    expect(marker).toContain("+");
  });

  test("keeps the code, gutter, and bar on the left in right-to-left", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const snippet = page.getByTestId("snippet-lines");
    const container = snippet.getByRole("textbox");
    expect(
      await container.evaluate((el) => getComputedStyle(el).direction),
    ).toBe("ltr");
    const highlighted = snippet
      .locator(".bx--snippet__line--highlighted")
      .first();
    const [barLeft, barRight, lineLeft, copyLeft] = await highlighted.evaluate(
      (line) => {
        const style = getComputedStyle(line);
        const button = line
          .closest(".bx--snippet")
          ?.querySelector(".bx--copy-btn") as HTMLElement;
        return [
          Number.parseFloat(style.borderLeftWidth),
          Number.parseFloat(style.borderRightWidth),
          line.getBoundingClientRect().left,
          button.getBoundingClientRect().left,
        ];
      },
    );
    expect(barLeft).toBe(4);
    expect(barRight).toBe(0);
    // The copy button is chrome: it moves to the start side, the left.
    expect(copyLeft).toBeLessThan(lineLeft);
  });

  test("colors the code through the syntax subpackage, line by line", async ({
    page,
  }) => {
    const supported = await page.evaluate(() => "highlights" in CSS);
    test.skip(!supported, "No CSS Custom Highlight API");
    await expect
      .poll(() =>
        page.evaluate(() => ({
          keyword: CSS.highlights.get("syntax-definition-keyword")?.size ?? 0,
          comment: CSS.highlights.get("syntax-comment")?.size ?? 0,
          string: CSS.highlights.get("syntax-string")?.size ?? 0,
        })),
      )
      // `const` twice, one comment, one string, from text with its line breaks.
      .toEqual({ keyword: 2, comment: 1, string: 1 });
  });

  test("renders 5,000 lines", async ({ page }) => {
    await page.getByTestId("show-big").click();
    const snippet = page.getByTestId("snippet-big");
    await expect(snippet.locator(".bx--snippet__line")).toHaveCount(5000);
    await expect(
      snippet.getByRole("button", { name: "Show more" }),
    ).toBeVisible();
    await expect(snippet.getByRole("textbox")).toHaveAccessibleDescription(
      "Lines 2 to 4, 4990 highlighted.",
    );
  });
});
