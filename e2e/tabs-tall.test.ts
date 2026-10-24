import { expect, test } from "./helpers/host";

/**
 * Sized container tabs with a secondary label lay out like unsized ones:
 * every tab as tall as the tallest, labels and secondary labels at the
 * tab's start edge. The server sends the set without `--tall` and its
 * siblings without the label wrapper (they register in the browser), so
 * the test rebuilds that markup and checks nothing moves.
 */
const layout = (page, testId: string) =>
  page
    .getByTestId(testId)
    .locator(".bx--tabs__nav-item")
    .evaluateAll((items) =>
      items.map((item) => {
        const box = item.getBoundingClientRect();
        const label = item
          .querySelector(".bx--tabs__nav-item-label")
          ?.getBoundingClientRect();
        const secondary = item
          .querySelector(".bx--tabs__nav-item-secondary-label:not(:empty)")
          ?.getBoundingClientRect();
        return {
          height: Math.round(box.height),
          labelTop: Math.round((label?.top ?? 0) - box.top),
          labelLeft: Math.round((label?.left ?? 0) - box.left),
          secondaryLeft: secondary
            ? Math.round(secondary.left - box.left)
            : undefined,
        };
      }),
    );

test("sized tabs with a secondary label match unsized ones, before and after registering", async ({
  page,
}) => {
  await page.goto("/tabs-tall.html");
  for (const size of ["sm", "xl"]) {
    const testId = `tabs-${size}`;
    // biome-ignore lint/performance/noAwaitInLoops: reads one set at a time
    const registered = await layout(page, testId);
    expect.soft(new Set(registered.map((t) => t.height)).size, size).toBe(1);
    expect
      .soft(registered[1].secondaryLeft, size)
      .toBe(registered[1].labelLeft);

    // The server's markup: no `--tall`, plain sibling labels.
    await page.getByTestId(testId).evaluate((root) => {
      root.querySelector(".bx--tabs")?.classList.remove("bx--tabs--tall");
      for (const link of root.querySelectorAll(
        ".bx--tabs__nav-item:not(.bx--tabs__nav-item--secondary-label) .bx--tabs__nav-link",
      )) {
        const text = link.textContent?.trim() ?? "";
        link.innerHTML = `<span class="bx--tabs__nav-item-label">${text}</span>`;
      }
    });
    expect
      .soft(await layout(page, testId), `${size} as served`)
      .toEqual(registered);
  }
});
