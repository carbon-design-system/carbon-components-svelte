import { expect, type Page, test } from "@playwright/test";
import { createServer } from "vite";

// A Slider rendered on the server under a plain `dir` sits where it does
// once the script runs: the styles place its parts by the nearest `dir`.

/** Each part's left and right edge, as a percent of its track's width. */
function layout(page: Page, testId: string) {
  return page.evaluate((testId) => {
    const region = document.querySelector(`[data-testid="${testId}"]`);
    const parts: Record<string, [number, number]> = {};
    for (const [i, slider] of [
      ...(region?.querySelectorAll(".bx--slider") ?? []),
    ].entries()) {
      const track = slider.querySelector(".bx--slider__track");
      if (!track) continue;
      const { left, width } = track.getBoundingClientRect();
      const at = (x: number) => Math.round(((x - left) / width) * 1000) / 10;
      for (const selector of [
        ".bx--slider__thumb",
        ".bx--slider__thumb-wrapper--lower",
        ".bx--slider__thumb-wrapper--upper",
        ".bx--slider__filled-track",
        ".bx--slider__mark",
      ]) {
        const el = slider.querySelector(selector);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        parts[`${i} ${selector}`] = [at(rect.left), at(rect.right)];
      }
    }
    return parts;
  }, testId);
}

test("places a server-rendered Slider by a plain dir before the script runs", async ({
  page,
  browser,
  baseURL,
}) => {
  const vite = await createServer({
    configFile: "e2e/vite.config.ts",
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
    logLevel: "silent",
  });
  let body: string;
  try {
    const { render } = await vite.ssrLoadModule("svelte/server");
    const { default: Fixture } = await vite.ssrLoadModule(
      "/SliderServerFixture.svelte",
    );
    ({ body } = render(Fixture));
  } finally {
    await vite.close();
  }

  // Hydrated: the fixture mounted with its script.
  await page.goto("/slider-server.html");
  await expect(
    page.getByTestId("plain-ltr").getByRole("slider").first(),
  ).toBeVisible();
  const styles = await page.evaluate(() =>
    [...document.querySelectorAll("style, link[rel=stylesheet]")]
      .map((node) => node.outerHTML)
      .join(""),
  );

  // Before hydration: the server markup with the same styles, no script.
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const serverPage = await context.newPage();
  await serverPage.goto("/slider-server.html");
  await serverPage.setContent(`<head>${styles}</head><body>${body}</body>`);

  for (const testId of ["plain-rtl", "plain-ltr"]) {
    // biome-ignore lint/performance/noAwaitInLoops: one region at a time
    const server = await layout(serverPage, testId);
    const hydrated = await layout(page, testId);
    expect.soft(Object.keys(hydrated), testId).toHaveLength(7);
    expect.soft(server, testId).toEqual(hydrated);
  }
  // The thumb at 20 sits at 80% of an RTL track.
  const rtl = await layout(serverPage, "plain-rtl");
  const [left, right] = rtl["0 .bx--slider__thumb"];
  expect((left + right) / 2).toBeCloseTo(80, 0);
  await context.close();
});
