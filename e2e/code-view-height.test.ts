import { expect, test } from "./helpers/host";

// The docs reserve a code view's height before its CodeSnippet renders
// (`docs/src/code-view-height.ts`). If CodeSnippet's multi-line styles
// change and the two disagree, a view above the reader changes height as
// it renders and moves the page in Safari, which doesn't anchor scroll.
const ids = ["1", "2", "5", "13", "14", "15", "16", "40", "5-trailing-newline"];

for (const rootFontSize of ["16px", "20px"]) {
  test(`a code view renders at the height the docs reserve, at a ${rootFontSize} root`, async ({
    page,
  }) => {
    await page.goto("/code-view-height.html");
    await page.evaluate((size) => {
      document.documentElement.style.fontSize = size;
    }, rootFontSize);

    for (const id of ids) {
      const view = page.getByTestId(`view-${id}`);
      const reserved = page.getByTestId(`reserved-${id}`);
      await expect(view.locator(".bx--snippet")).toBeVisible();
      // Poll: the snippet animates its max-height to a new root font size.
      await expect
        .poll(
          async () => {
            const rendered = await view.evaluate(
              (el) => el.getBoundingClientRect().height,
            );
            const expected = await reserved.evaluate(
              (el) => el.getBoundingClientRect().height,
            );
            return Math.abs(rendered - expected);
          },
          { message: `${id} lines` },
        )
        .toBeLessThan(0.5);
    }
  });
}
