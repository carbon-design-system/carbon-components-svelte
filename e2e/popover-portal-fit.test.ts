import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A portalled Popover, and the Toggletip built on it, fits in the window
// and points its caret at the anchor: on the page and in a Modal, at 320
// and 1280 px, after the window resizes while it is open, and in RTL. The
// placement class always names a real placement.

const PLACEMENT =
  /^bx--popover--((top|bottom)(-(left|right))?|(left|right)(-(top|bottom))?)$/;

type Measured = {
  /** The caret's center minus the anchor's center, along the anchor's edge. */
  caretOffset: number;
  /** Half the anchor's length along that edge. */
  anchorHalf: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  placement: string;
};

async function measure(button: Locator): Promise<Measured> {
  const controls = await button.getAttribute("aria-controls");
  return button.evaluate((anchorEl, id) => {
    const el = (
      id
        ? document.getElementById(id)
        : document.querySelector(".bx--popover--portal.bx--popover--open")
    ) as HTMLElement;
    const contents = el.querySelector(".bx--popover-contents") as HTMLElement;
    const r = contents.getBoundingClientRect();
    const anchor = anchorEl.getBoundingClientRect();
    const placement = [...el.classList]
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
    const across = /--(top|bottom)/.test(placement);
    return {
      caretOffset: across
        ? x - (anchor.left + anchor.width / 2)
        : y - (anchor.top + anchor.height / 2),
      anchorHalf: (across ? anchor.width : anchor.height) / 2,
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      placement,
    };
  }, controls);
}

const EDGE = /-(left|right|top|bottom)$/;

/**
 * Waits for the popover to settle, then checks where it sits. Toggletip and
 * a centered Popover center the caret on the anchor. A start- or end-aligned
 * Popover keeps Carbon's caret, 20px in from its corner, on the anchor.
 */
async function expectFits(button: Locator, label: string) {
  await expect(async () => {
    const m = await measure(button);
    expect(m.placement, label).toMatch(PLACEMENT);
    const centered = label.startsWith("toggletip") || !EDGE.test(m.placement);
    expect(Math.abs(m.caretOffset), `${label}: caret`).toBeLessThanOrEqual(
      centered ? 1 : m.anchorHalf,
    );
    expect(m.left, `${label}: left`).toBeGreaterThanOrEqual(0);
    expect(m.right, `${label}: right`).toBeLessThanOrEqual(m.width);
    expect(m.top, `${label}: top`).toBeGreaterThanOrEqual(0);
    expect(m.bottom, `${label}: bottom`).toBeLessThanOrEqual(m.height);
  }).toPass({ timeout: 2000 });
}

async function resize(page: Page, width: number) {
  await page.setViewportSize({ width, height: 640 });
}

for (const dir of ["ltr", "rtl"] as const)
  for (const where of ["page", "modal"] as const)
    test(`${where === "modal" ? "in a Modal" : "on the page"}, ${dir}: the caret points at the anchor and the content stays in the window`, async ({
      page,
    }) => {
      await resize(page, 320);
      await page.goto(`/popover-portal-fit.html?dir=${dir}`);
      await page.evaluate(() => document.fonts.ready);
      if (where === "modal") {
        await page.getByRole("button", { name: "Open modal" }).click();
        await expect(
          page.getByRole("dialog", { name: "Popover in a Modal" }),
        ).toBeVisible();
      }
      for (const kind of ["toggletip", "popover"] as const) {
        const button = page.getByTestId(`${where}-${kind}`).getByRole("button");
        for (const [from, to] of [
          [320, 1280],
          [1280, 320],
        ]) {
          // biome-ignore lint/performance/noAwaitInLoops: one popover opens at a time
          await resize(page, from);
          await button.click();
          await expectFits(button, `${kind} at ${from} px`);
          await resize(page, to);
          await expectFits(button, `${kind} from ${from} to ${to} px`);
          await button.click();
          await expect(page.locator(".bx--popover--portal")).toHaveCount(0);
        }
      }
    });

test("a new align while open takes its own side and edge", async ({ page }) => {
  await resize(page, 1280);
  await page.goto("/popover-portal-fit.html");
  const button = page.getByRole("button", { name: "Popover on the page" });
  await button.click();
  // The open popover may cover these buttons.
  await page
    .getByRole("button", { name: "Align right-end" })
    .dispatchEvent("click");
  // The anchor sits near the top, so `right-end` fits as `right-top`.
  await expect(page.locator(".bx--popover--portal")).toHaveClass(
    /bx--popover--right-top/,
  );
  await page
    .getByRole("button", { name: "Align bottom-start" })
    .dispatchEvent("click");
  const popover = page.locator(".bx--popover--portal");
  await expect(popover).toHaveClass(/bx--popover--bottom-left/);
  await expect(async () => {
    const [anchor, box] = await Promise.all([
      button.boundingBox(),
      popover.boundingBox(),
    ]);
    expect(box?.y).toBeGreaterThan((anchor?.y ?? 0) + (anchor?.height ?? 0));
    expect(Math.abs((box?.x ?? 0) - (anchor?.x ?? 0))).toBeLessThanOrEqual(1);
  }).toPass({ timeout: 2000 });
});
