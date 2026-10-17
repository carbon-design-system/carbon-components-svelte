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

test.describe("Select", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/select.html");
  });

  test("renders with label", async ({ page }) => {
    await expect(page.getByLabel("Country")).toBeVisible();
  });

  // Hovering a fluid field tints only the field; the divider under it
  // hides meanwhile, as fluid list boxes' does, rather than sitting a
  // pixel below the tint.
  test("hides a fluid invalid select's divider while the field is hovered", async ({
    page,
  }) => {
    const box = page.getByTestId("fluid-invalid");
    const divider = box.locator(".bx--select__divider");
    const color = () =>
      divider.evaluate((el) => getComputedStyle(el).borderBottomColor);

    expect(await color()).not.toBe("rgba(0, 0, 0, 0)");
    await box.locator("select").hover();
    await expect.poll(color).toBe("rgba(0, 0, 0, 0)");
  });

  test("can be located by getByLabel when labelText is set", async ({
    page,
  }) => {
    const select = page.getByLabel("Country");
    await expect(select).toBeVisible();
    await select.selectOption("Canada");
    await expect(page.getByTestId("selected-value")).toContainText("ca");
  });

  test("can be located and interacted with by data-testid", async ({
    page,
  }) => {
    const select = page.getByTestId("select-country");
    await expect(select).toBeVisible();
    await select.selectOption({ label: "United Kingdom" });
    await expect(page.getByTestId("selected-value")).toContainText("uk");
  });

  test("selects option", async ({ page }) => {
    await page.getByLabel("Country").selectOption("Germany");
    await expect(page.getByTestId("selected-value")).toContainText("de");
  });

  // Helper text goes under an inline field, where the invalid and warning
  // messages it alternates with go, not beside it.
  test("puts an inline select's helper text under the field", async ({
    page,
  }) => {
    const box = page.getByTestId("inline-helper");
    const field = await box.locator(".bx--select-input").boundingBox();
    const helper = await box.locator(".bx--form__helper-text").boundingBox();
    expect(helper?.y).toBeGreaterThanOrEqual(
      (field?.y ?? 0) + (field?.height ?? 0),
    );
    expect(helper?.x).toBeCloseTo(field?.x ?? 0, 0);
  });

  // The label stays centred on the field, whatever goes under it.
  test("centres an inline select's label on the field under a warning", async ({
    page,
  }) => {
    const box = page.getByTestId("inline-warning");
    const center = (r: { y: number; height: number } | null) =>
      (r?.y ?? 0) + (r?.height ?? 0) / 2;
    const label = await box.locator(".bx--label").boundingBox();
    const field = await box.locator(".bx--select-input").boundingBox();
    expect(Math.abs(center(label) - center(field))).toBeLessThanOrEqual(1);
  });

  // Long helper text and messages wrap under the field, inside the
  // container, without splitting a word that fits its line.
  for (const width of [240, 320])
    test(`wraps long text under the field in ${width}px`, async ({ page }) => {
      const layouts = await page
        .getByTestId(`inline-narrow-${width}`)
        .evaluate((box, splitWordsSource) => {
          const splitWords = new Function(`return (${splitWordsSource})`)();
          const edge = box.getBoundingClientRect().right;
          return [...box.querySelectorAll(".bx--select--inline")].map(
            (select) => {
              const field = select
                .querySelector(".bx--select-input")
                ?.getBoundingClientRect();
              const text = select
                .querySelector(".bx--form__helper-text, .bx--form-requirement")
                ?.getBoundingClientRect();
              return {
                // Under the field, aligned to its left edge.
                under: Math.round((text?.top ?? 0) - (field?.bottom ?? 0)),
                left: Math.round((text?.left ?? 0) - (field?.left ?? 0)),
                spill: Math.round(
                  Math.max(
                    0,
                    ...[...select.querySelectorAll("*")].map(
                      (el) => el.getBoundingClientRect().right - edge,
                    ),
                  ),
                ),
                split: splitWords(select),
              };
            },
          );
        }, splitWords.toString());

      // Helper text, invalid and warning, each 4px under the field.
      expect(layouts).toEqual(
        layouts.map(() => ({ under: 4, left: 0, spill: 0, split: [] })),
      );
      expect(layouts).toHaveLength(3);
    });

  test("the split-word check flags a squeezed word", async ({ page }) => {
    await page.evaluate(() => {
      const box = document.createElement("div");
      box.dataset.testid = "squeezed";
      box.style.cssText = "width: 20px; word-break: break-word";
      box.textContent = "Region";
      document.body.append(box);
    });
    expect(await page.getByTestId("squeezed").evaluate(splitWords)).toEqual([
      "Region",
    ]);
  });
});
