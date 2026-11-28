import { expect, test } from "./helpers/host";

test.describe("Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/button.html");
  });

  test("renders with text", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();
  });

  test("can be located and clicked by data-testid", async ({ page }) => {
    const button = page.getByTestId("button-primary");
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByTestId("click-count")).toContainText("1");
  });

  test("disabled button cannot be clicked", async ({ page }) => {
    const button = page.getByRole("button", { name: "Disabled" });
    await expect(button).toBeDisabled();
  });

  test("secondary variant renders", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Secondary" })).toBeVisible();
  });

  // The shortcut keys are text inside the button, so they need 4.5:1 on
  // its background (WCAG 1.4.3). Disabled keys match the disabled label.
  test("shortcut keys keep the label's contrast on every kind", async ({
    page,
  }) => {
    for (const theme of ["white", "g100"]) {
      const rows = await page.evaluate((theme) => {
        document.documentElement.setAttribute("theme", theme);
        const opaque = (color: string) =>
          color !== "transparent" && !/rgba\(.*, 0\)$/.test(color);
        return [
          ...document.querySelectorAll<HTMLElement>(
            "[data-testid=shortcut-kinds] [data-kind]",
          ),
        ].map((button) => {
          const key = button.querySelector(".bx--kbd__key");
          if (!key) throw new Error("no key");
          let alpha = 1;
          let background = "";
          for (let el: Element | null = key; el; el = el.parentElement) {
            const style = getComputedStyle(el);
            if (el === key || button.contains(el)) {
              alpha *= Number(style.opacity);
            }
            if (!background && opaque(style.backgroundColor) && el !== key) {
              background = style.backgroundColor;
            }
          }
          return {
            kind: button.dataset.kind ?? "",
            key: getComputedStyle(key).color,
            label: getComputedStyle(button).color,
            alpha,
            background:
              background || getComputedStyle(document.body).backgroundColor,
          };
        });
      }, theme);

      expect(rows).toHaveLength(8);
      for (const { kind, key, label, alpha, background } of rows) {
        expect.soft(key, `${theme} ${kind} color`).toBe(label);
        expect.soft(alpha, `${theme} ${kind} opacity`).toBe(1);
        if (kind === "disabled") continue;
        expect
          .soft(contrast(key, background, alpha), `${theme} ${kind} contrast`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  // The tooltip is inverse: dark in light themes, light in dark ones. Its
  // key is a cap a step off that surface, in its text color, and as tall
  // as its line, so the tooltip keeps its 24px height.
  test("draws a tooltip's shortcut key as a cap on its surface", async ({
    page,
  }) => {
    await page.getByTestId("shortcut-tooltip").hover();
    for (const theme of ["white", "g100"]) {
      const row = await page.evaluate((theme) => {
        document.documentElement.setAttribute("theme", theme);
        const tooltip = document.querySelector<HTMLElement>(
          "[data-testid=shortcut-tooltip] .bx--assistive-text",
        );
        const key = tooltip?.querySelector(".bx--kbd__key");
        if (!tooltip || !key) throw new Error("no tooltip key");
        const probe = document.createElement("div");
        probe.style.backgroundColor = "var(--cds-background-inverse-hover)";
        document.body.append(probe);
        const step = getComputedStyle(probe).backgroundColor;
        probe.remove();
        const tip = getComputedStyle(tooltip);
        const cap = getComputedStyle(key);
        return {
          step,
          surface: tip.backgroundColor,
          text: tip.color,
          key: cap.backgroundColor,
          keyColor: cap.color,
          keyHeight: key.getBoundingClientRect().height,
          lineHeight: Number.parseFloat(tip.lineHeight),
        };
      }, theme);

      expect.soft(row.key, `${theme} key background`).toBe(row.step);
      expect.soft(row.key, `${theme} key on surface`).not.toBe(row.surface);
      expect.soft(row.keyColor, `${theme} key color`).toBe(row.text);
      expect
        .soft(contrast(row.keyColor, row.key, 1), `${theme} key contrast`)
        .toBeGreaterThanOrEqual(4.5);
      expect.soft(row.keyHeight, `${theme} key height`).toBeGreaterThan(0);
      expect
        .soft(row.keyHeight, `${theme} key height`)
        .toBeLessThanOrEqual(Math.ceil(row.lineHeight));
    }
  });
});

// A disabled ghost button draws its icon in `$icon-disabled` and its text
// in `$text-disabled`, with or without a label. Carbon v11 uses
// `$icon-on-color-disabled` for the icon-only one; this library does not.
test("styles an icon in the icon slot without its class", async ({ page }) => {
  await page.goto("/button-icon-kinds.html");
  await page.evaluate(() => document.fonts.ready);
  // Each icon's place in its button, its size and its fill.
  const icons = (testId: string) =>
    page.getByTestId(testId).evaluate((root) =>
      [...root.querySelectorAll("button svg")].map((svg) => {
        const button = svg.closest("button");
        if (!button) throw new Error("no button");
        const box = svg.getBoundingClientRect();
        const outer = button.getBoundingClientRect();
        return {
          x: Math.round(box.x - outer.x),
          y: Math.round(box.y - outer.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
          fill: getComputedStyle(svg).fill,
        };
      }),
    );
  for (const kind of [
    "primary",
    "secondary",
    "tertiary",
    "ghost",
    "danger",
    "danger-tertiary",
    "danger-ghost",
    "expressive",
  ]) {
    const expected = await icons(`kind-${kind}`);
    expect(expected.length).toBeGreaterThan(0);
    expect.soft(await icons(`slot-kind-${kind}`), kind).toEqual(expected);
  }
});

test("disabled ghost buttons share one gray with or without a label", async ({
  page,
}) => {
  await page.goto("/button-icon-kinds.html");
  for (const theme of ["white", "g100"]) {
    const read = await page.evaluate((theme) => {
      document.documentElement.setAttribute("theme", theme);
      const token = (name: string) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${name})`;
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const fill = (button?: Element | null) => {
        const icon = button?.querySelector(".bx--btn__icon");
        return icon ? getComputedStyle(icon).fill : "";
      };
      return {
        textDisabled: token("--cds-text-disabled"),
        iconDisabled: token("--cds-icon-disabled"),
        kinds: ["ghost", "danger-ghost"].map((kind) => {
          const scope = document.querySelector(`[data-testid=kind-${kind}]`);
          const text = scope?.querySelector(
            ".bx--btn:disabled:not(.bx--btn--icon-only)",
          );
          const iconOnly = scope?.querySelector(".bx--btn--icon-only:disabled");
          return {
            kind,
            text: text ? getComputedStyle(text).color : "",
            textIcon: fill(text),
            iconOnly: fill(iconOnly),
          };
        }),
      };
    }, theme);
    for (const { kind, text, textIcon, iconOnly } of read.kinds) {
      const name = `${theme} ${kind}`;
      expect.soft(text, `${name} text`).toBe(read.textDisabled);
      expect.soft(textIcon, `${name} text icon`).toBe(read.iconDisabled);
      expect.soft(iconOnly, `${name} icon-only icon`).toBe(textIcon);
    }
  }
});

type Rgb = [number, number, number];

function parse(color: string): Rgb {
  const [r, g, b] = color.match(/[\d.]+/g)?.map(Number) ?? [];
  return [r, g, b];
}

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast of `fg` at `alpha` over an opaque `bg`. */
function contrast(fg: string, bg: string, alpha: number) {
  const back = parse(bg);
  const over = parse(fg).map(
    (v, i) => v * alpha + back[i] * (1 - alpha),
  ) as Rgb;
  const [hi, lo] = [luminance(over), luminance(back)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
