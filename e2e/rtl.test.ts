import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Under `dir="rtl"`, the UI Shell, the list boxes, the menus, the
// ClickableTile icon, Card and TreeView mirror their LTR layout: every part sits
// as far from the right edge as it sat from the left one.

type Box = { left: number; right: number; width: number };

const PARTS = {
  headerName: ".bx--header__name",
  headerNav: ".bx--header__nav",
  headerActions: ".bx--header__global",
  sideNav: ".bx--side-nav",
  sideNavIcon: ".bx--side-nav__link .bx--side-nav__icon",
  sideNavChevron: ".bx--side-nav__submenu-chevron",
  sideNavMenuItem: ".bx--side-nav__menu .bx--side-nav__link-text",
  content: ".bx--content",
  comboBoxInput: "[data-testid=combobox] input",
  comboBoxClear: "[data-testid=combobox] .bx--list-box__selection",
  comboBoxInvalid: "[data-testid=combobox] .bx--list-box__invalid-icon",
  comboBoxChevron: "[data-testid=combobox] .bx--list-box__menu-icon",
  dropdownLabel: "[data-testid=dropdown] .bx--list-box__label",
  dropdownChevron: "[data-testid=dropdown] .bx--list-box__menu-icon",
  multiSelectTag: "[data-testid=multiselect] .bx--tag",
  multiSelectTagLabel: "[data-testid=multiselect] .bx--tag__label",
  multiSelectTagClose: "[data-testid=multiselect] .bx--tag__close-icon",
  multiSelectChevron: "[data-testid=multiselect] .bx--list-box__menu-icon",
  clickableTileIcon: "[data-testid=clickable-tile] .bx--tile--icon",
  cardIcon: "[data-testid=card] .bx--card__clickable-footer svg",
  cardDecorator: "[data-testid=card] .bx--card__decorator",
  cardTitleMedia: "[data-testid=card-actions] .bx--card__title-media",
  cardTitle: "[data-testid=card-actions] .bx--card__title",
  cardActions: "[data-testid=card-actions] .bx--card__actions",
  cardActionsDecorator: "[data-testid=card-actions] .bx--card__decorator",
  cardFooterAction:
    "[data-testid=card-actions] .bx--card__action:not(.bx--card__action--icon-only)",
  cardFooterIconAction:
    "[data-testid=card-actions] .bx--card__action--icon-only",
  cardMediaDecorator: "[data-testid=card-media] .bx--card__decorator",
  cardMediaEndDecorator: "[data-testid=card-media-end] .bx--card__decorator",
  treeToggle:
    "[data-testid=tree] [data-tree-row-id=engine] > .bx--tree-node__label .bx--tree-parent-node__toggle",
  treeLeafIcon:
    "[data-testid=tree] [data-tree-row-id=spark] .bx--tree-node__icon",
  treeCheckbox:
    "[data-testid=tree-checkbox] [data-tree-row-id=hadoop] .bx--checkbox-label",
  treeParentCheckbox:
    "[data-testid=tree-checkbox] [data-tree-row-id=engine] > .bx--tree-node__label .bx--checkbox-label",
  treeVirtualToggle:
    "[data-testid=tree-virtual] [data-tree-row-id=engine] .bx--tree-parent-node__toggle",
  treeVirtualIcon:
    "[data-testid=tree-virtual] [data-tree-row-id=spark] .bx--tree-node__icon",
};

// The active and multiselect bars are `::before` boxes, so build each one
// from its label's box and its own `left` and `width`.
const BARS = {
  treeActiveBar:
    "[data-testid=tree] [data-tree-row-id=hadoop] > .bx--tree-node__label",
  treeSelectedBar:
    "[data-testid=tree-multiselect] [data-tree-row-id=spark] > .bx--tree-node__label",
  treeVirtualActiveBar:
    "[data-testid=tree-virtual] [data-tree-row-id=hadoop] > .bx--tree-node__label",
};

function boxes(page: Page, parts: Record<string, string>) {
  return page.evaluate(async (parts) => {
    // A label measured in the fallback font in LTR and in IBM Plex in RTL
    // differs by a pixel, so wait for the fonts before every measurement.
    await document.fonts.ready;
    const result: Record<string, Box | null> = {};
    for (const [name, selector] of Object.entries(parts)) {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      result[name] = rect
        ? {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          }
        : null;
    }
    return result;
  }, parts);
}

function barBoxes(page: Page, bars: Record<string, string>) {
  return page.evaluate(async (bars) => {
    await document.fonts.ready;
    const result: Record<string, Box | null> = {};
    for (const [name, selector] of Object.entries(bars)) {
      const label = document.querySelector(selector);
      const bar = label && getComputedStyle(label, "::before");
      if (!label || !bar || bar.content === "none") {
        result[name] = null;
        continue;
      }
      const left =
        label.getBoundingClientRect().left + Number.parseFloat(bar.left);
      const width = Number.parseFloat(bar.width);
      result[name] = {
        left: Math.round(left),
        right: Math.round(left + width),
        width: Math.round(width),
      };
    }
    return result;
  }, bars);
}

// A collapsed and an expanded caret in the recursive and virtualized trees.
const CARETS = {
  collapsed:
    "[data-testid=tree] [data-tree-row-id=storage] > .bx--tree-node__label .bx--tree-parent-node__toggle-icon",
  expanded:
    "[data-testid=tree] [data-tree-row-id=engine] > .bx--tree-node__label .bx--tree-parent-node__toggle-icon",
  virtualCollapsed:
    "[data-testid=tree-virtual] [data-tree-row-id=storage] .bx--tree-parent-node__toggle-icon",
  virtualExpanded:
    "[data-testid=tree-virtual] [data-tree-row-id=engine] .bx--tree-parent-node__toggle-icon",
};

/** Each caret's rotation in degrees, read from its computed transform. */
function caretAngles(page: Page) {
  return page.evaluate((carets) => {
    const result: Record<string, number | null> = {};
    for (const [name, selector] of Object.entries(carets)) {
      const node = document.querySelector(selector);
      if (!node) {
        result[name] = null;
        continue;
      }
      const matrix = new DOMMatrix(getComputedStyle(node).transform);
      result[name] = Math.round(
        (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
      );
    }
    return result;
  }, CARETS);
}

function setDirection(page: Page, dir: "rtl" | "ltr") {
  return page.evaluate((dir) => {
    document.documentElement.dir = dir;
  }, dir);
}

function boxShadow(locator: Locator) {
  return locator.evaluate((node) => getComputedStyle(node).boxShadow);
}

/** The x offset of an element's first box shadow, in px. */
async function shadowX(locator: Locator) {
  const x = (await boxShadow(locator)).match(/(-?[\d.]+)px/);
  return x ? Number.parseFloat(x[1]) : 0;
}

/** The space before each item after the first, at its inline start, in px. */
function inlineGaps(locator: Locator, dir: "rtl" | "ltr") {
  return locator.evaluateAll((items, dir) => {
    const rects = items.map((item) => item.getBoundingClientRect());
    return rects.slice(1).map((rect, index) => {
      const prev = rects[index];
      const gap =
        dir === "ltr" ? rect.left - prev.right : prev.left - rect.right;
      return Math.round(gap * 100) / 100;
    });
  }, dir);
}

/** Each LTR box reflected across the viewport's vertical center. */
function mirror(ltr: Record<string, Box | null>, viewportWidth: number) {
  return Object.fromEntries(
    Object.entries(ltr).map(([name, box]) => [
      name,
      box && {
        left: viewportWidth - box.right,
        right: viewportWidth - box.left,
        width: box.width,
      },
    ]),
  );
}

function expectMirrored(
  rtl: Record<string, Box | null>,
  mirrored: Record<string, Box | null>,
) {
  for (const [name, box] of Object.entries(mirrored)) {
    const actual = rtl[name];
    expect.soft(box, `${name} renders in LTR`).not.toBeNull();
    expect.soft(actual, `${name} renders in RTL`).not.toBeNull();
    if (!box || !actual) continue;
    expect.soft(Math.abs(actual.left - box.left), name).toBeLessThanOrEqual(1);
    expect.soft(actual.width, name).toBe(box.width);
  }
}

/** The moving parts of the `${prefix}slider` and `${prefix}range-slider`. */
function sliderParts(prefix: string) {
  const slider = `[data-testid=${prefix}slider]`;
  const range = `[data-testid=${prefix}range-slider]`;
  return {
    thumb: `${slider} .bx--slider__thumb`,
    fill: `${slider} .bx--slider__filled-track`,
    mark: `${slider} .bx--slider__mark:nth-child(4)`,
    lower: `${range} .bx--slider__thumb-wrapper--lower`,
    upper: `${range} .bx--slider__thumb-wrapper--upper`,
    rangeFill: `${range} .bx--slider__filled-track`,
    rangeMark: `${range} .bx--slider__mark:nth-child(2)`,
    rangeMarkLabel: `${range} .bx--slider__mark:nth-child(2) .bx--slider__mark-label`,
  };
}

/** Whether each RangeSlider handle is flipped, as its transform's x scale. */
function handleScales(page: Page, testId: string) {
  return page
    .getByTestId(testId)
    .locator(".bx--slider__thumb-wrapper")
    .evaluateAll((nodes) =>
      nodes.map((node) => new DOMMatrix(getComputedStyle(node).transform).a),
    );
}

// The fixture's CodeSnippets, by test id. Each has a button only where its
// name says so; the inline one is a button itself.
const SNIPPETS = [
  "snippet-single",
  "snippet-multi",
  "snippet-single-no-copy",
  "snippet-multi-no-copy",
  "snippet-inline",
];

type Span = { left: number; right: number };

type SnippetLayout = {
  width: number;
  direction: string;
  mask: string;
  copy: Span | null;
  expand: Span | null;
  /** The first glyph and the last glyph of the first line. */
  line: Span;
  /** How far the second line's first glyph sits from the first line's. */
  indent: number | null;
};

/** Each snippet's buttons and code, measured from its own left edge. */
function snippetLayouts(page: Page) {
  return page.evaluate((ids) => {
    function glyph(code: Element, at: number) {
      const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;
      let offset = at;
      while (node && offset >= node.length) {
        offset -= node.length;
        node = walker.nextNode() as Text | null;
      }
      if (!node) throw new Error(`no glyph at ${at}`);
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + 1);
      return range.getBoundingClientRect();
    }

    const result: Record<string, SnippetLayout> = {};
    for (const id of ids) {
      const root = document.querySelector(`[data-testid=${id}]`);
      const code = root?.querySelector("code");
      if (!root || !code) throw new Error(`no ${id}`);
      const origin = root.getBoundingClientRect();
      const span = (rect: DOMRect | undefined) =>
        rect
          ? {
              left: Math.round(rect.left - origin.left),
              right: Math.round(rect.right - origin.left),
            }
          : null;

      const text = code.textContent ?? "";
      const lineEnd =
        text.indexOf("\n") === -1 ? text.length : text.indexOf("\n");
      const first = text.search(/\S/);
      const last = text.slice(0, lineEnd).trimEnd().length - 1;
      const second = text.slice(lineEnd + 1).search(/\S/);
      const start = glyph(code, first);
      const container = root.querySelector(".bx--snippet-container");

      result[id] = {
        width: Math.round(origin.width),
        direction: getComputedStyle(code).direction,
        mask: container ? getComputedStyle(container).maskImage : "",
        copy: span(
          root.querySelector(".bx--copy-btn")?.getBoundingClientRect(),
        ),
        expand: span(
          root
            .querySelector(".bx--snippet-btn--expand")
            ?.getBoundingClientRect(),
        ),
        line: {
          left: Math.round(start.left - origin.left),
          right: Math.round(glyph(code, last).right - origin.left),
        },
        indent:
          lineEnd < text.length
            ? Math.round(glyph(code, lineEnd + 1 + second).left - start.left)
            : null,
      };
    }
    return result;
  }, SNIPPETS);
}

test.describe("right-to-left layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl.html");
  });

  test("mirrors the UI Shell, closed list boxes and tree rows", async ({
    page,
  }) => {
    // Measure once the fonts load. Run first in a worker, the header
    // name measured in the fallback font in LTR and in IBM Plex in RTL.
    const viewportWidth = await page.evaluate(async () => {
      const width = document.documentElement.clientWidth;
      await document.fonts.ready;
      return width;
    });
    const ltr = await boxes(page, PARTS);

    await setDirection(page, "rtl");
    const rtl = await boxes(page, PARTS);
    expectMirrored(rtl, mirror(ltr, viewportWidth));

    // The positions named in the request, spelled out.
    const sideNav = rtl.sideNav as Box;
    expect(sideNav.right).toBe(viewportWidth);
    expect((rtl.headerActions as Box).left).toBe(0);
    expect((rtl.headerName as Box).right).toBe(viewportWidth);
    expect((rtl.content as Box).right).toBe(sideNav.left);

    const comboBox = await boxes(page, {
      field: "[data-testid=combobox] .bx--list-box",
    });
    expect(
      (rtl.comboBoxChevron as Box).left - (comboBox.field as Box).left,
    ).toBe(12);
  });

  // As upstream's decorator in CardHeader: 8px inside the header's top
  // inline-end corner, below top media and clear of media at the end.
  test("keeps Card decorators at the header's corner, off the media", async ({
    page,
  }) => {
    const parts = {
      header: "[data-testid=card-media] .bx--card__header",
      decorator: "[data-testid=card-media] .bx--card__decorator",
      endMedia: "[data-testid=card-media-end] .bx--card__media",
      endDecorator: "[data-testid=card-media-end] .bx--card__decorator",
    };
    const tops = () =>
      page.evaluate(
        (parts) =>
          [parts.header, parts.decorator].map(
            (selector) =>
              document.querySelector(selector)?.getBoundingClientRect().top ??
              Number.NaN,
          ),
        parts,
      );

    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      const [headerTop, decoratorTop] = await tops();
      expect.soft(Math.abs(decoratorTop - headerTop - 8), dir).toBeLessThan(1);

      const box = await boxes(page, parts);
      const media = box.endMedia as Box;
      const decorator = box.endDecorator as Box;
      const gap =
        dir === "ltr"
          ? media.left - decorator.right
          : decorator.left - media.right;
      expect.soft(Math.abs(gap - 8), dir).toBeLessThanOrEqual(1);
    }
  });

  test("mirrors the TreeView active and selected bars", async ({ page }) => {
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const ltr = await barBoxes(page, BARS);

    await setDirection(page, "rtl");
    const rtl = await barBoxes(page, BARS);
    expectMirrored(rtl, mirror(ltr, viewportWidth));
  });

  test("points a collapsed TreeView caret toward the children", async ({
    page,
  }) => {
    // The caret is a down chevron: -90 points right, 90 left, 0 down.
    expect(await caretAngles(page)).toEqual({
      collapsed: -90,
      expanded: 0,
      virtualCollapsed: -90,
      virtualExpanded: 0,
    });

    await setDirection(page, "rtl");
    await expect
      .poll(() => caretAngles(page), { message: "carets settle" })
      .toEqual({
        collapsed: 90,
        expanded: 0,
        virtualCollapsed: 90,
        virtualExpanded: 0,
      });
  });

  test("expands a TreeView row with Left and collapses it with Right", async ({
    page,
  }) => {
    await setDirection(page, "rtl");
    for (const testId of ["tree", "tree-virtual"]) {
      const row = page
        .getByTestId(testId)
        .locator("[data-tree-row-id=storage]");
      // biome-ignore lint/performance/noAwaitInLoops: one tree at a time
      await row.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(row, testId).toHaveAttribute("aria-expanded", "true");
      await page.keyboard.press("ArrowRight");
      await expect(row, testId).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("puts Box's logical sides at the inline start and end", async ({
    page,
  }) => {
    const sides = () =>
      page.evaluate(() =>
        ["box-logical", "box-logical-custom"].map((id) => {
          const style = getComputedStyle(
            document.querySelector(`[data-testid=${id}]`) as Element,
          );
          return [
            style.paddingLeft,
            style.paddingRight,
            style.marginLeft,
            style.marginRight,
          ];
        }),
      );
    // paddingX={1} is 2px, paddingStart={5} is 16px, marginEnd={3} is 8px.
    expect(await sides()).toEqual([
      ["16px", "2px", "0px", "8px"],
      ["0px", "0px", "20px", "2px"],
    ]);
    await setDirection(page, "rtl");
    expect(await sides()).toEqual([
      ["2px", "16px", "8px", "0px"],
      ["0px", "0px", "2px", "20px"],
    ]);
  });

  test("keeps the Slider gaps beside the text input", async ({ page }) => {
    // Each pair is a part and the text input beside it, in the fixture's
    // Slider, hideRangeLabels Slider, RangeSlider and vertical RangeSlider.
    const slider = (n: number) =>
      `[data-testid=slider-gaps] > :nth-child(${n})`;
    const max = ".bx--slider__range-label:last-of-type";
    const min = ".bx--slider__range-label:first-of-type";
    const input = ".bx--slider-text-input-wrapper";
    const PAIRS: Record<string, [string, string]> = {
      maxLabel: [`${slider(1)} ${max}`, `${slider(1)} ${input}`],
      hideRangeLabels: [`${slider(2)} .bx--slider`, `${slider(2)} ${input}`],
      rangeMaxLabel: [`${slider(3)} ${max}`, `${slider(3)} ${input}--upper`],
      verticalMaxLabel: [`${slider(4)} ${max}`, `${slider(4)} ${input}--upper`],
      verticalMinLabel: [`${slider(4)} ${min}`, `${slider(4)} ${input}--lower`],
    };
    const parts = Object.fromEntries(
      Object.entries(PAIRS).flatMap(([name, [part, field]]) => [
        [name, part],
        [`${name}Input`, field],
      ]),
    );

    async function gaps() {
      const box = await boxes(page, parts);
      return Object.fromEntries(
        Object.keys(PAIRS).map((name) => {
          const a = box[name] as Box;
          const b = box[`${name}Input`] as Box;
          return [name, Math.max(b.left - a.right, a.left - b.right)];
        }),
      );
    }

    const ltr = await gaps();
    for (const [name, gap] of Object.entries(ltr)) {
      expect.soft(gap, `${name} in LTR`).toBeGreaterThanOrEqual(16);
    }

    await setDirection(page, "rtl");
    expect(await gaps()).toEqual(ltr);
  });

  test("mirrors vertical Slider labels and ticks around the track", async ({
    page,
  }) => {
    // The fixture's vertical Slider and vertical RangeSlider with labeled
    // marks. Each part is measured from its own track's center.
    const slider = (n: number) =>
      `[data-testid=slider-vertical-marks] > :nth-child(${n})`;
    const SLIDERS = [slider(1), slider(2)];
    const PARTS = {
      markLabel: ".bx--slider__mark:nth-child(2) .bx--slider__mark-label",
      maxLabel: ".bx--slider__range-label:last-of-type",
      minLabel: ".bx--slider__range-label:first-of-type",
    };
    const selectors = Object.fromEntries(
      SLIDERS.flatMap((root, i) =>
        Object.entries({ track: ".bx--slider__track", ...PARTS }).map(
          ([name, part]) => [`${name}${i}`, `${root} ${part}`],
        ),
      ),
    );

    /** Each part's edges as offsets from its track's center. */
    async function offsets() {
      const box = await boxes(page, selectors);
      const result: Record<string, { start: number; end: number }> = {};
      for (const i of SLIDERS.keys()) {
        const track = box[`track${i}`] as Box;
        const center = (track.left + track.right) / 2;
        for (const name of Object.keys(PARTS)) {
          const part = box[`${name}${i}`] as Box;
          result[`${name}${i}`] = {
            start: part.left - center,
            end: part.right - center,
          };
        }
      }
      // The center tick is the `::before` of a track without marks.
      result.centerTick = await page
        .locator("[data-testid=slider-gaps] > :nth-child(4) .bx--slider__track")
        .evaluate((track) => {
          const rect = track.getBoundingClientRect();
          const tick = getComputedStyle(track, "::before");
          const start = rect.left + Number.parseFloat(tick.left);
          const center = (rect.left + rect.right) / 2;
          return {
            start: Math.round(start - center),
            end: Math.round(start + Number.parseFloat(tick.width) - center),
          };
        });
      return result;
    }

    // In LTR the labels sit right of the track, mark labels nearest, and
    // the center tick sits left of it.
    const ltr = await offsets();
    for (const i of SLIDERS.keys()) {
      expect.soft(ltr[`markLabel${i}`].start, "LTR").toBeGreaterThan(0);
      expect
        .soft(ltr[`maxLabel${i}`].start, "LTR")
        .toBeGreaterThan(ltr[`markLabel${i}`].end);
    }
    expect.soft(ltr.centerTick.end, "LTR").toBeLessThan(0);

    await setDirection(page, "rtl");
    const rtl = await offsets();
    for (const [name, { start, end }] of Object.entries(ltr)) {
      const actual = rtl[name];
      expect.soft(Math.abs(actual.end + start), name).toBeLessThanOrEqual(1);
      expect.soft(Math.abs(actual.start + end), name).toBeLessThanOrEqual(1);
    }
  });

  test("keeps CodeSnippet code left to right and mirrors its buttons", async ({
    page,
  }) => {
    // The expand button shows once the snippet measures its rows.
    await expect(
      page
        .getByTestId("snippet-multi")
        .getByRole("button", { name: "Show more" }),
    ).toBeVisible();
    const ltr = await snippetLayouts(page);
    await setDirection(page, "rtl");
    const rtl = await snippetLayouts(page);

    for (const id of SNIPPETS) {
      const before = ltr[id];
      const after = rtl[id];
      expect.soft(after.direction, `${id} code direction`).toBe("ltr");
      // The line keeps its glyphs in order, so it spans the same width,
      // and the multi-line code keeps its indents.
      expect
        .soft(after.line.right - after.line.left, `${id} line`)
        .toBe(before.line.right - before.line.left);
      expect.soft(after.indent, `${id} indent`).toBe(before.indent);
      // Code starts at the left, as far past the copy button as it starts
      // past the snippet's edge in LTR. The fade stays on the right.
      if (id !== "snippet-inline") {
        expect
          .soft(after.line.left - (after.copy?.right ?? 0), `${id} start`)
          .toBe(before.line.left);
        expect.soft(after.mask, `${id} fade`).toBe(before.mask);
      }

      for (const part of ["copy", "expand"] as const) {
        const box = before[part];
        const actual = after[part];
        expect.soft(actual === null, `${id} ${part}`).toBe(box === null);
        if (!box || !actual) continue;
        expect
          .soft(actual.left, `${id} ${part} mirrors`)
          .toBe(before.width - box.right);
        expect
          .soft(actual.right - actual.left, `${id} ${part} width`)
          .toBe(box.right - box.left);
      }
    }
    expect(ltr["snippet-single"].copy, "single copy button").not.toBeNull();

    // Skeleton lines stand in for code, so they keep their LTR edges.
    const skeleton = page.getByTestId("snippet-skeleton").locator("span");
    const lines = () =>
      skeleton.evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          const root = node.closest(".bx--snippet")?.getBoundingClientRect();
          return Math.round(rect.left - (root?.left ?? 0));
        }),
      );
    const rtlLines = await lines();
    await setDirection(page, "ltr");
    expect(rtlLines).toEqual(await lines());
  });

  test("puts the checkmark at the inline end of an open ComboBox", async ({
    page,
  }) => {
    const selectedIcon =
      "[data-testid=combobox] .bx--list-box__menu-item--active .bx--list-box__menu-item__selected-icon";
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const input = page.getByTestId("combobox").locator("input");

    await input.click();
    await expect(page.locator(selectedIcon)).toBeVisible();
    const ltr = await boxes(page, { selectedIcon });

    await page.goto("/rtl.html");
    await setDirection(page, "rtl");
    await input.click();
    await expect(page.locator(selectedIcon)).toBeVisible();
    const rtl = await boxes(page, { selectedIcon });
    expectMirrored(rtl, mirror(ltr, viewportWidth));
  });

  test("puts MultiSelect checkboxes at the inline start", async ({ page }) => {
    await setDirection(page, "rtl");
    await page
      .getByTestId("multiselect")
      .locator(".bx--list-box__field")
      .click();

    const label = page
      .getByTestId("multiselect")
      .locator(".bx--checkbox-label")
      .first();
    const layout = await label.evaluate((node) => {
      const box = getComputedStyle(node, "::before");
      const style = getComputedStyle(node);
      return {
        boxRight: box.right,
        paddingRight: style.paddingRight,
        paddingLeft: style.paddingLeft,
      };
    });
    expect(layout).toEqual({
      boxRight: "0px",
      paddingRight: "28px",
      paddingLeft: "0px",
    });
  });

  test("puts Pagination separators and gaps on the mirrored side", async ({
    page,
  }) => {
    // Every part with a border, margin or padding on one inline side, in a
    // Pagination, one with a page number input, and the skeleton.
    const root = "[data-testid=pagination]";
    const PAGINATION_PARTS = {
      pageSizeSelect: `${root} .bx--select__item-count`,
      pageSelect: `${root} .bx--select__page-number`,
      pageInput: `${root} .bx--pagination__page-number-input`,
      backward: `${root} .bx--pagination__button--backward`,
      forward: `${root} .bx--pagination__button--forward`,
      left: `${root} .bx--pagination__left`,
      pageSizeLabel: `${root} .bx--pagination__left label.bx--pagination__text`,
      itemsCount: `${root} .bx--pagination__items-count`,
      pageText: `${root} .bx--pagination__right .bx--pagination__text`,
      skeletonText: `${root} .bx--skeleton .bx--skeleton__text`,
    };

    /** Each part's left and right border, margin and padding widths. */
    function sides() {
      return page.evaluate((parts) => {
        const result: Record<string, string[] | null> = {};
        for (const [name, selector] of Object.entries(parts)) {
          const node = document.querySelector(selector);
          if (!node) {
            result[name] = null;
            continue;
          }
          const style = getComputedStyle(node);
          result[name] = [
            style.borderLeftWidth,
            style.borderRightWidth,
            style.marginLeft,
            style.marginRight,
            style.paddingLeft,
            style.paddingRight,
          ];
        }
        return result;
      }, PAGINATION_PARTS);
    }

    /** Each select's chevron, as offsets from the select's inline end. */
    function chevrons() {
      return page.evaluate((root) => {
        const rtl = document.documentElement.dir === "rtl";
        return [
          ...document.querySelectorAll(`${root} .bx--select-input__wrapper`),
        ].map((wrapper) => {
          const box = wrapper.getBoundingClientRect();
          const icon = wrapper
            .querySelector(".bx--select__arrow")
            ?.getBoundingClientRect();
          if (!icon) return null;
          return rtl
            ? [
                Math.round(icon.left - box.left),
                Math.round(icon.right - box.left),
              ]
            : [
                Math.round(box.right - icon.right),
                Math.round(box.right - icon.left),
              ];
        });
      }, root);
    }

    const ltr = await sides();
    const ltrChevrons = await chevrons();
    expect(ltrChevrons.length).toBeGreaterThan(0);
    // In LTR the buttons' and page select's separators sit on their left,
    // and the page size select's on its right.
    expect(ltr.forward?.slice(0, 2)).toEqual(["1px", "0px"]);
    expect(ltr.pageSelect?.slice(0, 2)).toEqual(["1px", "0px"]);
    expect(ltr.pageSizeSelect?.slice(0, 2)).toEqual(["0px", "1px"]);

    await setDirection(page, "rtl");
    const rtl = await sides();
    for (const [name, values] of Object.entries(ltr)) {
      expect.soft(values, `${name} renders`).not.toBeNull();
      if (!values) continue;
      const [bl, br, ml, mr, pl, pr] = values;
      expect.soft(rtl[name], name).toEqual([br, bl, mr, ml, pr, pl]);
    }
    expect(await chevrons()).toEqual(ltrChevrons);
  });

  test("mirrors the submenu caret", async ({ page }) => {
    const trigger = page.getByTestId("menu-button").getByRole("button");
    const caret = page.locator(".bx--menu-option__info > svg");

    await trigger.click();
    await expect(caret).toBeVisible();
    expect(
      await caret.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("none");
    await page.keyboard.press("Escape");

    await setDirection(page, "rtl");
    await trigger.click();
    await expect(caret).toBeVisible();
    expect(
      await caret.evaluate((node) => getComputedStyle(node).transform),
    ).toBe("matrix(-1, 0, 0, 1, 0, 0)");

    // The caret ends the row, so it sits left of the label.
    const [caretBox, labelBox] = await Promise.all([
      caret.boundingBox(),
      page
        .getByRole("menuitem", { name: "Export as" })
        .locator(".bx--menu-option__label")
        .boundingBox(),
    ]);
    expect(caretBox && labelBox && caretBox.x < labelBox.x).toBe(true);
  });

  // Inset box shadows draw the indicator and the row dividers. A box
  // shadow has no logical form, so each x offset follows the direction.
  test("draws TabsVertical indicators and dividers at the inline start", async ({
    page,
  }) => {
    const column = page
      .getByTestId("tabs-vertical")
      .locator(".bx--tabs__nav-item");
    const row = page
      .getByTestId("tabs-vertical-row")
      .locator(".bx--tabs__nav-item");

    for (const [dir, sign] of [
      ["ltr", 1],
      ["rtl", -1],
    ] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      expect
        .soft(await shadowX(column.nth(0)), `${dir} selected`)
        .toBe(3 * sign);
      expect.soft(await shadowX(column.nth(1)), `${dir} plain`).toBe(3 * sign);
      expect
        .soft(await shadowX(column.nth(2)), `${dir} disabled`)
        .toBe(3 * sign);
      expect.soft(await shadowX(row.nth(2)), `${dir} row divider`).toBe(sign);

      // The hover rule repaints the indicator; wait for its color.
      const rest = await boxShadow(column.nth(1));
      await column.nth(1).hover();
      await expect.poll(() => boxShadow(column.nth(1))).not.toBe(rest);
      expect.soft(await shadowX(column.nth(1)), `${dir} hover`).toBe(3 * sign);
      await page.mouse.move(0, 0);
    }
  });

  // An outset box shadow draws the divider between contained tabs, at
  // each later tab's inline start.
  test("draws contained Tabs dividers at the inline start", async ({
    page,
  }) => {
    const tabs = page
      .getByTestId("tabs-container")
      .locator(".bx--tabs__nav-item");
    const skeleton = page
      .getByTestId("tabs-container-skeleton")
      .locator(".bx--tabs--scrollable__nav-item");

    for (const [dir, sign] of [
      ["ltr", 1],
      ["rtl", -1],
    ] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      // The first tab is selected, so the second has no divider.
      expect
        .soft(await boxShadow(tabs.nth(1)), `${dir} after selected`)
        .toBe("none");
      expect.soft(await shadowX(tabs.nth(2)), `${dir} divider`).toBe(-sign);
      expect.soft(await shadowX(tabs.nth(3)), `${dir} disabled`).toBe(-sign);
      expect
        .soft(await shadowX(skeleton.nth(1)), `${dir} skeleton`)
        .toBe(-sign);
    }
  });

  // Default tabs keep a 1px gap at each later tab's inline start.
  // Contained tabs sit flush and draw a divider there instead.
  test("spaces Tabs at the inline start", async ({ page }) => {
    const cases = [
      ["tabs-default", ".bx--tabs__nav-item", [1, 1, 1]],
      ["tabs-default-skeleton", ".bx--tabs--scrollable__nav-item", [1, 1]],
      ["tabs-container", ".bx--tabs__nav-item", [0, 0, 0]],
      ["tabs-container-skeleton", ".bx--tabs--scrollable__nav-item", [0, 0]],
    ] as const;

    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      const measured = await Promise.all(
        cases.map(([testId, item]) =>
          inlineGaps(page.getByTestId(testId).locator(item), dir),
        ),
      );
      cases.forEach(([testId, , gaps], index) => {
        expect.soft(measured[index], `${dir} ${testId}`).toEqual(gaps);
      });
    }
  });

  test("mirrors a Slider and a RangeSlider once the pointer reaches them", async ({
    page,
  }) => {
    const parts = sliderParts("");
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const ltr = await boxes(page, parts);

    // Nothing reports a page direction change, so each slider re-reads
    // its direction when the pointer enters it.
    await setDirection(page, "rtl");
    await page.getByTestId("slider").locator(".bx--slider").hover();
    await page.getByTestId("range-slider").locator(".bx--slider").hover();
    await expect
      .poll(() => handleScales(page, "range-slider"), {
        message: "handles flip",
      })
      .toEqual([-1, -1]);
    expectMirrored(await boxes(page, parts), mirror(ltr, viewportWidth));

    // A press 10% in from the right is 1, and ArrowLeft raises it.
    const range = page.getByTestId("range-slider");
    const track = await range.locator(".bx--slider__track").boundingBox();
    if (!track) throw new Error("no track");
    await page.mouse.click(
      track.x + track.width * 0.9,
      track.y + track.height / 2,
    );
    const lower = range.getByRole("slider", { name: /Lower bound/ });
    await expect(lower).toHaveAttribute("aria-valuenow", "1");
    await page.keyboard.press("ArrowLeft");
    await expect(lower).toHaveAttribute("aria-valuenow", "2");
  });

  test("mirrors sliders in a LayoutDirection when its dir changes", async ({
    page,
  }) => {
    const parts = sliderParts("region-");
    const region = await page.getByTestId("region").boundingBox();
    if (!region) throw new Error("no region");
    const ltr = await boxes(page, parts);
    expect(await handleScales(page, "region-range-slider")).toEqual([1, 1]);

    // The button sits outside the region, so the pointer never enters a
    // slider: the context alone updates them.
    await page.getByRole("button", { name: "Flip region" }).click();
    await expect
      .poll(() => handleScales(page, "region-range-slider"), {
        message: "handles flip",
      })
      .toEqual([-1, -1]);
    const axis = Math.round(region.x * 2 + region.width);
    expectMirrored(await boxes(page, parts), mirror(ltr, axis));
  });

  // Both platforms' keys share one grid cell as wide as the wider set. The
  // keys run left to right, but the narrower set still sits at the inline
  // end, next to whatever follows the label.
  test("keeps Kbd's narrower key set at the inline end", async ({ page }) => {
    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      const offsets = await page.getByTestId("kbd").evaluate((node, dir) => {
        const root = node.querySelector(".bx--kbd")?.getBoundingClientRect();
        if (!root) throw new Error("no kbd");
        return [...node.querySelectorAll(".bx--kbd__platform")].map((set) => {
          const box = set.getBoundingClientRect();
          return Math.round(
            dir === "rtl" ? box.left - root.left : root.right - box.right,
          );
        });
      }, dir);
      expect.soft(offsets, `${dir} end offsets`).toEqual([0, 0]);
    }
  });
});

// Icons that point forward or back, by meaning, mirror in RTL. A `dir="ltr"`
// region inside an RTL page turns the mirror off again.
const MIRRORED_ICONS = {
  clickableTile: "[data-testid=clickable-tile] .bx--tile--icon",
  card: "[data-testid=card] .bx--card__clickable-footer svg",
  paginationBack:
    "[data-testid=pagination] .bx--pagination__button--backward svg",
  paginationForward:
    "[data-testid=pagination] .bx--pagination__button--forward svg",
  paginationNavBack:
    "[data-testid=pagination-nav] .bx--pagination-nav__list-item:first-child svg",
  paginationNavForward:
    "[data-testid=pagination-nav] .bx--pagination-nav__list-item:last-child svg",
  carouselPrevious:
    "[data-testid=carousel] .bx--carousel__button--previous svg",
  carouselNext: "[data-testid=carousel] .bx--carousel__button--next svg",
  tabsNext: "[data-testid=tabs] .bx--tab--overflow-nav-button--next svg",
  stepperBack: "[data-testid=stepper] .bx--btn--ghost .bx--btn__icon",
  stepperNext: "[data-testid=stepper] .bx--btn--primary .bx--btn__icon",
  aiLabelRevert: "[data-testid=ai-label] .bx--ai-label__revert svg",
  ownIcon: "[data-testid=own-icon] .bx--icon--mirror-rtl",
};

const UNMIRRORED_ICONS = {
  launch: "[data-testid=own-icon] svg:not(.bx--icon--mirror-rtl)",
  islandOwnIcon: "[data-testid=ltr-island] .bx--icon--mirror-rtl",
  islandPaginationNav: "[data-testid=ltr-island] .bx--btn__icon",
};

/** Each icon's horizontal scale: -1 when mirrored, 1 when not. */
function iconScales(page: Page, icons: Record<string, string>) {
  return page.evaluate((icons) => {
    const result: Record<string, number | null> = {};
    for (const [name, selector] of Object.entries(icons)) {
      const node = document.querySelector(selector);
      result[name] = node
        ? new DOMMatrix(getComputedStyle(node).transform).a
        : null;
    }
    return result;
  }, icons);
}

test.describe("right-to-left icons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl-icons.html");
    await expect(
      page.locator(MIRRORED_ICONS.tabsNext),
      "tabs overflow",
    ).toBeAttached();
  });

  test("mirrors forward and back icons, and nothing else", async ({ page }) => {
    const all = { ...MIRRORED_ICONS, ...UNMIRRORED_ICONS };
    const ltr = await iconScales(page, all);
    for (const [name, scale] of Object.entries(ltr)) {
      expect.soft(scale, `${name} in LTR`).toBe(1);
    }

    await setDirection(page, "rtl");
    const rtl = await iconScales(page, all);
    for (const name of Object.keys(MIRRORED_ICONS)) {
      expect.soft(rtl[name], `${name} in RTL`).toBe(-1);
    }
    for (const name of Object.keys(UNMIRRORED_ICONS)) {
      expect.soft(rtl[name], `${name} in RTL`).toBe(1);
    }
  });
});

// Each text field case sits in a fixed-width box. In RTL every part sits
// as far from the box's right edge as it sat from its left edge in LTR.
// "text" is the input's content box, so it checks the reserved padding.
const FIELD_CASES = [
  "text-invalid",
  "text-warn",
  "text-readonly",
  "text-decorator",
  "text-inline",
  "password",
  "password-sm",
  "password-invalid",
  "password-readonly",
  "copy",
  "copy-sm",
  "number",
  "number-invalid",
  "number-sm-warn",
  "number-nosteppers-invalid",
  "number-readonly-nosteppers",
  "number-decorator",
  "search",
  "search-sm",
  "search-xl-invalid",
  "search-expandable",
  "text-area-invalid",
  "text-area-decorator",
  "fluid-text-invalid",
  "fluid-text-counter",
  "fluid-password-invalid",
  "fluid-copy",
  "fluid-number-invalid",
  "fluid-search",
  "fluid-search-invalid",
  "fluid-text-area-invalid",
  "fluid-text-decorator",
  "tag-input-invalid",
  "time-picker-invalid",
  "toolbar-search",
  "contained-list-search",
  "date-picker",
  "date-picker-invalid",
  "date-picker-warn",
  "date-picker-clearable",
  "date-picker-clearable-invalid",
  "date-picker-decorator",
  "date-picker-range",
  "select",
  "select-invalid",
  "select-warn",
  "select-decorator",
  "select-inline",
  "select-inline-invalid",
  "fluid-select",
  "fluid-select-invalid",
  "fluid-combo-box-invalid",
  "fluid-date-picker-invalid",
  "fluid-time-picker-invalid",
  "fluid-time-picker-selects",
  "fluid-pin-code-invalid",
];

const FIELD_PARTS = [
  ".bx--text-input__invalid-icon",
  ".bx--text-input__readonly-icon",
  ".bx--text-input--password__visibility__toggle",
  ".bx--copy-btn",
  ".bx--number__controls",
  ".bx--number__control-btn",
  ".bx--number__invalid",
  ".bx--number__rule-divider",
  ".bx--search-magnifier",
  ".bx--search-magnifier-icon",
  ".bx--search-close",
  ".bx--search__invalid-icon",
  ".bx--text-area__invalid-icon",
  ".bx--field-decorator",
  ".bx--label",
  ".bx--text-input__label-helper-wrapper",
  ".bx--text-input__field-outer-wrapper",
  ".bx--date-picker__icon",
  ".bx--date-picker__clear",
  ".bx--date-picker-container",
  ".bx--select__arrow",
  ".bx--select__invalid-icon",
  ".bx--form__helper-text",
  // Message-row status icons of the other fluid fields.
  ".bx--list-box__invalid-icon",
  ".bx--time-picker__icon",
  ".bx--pin-code-input__icon",
];

// Parts whose content box matters: the text stops short of the icons.
const FIELD_TEXT = [
  "input:not([type=hidden])",
  "textarea",
  "select",
  ".bx--form-requirement",
];

// Absolutely positioned pseudo-elements drawn at one side of a part.
const FIELD_PSEUDOS = [
  [".bx--number__control-btn", "::before"],
  [".bx--number__control-btn", "::after"],
  [".bx--search-close", "::before"],
  // The fluid TimePicker's dividers between its cells.
  [".bx--select-input__wrapper", "::before"],
  [".bx--select__inner-wrapper--decorator", "::after"],
] as const;

/** Every visible part of each case, as start and end offsets from its box. */
function fieldOffsets(page: Page) {
  return page.evaluate(
    async ({ cases, parts, text, pseudos }) => {
      // Run first in a worker, the labels measured in the fallback font in
      // LTR and in IBM Plex in RTL.
      await document.fonts.ready;
      const result: Record<string, { start: number; end: number }> = {};
      const rtl = document.documentElement.dir === "rtl";
      for (const name of cases) {
        const root = document.querySelector(`[data-testid="${name}"]`);
        if (!root) continue;
        const box = root.getBoundingClientRect();
        const record = (key: string, left: number, right: number) => {
          if (right - left <= 0) return;
          // Offsets from the box's inline start, so LTR and RTL compare.
          result[key] = rtl
            ? {
                start: Math.round(box.right - right),
                end: Math.round(box.right - left),
              }
            : {
                start: Math.round(left - box.left),
                end: Math.round(right - box.left),
              };
        };
        for (const selector of parts) {
          root.querySelectorAll(selector).forEach((node, i) => {
            const rect = node.getBoundingClientRect();
            record(`${name} ${selector}[${i}]`, rect.left, rect.right);
          });
        }
        for (const selector of text) {
          root.querySelectorAll(selector).forEach((node, i) => {
            const rect = node.getBoundingClientRect();
            const style = getComputedStyle(node);
            const px = (value: string) => Number.parseFloat(value) || 0;
            record(
              `${name} ${selector} content[${i}]`,
              rect.left + px(style.borderLeftWidth) + px(style.paddingLeft),
              rect.right - px(style.borderRightWidth) - px(style.paddingRight),
            );
          });
        }
        for (const [selector, pseudo] of pseudos) {
          root.querySelectorAll(selector).forEach((node, i) => {
            const style = getComputedStyle(node, pseudo);
            if (style.content === "none" || style.position !== "absolute")
              return;
            const rect = node.getBoundingClientRect();
            const left = rect.left + Number.parseFloat(style.left);
            record(
              `${name} ${selector}${pseudo}[${i}]`,
              left,
              left + Number.parseFloat(style.width),
            );
          });
        }
      }
      return result;
    },
    {
      cases: FIELD_CASES,
      parts: FIELD_PARTS,
      text: FIELD_TEXT,
      pseudos: FIELD_PSEUDOS,
    },
  );
}

test.describe("right-to-left text fields", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl-fields.html");
  });

  test("mirrors icons, buttons, steppers and padding", async ({ page }) => {
    const ltr = await fieldOffsets(page);
    // Guard against a selector that stops matching.
    expect(Object.keys(ltr).length).toBeGreaterThan(100);

    await setDirection(page, "rtl");
    const rtl = await fieldOffsets(page);
    expect.soft(Object.keys(rtl).sort()).toEqual(Object.keys(ltr).sort());
    // One list, so a failure names every part that stayed put.
    const unmirrored = Object.entries(ltr).flatMap(([name, box]) => {
      const actual = rtl[name];
      if (!actual) return [];
      const off =
        Math.abs(actual.start - box.start) > 1 ||
        Math.abs(actual.end - box.end) > 1;
      return off
        ? [
            `${name}: ${box.start}-${box.end} became ${actual.start}-${actual.end}`,
          ]
        : [];
    });
    expect(unmirrored).toEqual([]);
  });

  test("draws the fluid NumberInput focus edge at the inline end", async ({
    page,
  }) => {
    const field = page.getByTestId("fluid-number-invalid");
    const lastStepper = field.locator(".bx--number__control-btn").last();
    const shadow = () =>
      lastStepper.evaluate((node) => getComputedStyle(node).boxShadow);

    await field.locator("input").focus();
    const ltr = await shadow();
    expect(ltr).toContain("-2px 0px");

    await setDirection(page, "rtl");
    expect(await shadow()).toBe(ltr.replace("-2px 0px", "2px 0px"));
  });

  test("reads a Search query in its own direction, at the page's start", async ({
    page,
  }) => {
    await setDirection(page, "rtl");
    const input = page.getByTestId("search").locator("input");
    await input.fill("3 / 4");
    await page.evaluate(() => document.fonts.ready);
    // The query's left end, if it sits by the magnifier at the right.
    const { x, y } = await input.evaluate((node: HTMLInputElement) => {
      const style = getComputedStyle(node);
      const context = document.createElement("canvas").getContext("2d");
      if (!context) throw new Error("no canvas");
      context.font = style.font;
      const width = context.measureText(node.value).width;
      const box = node.getBoundingClientRect();
      return {
        x: box.right - Number.parseFloat(style.paddingRight) - width + 2,
        y: box.top + box.height / 2,
      };
    });
    await page.mouse.click(x, y);

    // "3" is at the left end, so the caret lands before it.
    expect(
      await input.evaluate((node: HTMLInputElement) => node.selectionStart),
    ).toBe(0);
  });
});

/**
 * Every button in each case of the buttons fixture, its label and its icon,
 * as start and end offsets from the case's box, plus each button's divider
 * as its box shadow's x offset.
 */
function buttonOffsets(page: Page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const rtl = document.documentElement.dir === "rtl";
    const parts: Record<string, { start: number; end: number }> = {};
    const dividers: Record<string, number> = {};
    for (const root of document.querySelectorAll<HTMLElement>(
      "[data-testid]",
    )) {
      const name = root.dataset.testid;
      // A modal case is measured from its footer.
      const frame = root.querySelector(".bx--modal-footer") ?? root;
      const box = frame.getBoundingClientRect();
      const record = (key: string, left: number, right: number) => {
        if (right - left <= 0) return;
        parts[key] = rtl
          ? {
              start: Math.round(box.right - right),
              end: Math.round(box.right - left),
            }
          : {
              start: Math.round(left - box.left),
              end: Math.round(right - box.left),
            };
      };
      const buttons = root.matches(".bx--btn")
        ? [root]
        : [...frame.querySelectorAll(".bx--btn")];
      buttons.forEach((button, i) => {
        const key = `${name} button[${i}]`;
        const rect = button.getBoundingClientRect();
        record(key, rect.left, rect.right);

        // The label's own text, not the box it sits in.
        const text = [...button.childNodes].filter(
          (node) =>
            node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        if (text.length > 0) {
          const range = document.createRange();
          range.setStartBefore(text[0]);
          range.setEndAfter(text[text.length - 1]);
          const label = range.getBoundingClientRect();
          record(`${key} label`, label.left, label.right);
        }

        for (const part of [".bx--btn__icon", ".bx--btn__loading"]) {
          const node = button.querySelector(part)?.getBoundingClientRect();
          if (node) record(`${key} ${part}`, node.left, node.right);
        }

        const shadow = getComputedStyle(button).boxShadow;
        const x = shadow.match(/(-?[\d.]+)px/);
        dividers[key] = x ? Number.parseFloat(x[1]) : 0;
      });
    }
    return { parts, dividers };
  });
}

const BUTTON_KINDS = [
  "primary",
  "secondary",
  "tertiary",
  "ghost",
  "danger",
  "danger-tertiary",
  "danger-ghost",
];

test.describe("right-to-left buttons", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl-buttons.html");
    // The loading spinner rotates, and a rotated box's bounds grow, so the
    // two directions would measure it at different points in its turn.
    await page.addStyleTag({
      content: "*, *::before, *::after { animation: none !important; }",
    });
  });

  test("mirrors labels, icons, sets and modal footers", async ({ page }) => {
    const ltr = await buttonOffsets(page);
    // Guard against a selector that stops matching.
    expect(Object.keys(ltr.parts).length).toBeGreaterThan(100);

    await setDirection(page, "rtl");
    const rtl = await buttonOffsets(page);
    expect
      .soft(Object.keys(rtl.parts).sort())
      .toEqual(Object.keys(ltr.parts).sort());
    // One list, so a failure names every part that stayed put.
    const unmirrored = Object.entries(ltr.parts).flatMap(([name, box]) => {
      const actual = rtl.parts[name];
      if (!actual) return [];
      const off =
        Math.abs(actual.start - box.start) > 1 ||
        Math.abs(actual.end - box.end) > 1;
      return off
        ? [
            `${name}: ${box.start}-${box.end} became ${actual.start}-${actual.end}`,
          ]
        : [];
    });
    expect.soft(unmirrored).toEqual([]);

    // The label starts as far in as in LTR (16px, 17px for ghosts), and the
    // icon follows it, at the inline end.
    for (const kind of BUTTON_KINDS) {
      const button = `kind-${kind} button[0]`;
      const label = rtl.parts[`${button} label`];
      const icon = rtl.parts[`${button} .bx--btn__icon`];
      expect
        .soft(label?.start, `${kind} label start`)
        .toBe(ltr.parts[`${button} label`]?.start);
      expect
        .soft(icon && label && icon.start >= label.end, `${kind} icon side`)
        .toBe(true);
    }

    // Dividers sit at each later button's inline start.
    expect(
      Object.values(ltr.dividers).filter((x) => x !== 0).length,
    ).toBeGreaterThan(2);
    expect(rtl.dividers).toEqual(
      Object.fromEntries(
        Object.entries(ltr.dividers).map(([name, x]) => [name, -x || 0]),
      ),
    );
  });

  test("seats the modal close button at the inline end, clear of the heading", async ({
    page,
  }) => {
    const measure = () =>
      page.evaluate(() => {
        const modal = document.querySelector("[data-testid=modal]");
        const box = (selector: string) => {
          const rect = modal?.querySelector(selector)?.getBoundingClientRect();
          if (!rect) throw new Error(`no ${selector}`);
          return rect;
        };
        const container = box(".bx--modal-container");
        const close = box(".bx--modal-close");
        const header = modal?.querySelector(".bx--modal-header");
        const style = getComputedStyle(header as Element);
        return {
          // The button's offsets from each edge of the dialog.
          fromLeft: Math.round(close.left - container.left),
          fromRight: Math.round(container.right - close.right),
          // The header keeps the button's width clear on the same side.
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
        };
      });

    const ltr = await measure();
    expect(ltr.fromRight).toBeLessThan(ltr.fromLeft);
    expect({ left: ltr.paddingLeft, right: ltr.paddingRight }).toEqual({
      left: "16px",
      right: "48px",
    });

    // Every offset mirrors.
    await setDirection(page, "rtl");
    const rtl = await measure();
    expect(rtl.fromLeft).toBe(ltr.fromRight);
    expect(rtl.fromRight).toBe(ltr.fromLeft);
    expect({ left: rtl.paddingLeft, right: rtl.paddingRight }).toEqual({
      left: "48px",
      right: "16px",
    });
  });
});

type Rect = { left: number; right: number };

/** A locator's left and right edges, rounded to whole pixels. */
async function edges(locator: Locator): Promise<Rect> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("no box");
  return { left: Math.round(box.x), right: Math.round(box.x + box.width) };
}

function viewportWidth(page: Page) {
  return page.evaluate(() => document.documentElement.clientWidth);
}

// Menus open toward the inline end and flip when there's no room; resize
// handles and roving lists follow the direction when the event arrives.
test.describe("right-to-left menus and keys", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl-placement.html");
    await setDirection(page, "rtl");
  });

  test("opens a submenu to the left and keeps it in view near the left edge", async ({
    page,
  }) => {
    const actions = page.getByRole("button", { name: "Actions", exact: true });
    await actions.click();
    const menu = page.getByRole("menu", { name: "Actions", exact: true });
    await page.getByRole("menuitem", { name: "Export as" }).focus();
    // ArrowLeft opens a submenu in RTL, and ArrowRight closes it.
    await page.keyboard.press("ArrowLeft");
    const submenu = page.getByRole("menu", { name: "Export as" });
    await expect(page.getByRole("menuitem", { name: "PDF" })).toBeFocused();

    // The menu starts at the trigger's right edge; the submenu opens left.
    await expect
      .poll(async () => (await edges(menu)).right)
      .toBe((await edges(actions)).right);
    await expect
      .poll(async () => (await edges(submenu)).right)
      .toBe((await edges(menu)).left);
    await page.keyboard.press("ArrowRight");
    await expect(submenu).toBeHidden();
    await expect(
      page.getByRole("menuitem", { name: "Export as" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");

    // Near the left edge there's no room on the left, so it flips right.
    const tools = page.getByRole("button", { name: "Tools" });
    await tools.click();
    const toolsMenu = page.getByRole("menu", { name: "Tools" });
    await page.getByRole("menuitem", { name: "Share via" }).focus();
    await page.keyboard.press("ArrowLeft");
    const share = page.getByRole("menu", { name: "Share via" });
    await expect(share).toBeVisible();
    await expect
      .poll(async () => (await edges(toolsMenu)).left)
      .toBe((await edges(tools)).left);
    await expect
      .poll(async () => (await edges(share)).left)
      .toBe((await edges(toolsMenu)).right);
  });

  test("opens a context menu and its submenu to the left of the pointer", async ({
    page,
  }) => {
    const target = await page.getByTestId("context-target").boundingBox();
    if (!target) throw new Error("no target");
    const y = target.y + 20;
    const width = await viewportWidth(page);
    const menu = page.getByRole("menu", { name: "Page actions" });
    const submenu = page.locator(".bx--menu[data-level='2']");

    async function openAt(x: number) {
      await page.mouse.click(x, y, { button: "right" });
      await expect(menu).toBeVisible();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowLeft");
      await expect(
        page.getByRole("menuitem", { name: "Archive" }),
      ).toBeFocused();
    }

    await openAt(Math.round(width / 2));
    expect((await edges(menu)).right).toBe(Math.round(width / 2));
    expect((await edges(submenu)).right).toBe((await edges(menu)).left);
    await page.keyboard.press("Escape");

    await openAt(20);
    const root = await edges(menu);
    expect(root.left).toBe(20);
    const sub = await edges(submenu);
    expect(sub.left).toBe(root.right);
    expect(sub.right).toBeLessThanOrEqual(width);
  });

  test("aligns OverflowMenu with the button's inline start, or end when flipped", async ({
    page,
  }) => {
    const width = await viewportWidth(page);
    const cases = [
      ["overflow-right", "Row actions", "right"],
      ["overflow-left", "Table actions", "left"],
      ["overflow-portal-right", "Service actions", "right"],
      ["overflow-portal-left", "Region actions", "left"],
    ] as const;

    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      for (const [testId, name, rtlSide] of cases) {
        const button = page.getByTestId(testId).getByRole("button", { name });
        // biome-ignore lint/performance/noAwaitInLoops: one menu opens at a time
        await button.click();
        const menu = page.getByRole("menu", { name });
        await expect(menu).toBeVisible();
        const [buttonBox, menuBox] = await Promise.all([
          edges(button),
          edges(menu),
        ]);
        // LTR is the mirror: the right-edge menu aligns on the left.
        const side =
          dir === "rtl" ? rtlSide : rtlSide === "right" ? "left" : "right";
        expect.soft(menuBox[side], `${dir} ${testId}`).toBe(buttonBox[side]);
        if (dir === "rtl") {
          expect
            .soft(menuBox.left, `${testId} in view`)
            .toBeGreaterThanOrEqual(0);
          expect
            .soft(menuBox.right, `${testId} in view`)
            .toBeLessThanOrEqual(width);
        }
        await page.keyboard.press("Escape");
        await expect(menu).toBeHidden();
      }
    }
  });

  test("swaps ArrowLeft and ArrowRight in roving lists", async ({ page }) => {
    const lists = [
      page.getByTestId("content-switcher").getByRole("tab"),
      page.getByTestId("toggle-group").getByRole("button"),
      page.getByTestId("progress").locator(".bx--progress-step-button"),
      page.getByTestId("tag-set").getByRole("button"),
    ];

    for (const items of lists) {
      // biome-ignore lint/performance/noAwaitInLoops: focus moves one list at a time
      await items.nth(0).focus();
      await page.keyboard.press("ArrowLeft");
      await expect(items.nth(1)).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(items.nth(0)).toBeFocused();
    }
  });
});

// Each floating case: what it points at, its surface, and its caret, either
// an element or a pseudo-element of the surface. `inline` cases align to
// `start` or `end`, or center on the trigger, so in RTL they mirror around
// the trigger's center. The others name a physical side and stay.
type FloatCase = {
  anchor: string;
  floating: string;
  caret?: string;
  caretPseudo?: "::after";
  focus?: string;
  inline: boolean;
};

const FLOAT_CASES: Record<string, FloatCase> = {
  tooltipStart: {
    anchor: "[data-testid=tooltip-start] .bx--tooltip__trigger",
    floating: "#tooltip-start",
    caret: "#tooltip-start .bx--tooltip__caret",
    inline: true,
  },
  tooltipEnd: {
    anchor: "[data-testid=tooltip-end] .bx--tooltip__trigger",
    floating: "#tooltip-end",
    caret: "#tooltip-end .bx--tooltip__caret",
    inline: true,
  },
  tooltipCenter: {
    anchor: "[data-testid=tooltip-center] .bx--tooltip__trigger",
    floating: "#tooltip-center",
    caret: "#tooltip-center .bx--tooltip__caret",
    inline: true,
  },
  tooltipRight: {
    anchor: "[data-testid=tooltip-right] .bx--tooltip__trigger",
    floating: "#tooltip-right",
    caret: "#tooltip-right .bx--tooltip__caret",
    inline: false,
  },
  tooltipPortal: {
    anchor: "[data-testid=tooltip-portal] .bx--tooltip__trigger",
    floating: "#tooltip-portal",
    caret: "#tooltip-portal .bx--tooltip__caret",
    inline: true,
  },
  popoverTopStart: {
    anchor: "[data-testid=popover-top-start] .anchor",
    floating: "#popover-top-start .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  popoverBottomEnd: {
    anchor: "[data-testid=popover-bottom-end] .anchor",
    floating: "#popover-bottom-end .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  popoverTopLeft: {
    anchor: "[data-testid=popover-top-left] .anchor",
    floating: "#popover-top-left .bx--popover-contents",
    caretPseudo: "::after",
    inline: false,
  },
  toggletipStart: {
    anchor: "[data-testid=toggletip-start] .bx--toggletip-button",
    floating: "#toggletip-start-content .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  toggletipEnd: {
    anchor: "[data-testid=toggletip-end] .bx--toggletip-button",
    floating: "#toggletip-end-content .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  toggletipPortal: {
    anchor: "[data-testid=toggletip-portal] .bx--toggletip-button",
    floating: "#toggletip-portal-content .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  aiLabel: {
    anchor: "[data-testid=ai-label] .bx--toggletip-button",
    floating: "#ai-label-content .bx--popover-contents",
    caretPseudo: "::after",
    inline: true,
  },
  tooltipIconStart: {
    anchor: "[data-testid=tooltip-icon-start] button",
    focus: "[data-testid=tooltip-icon-start] button",
    floating: "#tooltip-icon-start",
    inline: true,
  },
  tooltipIconEnd: {
    anchor: "[data-testid=tooltip-icon-end] button",
    focus: "[data-testid=tooltip-icon-end] button",
    floating: "#tooltip-icon-end",
    inline: true,
  },
  tooltipIconPortal: {
    anchor: "[data-testid=tooltip-icon-portal] button",
    focus: "[data-testid=tooltip-icon-portal] button",
    floating: "#tooltip-icon-portal",
    caret:
      ".bx--tooltip-portal:has(#tooltip-icon-portal) .bx--tooltip-portal__caret",
    inline: true,
  },
  tooltipDefinition: {
    anchor: "[data-testid=tooltip-definition] button",
    focus: "[data-testid=tooltip-definition] button",
    floating: "#tooltip-definition",
    inline: true,
  },
  tooltipDefinitionPortal: {
    anchor: "[data-testid=tooltip-definition-portal] button",
    focus: "[data-testid=tooltip-definition-portal] button",
    floating: "#tooltip-definition-portal",
    caret:
      ".bx--tooltip-portal:has(#tooltip-definition-portal) .bx--tooltip-portal__caret",
    inline: true,
  },
  buttonTooltip: {
    anchor: "[data-testid=button-tooltip] button",
    focus: "[data-testid=button-tooltip] button",
    floating: "[data-testid=button-tooltip] .bx--assistive-text",
    inline: true,
  },
  operationalTagStart: {
    anchor: "[data-testid=operational-tag-start] .bx--tag",
    floating: "#operational-tag-start-content .bx--popover-contents",
    inline: true,
  },
  operationalTagEnd: {
    anchor: "[data-testid=operational-tag-end] .bx--tag",
    floating: "#operational-tag-end-content .bx--popover-contents",
    inline: true,
  },
};

type FloatOffsets = { start: number; end: number; caret: number | null };

/**
 * One case's surface edges and caret center, in px from the center of what
 * it points at.
 */
function floatOffsets(page: Page, item: FloatCase) {
  return page.evaluate(async (item) => {
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    const anchor = document.querySelector(item.anchor);
    const floating = document.querySelector(item.floating);
    if (!anchor || !floating) return null;
    const anchorRect = anchor.getBoundingClientRect();
    const center = anchorRect.left + anchorRect.width / 2;
    const rect = floating.getBoundingClientRect();
    let caret: number | null = null;
    if (item.caret) {
      const caretRect = document
        .querySelector(item.caret)
        ?.getBoundingClientRect();
      if (caretRect) caret = caretRect.left + caretRect.width / 2;
    } else if (item.caretPseudo) {
      // The caret's center: its box, then its own translation.
      const style = getComputedStyle(floating, item.caretPseudo);
      const width =
        style.boxSizing === "border-box"
          ? Number.parseFloat(style.width)
          : Number.parseFloat(style.width) +
            Number.parseFloat(style.borderLeftWidth) +
            Number.parseFloat(style.borderRightWidth);
      const shift =
        style.transform === "none" ? 0 : new DOMMatrix(style.transform).e;
      caret =
        rect.left +
        floating.clientLeft +
        Number.parseFloat(style.left) +
        width / 2 +
        shift;
    }
    const round = (value: number) => Math.round(value * 2) / 2;
    return {
      start: round(rect.left - center),
      end: round(rect.right - center),
      caret: caret === null ? null : round(caret - center),
    };
  }, item);
}

async function allFloatOffsets(page: Page, cases: Record<string, FloatCase>) {
  const result: Record<string, FloatOffsets | null> = {};
  for (const [name, item] of Object.entries(cases)) {
    // biome-ignore lint/performance/noAwaitInLoops: one tooltip shows at a time
    if (item.focus) await page.locator(item.focus).focus();
    result[name] = await floatOffsets(page, item);
  }
  return result;
}

function expectAlignedInline(
  ltr: Record<string, FloatOffsets | null>,
  rtl: Record<string, FloatOffsets | null>,
  cases: Record<string, FloatCase>,
) {
  for (const [name, item] of Object.entries(cases)) {
    const before = ltr[name];
    const after = rtl[name];
    expect.soft(before, `${name} in LTR`).not.toBeNull();
    expect.soft(after, `${name} in RTL`).not.toBeNull();
    if (!before || !after) continue;
    const expected = item.inline
      ? {
          start: -before.end,
          end: -before.start,
          caret: before.caret === null ? null : -before.caret,
        }
      : before;
    for (const key of ["start", "end", "caret"] as const) {
      const value = after[key];
      const target = expected[key];
      if (target === null || value === null) {
        expect.soft(value, `${name} ${key}`).toBe(target);
      } else {
        expect
          .soft(Math.abs(value - target), `${name} ${key}`)
          .toBeLessThanOrEqual(1);
      }
    }
  }
}

test.describe("right-to-left tooltips and popovers", () => {
  test("aligns start and end to the inline sides, carets included", async ({
    page,
  }) => {
    await page.goto("/rtl-tooltips.html");
    const ltr = await allFloatOffsets(page, FLOAT_CASES);
    // Guard against a start case that reads the same mirrored.
    expect(ltr.tooltipIconStart?.end).toBeGreaterThan(100);

    await page.goto("/rtl-tooltips.html?dir=rtl");
    const rtl = await allFloatOffsets(page, FLOAT_CASES);
    expectAlignedInline(ltr, rtl, FLOAT_CASES);

    // The text starts at the right edge too.
    await page.locator(FLOAT_CASES.tooltipIconPortal.focus as string).focus();
    const textAlign = await page.evaluate(() =>
      [
        "#tooltip-start p",
        "#tooltip-icon-start",
        "#tooltip-definition",
        "[data-testid=button-tooltip] .bx--assistive-text",
        "#tooltip-icon-portal",
      ].map((selector) => {
        const node = document.querySelector(selector);
        return node && getComputedStyle(node).textAlign;
      }),
    );
    expect(textAlign).toEqual(Array(5).fill("right"));
  });

  test("mirrors the Breadcrumb trail, its overflow menu and caret", async ({
    page,
  }) => {
    // Each item's edges, from the trail's start edge inward, once the
    // fonts load: the fallback font's widths differ by a pixel or two.
    const items = (dir: "ltr" | "rtl") =>
      page.evaluate(async (dir) => {
        await document.fonts.ready;
        const trail = document
          .querySelector("[data-testid=breadcrumb] .bx--breadcrumb")
          ?.getBoundingClientRect();
        if (!trail) return null;
        return [
          ...document.querySelectorAll(
            "[data-testid=breadcrumb] .bx--breadcrumb-item",
          ),
        ].map((item) => {
          const box = item.getBoundingClientRect();
          return dir === "ltr"
            ? [
                Math.round(box.left - trail.left),
                Math.round(box.right - trail.left),
              ]
            : [
                Math.round(trail.right - box.right),
                Math.round(trail.right - box.left),
              ];
        });
      }, dir);
    const menu: FloatCase = {
      anchor: "[data-testid=breadcrumb] .bx--overflow-menu",
      floating: "[data-testid=breadcrumb] .bx--overflow-menu-options",
      caretPseudo: "::after",
      inline: true,
    };
    const cases = { menu };
    await page.goto("/rtl-tooltips.html");
    const ltrItems = await items("ltr");
    await page.locator(menu.anchor).click();
    const ltr = await allFloatOffsets(page, cases);

    await page.goto("/rtl-tooltips.html?dir=rtl");
    expect(await items("rtl")).toEqual(ltrItems);
    await page.locator(menu.anchor).click();
    const rtl = await allFloatOffsets(page, cases);
    expectAlignedInline(ltr, rtl, cases);
  });

  test("moves between TagInput's text and tags with the inline arrows", async ({
    page,
  }) => {
    await page.goto("/rtl-tooltips.html?dir=rtl");
    const field = page.getByTestId("tag-input");
    const input = field.getByRole("textbox");
    const lastTag = field.locator(".bx--tag__close-icon").last();

    await input.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(input).toBeFocused();
    // The tags sit at the inline start, to the right.
    await page.keyboard.press("ArrowRight");
    await expect(lastTag).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(input).toBeFocused();
  });

  test('keeps "+N" overflow counts reading left to right', async ({ page }) => {
    // Each count's characters in visual order, left to right. In an RTL
    // paragraph, bidi moves a sign that sits next to a number to the far
    // side: "+1" paints as "1+".
    const counts = () =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll(
            "[data-testid=plus-counts] .bx--tag-set-overflow__popover-trigger [aria-hidden=true], [data-testid=plus-counts] .bx--user-avatar-group__overflow .bx--user-avatar__text",
          ),
        ].map((count) => {
          const range = document.createRange();
          const chars: { char: string; left: number }[] = [];
          const walker = document.createTreeWalker(count, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            for (let i = 0; i < (node.textContent ?? "").length; i++) {
              range.setStart(node, i);
              range.setEnd(node, i + 1);
              chars.push({
                char: range.toString(),
                left: range.getBoundingClientRect().left,
              });
            }
          }
          return chars
            .sort((a, b) => a.left - b.left)
            .map(({ char }) => char)
            .join("");
        }),
      );
    const expected = ["+1", "+2", "+1", "99+"];
    await page.goto("/rtl-tooltips.html");
    expect(await counts()).toEqual(expected);
    await page.goto("/rtl-tooltips.html?dir=rtl");
    expect(await counts()).toEqual(expected);
  });

  test("moves between PinCodeInput segments with the inline arrows", async ({
    page,
  }) => {
    await page.goto("/rtl-tooltips.html?dir=rtl");
    const segments = page.getByTestId("pin-code").locator("input");

    await segments.first().focus();
    // The first segment is the rightmost one, so Left moves to the next.
    await page.keyboard.press("ArrowLeft");
    await expect(segments.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(segments.first()).toBeFocused();
  });
});

// The calendar runs from the right in RTL: weekdays, days, month cells, the
// header arrows and the range ends sit as far from the right edge as they
// sat from the left one, and a calendar opens at its field's inline start.
const DAY = (name: string, label: string) =>
  `[data-testid=${name}] .bx--date-picker__day[aria-label="${label}"]`;

const CALENDAR_PARTS = {
  previous: "[data-testid=single] .bx--date-picker__nav-button--previous",
  next: "[data-testid=single] .bx--date-picker__nav-button--next",
  monthLabel: "[data-testid=single] .bx--date-picker__month-label",
  year: "[data-testid=single] .bx--date-picker__year",
  firstWeekday: "[data-testid=single] .bx--date-picker__weekday",
  firstOfMonth: DAY("single", "Friday, March 1, 2024"),
  selected: "[data-testid=single] .bx--date-picker__day--selected",
  rangeStart: "[data-testid=range] .bx--date-picker__day--range-start",
  inRange: "[data-testid=range] .bx--date-picker__day--in-range",
  rangeEnd: "[data-testid=range] .bx--date-picker__day--range-end",
  rangeEndInput: "[data-testid=range] .bx--date-picker-container + * input",
  firstMonth: "[data-testid=month] .bx--date-picker__grid-cell",
  selectedMonth: "[data-testid=month] .bx--date-picker__grid-cell--selected",
};

test.describe("right-to-left date picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rtl-date-picker.html");
    await expect(page.locator(CALENDAR_PARTS.selectedMonth)).toBeVisible();
  });

  const viewportWidth = (page: Page) =>
    page.evaluate(async () => {
      await document.fonts.ready;
      return document.documentElement.clientWidth;
    });

  test("runs the grids, the arrows and the range from the right", async ({
    page,
  }) => {
    const width = await viewportWidth(page);
    const ltr = await boxes(page, CALENDAR_PARTS);
    await setDirection(page, "rtl");
    const rtl = await boxes(page, CALENDAR_PARTS);
    expectMirrored(rtl, mirror(ltr, width));

    // The range starts on the right, and the previous arrow sits on the
    // right and points right.
    expect((rtl.rangeStart as Box).left).toBeGreaterThan(
      (rtl.rangeEnd as Box).left,
    );
    expect((rtl.previous as Box).left).toBeGreaterThan((rtl.next as Box).left);
    expect(
      await iconScales(page, {
        previous: `${CALENDAR_PARTS.previous} svg`,
        next: `${CALENDAR_PARTS.next} svg`,
      }),
    ).toEqual({ previous: -1, next: -1 });
  });

  test("swaps ArrowLeft and ArrowRight, and keeps Home at the inline start", async ({
    page,
  }) => {
    await setDirection(page, "rtl");
    const day = (label: string) => page.locator(DAY("single", label));
    await day("Friday, March 15, 2024").focus();

    await page.keyboard.press("ArrowLeft");
    await expect(day("Saturday, March 16, 2024")).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(day("Thursday, March 14, 2024")).toBeFocused();
    await page.keyboard.press("Home");
    const sunday = day("Sunday, March 10, 2024");
    await expect(sunday).toBeFocused();
    // The week's first day is its rightmost cell.
    const row = await sunday.evaluate((node) => {
      const cells = [...(node.parentElement?.children ?? [])];
      return {
        cell: Math.round(node.getBoundingClientRect().right),
        max: Math.max(
          ...cells.map((cell) =>
            Math.round(cell.getBoundingClientRect().right),
          ),
        ),
      };
    });
    expect(row.cell).toBe(row.max);

    const months = page.locator(
      "[data-testid=month] .bx--date-picker__grid-cell",
    );
    await months.nth(2).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(months.nth(3)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(months.nth(1)).toBeFocused();
  });

  test("opens a calendar at its field's inline start and keeps it in view", async ({
    page,
  }) => {
    const width = await viewportWidth(page);
    const open = page.locator(
      ".bx--date-picker__calendar.bx--date-picker__calendar--open",
    );
    async function measure() {
      const result: Record<string, Box | null> = {};
      for (const name of ["static", "portal", "portal-inset", "portal-end"]) {
        // biome-ignore lint/performance/noAwaitInLoops: one calendar open at a time
        await page
          .getByTestId(name)
          .getByRole("textbox", { name: "Start date" })
          .click();
        await expect(open).toBeVisible();
        const box = await open.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          return {
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        });
        result[name] = box;
        await page.keyboard.press("Escape");
        await expect(open).toHaveCount(0);
      }
      return result;
    }

    const ltr = await measure();
    await setDirection(page, "rtl");
    const rtl = await measure();
    expectMirrored(rtl, mirror(ltr, width));
    for (const [name, box] of Object.entries(rtl)) {
      expect
        .soft((box as Box).left, `${name} in view`)
        .toBeGreaterThanOrEqual(0);
      expect
        .soft((box as Box).right, `${name} in view`)
        .toBeLessThanOrEqual(width);
    }
  });

  test("keeps a date and time in reading order", async ({ page }) => {
    // Bidi reordered "03/15/2024 2:30 PM" by the page's direction, so an
    // RTL page showed "PM 2:30 03/15/2024". Read left to right, the field's
    // caret offsets must run from the start of the text to its end, and the
    // overlay's characters must spell the date in order.
    const read = (testId: string) =>
      page.getByTestId(testId).evaluate((root) => {
        const input = root.querySelector("input");
        if (!input) throw new Error("no input");
        input.scrollIntoView({ block: "center" });
        const rect = input.getBoundingClientRect();
        const y = rect.top + rect.height / 2;
        const offsets: number[] = [];
        const xs: number[] = [];
        for (let x = Math.ceil(rect.left); x < rect.right; x++) {
          const position = document.caretPositionFromPoint(x, y);
          if (position?.offsetNode !== input) continue;
          if (offsets.at(-1) !== position.offset) {
            offsets.push(position.offset);
            xs.push(x);
          }
        }
        const chars: { char: string; left: number }[] = [];
        const text = root.querySelector(
          ".bx--date-picker__input-overlay span",
        )?.firstChild;
        const range = document.createRange();
        for (let i = 0; text && i < (text.textContent ?? "").length; i++) {
          if (/\s/.test(text.textContent?.[i] ?? "")) continue;
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          chars.push({
            char: text.textContent?.[i] ?? "",
            left: range.getBoundingClientRect().left,
          });
        }
        return {
          offsets,
          length: input.value.length,
          // Space before the text's first character and after its last.
          startGap: (xs[1] ?? rect.left) - rect.left,
          endGap: rect.right - (xs.at(-1) ?? rect.right),
          overlay: chars
            .sort((a, b) => a.left - b.left)
            .map(({ char }) => char)
            .join(""),
        };
      });

    await page.evaluate(() => document.fonts.ready);
    for (const dir of ["ltr", "rtl"] as const) {
      // biome-ignore lint/performance/noAwaitInLoops: one direction at a time
      await setDirection(page, dir);
      const field = await read("time");
      expect(field.length, dir).toBeGreaterThan(0);
      expect(field.offsets, dir).toEqual(
        Array.from({ length: field.length + 1 }, (_, index) => index),
      );
      // The text stays at the page's inline start.
      if (dir === "rtl") {
        expect(field.endGap).toBeLessThan(field.startGap);
      } else {
        expect(field.startGap).toBeLessThan(field.endGap);
      }
      expect((await read("time-multiple")).overlay, dir).toBe(
        "03/15/20242:30PM",
      );
    }
  });
});

test.describe("right-to-left numbers", () => {
  test("keeps BigNumber values, totals and deltas in their locale's order", async ({
    page,
  }) => {
    // Each number's characters in screen order, left to right, without
    // spaces, bidi marks and the total's slash. In an RTL paragraph, bidi moves the sign of
    // "+12%" to the far side, so it paints as "12%+".
    const numbers = () =>
      page.evaluate(() =>
        [...document.querySelectorAll("[data-testid=big-numbers] figure")].map(
          (figure) =>
            [
              ".bx--big-number__value",
              ".bx--big-number__denominator",
              ".bx--big-number__delta-value",
            ].flatMap((selector) => {
              const part = figure.querySelector(selector);
              if (!part) return [];
              const range = document.createRange();
              const chars: { char: string; left: number }[] = [];
              const walker = document.createTreeWalker(
                part,
                NodeFilter.SHOW_TEXT,
              );
              for (
                let node = walker.nextNode();
                node;
                node = walker.nextNode()
              ) {
                if (
                  node.parentElement?.closest(
                    ".bx--visually-hidden, [aria-hidden=true]",
                  )
                ) {
                  continue;
                }
                const text = node.textContent ?? "";
                for (let i = 0; i < text.length; i++) {
                  if (/[\s‎‏؜]/.test(text[i])) continue;
                  range.setStart(node, i);
                  range.setEnd(node, i + 1);
                  chars.push({
                    char: text[i],
                    left: range.getBoundingClientRect().left,
                  });
                }
              }
              return [
                chars
                  .sort((a, b) => a.left - b.left)
                  .map(({ char }) => char)
                  .join(""),
              ];
            }),
        ),
      );
    const expected = [
      ["-1.2K", "2K", "+12%"],
      ["٪١٢", "٪١٢+"],
      ["2", "نويلم-1.2"],
    ];
    await page.goto("/rtl.html");
    expect(await numbers()).toEqual(expected);
    await setDirection(page, "rtl");
    expect(await numbers()).toEqual(expected);
  });
});

test.describe("right-to-left plain dir", () => {
  // A plain `dir` inside a LayoutDirection wins for the keys, as it does
  // for the styles.
  for (const dir of ["ltr", "rtl"] as const) {
    test(`reads the keys by a plain dir="${dir}" inside a LayoutDirection`, async ({
      page,
    }) => {
      await page.goto("/rtl-plain-dir.html");
      // The key that moves toward the inline end.
      const forward = dir === "ltr" ? "ArrowRight" : "ArrowLeft";
      const region = page.getByTestId(`plain-${dir}`);

      const segments = region.locator(".bx--pin-code-input__field");
      await segments.first().focus();
      await page.keyboard.press(forward);
      await expect.soft(segments.nth(1), "PinCodeInput").toBeFocused();

      const slider = region.getByRole("slider");
      await slider.focus();
      await page.keyboard.press(forward);
      await expect
        .soft(slider, "Slider")
        .toHaveAttribute("aria-valuenow", "21");

      await region.getByRole("tab", { name: `Overview (${dir})` }).focus();
      await page.keyboard.press(forward);
      await expect
        .soft(region.getByRole("tab", { name: `Logs (${dir})` }), "Tabs")
        .toBeFocused();
    });
  }
});

test.describe("right-to-left plain dir portals", () => {
  // Portalled content takes the plain `dir` around its trigger, not the
  // LayoutDirection's.
  for (const dir of ["ltr", "rtl"] as const) {
    test(`opens portalled content ${dir} under a plain dir="${dir}"`, async ({
      page,
    }) => {
      await page.goto("/rtl-plain-dir.html");
      const region = page.getByTestId(`plain-${dir}`);
      const direction = (locator: Locator) =>
        locator.evaluate((node) => getComputedStyle(node).direction);

      await region.getByRole("combobox", { name: `Region (${dir})` }).click();
      const menu = page.locator("[data-portal] .bx--list-box__menu");
      await expect(menu).toBeVisible();
      expect.soft(await direction(menu), "Dropdown").toBe(dir);
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);

      await region.getByRole("button", { name: `Billing (${dir})` }).click();
      const tooltip = page.locator("[data-portal] .bx--tooltip__content");
      await expect(tooltip).toBeVisible();
      expect.soft(await direction(tooltip), "Tooltip").toBe(dir);
      await page.keyboard.press("Escape");
      await expect(tooltip).toHaveCount(0);

      const input = region.getByRole("textbox", { name: `Date (${dir})` });
      await input.click();
      const calendar = page.locator(".bx--date-picker__calendar--open");
      await expect(calendar).toBeVisible();
      expect.soft(await direction(calendar), "DatePicker").toBe(dir);
      // The calendar opens at the field's inline start.
      const [field, box] = await Promise.all(
        [input, calendar].map((locator) =>
          locator.evaluate((node) => {
            const { left, right } = node.getBoundingClientRect();
            return { left: Math.round(left), right: Math.round(right) };
          }),
        ),
      );
      const side = dir === "ltr" ? "left" : "right";
      expect.soft(box[side], "DatePicker side").toBe(field[side]);
    });
  }
});

test.describe("right-to-left nested regions", () => {
  // Every element's box and inline padding in each field, relative to the
  // field. A region lays out by its own `dir`, whatever the page's is.
  function layout(page: Page, dir: "ltr" | "rtl") {
    return page.evaluate(async (dir) => {
      await document.fonts.ready;
      const region = document.querySelector(`[data-testid=region-${dir}]`);
      const fields: Record<string, string[]> = {};
      for (const field of region?.querySelectorAll("[data-field]") ?? []) {
        const origin = field.getBoundingClientRect();
        // A closed select's options sit where the page puts them, and a
        // hidden tooltip where the window does.
        fields[field.getAttribute("data-field") ?? ""] = [
          ...field.querySelectorAll(":not(option, .bx--assistive-text)"),
        ].map((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return [
            el.tagName.toLowerCase(),
            Math.round(rect.left - origin.left),
            Math.round(rect.top - origin.top),
            Math.round(rect.width),
            style.paddingLeft,
            style.paddingRight,
            style.transform,
          ].join(" ");
        });
      }
      return fields;
    }, dir);
  }

  test("lays out a region by its own dir, not the page's", async ({ page }) => {
    await page.goto("/rtl-nested.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "ltr"),
    );
    const ltr = await layout(page, "ltr");
    const rtlInLtr = await layout(page, "rtl");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const rtl = await layout(page, "rtl");
    const ltrInRtl = await layout(page, "ltr");

    expect(Object.keys(ltr)).toEqual([
      "password",
      "select",
      "date-picker",
      "search",
    ]);
    for (const field of Object.keys(ltr)) {
      expect.soft(rtl[field], `${field} mirrors`).not.toEqual(ltr[field]);
      expect.soft(ltrInRtl[field], `LTR ${field} in RTL`).toEqual(ltr[field]);
      expect.soft(rtlInLtr[field], `RTL ${field} in LTR`).toEqual(rtl[field]);
    }
  });
});
