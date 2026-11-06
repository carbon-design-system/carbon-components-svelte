import { expect, test } from "./helpers/host";

// A portalled tooltip, with its trigger at each edge and corner of the
// window or in the middle, slides back inside the window, and its caret
// still points at the trigger, 1rem or more from the corner of the box.
// The fixture opens any one case from its URL:
// /icon-tooltip-side-edge.html?direction=right&align=start&edge=top-left
//   &component=Button
const TRIGGERS = {
  Button: ".bx--btn",
  TooltipDefinition: ".bx--tooltip__trigger",
  TooltipIcon: ".bx--tooltip__trigger",
} as const;
type Name = keyof typeof TRIGGERS;

const DIRECTIONS = ["top", "bottom", "left", "right"] as const;
const ALIGNS = ["start", "center", "end"] as const;
const EDGES = [
  "none",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

// TooltipDefinition opens above or below its trigger only, so it has no
// left or right case.
const DIRECTIONS_OF: Record<Name, readonly (typeof DIRECTIONS)[number][]> = {
  Button: DIRECTIONS,
  TooltipDefinition: ["top", "bottom"],
  TooltipIcon: DIRECTIONS,
};

const WIDTH = 900;
const HEIGHT = 700;
// 1rem, less half a pixel of rounding.
const INSET = 15.5;

interface Measure {
  /** The side the tooltip really opened on, after any flip. */
  side: string;
  /** The window, and the edges of each box on the sliding axis. */
  size: number;
  across: boolean;
  trigger: Box;
  caret: Box;
  content: Box;
  /** The slide the box carries, in px. */
  applied: number;
}
interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

async function measure(page: import("@playwright/test").Page, name: Name) {
  const trigger = page.getByTestId("trigger").locator(TRIGGERS[name]).first();
  await trigger.focus();
  const tooltip = page.locator(".bx--tooltip-portal");
  await expect(tooltip).toBeVisible();
  // The tooltip slides a frame after the portal places it.
  await page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  return page.evaluate((selector): Measure => {
    const box = (el: Element): Box => {
      const { left, right, top, bottom } = el.getBoundingClientRect();
      return { left, right, top, bottom };
    };
    const portal = document.querySelector(".bx--tooltip-portal") as HTMLElement;
    const content = portal.querySelector(
      ".bx--tooltip-portal__content",
    ) as HTMLElement;
    const caret = portal.querySelector(".bx--tooltip-portal__caret") as Element;
    const trigger = document.querySelector(
      `[data-testid=trigger] ${selector}`,
    ) as Element;
    const side = portal.getAttribute("data-direction") ?? "";
    const across = side === "top" || side === "bottom";
    return {
      side,
      across,
      size: across
        ? document.documentElement.clientWidth
        : document.documentElement.clientHeight,
      trigger: box(trigger),
      caret: box(caret),
      content: box(content),
      applied:
        Number.parseFloat(across ? content.style.left : content.style.top) || 0,
    };
  }, TRIGGERS[name]);
}

/** The edges of a box on the sliding axis, and its center there. */
function axis(m: Measure, b: Box) {
  const [start, end] = m.across ? [b.left, b.right] : [b.top, b.bottom];
  return { start, end, center: (start + end) / 2 };
}

function check(m: Measure, direction: string, align: string, edge: string) {
  const trigger = axis(m, m.trigger);
  const caret = axis(m, m.caret);
  const content = axis(m, m.content);

  // (d) The caret sits on the side of the box that faces the trigger. The
  // tooltip may flip to the other side where the trigger leaves no room.
  if (edge === "none") expect(m.side).toBe(direction);
  const trigger2 = { ...m.trigger };
  const caretMid = {
    x: (m.caret.left + m.caret.right) / 2,
    y: (m.caret.top + m.caret.bottom) / 2,
  };
  const facing = {
    top: () =>
      caretMid.y >= m.content.bottom - 1 && caretMid.y <= trigger2.top + 1,
    bottom: () =>
      caretMid.y <= m.content.top + 1 && caretMid.y >= trigger2.bottom - 1,
    left: () =>
      caretMid.x >= m.content.right - 1 && caretMid.x <= trigger2.left + 1,
    right: () =>
      caretMid.x <= m.content.left + 1 && caretMid.x >= trigger2.right - 1,
  }[m.side as "top"];
  expect(facing?.(), `caret faces the trigger on the ${m.side}`).toBe(true);

  // (a) The caret stays on the trigger. Beside the trigger, a start or end
  // aligned box lines its edge up with the trigger's and centers the caret
  // on the box, not on the trigger (see _tooltip.scss), so there the caret
  // must stay at the center of the box as placed, before any slide.
  const aimed =
    m.across || align === "center"
      ? trigger.center
      : (content.start + content.end) / 2 - m.applied;
  expect(Math.abs(caret.center - aimed)).toBeLessThan(2);

  // (b) The caret stays 1rem inside the box. Where the unslid box already
  // had it closer (a start or end aligned tooltip on a small trigger), the
  // slide never moves it closer still.
  const unslidStart = content.start - m.applied;
  const unslidEnd = content.end - m.applied;
  const fromStart = caret.center - content.start;
  const fromEnd = content.end - caret.center;
  expect(fromStart).toBeGreaterThanOrEqual(
    Math.min(INSET, caret.center - unslidStart - 0.5),
  );
  expect(fromEnd).toBeGreaterThanOrEqual(
    Math.min(INSET, unslidEnd - caret.center - 0.5),
  );

  // (c) The box stays in the window, except where that inset needs it to
  // reach past the edge.
  const overStart = Math.max(0, 16 - caret.center);
  const overEnd = Math.max(0, caret.center + 16 - m.size);
  expect(content.start).toBeGreaterThanOrEqual(-overStart - 0.5);
  expect(content.end).toBeLessThanOrEqual(m.size + overEnd + 0.5);
}

for (const name of Object.keys(TRIGGERS) as Name[]) {
  for (const dir of ["ltr", "rtl"] as const) {
    for (const direction of DIRECTIONS_OF[name]) {
      // Right to left swaps start and end above and below. The side
      // placements are the ones it leaves alone, so only they repeat.
      if (dir === "rtl" && (direction === "top" || direction === "bottom"))
        continue;
      test.describe(`${name} ${direction}${dir === "rtl" ? " (rtl)" : ""}`, () => {
        for (const align of ALIGNS) {
          for (const edge of EDGES) {
            test(`${align} at ${edge}`, async ({ page }) => {
              await page.setViewportSize({ width: WIDTH, height: HEIGHT });
              await page.goto(
                `/icon-tooltip-side-edge.html?direction=${direction}&align=${align}&edge=${edge}&component=${name}${dir === "rtl" ? "&dir=rtl" : ""}`,
              );
              await page.evaluate(() => document.fonts.ready);
              check(await measure(page, name), direction, align, edge);
            });
          }
        }
      });
    }
  }
}

// The default fixture: a side tooltip with its trigger at the top and at
// the bottom edge.
for (const name of ["Button", "TooltipIcon"] as const) {
  for (const edge of ["top", "bottom"]) {
    test(`${name} tooltip beside its trigger stays in the window (${edge})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: WIDTH, height: HEIGHT });
      await page.goto("/icon-tooltip-side-edge.html");
      await page.evaluate(() => document.fonts.ready);

      const trigger = page
        .getByTestId(`${name}-${edge}`)
        .locator(TRIGGERS[name])
        .first();
      await trigger.focus();
      const tooltip = page.locator(".bx--tooltip-portal");
      await expect(tooltip).toBeVisible();
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );

      const [content, caret, anchor] = await Promise.all(
        [
          tooltip.locator(".bx--tooltip-portal__content"),
          tooltip.locator(".bx--tooltip-portal__caret"),
          trigger,
        ].map((locator) =>
          locator.evaluate((el) => {
            const { top, bottom } = el.getBoundingClientRect();
            return { top, bottom, center: (top + bottom) / 2 };
          }),
        ),
      );

      expect(Math.abs(caret.center - anchor.center)).toBeLessThan(2);
      expect(caret.center - content.top).toBeGreaterThanOrEqual(INSET);
      expect(content.bottom - caret.center).toBeGreaterThanOrEqual(INSET);
      const overTop = Math.max(0, 16 - caret.center);
      const overBottom = Math.max(0, caret.center + 16 - HEIGHT);
      expect(content.top).toBeGreaterThanOrEqual(-overTop - 0.5);
      expect(content.bottom).toBeLessThanOrEqual(HEIGHT + overBottom + 0.5);
    });
  }
}
