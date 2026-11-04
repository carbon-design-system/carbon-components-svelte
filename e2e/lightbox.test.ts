import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

async function open(page: Page, query = "") {
  await page.goto(`/lightbox.html?${query}`);
  await page.getByTestId("open-lightbox").click();
  await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();
}

// Axe reads colors, so let the modal's fade and slide finish first.
async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.allSettled(
      document.getAnimations().map((animation) => animation.finished),
    ),
  );
  await expect(page.locator(".bx--modal")).toHaveCSS("opacity", "1");
}

const dialog = (page: Page) =>
  page.getByRole("dialog", { name: "Product photos" });
const scale = (page: Page) =>
  page
    .locator(".bx--image-viewer__layer")
    .evaluate((layer) =>
      Number(
        (layer as HTMLElement).style.transform.match(/scale\((.+)\)/)?.[1],
      ),
    );

test.describe("Lightbox", () => {
  test("opens as an image gallery with the stage focused", async ({ page }) => {
    await open(page);

    await expect(dialog(page)).toHaveAttribute(
      "aria-roledescription",
      "image gallery",
    );
    await expect(page.locator(".bx--lightbox__counter")).toHaveText(
      "Image 1 of 12",
    );
    await expect(dialog(page).getByText("Caption for picture 1")).toBeVisible();
    await expect(page.getByRole("img", { name: "Picture 1" })).toBeFocused();
  });

  test("steps with the arrows, Home and End, and Escape closes it", async ({
    page,
  }) => {
    // Opened from the keyboard: Safari does not focus a clicked button, so
    // there would be no focus to return.
    await page.goto("/lightbox.html");
    await page.getByTestId("open-lightbox").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("index")).toHaveText("2");
    await expect(page.locator(".bx--lightbox__counter")).toHaveText(
      "Image 3 of 12",
    );
    await expect(
      dialog(page)
        .getByRole("status")
        .filter({ hasText: "Caption for picture 3" }),
    ).toHaveText("Image 3 of 12. Caption for picture 3");
    await page.keyboard.press("End");
    await expect(page.getByTestId("index")).toHaveText("11");
    await page.keyboard.press("Home");
    await expect(page.getByTestId("index")).toHaveText("0");
    await expect(page.getByTestId("changes")).toHaveText("1,2,11,0");

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();
    await expect(page.getByTestId("closes")).toHaveText("escape-key");
    await expect(page.getByTestId("open-lightbox")).toBeFocused();
  });

  test("zooms from anywhere in the dialog, and arrows pan a zoomed image", async ({
    page,
  }) => {
    await open(page);
    const fit = await scale(page);

    // Focus is on a button, not the stage, so the dialog handles the keys.
    await page.getByRole("button", { name: "Next image" }).focus();
    await page.keyboard.press("+");
    await expect.poll(() => scale(page)).toBeGreaterThan(fit);
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("index")).toHaveText("0");

    await page.keyboard.press("0");
    await expect.poll(() => scale(page)).toBeCloseTo(fit, 5);
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("index")).toHaveText("1");
  });

  test("shows each image at fit, and moves through the strip with the arrows", async ({
    page,
  }) => {
    await open(page);
    const strip = page.getByRole("listbox", { name: "Thumbnails" });
    await expect(strip.getByRole("option")).toHaveCount(12);
    await page.keyboard.press("+");
    await page.keyboard.press("+");
    await page.getByRole("option", { name: "Picture 1", exact: true }).focus();

    // The strip's arrows move through the images even when zoomed.
    await page.keyboard.press("ArrowRight");

    await expect(page.getByTestId("index")).toHaveText("1");
    await expect(
      page.getByRole("option", { name: "Picture 2", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("option", { name: "Picture 2", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    // The next image starts at fit.
    const frame = await page.locator(".bx--image-viewer__frame").boundingBox();
    expect(frame).not.toBeNull();
    await expect.poll(() => scale(page)).toBeLessThanOrEqual(1);
    await expect(
      page.getByRole("button", { name: /Actual size/ }),
    ).toBeVisible();
  });

  test("keeps the selected thumbnail in view", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 700 });
    await open(page);

    await page.keyboard.press("End");

    const strip = page.getByRole("listbox", { name: "Thumbnails" });
    const last = page.getByRole("option", { name: "Picture 12", exact: true });
    await expect(last).toBeInViewport();
    expect(await strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  });

  test("clicking a thumbnail or the buttons changes the image", async ({
    page,
  }) => {
    await open(page);

    await page.getByRole("option", { name: "Picture 5", exact: true }).click();
    await expect(page.getByTestId("index")).toHaveText("4");
    await page.getByRole("button", { name: "Previous image" }).click();
    await expect(page.getByTestId("index")).toHaveText("3");
  });

  test("offers a download and wraps with loop", async ({ page }) => {
    await open(page, "download&loop");

    await expect(
      page.getByRole("link", { name: "Download image" }),
    ).toHaveAttribute("download", "");
    await page.getByRole("button", { name: "Previous image" }).click();
    await expect(page.getByTestId("index")).toHaveText("11");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await open(page, "download");
    await settle(page);

    const results = await new AxeBuilder({ page }).include("#app").analyze();
    // The dialog is outside `#app`'s own markup only when portalled.
    const whole = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
    expect(whole.violations).toEqual([]);
  });

  test("has no violations in Gray 100", async ({ page }) => {
    await page.goto("/lightbox.html");
    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
    });
    await page.getByTestId("open-lightbox").click();
    await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();
    await settle(page);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test("with reduced motion, the container does not slide in", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);

    await expect(page.locator(".bx--lightbox")).toHaveCSS(
      "transition-property",
      "none",
    );
  });
});

test.describe("Lightbox right to left", () => {
  test("swaps previous and next, and lays the strip out from the right", async ({
    page,
  }) => {
    await page.goto("/lightbox.html?start=1");
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await page.getByTestId("open-lightbox").click();
    await expect(page.locator(".bx--image-viewer--ready")).toBeVisible();

    // Next is toward the inline end, which is the left.
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("index")).toHaveText("2");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("index")).toHaveText("1");

    const previous = await page
      .getByRole("button", { name: "Previous image" })
      .boundingBox();
    const next = await page
      .getByRole("button", { name: "Next image" })
      .boundingBox();
    const first = await page
      .getByRole("option", { name: "Picture 1", exact: true })
      .boundingBox();
    const second = await page
      .getByRole("option", { name: "Picture 2", exact: true })
      .boundingBox();
    if (!previous || !next || !first || !second) throw new Error("no boxes");
    expect(previous.x).toBeGreaterThan(next.x);
    expect(first.x).toBeGreaterThan(second.x);

    // The arrow glyphs mirror, so "previous" still points the way it goes.
    const mirrored = await page
      .getByRole("button", { name: "Previous image" })
      .locator("svg")
      .evaluate((svg) => getComputedStyle(svg).transform);
    expect(mirrored).not.toBe("none");
  });
});

test.describe("Lightbox forced colors", () => {
  test("keeps the buttons over the image on a surface with an edge", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await open(page);

    const edges = await page
      .locator(".bx--lightbox__nav, .bx--image-viewer__controls")
      .evaluateAll((nodes) => {
        const probe = document.createElement("div");
        probe.style.backgroundColor = "Canvas";
        document.body.append(probe);
        const canvas = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor === canvas,
            border: `${style.borderTopStyle} ${style.borderTopWidth}`,
          };
        });
      });
    expect(edges.length).toBeGreaterThanOrEqual(3);
    for (const edge of edges) {
      expect(edge).toEqual({ background: true, border: "solid 1px" });
    }

    // The selected thumbnail is told apart by more than its color.
    const selected = await page
      .getByRole("option", { name: "Picture 1", exact: true })
      .evaluate((el) => getComputedStyle(el).borderTopColor);
    const other = await page
      .getByRole("option", { name: "Picture 2", exact: true })
      .evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(selected).not.toBe(other);
  });
});
