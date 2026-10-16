import { expect, type Page, test } from "@playwright/test";

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
    [".bx--toggle-input", ".bx--toggle__switch", "::before", "Highlight"],
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
});

test("prefers-contrast: more dots the focus outline", async ({ page }) => {
  await page.emulateMedia({ contrast: "more" });
  await page.goto("/forced-colors.html");
  await page.focus(".bx--toggle-button--pressed");
  expect((await style(page, ".bx--toggle-button--pressed")).outline).toBe(
    "dotted 2px",
  );
});
