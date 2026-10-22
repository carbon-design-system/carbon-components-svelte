import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Forced colors (Windows contrast themes) repaint author colors with a few
// system colors and drop box-shadows, so a state drawn only as a tint, an
// inset bar or a shadow ring vanishes. Chromium reports the forced values from
// getComputedStyle, so these read what a user in that mode sees.

const SYSTEM_COLORS = [
  "Canvas",
  "CanvasText",
  "Highlight",
  "HighlightText",
  "GrayText",
  "LinkText",
  "ButtonText",
] as const;
type SystemColor = (typeof SYSTEM_COLORS)[number];

// System colors resolve per platform, so look them up instead of hardcoding.
function systemColors(page: Page) {
  return page.evaluate((names) => {
    const probe = document.createElement("div");
    document.body.append(probe);
    const colors = Object.fromEntries(
      names.map((name) => {
        probe.style.backgroundColor = name;
        return [name, getComputedStyle(probe).backgroundColor];
      }),
    );
    probe.remove();
    return colors;
  }, SYSTEM_COLORS) as Promise<Record<SystemColor, string>>;
}

function style(page: Page, selector: string, pseudo?: string) {
  return page.evaluate(
    ([selector, pseudo]) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      const s = getComputedStyle(el, pseudo);
      return {
        background: s.backgroundColor,
        backgroundImage: s.backgroundImage,
        color: s.color,
        outline: `${s.outlineStyle} ${s.outlineWidth}`,
        outlineColor: s.outlineColor,
      };
    },
    [selector, pseudo ?? null] as const,
  );
}

test.describe("forced colors", () => {
  let system: Record<SystemColor, string>;

  test.beforeEach(async ({ page, browserName }) => {
    // WebKit matches the media query but paints author colors unchanged, so
    // a transparent outline stays transparent. Safari has no such mode.
    test.skip(browserName === "webkit", "WebKit does not force colors");
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/forced-colors.html");
    await expect(page.locator(".bx--tree-node").first()).toBeVisible();
    system = await systemColors(page);
  });

  const selected = [
    [
      ".bx--tree-node--selected > .bx--tree-node__label",
      ".bx--tree-node:not(.bx--tree-node--selected):not(.bx--tree-node--disabled) > .bx--tree-node__label",
    ],
    [
      ".bx--toggle-button--pressed",
      ".bx--toggle-button:not(.bx--toggle-button--pressed):not(:disabled)",
    ],
    [
      ".bx--tag--selectable-selected",
      ".bx--tag--selectable:not(.bx--tag--selectable-selected)",
    ],
    [
      ".bx--content-switcher--selected",
      ".bx--content-switcher-btn:not(.bx--content-switcher--selected)",
    ],
    [
      ".bx--switcher__item-link--selected",
      ".bx--switcher__item-link:not(.bx--switcher__item-link--selected)",
    ],
    [
      ".bx--structured-list-row--selected",
      ".bx--structured-list-row:not(.bx--structured-list-row--selected)",
    ],
  ] as const;

  test("selected and pressed items fill with Highlight, also on hover", async ({
    page,
  }) => {
    for (const [on, off] of selected) {
      // biome-ignore lint/performance/noAwaitInLoops: hover moves one pointer
      await page.hover(on);
      expect.soft(await style(page, on), on).toMatchObject({
        background: system.Highlight,
        color: system.HighlightText,
      });
      expect
        .soft((await style(page, off)).background, off)
        .not.toBe(system.Highlight);
    }
  });

  test("the Truncate toggle reads as a link, also on hover", async ({
    page,
  }) => {
    const toggle = ".bx--text-truncate__toggle";
    // The toggle shows once the text measures as clipped.
    await page.locator(toggle).waitFor();
    expect
      .soft((await style(page, toggle)).color, toggle)
      .toBe(system.LinkText);
    await page.hover(toggle);
    expect
      .soft((await style(page, toggle)).color, toggle)
      .toBe(system.LinkText);
  });

  test("disabled items read GrayText, also on hover", async ({ page }) => {
    for (const selector of [
      ".bx--tree-node--disabled > .bx--tree-node__label",
      ".bx--toggle-button:disabled",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: hover moves one pointer
      await page.hover(selector, { force: true });
      const { background, color } = await style(page, selector);
      expect.soft(color, selector).toBe(system.GrayText);
      expect.soft(background, selector).not.toBe(system.Highlight);
    }
  });

  // Forced colors leave an SVG fill alone, so the icon's token blue would
  // stay on a dark Canvas.
  test("clickable tile icons follow the tile's text, or GrayText when disabled", async ({
    page,
  }) => {
    const [tile, disabled] = await page.evaluate(() =>
      [
        ".bx--tile--clickable:not(.bx--link--disabled)",
        ".bx--tile--clickable.bx--link--disabled",
      ].map((selector) => {
        const icon = document.querySelector(`${selector} .bx--tile--icon`);
        if (!icon?.parentElement) throw new Error(`no ${selector} icon`);
        return {
          color: getComputedStyle(icon.parentElement).color,
          fill: getComputedStyle(icon).fill,
        };
      }),
    );
    expect.soft(tile.fill).toBe(tile.color);
    expect.soft(disabled.fill).toBe(system.GrayText);
  });

  // The empty and the checked box differ only in shape and fill, and the
  // forced border is the same either way, so the fill carries the state.
  test("selectable tile checkboxes follow the text, fill with Highlight when selected, or read GrayText when disabled", async ({
    page,
  }) => {
    const states = await page.evaluate(() =>
      [
        ".bx--tile--selectable:not(.bx--tile--is-selected):not(.bx--tile--disabled)",
        ".bx--tile--is-selected:not(.bx--tile--disabled)",
        ".bx--tile--disabled:not(.bx--tile--is-selected)",
        ".bx--tile--disabled.bx--tile--is-selected",
      ].map((selector) => {
        const box = document.querySelector(
          `${selector} .bx--tile__checkmark--persistent`,
        );
        const icon = box?.querySelector("svg");
        if (!box || !icon) throw new Error(`no ${selector} checkbox`);
        return {
          color: getComputedStyle(box).color,
          fill: getComputedStyle(icon).fill,
          opacity: getComputedStyle(box).opacity,
        };
      }),
    );
    const [unselected, selected, disabled, disabledSelected] = states;
    for (const state of states) expect.soft(state.opacity).toBe("1");
    expect.soft(unselected.fill).toBe(unselected.color);
    expect.soft(selected.fill).toBe(system.Highlight);
    expect.soft(disabled.fill).toBe(system.GrayText);
    expect.soft(disabledSelected.fill).toBe(system.GrayText);
  });

  // [focus target, element drawing the ring, pseudo-element, ring color]
  const rings: [string, string, string | undefined, SystemColor][] = [
    [
      ".bx--tree-node--selected",
      ".bx--tree-node--selected > .bx--tree-node__label",
      undefined,
      "HighlightText",
    ],
    [
      ".bx--toggle-button--pressed",
      ".bx--toggle-button--pressed",
      undefined,
      "HighlightText",
    ],
    [
      ".bx--toggle-button:not(.bx--toggle-button--pressed)",
      ".bx--toggle-button:not(.bx--toggle-button--pressed)",
      undefined,
      "CanvasText",
    ],
    [".bx--tag--selectable", ".bx--tag--selectable", undefined, "CanvasText"],
    [
      ".bx--content-switcher--selected",
      ".bx--content-switcher--selected",
      undefined,
      "HighlightText",
    ],
    [
      ".bx--switcher__item-link--selected",
      ".bx--switcher__item-link--selected",
      undefined,
      "HighlightText",
    ],
    [
      "#structured-selected",
      ".bx--structured-list-row--selected",
      undefined,
      "HighlightText",
    ],
    [".bx--toggle-input", ".bx--toggle__switch", "::before", "Highlight"],
    [
      ".bx--text-truncate--focusable",
      ".bx--text-truncate--focusable",
      undefined,
      "CanvasText",
    ],
    [
      ".bx--text-truncate__toggle",
      ".bx--text-truncate__toggle",
      undefined,
      "CanvasText",
    ],
    [".bx--header__name", ".bx--header__name", undefined, "Highlight"],
    [
      ".bx--header__menu-item",
      ".bx--header__menu-item",
      undefined,
      "Highlight",
    ],
    [
      ".bx--header__global .bx--header__action",
      ".bx--header__global .bx--header__action",
      undefined,
      "Highlight",
    ],
  ];

  test("focus rings stay visible in a contrasting system color", async ({
    page,
  }) => {
    await page.locator(".bx--text-truncate__toggle").waitFor();
    for (const [target, ring, pseudo, color] of rings) {
      // biome-ignore lint/performance/noAwaitInLoops: one element has focus at a time
      await page.focus(target);
      expect.soft(await style(page, ring, pseudo), target).toMatchObject({
        outline: "solid 2px",
        outlineColor: system[color],
      });
    }
  });

  test("progress fills and floating surfaces stand out from the page", async ({
    page,
  }) => {
    const bars = [
      ".bx--progress-bar__bar",
      ".bx--meter--success .bx--meter__bar",
      ".bx--meter--warning .bx--meter__bar",
      ".bx--meter--error .bx--meter__bar",
    ];
    // Floating surfaces lose the shadow that separated them from the page.
    const surfaces = [
      ".bx--progress-bar__track",
      ".bx--meter__track",
      ".bx--popover-contents",
      ".bx--overflow-menu-options",
      ".bx--menu",
    ];
    const [barStyles, surfaceStyles] = await Promise.all([
      Promise.all(bars.map((bar) => style(page, bar))),
      Promise.all(surfaces.map((surface) => style(page, surface))),
    ]);
    bars.forEach((bar, i) => {
      expect.soft(barStyles[i].background, bar).toBe(system.Highlight);
    });
    surfaces.forEach((surface, i) => {
      expect.soft(surfaceStyles[i], surface).toMatchObject({
        outline: "solid 1px",
        outlineColor: system.CanvasText,
      });
    });

    expect
      .soft(await style(page, ".bx--meter__threshold"))
      .toMatchObject({ background: system.CanvasText });
    expect
      .soft(
        await style(
          page,
          ".bx--progress-bar--indeterminate .bx--progress-bar__track",
          "::after",
        ),
      )
      .toMatchObject({ background: system.Highlight, backgroundImage: "none" });
  });

  // Forced colors keep SVG fills. A dark theme draws these edges in the light
  // fill color, which a light Canvas would swallow.
  test("shape indicator edges read CanvasText, also in a dark theme", async ({
    page,
  }) => {
    const edges = [
      ".bx--shape-indicator--medium path:first-of-type",
      "[theme=g100] .bx--shape-indicator--low path:nth-of-type(2)",
      "[theme=g100] .bx--shape-indicator--cautious path:first-of-type",
    ];
    const fills = await page.evaluate(
      (selectors) =>
        selectors.map((selector) => {
          const el = document.querySelector(selector);
          if (!el) throw new Error(`no ${selector}`);
          return getComputedStyle(el).fill;
        }),
      edges,
    );
    edges.forEach((edge, i) => {
      expect.soft(fills[i], edge).toBe(system.CanvasText);
    });
  });
});

// The subtle read-only border is a color cue that forced colors erases, so
// the read-only icon, or the steppers' disabled color, has to carry the state.
test("forced colors: read-only fields keep a non-color cue", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "WebKit does not force colors");
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/readonly-fields.html");
  await expect(page.getByTestId("fluid-number-input")).toBeVisible();
  const system = await systemColors(page);
  const icon = ".bx--text-input__readonly-icon";
  const stepper = ".bx--number__control-btn svg";
  const cases: [string, string, SystemColor][] = [
    ["text-input", icon, "CanvasText"],
    ["password-input", icon, "CanvasText"],
    ["number-input-no-steppers", icon, "CanvasText"],
    ["fluid-text-input", icon, "CanvasText"],
    ["number-input", stepper, "GrayText"],
    ["fluid-number-input", stepper, "GrayText"],
    ["number-input-editable", stepper, "ButtonText"],
  ];
  const fills = await Promise.all(
    cases.map(([id, selector]) =>
      page
        .getByTestId(id)
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).fill),
    ),
  );
  cases.forEach(([id, , color], i) => {
    expect.soft(fills[i], id).toBe(system[color]);
  });
});

test("prefers-contrast: more dots the focus outline", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  await page.goto("/forced-colors.html");
  await page.focus(".bx--toggle-button--pressed");
  expect((await style(page, ".bx--toggle-button--pressed")).outline).toBe(
    "dotted 2px",
  );
});
