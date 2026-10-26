import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// A read-only checkbox, radio or toggle is still in use, so its outline must
// reach the 3:1 that WCAG 1.4.11 asks of a control's boundary. The disabled
// colors do not: icon-disabled is translucent in v11. These read the outline
// colors a user sees, in each theme, and compare them to the token and to the
// page behind them.

const THEMES = ["white", "g10", "g80", "g90", "g100"] as const;

type Outline = { label: string; color: string };

/** Outline colors of the controls under test, and the tokens to compare. */
function read(page: Page, theme: string) {
  return page.evaluate((theme) => {
    document.documentElement.setAttribute("theme", theme);
    const border = (el: Element | null, pseudo?: string) => {
      if (!el) throw new Error("fixture element missing");
      return getComputedStyle(el, pseudo).borderTopColor;
    };
    const token = (name: string) => {
      const probe = document.createElement("div");
      probe.style.color = `var(--cds-${name})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const boxes = (testId: string) => [
      ...document.querySelectorAll(
        `[data-testid=${testId}] .bx--checkbox-label`,
      ),
    ];
    const [uncheckedBox, checkedBox, disabledBox] = boxes(
      "readonly-checkboxes",
    );
    const [onRadio, offRadio] = [
      ...document.querySelectorAll(
        "[data-testid=readonly-radios] .bx--radio-button__appearance",
      ),
    ];
    const [offToggle, onToggle, disabledToggle] = [
      ...document.querySelectorAll(
        "[data-testid=readonly-toggles] .bx--toggle__switch",
      ),
    ];
    const outlines: Outline[] = [
      { label: "checkbox unchecked", color: border(uncheckedBox, "::before") },
      { label: "checkbox checked", color: border(checkedBox, "::before") },
      { label: "radio selected", color: border(onRadio) },
      { label: "radio not selected", color: border(offRadio) },
      { label: "toggle off", color: border(offToggle, "::before") },
      { label: "toggle on", color: border(onToggle, "::before") },
    ];
    return {
      outlines,
      disabled: [
        { label: "checkbox", color: border(disabledBox, "::before") },
        { label: "toggle", color: border(disabledToggle, "::before") },
      ] as Outline[],
      secondary: token("icon-secondary"),
      disabledToken: token("icon-disabled"),
      background: getComputedStyle(document.body).backgroundColor,
    };
  }, theme);
}

type Rgba = [number, number, number, number];

function parse(color: string): Rgba {
  const nums = color.match(/[\d.]+/g)?.map(Number) ?? [];
  return [nums[0], nums[1], nums[2], nums[3] ?? 1];
}

function luminance([r, g, b]: Rgba) {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** WCAG contrast of `fg` painted over an opaque `bg`. */
function contrast(fg: string, bg: string) {
  const [br, bgg, bb] = parse(bg);
  const [r, g, b, a] = parse(fg);
  const over: Rgba = [
    r * a + br * (1 - a),
    g * a + bgg * (1 - a),
    b * a + bb * (1 - a),
    1,
  ];
  const [hi, lo] = [luminance(over), luminance(parse(bg))].sort(
    (x, y) => y - x,
  );
  return (hi + 0.05) / (lo + 0.05);
}

test("read-only outlines are the secondary icon color, with 3:1 contrast", async ({
  page,
}) => {
  await page.goto("/readonly-controls.html");

  for (const theme of THEMES) {
    const { outlines, disabled, secondary, disabledToken, background } =
      await read(page, theme);

    for (const { label, color } of outlines) {
      expect.soft(color, `${theme} ${label} outline`).toBe(secondary);
      expect
        .soft(contrast(color, background), `${theme} ${label} contrast`)
        .toBeGreaterThanOrEqual(3);
    }

    // Only read-only controls changed: disabled ones keep the disabled color.
    for (const { label, color } of disabled)
      expect
        .soft(color, `${theme} disabled ${label} outline`)
        .not.toBe(secondary);
    expect(disabledToken).not.toBe(secondary);
  }
});
