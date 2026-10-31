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
  "ButtonBorder",
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
    // The clip is in viewport coordinates.
    el.scrollIntoView({ block: "center" });
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

// Share of the pixels in the band `width` px inside an element's edge that
// show its ring: 1 when nothing covers the ring. A pixel in `Canvas` or
// `CanvasText` is a fill or a line drawn over it. The ring's own color
// differs where it blends with an edge below, since the emulated
// `Highlight` is translucent.
async function ringShare(
  page: Page,
  selector: string,
  system: Record<SystemColor, string>,
  width = 4,
) {
  const clip = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`no ${selector}`);
    // The clip is in viewport coordinates.
    el.scrollIntoView({ block: "center" });
    const { x, y, width, height } = el.getBoundingClientRect();
    return {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    };
  }, selector);
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(
    async ([png, covers, width]) => {
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
      const cover = covers.map((color) =>
        (color.match(/\d+/g) ?? []).slice(0, 3).map(Number),
      );
      let band = 0;
      let ring = 0;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const edge = Math.min(x, y, img.width - 1 - x, img.height - 1 - y);
          if (edge >= width) continue;
          const i = (y * img.width + x) * 4;
          band++;
          const covered = cover.some((rgb) =>
            rgb.every((c, k) => Math.abs((data[i + k] ?? 0) - c) <= 2),
          );
          if (!covered) ring++;
        }
      }
      return ring / band;
    },
    [png, [system.Canvas, system.CanvasText], width] as const,
  );
}

// Colors (`r,g,b`) of the pixels in page rows `ys`, from `x` to `x + width`.
async function pixelRows(page: Page, x: number, width: number, ys: number[]) {
  const top = Math.round(Math.min(...ys));
  const clip = {
    x: Math.round(x),
    y: top,
    width: Math.round(width),
    height: Math.round(Math.max(...ys)) - top + 1,
  };
  const png = (await page.screenshot({ clip })).toString("base64");
  return page.evaluate(
    async ([png, rows]) => {
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
      return rows.map((y) =>
        Array.from({ length: img.width }, (_, x) => {
          const i = (y * img.width + x) * 4;
          return `${data[i]},${data[i + 1]},${data[i + 2]}`;
        }),
      );
    },
    [png, ys.map((y) => Math.round(y) - top)] as const,
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
    [
      ".bx--tabs__nav-link--selected",
      ".bx--tabs__nav-item--default .bx--tabs__nav-link",
    ],
    [
      "[data-testid=tabs-vertical] .bx--tabs__nav-link--selected",
      "[data-testid=tabs-vertical] .bx--tabs__nav-item--default .bx--tabs__nav-link",
    ],
    [
      "[data-testid=tabs-container] .bx--tabs__nav-link--selected",
      "[data-testid=tabs-container] .bx--tabs__nav-item--default .bx--tabs__nav-link",
    ],
    [
      ".bx--btn--icon-only.bx--btn--selected",
      ".bx--btn--icon-only:not(.bx--btn--selected)",
    ],
  ] as const;

  test("selected and pressed items fill with Highlight, also on hover", async ({
    page,
  }) => {
    for (const [on, off] of selected) {
      // biome-ignore lint/performance/noAwaitInLoops: hover moves one pointer
      await page.hover(on);
      // Polled: a hover transition can still be running at the first read.
      await expect
        .poll(() => style(page, on), { message: on })
        .toMatchObject({
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
    // An icon-only button has no visible label.
    for (const [on] of selected.filter(([on]) => !on.includes("bx--btn"))) {
      // biome-ignore lint/performance/noAwaitInLoops: one screenshot at a time
      expect.soft(await flatness(page, on), on).toBeLessThan(0.95);
    }
  });

  test("disabled items read GrayText, also on hover", async ({ page }) => {
    for (const selector of [
      ".bx--tree-node--disabled > .bx--tree-node__label",
      ".bx--toggle-button:disabled",
      ".bx--chat-btn--quick-action:not(.bx--chat-btn--quick-action--selected)[disabled]",
      ".bx--tabs__nav-item--disabled .bx--tabs__nav-link",
      "[data-testid=tabs-vertical] .bx--tabs__nav-item--disabled .bx--tabs__nav-link",
      "[data-testid=tabs-container] .bx--tabs__nav-item--disabled .bx--tabs__nav-link",
      ".bx--tag--disabled",
      ".bx--tile--clickable.bx--link--disabled",
      ".bx--tile--selectable.bx--tile--disabled",
      ".bx--edit-in-place--disabled .bx--edit-in-place__text-input",
      ".bx--card--disabled",
      ".bx--card--disabled .bx--card__label",
      ".bx--card--disabled .bx--card__title-text-row",
      ".bx--menu-option--disabled .bx--menu-option__label",
      ".bx--menu-option--disabled .bx--menu-option__info",
    ]) {
      // biome-ignore lint/performance/noAwaitInLoops: hover moves one pointer
      await page.hover(selector, { force: true });
      await expect
        .poll(async () => (await style(page, selector)).color, {
          message: selector,
        })
        .toBe(system.GrayText);
      const { background } = await style(page, selector);
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

  // A card's edge is its fill, which forced colors drop, so every card
  // draws a CanvasText outline over its border. A clickable card's icon
  // follows its text. A disabled card reads GrayText, edge and icon too.
  test("cards keep an edge, and clickable card icons follow the text", async ({
    page,
  }) => {
    const [card, disabled, still] = await page.evaluate(() =>
      ["card", "card-disabled", "card-static"].map((id) => {
        const card = document.querySelector(`[data-testid=${id}]`);
        if (!card) throw new Error(`no ${id}`);
        const style = getComputedStyle(card);
        const icon = card.querySelector(".bx--card__clickable-footer svg");
        return {
          border: style.borderLeftColor,
          outline: `${style.outlineStyle} ${style.outlineColor}`,
          color: style.color,
          fill: icon ? getComputedStyle(icon).fill : null,
        };
      }),
    );
    expect.soft(card.outline).toBe(`solid ${system.CanvasText}`);
    expect.soft(card.fill).toBe(card.color);
    expect.soft(still.outline).toBe(`solid ${system.CanvasText}`);
    expect.soft(disabled).toMatchObject({
      border: system.GrayText,
      outline: `solid ${system.GrayText}`,
      fill: system.GrayText,
    });
  });

  // A side panel's shadow and AI edge drop, so it draws a CanvasText
  // outline. Its resize line is a fill, so it reads Highlight on hover.
  test("a side panel keeps an edge, and its resize line reads Highlight", async ({
    page,
  }) => {
    // A click would leave later tests' scripted focus without a ring.
    await page.getByTestId("side-panel-open").press("Enter");
    await expect(page.locator(".bx--side-panel")).toBeVisible();
    expect
      .soft(await style(page, ".bx--side-panel"))
      .toMatchObject({ outline: "solid 1px", outlineColor: system.CanvasText });

    await page.hover(".bx--side-panel__resize-handle");
    await expect
      .poll(
        async () =>
          (await style(page, ".bx--side-panel__resize-handle", "::after"))
            .background,
      )
      .toBe(system.Highlight);
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
    ["#inline-edit", ".bx--edit-in-place--focused", undefined, "CanvasText"],
    ["[data-testid=card]", "[data-testid=card]", undefined, "CanvasText"],
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

  // Forced colors draw the reserved border on every InlineEdit, so the
  // red invalid border reads like the resting one. The icon carries it.
  test("an invalid InlineEdit keeps its warning icon", async ({ page }) => {
    const icon = ".bx--edit-in-place--invalid .bx--edit-in-place__warning-icon";
    expect.soft((await style(page, icon)).fill, icon).toBe(system.CanvasText);
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

  test("UserAvatar circles and status dots keep a CanvasText edge", async ({
    page,
  }) => {
    expect
      .soft(await style(page, ".bx--user-avatar"), ".bx--user-avatar")
      .toMatchObject({ outline: "solid 1px", outlineColor: system.CanvasText });
    const dots = ["online", "away", "busy", "offline"].map(
      (status) => `.bx--user-avatar__status--${status}`,
    );
    const [online, away, busy, offline] = await Promise.all(
      dots.map((dot) => style(page, dot)),
    );
    for (const [i, dot] of [online, away, busy, offline].entries()) {
      expect.soft(dot, dots[i]).toMatchObject({
        outline: "solid 1px",
        outlineColor: system.CanvasText,
      });
    }
    const fills = [online, away, busy].map((dot) => dot.background);
    expect.soft(new Set([...fills, system.Canvas]).size).toBe(4);
    expect.soft(offline).toMatchObject({
      background: system.Canvas,
      borderColor: system.GrayText,
    });
  });

  // Forced colors drop the box shadows that divide contained tabs. Each
  // link keeps its own edge instead: the focus reset's transparent outline
  // turns into a frame in the link's color.
  test("contained Tabs keep an edge per tab, in both directions", async ({
    page,
  }) => {
    const links = page.locator(
      "[data-testid=tabs-container] .bx--tabs__nav-link",
    );
    // Overview, Logs (selected), Metrics, Alerts, Settings (disabled)
    const colors: SystemColor[] = [
      "LinkText",
      "HighlightText",
      "LinkText",
      "LinkText",
      "GrayText",
    ];

    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, dir);
      const outlines = await links.evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el);
          return {
            outline: `${s.outlineStyle} ${s.outlineWidth}`,
            outlineColor: s.outlineColor,
          };
        }),
      );
      expect(outlines).toHaveLength(colors.length);
      colors.forEach((color, i) => {
        expect.soft(outlines[i], `${dir} tab ${i + 1}`).toEqual({
          outline: "solid 2px",
          outlineColor: system[color],
        });
      });
    }
  });

  // A key cap is drawn by its border; keys inside a button take the
  // button's text color, GrayText when it's disabled.
  test("Kbd keeps its edge, and shortcut keys follow their button", async ({
    page,
  }) => {
    expect
      .soft(await style(page, "#fc-kbd .bx--kbd__key"), "#fc-kbd")
      .toMatchObject({ borderColor: system.CanvasText });
    const ids = ["#fc-kbd-button", "#fc-kbd-button-disabled"];
    const pairs = await Promise.all(
      ids.map((id) =>
        Promise.all([style(page, id), style(page, `${id} .bx--kbd__key`)]),
      ),
    );
    pairs.forEach(([button, key], i) => {
      expect.soft(key, ids[i]).toMatchObject({ color: button.color });
    });
    expect
      .soft(await style(page, "#fc-kbd-button-disabled"))
      .toMatchObject({ color: system.GrayText });
  });

  // A button would read as ButtonText; "View all" looks and acts as a link.
  // The popover builds it on the first open.
  test("TagSet's View all reads as a link", async ({ page }) => {
    await page.click(".bx--tag-set-overflow__popover-trigger");
    expect
      .soft((await style(page, ".bx--tag-set-overflow__view-all")).color)
      .toBe(system.LinkText);
  });

  // Forced colors drop the code block's surface; table rules, the quote's
  // border and the divider are borders, which stay.
  test("Prose code blocks, tables, quotes and rules keep their edges", async ({
    page,
  }) => {
    const prose = '[data-testid="prose"]';
    expect
      .soft(await style(page, `${prose} pre`))
      .toMatchObject({ outline: "solid 1px", outlineColor: system.CanvasText });
    const edges = await page.evaluate((prose) => {
      const read = (selector: string, side: string) => {
        const el = document.querySelector(`${prose} ${selector}`);
        if (!el) throw new Error(`no ${selector}`);
        const s = getComputedStyle(el);
        return {
          color: s.getPropertyValue(`border-${side}-color`),
          width: s.getPropertyValue(`border-${side}-width`),
        };
      };
      return {
        th: read("th", "bottom"),
        td: read("td", "bottom"),
        blockquote: read("blockquote", "left"),
        hr: read("hr", "top"),
      };
    }, prose);
    for (const [element, edge] of Object.entries(edges)) {
      expect.soft(edge.color, element).toBe(system.CanvasText);
      expect.soft(edge.width, element).not.toBe("0px");
    }
  });

  test("a range drag shows both handles in their focus color", async ({
    page,
  }) => {
    const slider = page.getByTestId("range-slider-drag");
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.locator(".bx--slider__track").boundingBox();
    if (!box) throw new Error("missing track box");
    const y = box.y + box.height / 2;
    const icons = slider.locator(".bx--slider__thumb-icon--focus");
    const fills = () =>
      icons.evaluateAll((els) =>
        els.map((el) => {
          const s = getComputedStyle(el);
          return s.display === "none" ? "none" : s.fill;
        }),
      );

    await page.mouse.move(box.x + box.width * 0.4, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 2 });
    // Forced colors keep SVG fills, so the icon swap still marks both
    // handles while neither holds focus.
    const [lower, upper] = await fills();
    await page.mouse.up();
    expect.soft(lower).toBe(upper);
    expect.soft(lower).not.toBe("none");
    expect.soft(lower).not.toBe(system.Canvas);
  });

  // The action's ring is a box-shadow, which forced colors drop, so the
  // button's own forced-colors outline has to win. Its edge is the
  // browser's button border, ButtonBorder: ButtonText in Chromium, a mid
  // gray in Firefox.
  test("a toast action keeps its edge and a Highlight focus ring", async ({
    page,
  }) => {
    const action = ".bx--toast-notification__action-button";
    expect.soft(await style(page, action)).toMatchObject({
      borderColor: system.ButtonBorder,
      color: system.ButtonText,
    });
    await page.focus(action);
    expect.soft(await style(page, action)).toMatchObject({
      outline: "solid 1px",
      outlineColor: system.Highlight,
    });
  });

  // A field's resting outline is `transparent`, which forced colors paint
  // as a 2px `CanvasText` ring, so a 2px `Highlight` focus ring changed
  // only the color. Some palettes draw `Highlight` close to `CanvasText`.
  // [field, element drawing the ring, pseudo-element]
  const fieldRings: [string, string, string?][] = [
    ["text", "input"],
    ["password", "input"],
    ["number", "input"],
    ["textarea", "textarea"],
    ["search", "input"],
    ["select", "select"],
    ["combobox", "input"],
    ["dropdown", ".bx--list-box__field"],
    ["multiselect", ".bx--list-box__field--wrapper--input-focused"],
    ["multiselect-filterable", ".bx--list-box__field--wrapper--input-focused"],
    ["date", "input"],
    ["time", "input"],
    ["tags", ".bx--tag-input"],
    ["copy", "input"],
    ["pin", "input"],
  ];
  const fluidRings: [string, string, string?][] = [
    ["text", "input"],
    ["password", "input"],
    ["number", ".bx--number"],
    ["textarea", ".bx--text-area__wrapper", "::after"],
    ["search", "input"],
    ["select", ".bx--select-input__wrapper"],
    ["combobox", ".bx--list-box__field--wrapper--input-focused"],
    ["dropdown", ".bx--list-box__field--wrapper--input-focused"],
    ["multiselect", ".bx--list-box__field--wrapper--input-focused"],
    ["date", "input"],
    ["time", ".bx--time-picker__input .bx--text-input__field-wrapper"],
    ["copy", "input"],
    ["pin", "input"],
  ];

  test("fields focus with a 4px Highlight ring", async ({ page }) => {
    for (const [group, rings] of [
      ["fields", fieldRings],
      ["fluid-fields", fluidRings],
    ] as const) {
      for (const [field, ring, pseudo] of rings) {
        const scope = `[data-testid=${group}] [data-testid=${field}]`;
        const target = `${scope} :is(input:not([type=hidden]):not([tabindex="-1"]), textarea, select, [role=combobox])`;
        // biome-ignore lint/performance/noAwaitInLoops: one element has focus at a time
        await page.locator(target).first().focus();
        expect
          .soft(
            await style(page, `${scope} ${ring}`, pseudo),
            `${group} ${field}`,
          )
          .toMatchObject({
            outline: "solid 4px",
            outlineColor: system.Highlight,
          });
      }
    }
  });

  // The clear button sits over the field's inline end, and forced colors
  // painted its transparent resting outline as a 2px CanvasText box, and its
  // start-edge strip and hover fill as Canvas, on top of the field's 4px
  // Highlight ring.
  test("a Search focus ring runs past its clear button", async ({ page }) => {
    for (const group of ["fields", "fluid-fields"]) {
      const scope = `[data-testid=${group}] [data-testid=search]`;
      const close = `${scope} .bx--search-close`;
      const settled = () =>
        page.$eval(close, (el) =>
          el.getAnimations().every((a) => a.playState === "finished"),
        );
      // biome-ignore lint/performance/noAwaitInLoops: one field has focus at a time
      await page.fill(`${scope} input`, "us-east");
      // The clear button fades in.
      await expect.poll(settled).toBe(true);
      expect
        .soft(await ringShare(page, `${scope} input`, system), group)
        .toBe(1);
      await page.hover(close);
      await expect.poll(settled).toBe(true);
      expect
        .soft(await ringShare(page, `${scope} input`, system), `${group} hover`)
        .toBe(1);
      await page.mouse.move(0, 0);
      await page.focus(close);
      expect
        .soft(await style(page, close), `${group} clear button focus`)
        .toMatchObject({ outline: "solid 2px" });
      await page.fill(`${scope} input`, "");
    }
  });

  // The menu drew its 1px edge outside its own box, 1px past the field's
  // sides and over the last row of the field's focus ring, and the field
  // drew a 1px edge outside its 2px resting box.
  test("an open list box's menu lines up with its field", async ({ page }) => {
    const rgb = (color: string) => color.match(/\d+/g)?.join(",");
    const canvas = rgb(system.Canvas);
    const text = rgb(system.CanvasText);
    for (const [field, trigger] of [
      ["dropdown", ".bx--list-box__field"],
      ["combobox", "input"],
      ["multiselect", ".bx--list-box__field"],
    ]) {
      const scope = `[data-testid=fields] [data-testid=${field}]`;
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      await page.click(`${scope} ${trigger}`);
      const option = page.locator(`${scope} .bx--list-box__menu-item`).nth(2);
      await expect(option).toBeVisible();
      await page.mouse.move(0, 0);
      const box = await page.locator(`${scope} ${trigger}`).boundingBox();
      const row = await option.boundingBox();
      if (!box || !row) throw new Error(`no ${field} box`);
      const [fieldRow = [], optionRow = [], ringRow = []] = await pixelRows(
        page,
        box.x - 4,
        box.width / 2,
        [
          box.y + box.height / 2,
          row.y + row.height / 2,
          box.y + box.height - 1,
        ],
      );
      const edge = (pixels: string[]) => pixels.findIndex((c) => c !== canvas);
      expect.soft(edge(optionRow), `${field} menu edge`).toBe(edge(fieldRow));
      expect.soft(ringRow.at(-1), `${field} ring`).not.toBe(text);
      await page.keyboard.press("Escape");
    }
  });

  // The highlight was a tint, or a ring the rows' own edges matched.
  test("a list box's highlighted option fills with Highlight", async ({
    page,
  }) => {
    for (const [field, trigger] of [
      ["dropdown", ".bx--list-box__field"],
      ["combobox", "input"],
      ["multiselect", ".bx--list-box__field"],
      ["treeselect", ".bx--list-box__field"],
    ]) {
      const scope = `[data-testid=fields] [data-testid=${field}]`;
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      await page.focus(`${scope} ${trigger}`);
      const highlighted = `${scope} .bx--list-box__menu-item--highlighted`;
      // The first press opens the menu; ComboBox highlights on the second.
      await expect(async () => {
        await page.keyboard.press("ArrowDown");
        await expect(page.locator(highlighted)).toBeVisible({ timeout: 500 });
      }).toPass();
      // Polled: the fill transitions in.
      await expect
        .poll(() => style(page, highlighted), { message: field })
        .toMatchObject({
          background: system.Highlight,
          color: system.HighlightText,
        });
      expect
        .soft(
          (await style(page, `${highlighted} .bx--list-box__menu-item__option`))
            .color,
          field,
        )
        .toBe(system.HighlightText);
      expect.soft(await flatness(page, highlighted), field).toBeLessThan(0.95);
      if (field === "treeselect") {
        expect
          .soft(
            (await style(page, `${highlighted} .bx--tree-select__toggle svg`))
              .fill,
            field,
          )
          .toBe(system.HighlightText);
      }
      if (field === "multiselect" || field === "treeselect") {
        const checkbox = `${highlighted} .bx--checkbox-label`;
        expect
          .soft((await style(page, checkbox, "::before")).borderColor, field)
          .toBe(system.HighlightText);
      }
      await page.keyboard.press("Escape");
    }
  });

  // Each option's transparent bottom border was forced to CanvasText on
  // top of the next option's divider, so every divider read twice as thick.
  test("a list box draws one line between options", async ({ page }) => {
    for (const [field, trigger] of [
      ["dropdown", ".bx--list-box__field"],
      ["combobox", "input"],
      ["multiselect", ".bx--list-box__field"],
    ]) {
      const scope = `[data-testid=fields] [data-testid=${field}]`;
      // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
      await page.click(`${scope} ${trigger}`);
      const options = page.locator(`${scope} .bx--list-box__menu-item__option`);
      await expect(options.nth(2)).toBeVisible();
      // Lines between each option and the next: its bottom edge plus the
      // next one's top edge.
      const lines = await options.evaluateAll((els) => {
        const drawn = (style: string, width: string) =>
          style !== "none" && style !== "hidden" && width !== "0px" ? 1 : 0;
        const edges = els.map((el) => {
          const s = getComputedStyle(el);
          return {
            top: drawn(s.borderTopStyle, s.borderTopWidth),
            bottom: drawn(s.borderBottomStyle, s.borderBottomWidth),
          };
        });
        return edges
          .slice(1)
          .map((edge, i) => (edges[i]?.bottom ?? 0) + edge.top);
      });
      expect.soft(lines, field).toEqual([1, 1]);
      await page.keyboard.press("Escape");
    }
  });

  test("an OverflowMenu option and a HeaderSearch result fill with Highlight when highlighted", async ({
    page,
  }) => {
    // Every option's resting outline is forced too, so a 1px focus ring
    // stood out less than its neighbors.
    const option = ".bx--overflow-menu-options__btn";
    await page.focus(option);
    // Polled: the fill transitions in.
    await expect
      .poll(() => style(page, option), { message: option })
      .toMatchObject({
        background: system.Highlight,
        color: system.HighlightText,
      });
    expect.soft(await flatness(page, option), option).toBeLessThan(0.95);

    await page.click(".bx--header__search .bx--header-search-button");
    await page.keyboard.press("ArrowDown");
    const result = ".bx--header-search-menu-item--selected";
    await expect
      .poll(() => style(page, result), { message: result })
      .toMatchObject({
        background: system.Highlight,
        color: system.HighlightText,
      });
    expect.soft(await flatness(page, result), result).toBeLessThan(0.95);
  });

  // A transparent resting outline is forced to a visible color, so a list
  // with a menu per row drew a box on every row.
  test("an OverflowMenu trigger draws a ring only when focused or open", async ({
    page,
  }) => {
    const edges = (selector: string) =>
      page.evaluate((selector) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`no ${selector}`);
        const s = getComputedStyle(el);
        return {
          border: s.borderTopStyle,
          outline: s.outlineStyle,
          outlineWidth: s.outlineWidth,
          outlineColor: s.outlineColor,
        };
      }, selector);
    const ring = (color: SystemColor) => ({
      outline: "solid",
      outlineWidth: "2px",
      outlineColor: system[color],
    });

    for (const trigger of ["#fc-overflow-1", "#fc-overflow-2"]) {
      // biome-ignore lint/performance/noAwaitInLoops: reads one trigger at a time
      expect.soft(await edges(trigger), trigger).toMatchObject({
        border: "none",
        outline: "none",
      });
    }

    await page.focus("#fc-overflow-1");
    expect
      .soft(await edges("#fc-overflow-1"), "focused")
      .toMatchObject(ring("Highlight"));
    expect
      .soft(await edges("#fc-overflow-2"), "beside the focused trigger")
      .toMatchObject({ outline: "none" });

    await page.click("#fc-overflow-2");
    await expect(page.locator("#fc-overflow-2")).toHaveClass(
      /bx--overflow-menu--open/,
    );
    expect
      .soft(await edges("#fc-overflow-2"), "open")
      .toMatchObject(ring("CanvasText"));
    await page.keyboard.press("Escape");
  });

  // The underline is a background fill, which forced colors repaint.
  test("the current PaginationNav page keeps its underline", async ({
    page,
  }) => {
    expect(
      (await style(page, ".bx--pagination-nav__page--active", "::after"))
        .background,
    ).toBe(system.Highlight);
  });

  test("chat day dividers keep their lines", async ({ page }) => {
    const lines = await page.evaluate(() =>
      ["::before", "::after"].map((pseudo) => {
        const divider = document.querySelector(".bx--chat-divider");
        if (!divider) throw new Error("no .bx--chat-divider");
        const s = getComputedStyle(divider, pseudo);
        return `${s.borderTopStyle} ${s.borderTopWidth} ${s.borderTopColor}`;
      }),
    );
    for (const line of lines) {
      expect.soft(line).toBe(`solid 1px ${system.CanvasText}`);
    }
  });

  // Forced colors leave an SVG fill alone. These rules outranked the base
  // sheet's `svg { fill: ButtonText }`, so their icons kept a token color.
  // [icon, color]
  const icons: [string, SystemColor][] = [
    [".bx--header__global .bx--header__action > svg", "ButtonText"],
    [
      "[data-testid=fluid-fields] [data-testid=search] .bx--search-magnifier-icon",
      "ButtonText",
    ],
    [
      "[data-testid=fields] [data-testid=copy] .bx--snippet__icon",
      "ButtonText",
    ],
    [
      "[data-testid=icons] .bx--content-switcher-btn:not(.bx--content-switcher--selected) svg",
      "ButtonText",
    ],
    [".bx--disclosure__arrow", "ButtonText"],
    ["[data-testid=icons] .bx--progress-step--complete svg", "ButtonText"],
    ["[data-testid=icons] .bx--progress-step--incomplete svg", "ButtonText"],
    [
      "[data-testid=icons] .bx--tabs__nav-item--default .bx--tabs__nav-item--close-icon svg",
      "ButtonText",
    ],
    [".bx--tile__chevron svg", "ButtonText"],
    ["[data-testid=icons] .bx--toggle-button svg", "ButtonText"],
    ["[data-testid=icons] .bx--tree-node__icon", "ButtonText"],
    ["[data-testid=icons] .bx--tree-parent-node__toggle-icon", "ButtonText"],
    [
      "[data-testid=range-slider-drag] .bx--slider__thumb-icon:not(.bx--slider__thumb-icon--focus)",
      "ButtonText",
    ],
    [
      "[data-testid=icons] .bx--tile--is-selected .bx--tile__checkmark svg",
      "Highlight",
    ],
    [
      "[data-testid=icons] .bx--select--readonly .bx--select__arrow",
      "GrayText",
    ],
    [
      "[data-testid=icons] .bx--date-picker-input__wrapper--readonly .bx--date-picker__icon",
      "GrayText",
    ],
    [
      "[data-testid=icons] .bx--dropdown--readonly .bx--list-box__menu-icon svg",
      "GrayText",
    ],
    ["[data-testid=icons] .bx--number__controls svg", "GrayText"],
  ];

  test("icons read ButtonText, or GrayText when disabled or read-only", async ({
    page,
  }) => {
    const fills = await page.evaluate(
      (selectors) =>
        selectors.map((selector) => {
          const el = document.querySelector(selector);
          if (!el) throw new Error(`no ${selector}`);
          return getComputedStyle(el).fill;
        }),
      icons.map(([icon]) => icon),
    );
    icons.forEach(([icon, color], i) => {
      expect.soft(fills[i], icon).toBe(system[color]);
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
  // A fresh document: the shared host page remounts fixtures in place, and
  // Firefox keeps a live page's styles computed without a media query
  // switched by emulation, though matchMedia reports it.
  await page.goto("about:blank");
  await page.goto("/forced-colors.html");
  await page.focus(".bx--toggle-button--pressed");
  expect((await style(page, ".bx--toggle-button--pressed")).outline).toBe(
    "dotted 2px",
  );
});
