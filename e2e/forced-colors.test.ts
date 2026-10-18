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
        borderColor: s.borderLeftColor,
        color: s.color,
        outline: `${s.outlineStyle} ${s.outlineWidth}`,
        outlineColor: s.outlineColor,
        fill: s.fill,
      };
    },
    [selector, pseudo ?? null] as const,
  );
}

// Share of the most common color in a screenshot of an element's first line
// of text: 1 when the text doesn't show. Forced text sits on a `Canvas`
// backplate, which getComputedStyle doesn't report.
async function flatness(page: Page, selector: string) {
  const clip = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`no ${selector}`);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.textContent?.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    });
    const text = walker.nextNode();
    if (!text) throw new Error(`no text in ${selector}`);
    const range = document.createRange();
    range.selectNodeContents(text);
    const { x, y, width, height } = range.getBoundingClientRect();
    return { x, y, width, height };
  }, selector);
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(async (png) => {
    const img = new Image();
    img.src = `data:image/png;base64,${png}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const counts = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Math.max(...counts.values()) / (data.length / 4);
  }, png);
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
      ".bx--chat-btn--quick-action--selected:not([disabled])",
      ".bx--chat-btn--quick-action:not(.bx--chat-btn--quick-action--selected):not([disabled])",
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

  // A selected label is `HighlightText` on `Highlight`. Left forced, its text
  // gets a `Canvas` backplate the same color as `HighlightText` in both
  // contrast schemes, so the label vanished into a solid block.
  test("selected and pressed labels show on their fill", async ({ page }) => {
    for (const [on] of selected) {
      // biome-ignore lint/performance/noAwaitInLoops: one screenshot at a time
      expect.soft(await flatness(page, on), on).toBeLessThan(0.95);
    }
  });

  test("disabled items read GrayText, also on hover", async ({ page }) => {
    for (const selector of [
      ".bx--tree-node--disabled > .bx--tree-node__label",
      ".bx--toggle-button:disabled",
      ".bx--chat-btn--quick-action:not(.bx--chat-btn--quick-action--selected)[disabled]",
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

  test("a chosen quick action keeps Highlight when disabled", async ({
    page,
  }) => {
    const chosen = ".bx--chat-btn--quick-action--selected[disabled]";
    await page.hover(chosen, { force: true });
    expect(await style(page, chosen)).toMatchObject({
      background: system.Highlight,
      color: system.HighlightText,
    });
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
      ".bx--popover--border .bx--popover-contents",
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

    // The Canvas caret would read as a gap in the outline; its edge stays.
    const carets = [
      // Toggletip keeps the v10 caret, so match the v11 caret only.
      ".bx--popover--caret:not(.bx--popover--border):not(.bx--toggletip-popover) .bx--popover-contents",
      ".bx--popover--caret.bx--popover--border:not(.bx--toggletip-popover) .bx--popover-contents",
    ];
    const caretStyles = await Promise.all(
      carets.map((caret) => style(page, caret, "::before")),
    );
    carets.forEach((caret, i) => {
      expect.soft(caretStyles[i].background, caret).toBe(system.CanvasText);
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

  test("the active TableOfContents bar fills with Highlight", async ({
    page,
  }) => {
    // Wait for the measurement, so it can't put the class back below.
    await expect(page.locator(".bx--toc")).toHaveClass(/bx--toc--measured/);
    expect
      .soft((await style(page, ".bx--toc__bar")).background)
      .toBe(system.Highlight);
    // A theme's Highlight can sit close to its CanvasText, so the bar also
    // stands out by width: it's wider than the track it covers.
    const widths = await page.evaluate(() => {
      const bar = document.querySelector(".bx--toc__bar");
      const list = document.querySelector(".bx--toc__list");
      if (!bar || !list) throw new Error("no toc");
      return {
        bar: bar.getBoundingClientRect().width,
        track: Number.parseFloat(getComputedStyle(list).borderLeftWidth),
      };
    });
    expect.soft(widths.bar).toBeGreaterThan(widths.track);
    // Before its first measurement, the active row draws its own bar.
    await page.evaluate(() =>
      document.querySelector(".bx--toc")?.classList.remove("bx--toc--measured"),
    );
    expect
      .soft(
        (await style(page, ".bx--toc__item--active", "::before")).background,
      )
      .toBe(system.Highlight);
  });

  test("chat bubbles, typing dots and the streaming caret stay visible", async ({
    page,
  }) => {
    const agent = ".bx--chat-message:not(.bx--chat-message--me)";
    const me = ".bx--chat-message--me";
    expect
      .soft(await style(page, `${agent} .bx--chat-message__bubble`))
      .toMatchObject({ outline: "solid 1px", outlineColor: system.CanvasText });
    expect
      .soft((await style(page, `${me} .bx--chat-message__bubble`)).outline)
      .toMatch(/^none /);
    // The typing dots, then the streaming caret in either bubble.
    const marks: [string, string?][] = [
      [".bx--chat-message__dot"],
      ...[agent, me].map((from): [string, string] => [
        `${from}.bx--chat-message--streaming .bx--chat-message__bubble`,
        "::after",
      ]),
    ];
    const markStyles = await Promise.all(
      marks.map(([mark, pseudo]) => style(page, mark, pseudo)),
    );
    marks.forEach(([mark], i) => {
      expect.soft(markStyles[i].background, mark).toBe(system.CanvasText);
    });
  });

  test("disabled checkboxes read GrayText, box and check included", async ({
    page,
  }) => {
    for (const label of [
      ".bx--checkbox:disabled:not(:checked) + .bx--checkbox-label",
      ".bx--checkbox:disabled:checked + .bx--checkbox-label",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: hover moves one pointer
      await page.hover(label, { force: true });
      const [text, box, check] = await Promise.all([
        style(page, label),
        style(page, label, "::before"),
        style(page, label, "::after"),
      ]);
      expect.soft(text.color, label).toBe(system.GrayText);
      expect.soft(box.borderColor, `${label}::before`).toBe(system.GrayText);
      expect.soft(check.borderColor, `${label}::after`).toBe(system.GrayText);
    }
    const enabled = ".bx--checkbox:not(:disabled) + .bx--checkbox-label";
    expect
      .soft((await style(page, enabled, "::before")).borderColor, enabled)
      .toBe(system.CanvasText);
  });

  test("the Toggletip icon reads ButtonText, also open and on hover", async ({
    page,
  }) => {
    const closed = ".bx--toggletip:not(.bx--toggletip--open) svg";
    const open = ".bx--toggletip--open .bx--toggletip-button svg";
    expect.soft((await style(page, open)).fill, open).toBe(system.ButtonText);
    await page.hover(closed);
    expect
      .soft((await style(page, closed)).fill, closed)
      .toBe(system.ButtonText);
  });

  test("the SearchMenu highlighted row fills with Highlight", async ({
    page,
  }) => {
    await page.getByRole("combobox", { name: "Search menu" }).focus();
    await page.keyboard.press("ArrowDown");
    const highlighted = ".bx--search-menu-item--highlighted";
    await page.hover(highlighted);
    expect.soft(await style(page, highlighted), highlighted).toMatchObject({
      background: system.Highlight,
      color: system.HighlightText,
    });
    const plain =
      ".bx--search-menu-item:not(.bx--search-menu-item--highlighted):not(.bx--search-menu-item--disabled)";
    expect
      .soft((await style(page, plain)).background, plain)
      .not.toBe(system.Highlight);
    const disabled = ".bx--search-menu-item--disabled";
    expect
      .soft((await style(page, disabled)).color, disabled)
      .toBe(system.GrayText);
    // The menu loses the shadow that separated it from the page.
    expect
      .soft(await style(page, ".bx--search-menu__menu"))
      .toMatchObject({ outline: "solid 1px", outlineColor: system.CanvasText });
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
