import { expect, test } from "./helpers/host";

test("ActionSet fills with the contextual layer and lines labels up in a modal footer", async ({
  page,
}) => {
  await page.goto("/action-set.html");
  await page.evaluate(() => document.fonts.ready);

  const read = await page.evaluate(() => {
    const fill = (testId: string) => {
      const set = document.querySelector(
        `[data-testid="${testId}"] .bx--action-set`,
      );
      if (!set) throw new Error(`no ${testId}`);
      return getComputedStyle(set).backgroundColor;
    };
    // The label's offset from the top of its footer.
    const labelTop = (testId: string) => {
      const footer = document.querySelector(`[data-testid="${testId}"]`);
      const button = footer?.querySelector(".bx--btn--primary");
      if (!footer || !button) throw new Error(`no ${testId}`);
      const range = document.createRange();
      range.selectNodeContents(button);
      return (
        range.getBoundingClientRect().top - footer.getBoundingClientRect().top
      );
    };
    const layer = document.querySelector('[data-testid="layer"]');
    return {
      page: fill("page"),
      layer: fill("layer"),
      layerSurface: layer ? getComputedStyle(layer).backgroundColor : "",
      plain: labelTop("plain-footer"),
      actionSet: labelTop("action-set-footer"),
    };
  });

  // layer-01 on the page; one step up on a layer.
  expect(read.page).toBe("rgb(244, 244, 244)");
  expect(read.layer).not.toBe(read.page);
  expect(read.layer).not.toBe(read.layerSurface);
  expect(read.actionSet).toBeCloseTo(read.plain, 0);
});
