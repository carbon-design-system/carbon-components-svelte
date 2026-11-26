import { expect, test } from "@playwright/test";

// Components that measure themselves after mount must end up the same when
// they're mounted hidden and shown later: in a hidden tab panel, behind
// `display: none`, or offscreen under `content-visibility: auto`. Each case
// is mounted visible for reference and hidden three ways, then revealed and
// compared. CodeSnippet missed its expand button (#5782) and fired a
// ResizeObserver loop error (#5791) only once a page mounted it hidden.

type Shape = { width: number; height: number; buttons: string[] };

const reveal = {
  hidden: (el: HTMLElement) => el.removeAttribute("hidden"),
  "display-none": (el: HTMLElement) => el.style.removeProperty("display"),
  "content-visibility": (el: HTMLElement) => el.scrollIntoView(),
};

test("measuring components mounted hidden match them mounted visible", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const errors: string[] = [];
    Object.assign(window, { pageErrors: errors });
    addEventListener("error", (event) => errors.push(event.message));
  });
  await page.goto("/hidden-mount.html");
  await page.evaluate(() => document.fonts.ready);

  const frames = () =>
    page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
  // Each case's size and the buttons it shows, such as an expand button
  // or the tab list's scroll buttons.
  const shapes = (mode: string) =>
    page.locator(`[data-mode="${mode}"]`).evaluate((root) => {
      const result: Record<string, Shape> = {};
      for (const node of root.querySelectorAll<HTMLElement>("[data-case]")) {
        const box = node.getBoundingClientRect();
        const buttons = [...node.querySelectorAll("button")]
          .filter((button) => button.checkVisibility())
          .map(
            (button) =>
              button.getAttribute("aria-label") ??
              button.textContent?.trim() ??
              "",
          );
        result[node.dataset.case ?? ""] = {
          width: Math.round(box.width),
          height: Math.round(box.height),
          buttons,
        };
      }
      return result;
    });

  await frames();
  const expected = await shapes("visible");
  expect(Object.keys(expected).length).toBeGreaterThan(5);

  for (const [mode, show] of Object.entries(reveal)) {
    await page
      .locator(`[data-mode="${mode}"]`)
      .evaluate(show as (el: HTMLElement) => void);
    await frames();
    await expect.poll(() => shapes(mode), { message: mode }).toEqual(expected);
  }

  expect(
    await page.evaluate(
      () => (window as unknown as { pageErrors: string[] }).pageErrors,
    ),
  ).toEqual([]);
});
