import { expect, test } from "./helpers/host";

/**
 * A fluid label too long for its field truncates with an ellipsis. It used
 * to scroll sideways under a hidden scrollbar, which made it a scroll
 * container: Chromium puts one with nothing focusable inside in the tab
 * order, so each cut-off label was a stop of its own.
 */
test("long fluid labels truncate and stay out of the tab order", async ({
  page,
}) => {
  await page.goto("/fluid-label.html");

  const labels = page.locator(".bx--label");
  expect(await labels.count()).toBeGreaterThan(0);
  for (const label of await labels.all()) {
    // biome-ignore lint/performance/noAwaitInLoops: reads one label at a time
    const style = await label.evaluate((el) => {
      const s = getComputedStyle(el);
      const field = (el.parentElement ?? el).getBoundingClientRect();
      return {
        overflowX: s.overflowX,
        textOverflow: s.textOverflow,
        // An ellipsis renders in a block container, not a flex one.
        display: s.display,
        // Inside the field's 16px inline padding.
        inside: el.getBoundingClientRect().right <= field.right - 15,
        cut: el.scrollWidth > el.clientWidth,
      };
    });
    expect(style.overflowX).toBe("hidden");
    expect(style.display).toBe("block");
    expect(style.cut).toBe(true);
    expect(style.textOverflow).toBe("ellipsis");
    expect(style.inside).toBe(true);
  }

  await page.getByTestId("start").focus();
  const stops: string[] = [];
  for (;;) {
    // biome-ignore lint/performance/noAwaitInLoops: tabs one stop at a time
    await page.keyboard.press("Tab");
    const tag = await page.evaluate(() => document.activeElement?.tagName);
    if (!tag || tag === "BODY") break;
    stops.push(tag);
  }
  expect(stops.length).toBeGreaterThan(5);
  for (const tag of stops) {
    expect(["INPUT", "TEXTAREA", "SELECT", "BUTTON"]).toContain(tag);
  }
});
