import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// The image is 1200 x 800 with a target at 30% / 60%, so a pin's place on the
// image is its percentage of the image's rectangle, whatever the box does.

const box = async (locator: Locator) => {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("no box");
  return rect;
};

const center = (rect: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

const pin = (scene: Locator, name: string | RegExp) =>
  scene.getByRole("button", { name, exact: false }).first();

/** The pin's center, as a percentage of `plane`. */
async function percentOf(plane: Locator, pinButton: Locator) {
  const p = await box(plane);
  const c = center(await box(pinButton));
  return {
    x: ((c.x - p.x) / p.width) * 100,
    y: ((c.y - p.y) / p.height) * 100,
  };
}

test.describe("AnnotatedImage", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/annotated-image.html");
  });

  test("puts a pin at its percentage of the image at any width", async ({
    page,
  }) => {
    const scene = page.getByTestId("basic");
    const plane = scene.locator(".bx--annotated-image__plane");
    for (const width of [1100, 700, 400]) {
      await page.setViewportSize({ width, height: 800 });
      const at = await percentOf(plane, pin(scene, /Battery/));
      expect(at.x).toBeCloseTo(30, 0);
      expect(at.y).toBeCloseTo(60, 0);
    }
  });

  test("keeps pins in image coordinates in RTL", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const scene = page.getByTestId("basic");
    const plane = scene.locator(".bx--annotated-image__plane");
    const at = await percentOf(plane, pin(scene, /Battery/));
    expect(at.x).toBeCloseTo(30, 0);

    // The legend is chrome, so it moves to the other side.
    const legend = await box(scene.locator(".bx--annotated-image__legend"));
    const image = await box(plane);
    expect(legend.x + legend.width).toBeLessThanOrEqual(image.x + 1);
  });

  test("keeps pins on the image of a cropped box", async ({ page }) => {
    // cover, focal point 30% / 50%, a 3:2 image in a square box.
    const scene = page.getByTestId("crop");
    const frame = await box(scene.locator(".bx--annotated-image__frame"));
    const planeBox = await box(scene.locator(".bx--annotated-image__plane"));
    const scale = Math.max(frame.width / 1200, frame.height / 800);
    expect(planeBox.width).toBeCloseTo(1200 * scale, 0);
    expect(planeBox.height).toBeCloseTo(800 * scale, 0);
    expect(planeBox.x - frame.x).toBeCloseTo(
      (frame.width - 1200 * scale) * 0.3,
      0,
    );

    const c = center(await box(pin(scene, /Battery/)));
    expect(c.x - frame.x).toBeCloseTo(
      (frame.width - 1200 * scale) * 0.3 + 0.3 * 1200 * scale,
      0,
    );
    expect(c.y - frame.y).toBeCloseTo(
      (frame.height - 800 * scale) * 0.5 + 0.6 * 800 * scale,
      0,
    );
  });

  test("keeps pins on the image when it is fit inside the box", async ({
    page,
  }) => {
    const scene = page.getByTestId("contain");
    const frame = await box(scene.locator(".bx--annotated-image__frame"));
    const scale = Math.min(frame.width / 1200, frame.height / 800);
    const c = center(await box(pin(scene, /Camera/)));
    expect(c.x - frame.x).toBeCloseTo(
      (frame.width - 1200 * scale) / 2 + 0.7 * 1200 * scale,
      0,
    );
    expect(c.y - frame.y).toBeCloseTo(
      (frame.height - 800 * scale) / 2 + 0.25 * 800 * scale,
      0,
    );
  });

  test("opens a popover, and Escape closes it and returns focus", async ({
    page,
  }) => {
    const scene = page.getByTestId("basic");
    const battery = pin(scene, /Battery/);
    await battery.click();
    await expect(battery).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByTestId("basic").getByText("Lasts ten hours."),
    ).toBeVisible();
    await expect(page.getByTestId("open-id")).toHaveText("a");

    // Safari does not focus a button on click: Escape must work wherever
    // focus is.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.keyboard.press("Escape");
    await expect(battery).toHaveAttribute("aria-expanded", "false");

    await battery.focus();
    await page.keyboard.press("Enter");
    await expect(battery).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(battery).toHaveAttribute("aria-expanded", "false");
    await expect(battery).toBeFocused();
  });

  test("a cropped image opens its popover outside the clipping box", async ({
    page,
  }) => {
    const scene = page.getByTestId("crop");
    const battery = pin(scene, /Battery/);
    await battery.scrollIntoViewIfNeeded();
    await battery.click();
    const popover = page.locator(".bx--popover--portal.bx--popover--open");
    await expect(popover).toBeVisible();
    await expect(popover).toContainText("Battery");
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(battery).toBeFocused();
  });

  test("opens one popover at a time and closes on an outside click", async ({
    page,
  }) => {
    const scene = page.getByTestId("basic");
    await pin(scene, /Battery/).click();
    await pin(scene, /Camera/).click();
    await expect(pin(scene, /Battery/)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(pin(scene, /Camera/)).toHaveAttribute("aria-expanded", "true");
    await page.getByTestId("open-id").click();
    await expect(pin(scene, /Camera/)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("closes when focus leaves the pin and its popover", async ({ page }) => {
    const scene = page.getByTestId("basic");
    const battery = pin(scene, /Battery/);
    await battery.focus();
    await page.keyboard.press("Enter");
    await expect(battery).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(battery).toHaveAttribute("aria-expanded", "false");
  });

  test("a legend item opens the pin's popover and focuses the pin", async ({
    page,
  }) => {
    const scene = page.getByTestId("basic");
    await scene
      .locator(".bx--annotated-image__legend-item", { hasText: "Camera" })
      .click();
    const camera = pin(scene, /Camera/);
    await expect(camera).toHaveAttribute("aria-expanded", "true");
    await expect(camera).toBeFocused();
    await expect(
      page.getByTestId("basic").getByText("Twelve megapixels."),
    ).toBeVisible();
  });

  test("names a pin by its number and label", async ({ page }) => {
    const scene = page.getByTestId("basic");
    await expect(
      scene
        .locator(".bx--annotated-image__plane")
        .getByRole("button", { name: "1 Battery", exact: true }),
    ).toBeVisible();
  });

  test("every pin is a tab stop by default", async ({ page }) => {
    const scene = page.getByTestId("basic");
    const stops = await scene
      .locator(".bx--annotated-image__pin")
      .evaluateAll((pins) => pins.map((p) => (p as HTMLElement).tabIndex));
    expect(stops).toEqual([0, 0, 0, 0]);
  });

  test("roving: one tab stop, arrows move, Home and End jump", async ({
    page,
  }) => {
    const scene = page.getByTestId("roving");
    const pins = scene.locator(".bx--annotated-image__pin");
    const stops = await pins.evaluateAll((all) =>
      all.map((p) => (p as HTMLElement).tabIndex),
    );
    expect(stops).toEqual([0, -1, -1]);

    await pins.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(pins.nth(1)).toBeFocused();
    await expect(pins.nth(1)).toHaveAttribute("tabindex", "0");
    await expect(pins.nth(0)).toHaveAttribute("tabindex", "-1");
    await page.keyboard.press("End");
    await expect(pins.nth(2)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(pins.nth(0)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(pins.nth(2)).toBeFocused();
  });

  test("roving: Left and Right swap in RTL", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const pins = page
      .getByTestId("roving")
      .locator(".bx--annotated-image__pin");
    await pins.nth(0).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(pins.nth(1)).toBeFocused();
  });

  test("a pin is at least 24px square, and 32px by default", async ({
    page,
  }) => {
    const small = await box(
      page.getByTestId("small").locator(".bx--annotated-image__pin").first(),
    );
    expect(small.width).toBeGreaterThanOrEqual(24);
    expect(small.height).toBeGreaterThanOrEqual(24);
    const normal = await box(pin(page.getByTestId("basic"), /Battery/));
    expect(normal.width).toBeGreaterThanOrEqual(32);
  });

  test("a popover at a corner stays inside the window", async ({ page }) => {
    for (const [width, name] of [
      [1280, /Top left corner/],
      [1280, /Bottom right corner/],
      [320, /Top left corner/],
      [320, /Bottom right corner/],
    ] as const) {
      await page.setViewportSize({ width, height: 700 });
      const scene = page.getByTestId("basic");
      const trigger = pin(scene, name);
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const content = scene
        .locator(
          ".bx--annotated-image__popover.bx--popover--open, .bx--popover--portal.bx--popover--open",
        )
        .first();
      await expect(content).toBeVisible();
      const rect = await box(content);
      const view = page.viewportSize() as { width: number; height: number };
      expect(rect.x).toBeGreaterThanOrEqual(-1);
      expect(rect.x + rect.width).toBeLessThanOrEqual(view.width + 1);
      await page.keyboard.press("Escape");
    }
  });

  test("reflows at 320px with no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    // The legend drops below the image.
    const scene = page.getByTestId("basic");
    const image = await box(scene.locator(".bx--annotated-image__plane"));
    const legend = await box(scene.locator(".bx--annotated-image__legend"));
    expect(legend.y).toBeGreaterThanOrEqual(image.y + image.height);
  });

  test("custom content and marker slots render", async ({ page }) => {
    const scene = page.getByTestId("slots");
    await scene.locator(".bx--annotated-image__pin").first().click();
    await expect(scene.getByRole("link", { name: "Buy" })).toBeVisible();
    await expect(
      scene.locator(".bx--annotated-image__marker").first(),
    ).toHaveText("★");
  });

  test("a pin on a busy image keeps a ring in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const style = await pin(page.getByTestId("basic"), /Battery/).evaluate(
      (el) => {
        const s = getComputedStyle(el);
        return {
          style: s.borderTopStyle,
          width: s.borderTopWidth,
          color: s.borderTopColor,
          bg: s.backgroundColor,
        };
      },
    );
    expect(style.style).toBe("double");
    expect(Number.parseFloat(style.width)).toBeGreaterThanOrEqual(3);
    expect(style.color).not.toBe(style.bg);
  });

  test("the focused pin has a visible ring", async ({ page }) => {
    const battery = pin(page.getByTestId("basic"), /Battery/);
    await battery.focus();
    const ring = await battery.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    expect(ring.style).toBe("solid");
    expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);

    await pin(page.getByTestId("basic"), /Battery/).click();
    await expect(
      page.getByTestId("basic").getByText("Lasts ten hours."),
    ).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);
  });

  test.describe("editable", () => {
    const pins = (page: Page) =>
      page.getByTestId("editable").locator(".bx--annotated-image__pin");

    test("a click on the image adds a pin there", async ({ page }) => {
      const plane = page
        .getByTestId("editable")
        .locator(".bx--annotated-image__plane");
      await plane.scrollIntoViewIfNeeded();
      const rect = await box(plane);
      await page.mouse.click(
        rect.x + rect.width * 0.5,
        rect.y + rect.height * 0.25,
      );
      await expect(pins(page)).toHaveCount(3);
      const added = await percentOf(plane, pins(page).nth(2));
      expect(added.x).toBeCloseTo(50, 0);
      expect(added.y).toBeCloseTo(25, 0);
      await expect(page.getByTestId("edit-changes")).toHaveText(/^add:/);
      await expect(pins(page).nth(2)).toBeFocused();
    });

    test("dragging a pin moves it without opening it", async ({ page }) => {
      const plane = page
        .getByTestId("editable")
        .locator(".bx--annotated-image__plane");
      await plane.scrollIntoViewIfNeeded();
      const rect = await box(plane);
      const first = pins(page).first();
      const from = center(await box(first));
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(
        rect.x + rect.width * 0.8,
        rect.y + rect.height * 0.8,
        {
          steps: 6,
        },
      );
      await page.mouse.up();
      const at = await percentOf(plane, first);
      expect(at.x).toBeCloseTo(80, 0);
      expect(at.y).toBeCloseTo(80, 0);
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByTestId("edit-changes")).toHaveText("move:e1");
    });

    test("a click on a pin opens it and does not add one", async ({ page }) => {
      await pins(page).first().click();
      await expect(pins(page).first()).toHaveAttribute("aria-expanded", "true");
      await expect(pins(page)).toHaveCount(2);
    });

    test("arrows move a focused pin and Delete removes it", async ({
      page,
    }) => {
      const first = pins(page).first();
      await first.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("Shift+ArrowDown");
      await expect(page.getByTestId("edit-pins")).toHaveText(
        "[[31,70],[70,25]]",
      );
      await page.keyboard.press("Delete");
      await expect(pins(page)).toHaveCount(1);
      await expect(pins(page).first()).toBeFocused();
    });

    test("the Add pin button adds a pin at the center", async ({ page }) => {
      await page.getByRole("button", { name: "Add pin" }).click();
      await expect(pins(page)).toHaveCount(3);
      await expect(page.getByTestId("edit-pins")).toHaveText(
        "[[30,60],[70,25],[50,50]]",
      );
      await expect(pins(page).nth(2)).toBeFocused();
    });
  });
});
