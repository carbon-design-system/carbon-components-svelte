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
      // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
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
});

// Carbon v11 draws a disabled ghost button's text and icon in
// `$text-disabled`, and an icon-only one in `$icon-on-color-disabled`.
test("disabled ghost buttons use v11's disabled colors", async ({ page }) => {
  await page.goto("/button-icon-kinds.html");
  for (const theme of ["white", "g100"]) {
    // biome-ignore lint/performance/noAwaitInLoops: one theme at a time
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
      const ghost = document.querySelector("[data-testid=kind-ghost]");
      const text = ghost?.querySelector(
        ".bx--btn:disabled:not(.bx--btn--icon-only)",
      );
      const iconOnly = ghost?.querySelector(".bx--btn--icon-only:disabled");
      const fill = (button?: Element | null) => {
        const icon = button?.querySelector(".bx--btn__icon");
        return icon ? getComputedStyle(icon).fill : "";
      };
      return {
        textDisabled: token("--cds-text-disabled"),
        iconOnColorDisabled: token("--cds-icon-on-color-disabled"),
        text: text ? getComputedStyle(text).color : "",
        textIcon: fill(text),
        iconOnly: fill(iconOnly),
      };
    }, theme);
    expect.soft(read.text, `${theme} text`).toBe(read.textDisabled);
    expect.soft(read.textIcon, `${theme} text icon`).toBe(read.textDisabled);
    expect
      .soft(read.iconOnly, `${theme} icon-only icon`)
      .toBe(read.iconOnColorDisabled);
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
