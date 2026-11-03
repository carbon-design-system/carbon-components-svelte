import { expect, type Page, test } from "./helpers/host";

declare global {
  interface Window {
    __recorded?: { properties: Set<string>; animated: Set<string> };
  }
}

const TIMING_KEYS = ["offset", "computedOffset", "easing", "composite"];

/**
 * Record, on every frame, the properties the running animations set and the
 * test ids of the content they run around. An exit lasts 70ms, so polling
 * from the test would miss it.
 */
function record(page: Page) {
  return page.evaluate((timingKeys) => {
    const recorded = {
      properties: new Set<string>(),
      animated: new Set<string>(),
    };
    window.__recorded = recorded;
    const frame = () => {
      for (const animation of document.getAnimations()) {
        const effect = animation.effect as KeyframeEffect | null;
        for (const keyframe of effect?.getKeyframes() ?? []) {
          for (const key of Object.keys(keyframe)) {
            if (!timingKeys.includes(key)) recorded.properties.add(key);
          }
        }
        for (const node of document.querySelectorAll("[data-testid]")) {
          if (effect?.target?.contains(node)) {
            recorded.animated.add(node.getAttribute("data-testid") as string);
          }
        }
      }
      requestAnimationFrame(frame);
    };
    frame();
  }, TIMING_KEYS);
}

const recorded = (page: Page) =>
  page.evaluate(() => ({
    properties: [...(window.__recorded?.properties ?? [])],
    animated: [...(window.__recorded?.animated ?? [])],
  }));

const animationCount = (page: Page) =>
  page.evaluate(() => document.getAnimations().length);

interface Surface {
  name: string;
  content: string;
  portalled: boolean;
  open: (page: Page) => Promise<void>;
}

const surfaces: Surface[] = [
  {
    name: "popover",
    content: "popover-content",
    portalled: false,
    open: (page) => page.getByRole("button", { name: "Open popover" }).click(),
  },
  {
    name: "popover clipped by a box",
    content: "clipped-popover-content",
    portalled: true,
    open: (page) =>
      page.getByRole("button", { name: "Open clipped popover" }).click(),
  },
  {
    name: "toggletip",
    content: "toggletip-content",
    portalled: false,
    open: (page) =>
      page.getByRole("button", { name: "Toggletip", exact: true }).click(),
  },
  {
    name: "tooltip",
    content: "tooltip-content",
    portalled: false,
    open: (page) =>
      page.getByRole("button", { name: "Tooltip", exact: true }).hover(),
  },
  {
    name: "tooltip clipped by a box",
    content: "clipped-tooltip-content",
    portalled: true,
    open: (page) =>
      page.getByRole("button", { name: "Clipped tooltip" }).hover(),
  },
];

async function show(page: Page, surface: Surface) {
  await page.goto("/motion-tooltip-popover.html");
  await surface.open(page);
  const content = page.getByTestId(surface.content);
  await expect(content).toBeVisible();
  // Let the entrance end.
  await expect.poll(() => animationCount(page)).toBe(0);
  // A clipped surface moves to a portal for the open.
  expect(
    await content.evaluate((node) => !!node.closest("[data-portal]")),
  ).toBe(surface.portalled);
  return content;
}

test.describe("Motion on tooltips, toggletips and popovers", () => {
  for (const surface of surfaces) {
    test(`${surface.name} fades out, then leaves the page`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      const content = await show(page, surface);
      await record(page);

      await page.keyboard.press("Escape");

      await expect(content).toHaveCount(0);
      const { properties } = await recorded(page);
      expect(properties).toContain("opacity");
      for (const property of properties) {
        expect(property).toMatch(/^(opacity|transform|width|height)$/);
      }
      expect(await animationCount(page)).toBe(0);
    });

    test(`${surface.name} leaves at once under reduced motion`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const content = await show(page, surface);

      await page.keyboard.press("Escape");

      await expect(content).toHaveCount(0, { timeout: 100 });
      expect(await animationCount(page)).toBe(0);
    });
  }

  test("a tooltip fades in when no neighbor was open", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion-tooltip-popover.html");
    await record(page);

    await page.getByRole("button", { name: "Tooltip", exact: true }).hover();

    await expect(page.getByTestId("tooltip-content")).toBeVisible();
    await expect.poll(() => animationCount(page)).toBe(0);
    expect((await recorded(page)).animated).toContain("tooltip-content");
  });

  test("a tooltip that opens right after another one skips the fade", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/motion-tooltip-popover.html");
    await page.getByRole("button", { name: "Tooltip", exact: true }).hover();
    await expect(page.getByTestId("tooltip-content")).toBeVisible();
    await expect.poll(() => animationCount(page)).toBe(0);
    await record(page);

    await page.getByRole("button", { name: "Neighbor", exact: true }).hover();

    await expect(page.getByTestId("neighbor-content")).toBeVisible();
    await expect(page.getByTestId("tooltip-content")).toHaveCount(0);
    const { animated } = await recorded(page);
    expect(animated).toContain("tooltip-content");
    expect(animated).not.toContain("neighbor-content");
  });
});
