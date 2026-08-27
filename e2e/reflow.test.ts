import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  expectMenuReadsContinuously,
  filterBy,
  readOptionBoxes,
  SLACK,
  scrollToEnd,
} from "./measured-menu";

/**
 * WCAG 1.4.10 Reflow, for the listbox family's options.
 *
 * Everything asserted here needs a layout engine: whether text wrapped,
 * whether it is clipped, whether the document scrolls sideways. None of it is
 * observable in the unit environment, where nothing has a size, which is why
 * this file exists rather than a component test.
 */

// The criterion's test condition: 320x256 CSS px, i.e. 1280x1024 at 400% zoom.
test.use({ viewport: { width: 320, height: 256 } });

// Carbon's fixed option height at the default size. Wrapping releases it, so an
// option taller than this is one that took more than the single line it used to
// be confined to.
const SINGLE_LINE_HEIGHT = 40;

const LONG_LABEL =
  "Chief Accessibility Officer for Regional Operations and Strategic Partnerships";
const UNBROKEN_LABEL =
  "Verylongunbrokenidentifierwithnowhereatallforalinebreaktoland";
const ITEM_COUNT = 300;

/** Whether reading the page requires scrolling in the second dimension. */
function documentScrollsHorizontally(page: Page) {
  return page.evaluate((slack) => {
    const { scrollWidth, clientWidth } = document.documentElement;
    return scrollWidth > clientWidth + slack;
  }, SLACK);
}

/**
 * How far an option's content escapes the box it is drawn in. Anything above
 * zero is text the reader cannot see.
 */
function readOptionClipping(option: Locator) {
  return option.evaluate((el, slack) => {
    const inner = el.querySelector(".bx--list-box__menu-item__option") ?? el;
    return {
      horizontal: inner.scrollWidth - inner.clientWidth > slack,
      vertical: inner.scrollHeight - inner.clientHeight > slack,
      height: el.getBoundingClientRect().height,
    };
  }, SLACK);
}

/**
 * Where each line of an option's text starts, for whichever element actually
 * holds that text: the checkbox's label span on `MultiSelect`, the option's own
 * box everywhere else.
 */
function readTextLineLefts(option: Locator) {
  return option.evaluate((el) => {
    const text =
      el.querySelector(".bx--checkbox-label-text") ??
      el.querySelector(".bx--list-box__menu-item__option") ??
      el;
    const range = document.createRange();
    range.selectNodeContents(text);
    const lines = Array.from(range.getClientRects()).filter(
      (rect) => rect.height > 0 && rect.width > 0,
    );
    return lines.map((rect) => rect.left);
  });
}

/**
 * Every line of a wrapped label starts at the same left edge.
 *
 * Worth asserting because padding on an *inline* element is drawn once at the
 * start of the whole inline box rather than at the start of each line it breaks
 * into: any padded inline wrapping its text indents its first line and hangs
 * the rest to the left of it.
 */
async function expectLinesShareLeftEdge(option: Locator) {
  const lefts = await readTextLineLefts(option);

  expect(lefts.length).toBeGreaterThan(1);
  expect(Math.max(...lefts) - Math.min(...lefts)).toBeLessThanOrEqual(SLACK);
}

/**
 * How far a `MultiSelect` option's label escapes its own box, and how many
 * lines it took.
 *
 * `readOptionClipping` cannot see this component's failure: the label is
 * `width: 100%` with `overflow: hidden`, so text lost inside it never overflows
 * the option wrapper that function measures. The label is where Carbon confines
 * the text, twice over: on the label and again on the span inside it. So the
 * label is where the release has to be read.
 */
function readLabelClipping(option: Locator) {
  return option.evaluate((el, slack) => {
    const label = el.querySelector(".bx--checkbox-label");
    const text = el.querySelector(".bx--checkbox-label-text");
    if (!label || !text) return null;
    // One rect per line box the label's text was laid out on.
    const range = document.createRange();
    range.selectNodeContents(text);
    const lines = Array.from(range.getClientRects()).filter(
      (rect) => rect.height > 0 && rect.width > 0,
    );
    // The label's content box: the width its text actually has to fit in,
    // padding for the checkbox excluded. The text span is inline, so its own
    // `clientWidth` is not a box any engine agrees on. The line rects above
    // are, which is why the fit is judged from them.
    const style = getComputedStyle(label);
    const available =
      label.clientWidth -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight);
    const lefts = lines.map((rect) => rect.left);
    return {
      labelClipped: label.scrollWidth - label.clientWidth > slack,
      lineCount: lines.length,
      widest: Math.max(0, ...lines.map((rect) => rect.width)),
      available,
      // How far the line starts spread apart. The gap between the checkbox and
      // the words is padding on the text span, and inline padding is drawn
      // once at the start of the whole inline rather than on every line, so an
      // inline span indents its first line and hangs the rest to its left.
      leftSpread: lines.length ? Math.max(...lefts) - Math.min(...lefts) : 0,
    };
  }, SLACK);
}

/**
 * The label read every line of its text, over more than one line, inside the
 * width it was given.
 */
async function expectLabelReadsWhole(option: Locator) {
  const label = await readLabelClipping(option);
  expect(label).not.toBeNull();
  expect(label?.labelClipped).toBe(false);
  expect(label?.lineCount).toBeGreaterThan(1);
  expect(label?.widest).toBeLessThanOrEqual((label?.available ?? 0) + SLACK);
  // Every line starts at the same place, so the wrapped label reads as one
  // block of text beside its checkbox rather than as an indented first line.
  expect(label?.leftSpread).toBeLessThanOrEqual(SLACK);
}

/** Open one of the fixture's fields by its accessible name. */
async function openMenu(page: Page, name: string) {
  await page.goto("/reflow.html");
  const field = page.getByRole("combobox", { name });
  await field.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  return field;
}

/**
 * The reflow assertions every wrapping listbox owes, against a list short
 * enough that the component renders it whole. Shared rather than copied per
 * component: the criterion is the same one, and what differs between them is
 * only which field opens the menu.
 */
function describeListRenderedWhole(fieldName: string) {
  test.describe("a list the component renders whole", () => {
    test.beforeEach(async ({ page }) => {
      await openMenu(page, fieldName);
    });

    test("the document does not scroll horizontally", async ({ page }) => {
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });

    test("a long label is rendered in full, unclipped, over several lines", async ({
      page,
    }) => {
      const option = page.getByRole("option").first();

      // The whole label, not the part that fit before an ellipsis.
      await expect(option).toHaveText(LONG_LABEL);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      await expectLinesShareLeftEdge(option);
    });

    test("a single unbroken token reflows instead of forcing sideways scroll", async ({
      page,
    }) => {
      const option = page.getByRole("option").nth(1);

      await expect(option).toHaveText(UNBROKEN_LABEL);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });

    test("the overflow title removes itself once the text wraps", async ({
      page,
    }) => {
      // The title exists only while text overflows horizontally, which wrapping
      // ends. Verified rather than assumed: a hover-only tooltip is exactly the
      // mitigation this work replaces.
      const options = page.locator(".bx--list-box__menu-item__option");

      await expect(options.first()).not.toHaveAttribute("title");
      await expect(options.nth(1)).not.toHaveAttribute("title");
    });
  });
}

/**
 * Wrapping is one stylesheet rule reaching one marker class, and a portal is
 * where that reach is least obvious: the menu is rendered outside the
 * component's own subtree, so nothing on the component root could style it.
 * The same question of all three, so asked once here.
 */
function describePortaledMenu(fieldName: string) {
  test.describe("a portaled menu", () => {
    test.beforeEach(async ({ page }) => {
      await openMenu(page, fieldName);
    });

    test("wraps options rendered outside the component's own subtree", async ({
      page,
    }) => {
      const menu = page.getByRole("listbox");
      // The marker class is on the menu rather than the component root for
      // exactly this case: nothing on the root reaches here.
      await expect(
        menu.locator("xpath=ancestor::*[@data-floating-portal]"),
      ).toHaveCount(1);

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(LONG_LABEL);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });
  });
}

/**
 * The other context where the reach is in doubt: fluid sets the option's fixed
 * height through a stronger selector than the one that releases it. Also the
 * same question of all three.
 */
function describeFluidField(fieldName: string) {
  test.describe("a fluid field", () => {
    test.beforeEach(async ({ page }) => {
      await openMenu(page, fieldName);
    });

    test("wraps options, whose fixed height fluid sets through a stronger selector", async ({
      page,
    }) => {
      const option = page.getByRole("option").first();
      await expect(option).toHaveText(LONG_LABEL);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(await documentScrollsHorizontally(page)).toBe(false);

      // What proves the fluid row height was released is the row hugging its
      // wrapped content. A row taller than one line proves nothing, since it
      // sits at fluid's own 64px either way.
      const boxes = await option.evaluate((el) => {
        const inner = el.querySelector(".bx--list-box__menu-item__option");
        return {
          item: el.getBoundingClientRect().height,
          content: inner?.getBoundingClientRect().height ?? 0,
        };
      });
      expect(boxes.content).toBeGreaterThan(0);
      expect(Math.abs(boxes.item - boxes.content)).toBeLessThanOrEqual(SLACK);

      await expectMenuReadsContinuously(page);
    });
  });
}

test.describe("Dropdown option reflow", () => {
  describeListRenderedWhole("Dropdown short");

  test.describe("a list the component windows", () => {
    test.beforeEach(async ({ page }) => {
      await openMenu(page, "Dropdown windowed");
    });

    test("options wrap while the list is windowed", async ({ page }) => {
      const option = page.getByRole("option").first();

      await expect(option).toHaveText(`Item 1: ${LONG_LABEL}`);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });

    test("scrolling to the end reveals the last option in full", async ({
      page,
    }) => {
      await scrollToEnd(page);

      const boxes = await readOptionBoxes(page);
      expect(boxes).not.toBeNull();
      const last = boxes?.options.at(-1);

      expect(last?.text).toBe(`Item ${ITEM_COUNT}: ${LONG_LABEL}`);
      expect(last?.top).toBeGreaterThanOrEqual((boxes?.menu.top ?? 0) - SLACK);
      expect(last?.bottom).toBeLessThanOrEqual(
        (boxes?.menu.bottom ?? 0) + SLACK,
      );
    });

    test("the wrapped list reads continuously, with no gaps or overlaps", async ({
      page,
    }) => {
      await scrollToEnd(page);

      await expectMenuReadsContinuously(page);
    });
  });
  describePortaledMenu("Dropdown portaled");
  describeFluidField("Dropdown fluid");
});

test.describe("ComboBox option reflow", () => {
  // Long enough to straddle a line break at 320px, and contiguous, so the
  // highlight around it has to survive being split across two lines.
  const TYPED_MATCH = "Accessibility Officer for Regional Operations";

  // "Item 1", "Item 10".."Item 19", "Item 100".."Item 199": still above the
  // count at which the list is windowed, so a filtered list has to wrap and
  // place measured offsets at the same time.
  const FILTER_MANY = "Item 1";
  const FILTER_MANY_COUNT = 111;
  const FILTER_SOLE = "Item 250:";

  describeListRenderedWhole("ComboBox short");

  test.describe("a filtered list the component windows", () => {
    test("options wrap while a filtered list is still windowed", async ({
      page,
    }) => {
      const field = await openMenu(page, "ComboBox windowed");
      await filterBy(page, field, FILTER_MANY, FILTER_MANY_COUNT);

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(`Item 1: ${LONG_LABEL}`);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });

    test("scrolling a filtered list to the end reveals the last match in full", async ({
      page,
    }) => {
      const field = await openMenu(page, "ComboBox windowed");
      await filterBy(page, field, FILTER_MANY, FILTER_MANY_COUNT);
      await scrollToEnd(page);

      const boxes = await readOptionBoxes(page);
      expect(boxes).not.toBeNull();
      const last = boxes?.options.at(-1);

      expect(last?.text).toBe(`Item 199: ${LONG_LABEL}`);
      expect(last?.top).toBeGreaterThanOrEqual((boxes?.menu.top ?? 0) - SLACK);
      expect(last?.bottom).toBeLessThanOrEqual(
        (boxes?.menu.bottom ?? 0) + SLACK,
      );

      await expectMenuReadsContinuously(page);
    });

    test("a filter that leaves a single match wraps it and reads it in full", async ({
      page,
    }) => {
      const field = await openMenu(page, "ComboBox windowed");
      // Below the threshold there is no window at all, so this is the browser
      // laying one wrapped option out rather than the measured path placing it.
      await filterBy(page, field, FILTER_SOLE);

      const options = page.getByRole("option");
      await expect(options).toHaveCount(1);
      await expect(options.first()).toHaveText(`Item 250: ${LONG_LABEL}`);

      const clipping = await readOptionClipping(options.first());
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });
  });

  describePortaledMenu("ComboBox portaled");

  describeFluidField("ComboBox fluid");

  test.describe("a highlighted match", () => {
    test("stays highlighted across the line break it is split by", async ({
      page,
    }) => {
      const field = await openMenu(page, "ComboBox highlighted");
      await filterBy(page, field, TYPED_MATCH);

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(LONG_LABEL);
      expect(await documentScrollsHorizontally(page)).toBe(false);

      const mark = page.getByTestId("match");
      await expect(mark).toHaveCount(1);
      // The whole typed run is marked, not the part of it that fit on the
      // first line. That is the visual connection to what was typed, and it is
      // what a break inside the run must not cost.
      await expect(mark).toHaveText(TYPED_MATCH);

      // One inline element split into several line boxes: the highlight is one
      // style over all of them, so what is left to check is that it really did
      // break, that every piece of it is drawn, and that the reader's eye can
      // carry from one to the next.
      const fragments = await mark.evaluate((el) =>
        Array.from(el.getClientRects(), (rect) => ({
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        })),
      );

      expect(fragments.length).toBeGreaterThan(1);
      for (const fragment of fragments) {
        expect(fragment.width).toBeGreaterThan(0);
        expect(fragment.height).toBeGreaterThan(0);
      }
      // Consecutive line boxes, with no unhighlighted line stranded between
      // them, which is the break the match survives rather than a scattering.
      for (let i = 1; i < fragments.length; i++) {
        expect(fragments[i].top).toBeGreaterThan(fragments[i - 1].top);
        expect(fragments[i].top).toBeLessThan(
          fragments[i - 1].bottom + fragments[i - 1].height,
        );
      }

      // And it reads as a highlight at all, rather than as the text around it.
      const contrast = await option.evaluate((el) => {
        const marked = el.querySelector("mark");
        if (!marked) return null;
        return {
          mark: getComputedStyle(marked).backgroundColor,
          option: getComputedStyle(el).backgroundColor,
        };
      });
      expect(contrast).not.toBeNull();
      expect(contrast?.mark).not.toBe(contrast?.option);
    });
  });
});

test.describe("MultiSelect option reflow", () => {
  // "Item 1", "Item 10".."Item 19", "Item 100".."Item 199": still above the
  // count at which the list is windowed, so a filtered list has to wrap and
  // place measured offsets at the same time.
  const FILTER_MANY = "Item 1";
  const FILTER_MANY_COUNT = 111;

  describeListRenderedWhole("MultiSelect short");

  test.describe("an option's label", () => {
    // The shared block above measures the option wrapper, which on this
    // component stays inside its own box whether the label wraps or not: the
    // label is `width: 100%` with `overflow: hidden`, so the text it loses
    // never reaches the wrapper. These read the label itself.
    test("reads every line of its text inside the width it was given", async ({
      page,
    }) => {
      await openMenu(page, "MultiSelect short");

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(LONG_LABEL);

      await expectLabelReadsWhole(option);
    });

    test("wraps a portaled option's label too", async ({ page }) => {
      await openMenu(page, "MultiSelect portaled");

      await expectLabelReadsWhole(page.getByRole("option").first());
    });

    test("wraps a fluid option's label too", async ({ page }) => {
      await openMenu(page, "MultiSelect fluid");

      await expectLabelReadsWhole(page.getByRole("option").first());
    });
  });

  test.describe("an option's checkbox", () => {
    test("stays with the first line of a label that wrapped", async ({
      page,
    }) => {
      await openMenu(page, "MultiSelect short");

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(LONG_LABEL);

      const geometry = await option.evaluate((el) => {
        const label = el.querySelector(".bx--checkbox-label");
        if (!label) return null;
        const labelBox = label.getBoundingClientRect();
        // The checkbox is drawn as the label's ::before, positioned into the
        // label's own padding, so its box has to be read off the style rather
        // than off an element.
        const box = getComputedStyle(label, "::before");
        const top =
          labelBox.top +
          Number.parseFloat(box.top) +
          Number.parseFloat(box.marginTop || "0");
        const size = Number.parseFloat(box.height);
        // The label's text as the browser laid it out: one rect per line box.
        // Selected on the text span, not the label: the span is a block box, so
        // selecting the label's contents also returns the one rect covering all
        // of its lines, which is not a line box.
        const range = document.createRange();
        range.selectNodeContents(
          label.querySelector(".bx--checkbox-label-text") ?? label,
        );
        const lines = Array.from(range.getClientRects())
          .filter((rect) => rect.height > 0 && rect.width > 0)
          .sort((a, b) => a.top - b.top);
        const optionBox = el.getBoundingClientRect();
        return {
          checkbox: {
            top,
            bottom: top + size,
            left: labelBox.left + Number.parseFloat(box.left),
            right:
              labelBox.left +
              Number.parseFloat(box.left) +
              Number.parseFloat(box.width),
          },
          firstLine: lines[0]
            ? {
                top: lines[0].top,
                bottom: lines[0].bottom,
                left: lines[0].left,
              }
            : null,
          lineCount: lines.length,
          option: { top: optionBox.top, bottom: optionBox.bottom },
        };
      });

      expect(geometry).not.toBeNull();
      if (!geometry?.firstLine) return;
      // The premise: this label really did take more than one line.
      expect(geometry.lineCount).toBeGreaterThan(1);

      const checkboxCenter =
        (geometry.checkbox.top + geometry.checkbox.bottom) / 2;
      // Beside the first line, not floating above or below it.
      expect(checkboxCenter).toBeGreaterThanOrEqual(
        geometry.firstLine.top - SLACK,
      );
      expect(checkboxCenter).toBeLessThanOrEqual(
        geometry.firstLine.bottom + SLACK,
      );
      // And not drifted to the middle of the grown option, which is what a
      // vertically centred checkbox would do once the label wraps. The
      // option's own centre lies below the first line, so a checkbox inside
      // that line is demonstrably not centred on the option.
      const optionCenter = (geometry.option.top + geometry.option.bottom) / 2;
      expect(optionCenter).toBeGreaterThan(geometry.firstLine.bottom);
      // Before the text it belongs to, and close enough to read as its box.
      expect(geometry.checkbox.right).toBeLessThanOrEqual(
        geometry.firstLine.left + SLACK,
      );
      expect(geometry.firstLine.left - geometry.checkbox.right).toBeLessThan(
        32,
      );
    });

    test("is toggled by a click on the part of the option wrapping added", async ({
      page,
    }) => {
      await openMenu(page, "MultiSelect short");

      const option = page.getByRole("option").first();
      await expect(option).toHaveAttribute("aria-selected", "false");

      // The last line of the label, well below the single line the option used
      // to be: the grown option is one control only if this toggles it.
      const box = await option.boundingBox();
      expect(box?.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      await page.mouse.click(
        (box?.x ?? 0) + (box?.width ?? 0) / 2,
        (box?.y ?? 0) + (box?.height ?? 0) - 4,
      );

      await expect(option).toHaveAttribute("aria-selected", "true");
    });
  });

  test.describe("a filtered list the component windows", () => {
    test("options wrap while a filtered list is still windowed", async ({
      page,
    }) => {
      const field = await openMenu(page, "MultiSelect windowed");
      await filterBy(page, field, FILTER_MANY, FILTER_MANY_COUNT);

      const option = page.getByRole("option").first();
      await expect(option).toHaveText(`Item 1: ${LONG_LABEL}`);

      const clipping = await readOptionClipping(option);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);
    });

    test("scrolling a filtered list to the end reveals the last match in full", async ({
      page,
    }) => {
      const field = await openMenu(page, "MultiSelect windowed");
      await filterBy(page, field, FILTER_MANY, FILTER_MANY_COUNT);
      await scrollToEnd(page);

      const boxes = await readOptionBoxes(page);
      expect(boxes).not.toBeNull();
      const last = boxes?.options.at(-1);

      expect(last?.text).toBe(`Item 199: ${LONG_LABEL}`);
      expect(last?.top).toBeGreaterThanOrEqual((boxes?.menu.top ?? 0) - SLACK);
      expect(last?.bottom).toBeLessThanOrEqual(
        (boxes?.menu.bottom ?? 0) + SLACK,
      );

      await expectMenuReadsContinuously(page);
    });
  });

  describePortaledMenu("MultiSelect portaled");

  describeFluidField("MultiSelect fluid");

  test.describe("options that sort to the top when selected", () => {
    test("stay wrapped through the rearrangement checking one causes", async ({
      page,
    }) => {
      await openMenu(page, "MultiSelect sorted");

      // The last option, so selecting it moves it past both of the others.
      const brief = page.getByRole("option").nth(2);
      await expect(brief).toHaveText("Brief");
      await brief.click();

      // It sorted to the top, and the long label that was above it moved down.
      const options = page.getByRole("option");
      await expect(options.first()).toHaveText("Brief");
      await expect(options.nth(1)).toHaveText(LONG_LABEL);

      const moved = options.nth(1);
      const clipping = await readOptionClipping(moved);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      await expectLabelReadsWhole(moved);
      expect(await documentScrollsHorizontally(page)).toBe(false);

      // And the options still abut one another at their new heights, rather
      // than being placed against the heights they had before they moved.
      await expectMenuReadsContinuously(page);
    });
  });

  test.describe("a select-all row", () => {
    test("wraps and keeps the separator that sets it apart from the options", async ({
      page,
    }) => {
      await openMenu(page, "MultiSelect select all");

      const selectAll = page.getByRole("option").first();
      await expect(selectAll).toHaveText(
        "Select every one of the roles listed below without exception",
      );

      const clipping = await readOptionClipping(selectAll);
      expect(clipping.horizontal).toBe(false);
      expect(clipping.vertical).toBe(false);
      expect(clipping.height).toBeGreaterThan(SINGLE_LINE_HEIGHT);
      expect(await documentScrollsHorizontally(page)).toBe(false);

      // The separator and the padding either side of it are declared on the
      // row's inner element by a selector wrapping does not touch, so what is
      // checked is that they are still drawn under a row that grew.
      const treatment = await selectAll.evaluate((el) => {
        const inner = el.querySelector(".bx--list-box__menu-item__option");
        if (!inner) return null;
        const style = getComputedStyle(inner);
        return {
          borderBottomWidth: style.borderBottomWidth,
          borderBottomStyle: style.borderBottomStyle,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight,
        };
      });
      expect(treatment?.borderBottomStyle).toBe("solid");
      expect(Number.parseFloat(treatment?.borderBottomWidth ?? "0")).toBe(1);
      expect(Number.parseFloat(treatment?.paddingLeft ?? "0")).toBeGreaterThan(
        0,
      );
      expect(Number.parseFloat(treatment?.paddingRight ?? "0")).toBeGreaterThan(
        0,
      );

      // The row below it draws no border of its own, so the two do not read as
      // a double rule once both have grown.
      const next = page.getByRole("option").nth(1);
      const nextBorder = await next.evaluate((el) => {
        const inner = el.querySelector(".bx--list-box__menu-item__option");
        return inner ? getComputedStyle(inner).borderTopStyle : null;
      });
      expect(nextBorder).toBe("none");

      await expectMenuReadsContinuously(page);
    });
  });
});
