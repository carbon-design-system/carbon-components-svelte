import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// An open Popover stays in view: it takes the other side or edge when it
// would run past the window, and moves to a portal when a box around it
// would cut it off. One that fits stays as it is. Toggletip and
// OperationalTag open the same Popover, so they fit the same way.

type Opened = {
  inWindow: boolean;
  /** Corners of the surface that something else covers. */
  covered: number;
  align: string;
  portalled: boolean;
  /** The caret's center minus the anchor's center, along the anchor's edge. */
  caretOffset: number;
  /** Half the anchor's length along that edge. */
  anchorHalf: number;
};

/** Opens a case by its trigger, then measures its popover. */
async function open(page: Page, id: string, trigger: string): Promise<Opened> {
  const host = page.getByTestId(id);
  await host.scrollIntoViewIfNeeded();
  const button = host.getByRole("button", { name: trigger });
  await button.click();
  const controls = await button.getAttribute("aria-controls");
  const popover = controls
    ? page.locator(`[id="${controls}"]`)
    : page.locator(".bx--popover--open").last();
  await expect(popover).toBeVisible();
  // Fit, a move to a portal, and the portal's two placement passes.
  await page.evaluate(
    () =>
      new Promise((r) =>
        requestAnimationFrame(() =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
      ),
  );
  return popover.evaluate((el, triggerName) => {
    const contents = el.querySelector(".bx--popover-contents") as HTMLElement;
    const r = contents.getBoundingClientRect();
    const anchor = [...document.querySelectorAll("button")]
      .find(
        (b) =>
          (b.getAttribute("aria-label") ?? b.textContent?.trim()) ===
          triggerName,
      )
      ?.getBoundingClientRect() as DOMRect;
    const align = [...el.classList]
      .filter((c) => /^bx--popover--(top|bottom|left|right)/.test(c))
      .join(" ");
    // The caret's center: its box, then its own translation.
    const caret = getComputedStyle(contents, "::after");
    const shift = new DOMMatrix(caret.transform);
    const x =
      r.left +
      contents.clientLeft +
      Number.parseFloat(caret.left) +
      shift.e +
      Number.parseFloat(caret.width) / 2;
    const y =
      r.top +
      contents.clientTop +
      Number.parseFloat(caret.top) +
      shift.f +
      Number.parseFloat(caret.height) / 2;
    const across = /--(top|bottom)/.test(align);
    const corners = [
      [r.left + 4, r.top + 4],
      [r.right - 4, r.top + 4],
      [r.left + 4, r.bottom - 4],
      [r.right - 4, r.bottom - 4],
    ];
    return {
      inWindow:
        r.left >= 0 &&
        r.top >= 0 &&
        r.right <= document.documentElement.clientWidth &&
        r.bottom <= document.documentElement.clientHeight,
      covered: corners.filter(
        ([x, y]) => !el.contains(document.elementFromPoint(x, y)),
      ).length,
      align,
      portalled: el.classList.contains("bx--popover--portal"),
      caretOffset: across
        ? x - (anchor.left + anchor.width / 2)
        : y - (anchor.top + anchor.height / 2),
      anchorHalf: (across ? anchor.width : anchor.height) / 2,
    };
  }, trigger);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 600 });
});

test.describe("in LTR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popover-fit.html");
  });

  test("at the window's right edge, it aligns to its anchor's right edge", async ({
    page,
  }) => {
    const p = await open(page, "edge", "Edge");
    expect(p.inWindow).toBe(true);
    expect(p.align).toBe("bx--popover--bottom-right");
    expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
  });

  test("beside an anchor at the window's right edge, it opens on the left", async ({
    page,
  }) => {
    const p = await open(page, "side", "Side");
    expect(p.inWindow).toBe(true);
    expect(p.align).toBe("bx--popover--left-top");
    expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
  });

  test("at the bottom of the window, it opens above", async ({ page }) => {
    const p = await open(page, "bottom", "Bottom");
    expect(p.inWindow).toBe(true);
    expect(p.align).toBe("bx--popover--top-left");
    expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
  });

  test("a Toggletip at the window's right edge points at its button", async ({
    page,
  }) => {
    const p = await open(page, "toggletip-end", "Toggletip at the end");
    expect(p.inWindow).toBe(true);
    expect(p.align).toContain("bx--popover--bottom-right");
    expect(Math.abs(p.caretOffset)).toBeLessThan(1);
  });

  test("an OperationalTag at the window's right edge stays in view", async ({
    page,
  }) => {
    const p = await open(page, "tag-end", "Tag at the end");
    expect(p.inWindow).toBe(true);
    expect(p.align).toContain("bx--popover--bottom-right");
  });

  for (const [id, name] of [
    ["scroll", "Panel"],
    ["card", "Card"],
  ] as const)
    test(`in a ${id === "scroll" ? "scrolling panel" : "clipping card"}, it shows whole`, async ({
      page,
    }) => {
      const p = await open(page, id, name);
      expect(p.portalled).toBe(true);
      expect(p.covered).toBe(0);
      expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
      const scroll = await page
        .getByTestId(`${id}-box`)
        .evaluate((el) => el.scrollHeight - el.clientHeight);
      expect(scroll).toBeLessThanOrEqual(1);
      // The move to the portal leaves focus on the trigger.
      await expect(
        page.getByTestId(id).getByRole("button", { name }),
      ).toBeFocused();
    });

  test("a Toggletip in a clipping card moves to a portal and points at its button", async ({
    page,
  }) => {
    const p = await open(page, "toggletip-card", "Toggletip in a card");
    expect(p.portalled).toBe(true);
    expect(p.covered).toBe(0);
    expect(Math.abs(p.caretOffset)).toBeLessThan(1);
  });

  test("a portalled Toggletip keeps its caret edge in forced colors", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const p = await open(page, "toggletip-card", "Toggletip in a card");
    expect(p.portalled).toBe(true);
    // Below the button, the caret's top and left sides face away.
    const edge = await page
      .locator(
        ".bx--popover--portal.bx--toggletip-popover .bx--popover-contents",
      )
      .evaluate((el) => getComputedStyle(el, "::after").borderTopWidth);
    expect(edge).toBe("1px");
  });

  for (const [id, name] of [
    ["narrow", "Narrow"],
    ["narrow-portal", "Narrow portal"],
    ["toggletip-narrow", "Toggletip with no side room"],
  ] as const)
    test(`${id} with no room on either side at 320px opens above or below`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 600 });
      const p = await open(page, id, name);
      expect(p.inWindow).toBe(true);
      expect(p.align).toMatch(/^bx--popover--(top|bottom)/);
      expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
    });

  test("one that fits keeps its align, in place", async ({ page }) => {
    const p = await open(page, "plain", "Plain");
    expect(p.align).toBe("bx--popover--bottom-left");
    expect(p.portalled).toBe(false);
  });
});

test.describe("in RTL", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/popover-fit.html?dir=rtl");
  });

  // The right-edge row sits at the window's left edge in RTL.
  for (const [id, name] of [
    ["toggletip-start", "Toggletip at the start"],
    ["toggletip-end", "Toggletip at the end"],
  ] as const)
    test(`a Toggletip with align start (${id}) stays in view and points at its button`, async ({
      page,
    }) => {
      const p = await open(page, id, name);
      expect(p.inWindow).toBe(true);
      expect(Math.abs(p.caretOffset)).toBeLessThan(1);
    });

  test("a start-aligned Toggletip at the window's left edge opens to the right", async ({
    page,
  }) => {
    const p = await open(page, "toggletip-end", "Toggletip at the end");
    // `start` is the right in RTL; there it would run past the left edge.
    expect(p.align).toContain("bx--popover--bottom-left");
  });

  test("a bottom-start Popover at the window's left edge opens to the right", async ({
    page,
  }) => {
    const p = await open(page, "edge", "Edge");
    // `bottom-start` is `bottom-right` in RTL, past the window's left edge.
    expect(p.inWindow).toBe(true);
    expect(p.align).toBe("bx--popover--bottom-left");
    expect(Math.abs(p.caretOffset)).toBeLessThan(p.anchorHalf);
  });

  test("an OperationalTag at the window's left edge stays in view", async ({
    page,
  }) => {
    const p = await open(page, "tag-end", "Tag at the end");
    expect(p.inWindow).toBe(true);
  });
});
