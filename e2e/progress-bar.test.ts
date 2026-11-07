import { expect, test } from "./helpers/host";

test.describe("ProgressBar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/progress-bar.html");
  });

  // A visually hidden label must not leave its row behind. The unit tests
  // can only see the class; the indent or blank row it causes needs layout.
  for (const kind of ["default", "inline", "indented"]) {
    test(`hideLabel leaves no space before the ${kind} track`, async ({
      page,
    }) => {
      const root = page.getByTestId(`hidden-label-${kind}`);
      const track = root.getByRole("progressbar");

      const rootBox = await root.boundingBox();
      const trackBox = await track.boundingBox();
      if (!rootBox || !trackBox) throw new Error("not rendered");

      expect(trackBox.x).toBeCloseTo(rootBox.x, 0);
      expect(trackBox.y).toBeCloseTo(rootBox.y, 0);
    });
  }

  // The value text is English here, so "1 of 4 complete" must read in that
  // order even when the page is right to left.
  test("keeps the value text in reading order in RTL", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const order = await page.evaluate(() => {
      const el = document.querySelector(
        "[data-testid=value-text] .bx--progress-bar__value-text",
      );
      const text = el?.firstChild;
      if (!text?.textContent) throw new Error("no value text");
      const left = (index: number) => {
        const range = document.createRange();
        range.setStart(text, index);
        range.setEnd(text, index + 1);
        return range.getBoundingClientRect().left;
      };
      return {
        text: text.textContent,
        first: left(0),
        last: left(text.textContent.length - 1),
      };
    });
    expect(order.text).toBe("1 of 4 complete");
    expect(order.first).toBeLessThan(order.last);
  });

  test("puts the value text at the end of the label row in RTL", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const root = page.getByTestId("value-text");
    const rootBox = await root.boundingBox();
    const valueBox = await root
      .locator(".bx--progress-bar__value-text")
      .boundingBox();
    if (!rootBox || !valueBox) throw new Error("not rendered");

    expect(valueBox.x).toBeCloseTo(rootBox.x, 0);
  });

  test("paints the track with border-subtle, as in v11", async ({ page }) => {
    const subtle = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--cds-border-subtle)";
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return color;
    });
    await expect(
      page
        .getByTestId("hidden-label-default")
        .locator(".bx--progress-bar__track"),
    ).toHaveCSS("background-color", subtle);
  });
});
