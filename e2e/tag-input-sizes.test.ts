import { expect, test } from "@playwright/test";

// An empty TagInput is as tall as a TextInput of the same size. Its tag
// set's hidden "+N" counter stayed in the row (a tooltip rule outranked
// the one taking it out of flow) and wrapped onto a line of its own:
// 51px at xs where a TextInput is 24.
test("an empty TagInput matches TextInput's height at each size", async ({
  page,
}) => {
  await page.goto("/tag-input-sizes.html");
  await expect(page.locator("[data-size] .bx--tag-input")).toHaveCount(4);

  const heights = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-size]")].map((row) => ({
      size: row.dataset.size,
      tagInput: row.querySelector(".bx--tag-input")?.getBoundingClientRect()
        .height,
      textInput: row.querySelector(".bx--text-input")?.getBoundingClientRect()
        .height,
    })),
  );

  for (const { size, tagInput, textInput } of heights)
    expect(tagInput, size).toBe(textInput);
});

// A tag and the text input share a row in a narrow column, as in a form
// row of 12rem fields. The input's 160px basis wrapped it under a single
// tag, doubling the field's height.
test("a TagInput with one tag stays one row in a 12rem column", async ({
  page,
}) => {
  await page.goto("/tag-input-sizes.html");
  await expect(page.locator("[data-narrow] .bx--tag-input")).toHaveCount(4);

  const heights = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-narrow]")].map((row) => ({
      size: row.dataset.narrow,
      tagInput: row.querySelector(".bx--tag-input")?.getBoundingClientRect()
        .height,
      textInput: row.querySelector(".bx--text-input")?.getBoundingClientRect()
        .height,
    })),
  );

  for (const { size, tagInput, textInput } of heights)
    expect(tagInput, size).toBe(textInput);
});

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

// Field heights by container width: 40px for one row, 72px for two. A tag
// and the input share a row when the input keeps its 64px, and more tags
// wrap onto new rows.
// Fields: one tag, three tags, a tag of one long word, one tag with a
// placeholder.
const heights: [number, number[]][] = [
  [192, [40, 72, 72, 40]],
  [240, [40, 72, 72, 40]],
  [320, [40, 72, 40, 40]],
];

for (const [width, expected] of heights)
  test(`TagInput fields wrap by tag count in a ${width}px column`, async ({
    page,
  }) => {
    await page.goto("/tag-input-sizes.html");
    const box = page.locator(`[data-width="${width}"]`);
    await expect(box.locator(".bx--tag-input")).toHaveCount(4);

    const fields = await box.locator(".bx--tag-input").evaluateAll((els) =>
      els.map((field) => {
        const rect = (el: Element | null) => el?.getBoundingClientRect();
        const input = rect(field.querySelector("input"));
        const field_ = rect(field);
        return {
          height: Math.round(field_?.height ?? 0),
          inputWidth: Math.round(input?.width ?? 0),
        };
      }),
    );
    expect(fields.map((f) => f.height)).toEqual(expected);
    // The input is never squeezed below its 64px basis.
    for (const { inputWidth } of fields)
      expect(inputWidth).toBeGreaterThanOrEqual(64);

    // No word that fits its line is split. The long compound word doesn't.
    const items = await box
      .locator(".bx--form-item")
      .filter({ hasNotText: "Datenschutz" })
      .all();
    const split = await Promise.all(
      items.map((item) => item.evaluate(splitWords)),
    );
    expect(split.flat()).toEqual([]);
  });

test("the split-word check flags a squeezed word", async ({ page }) => {
  await page.goto("/tag-input-sizes.html");
  await page.evaluate(() => {
    const box = document.createElement("div");
    box.dataset.testid = "squeezed";
    box.style.cssText = "width: 20px; word-break: break-word";
    box.textContent = "Topics";
    document.body.append(box);
  });
  expect(await page.getByTestId("squeezed").evaluate(splitWords)).toEqual([
    "Topics",
  ]);
});
