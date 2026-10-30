import { expect, test } from "./helpers/host";
import {
  expectAligned,
  expectNoNestedBorders,
  expectNoPageOverflow,
  expectOnePitch,
  expectSingleRing,
  expectTextFits,
} from "./helpers/layout";

// Each helper passes on its good case and throws on its bad case, naming
// the offending element. A helper that stops measuring fails the good case
// too, since each throws when it finds nothing to check.

test("layout helpers pass good cases and name the element in bad ones", async ({
  page,
}) => {
  await page.goto("/layout-checks.html");
  const within = (id: string, selector: string) =>
    page.getByTestId(id).locator(selector);

  await test.step("expectAligned", async () => {
    expect(
      await expectAligned(within("aligned-top-good", ".box"), { edge: "top" }),
    ).toBe(3);
    await expect(
      expectAligned(within("aligned-top-bad", ".box"), { edge: "top" }),
    ).rejects.toThrow(/aligned-top-off.*top at .*, 3px from/);

    const baseline = (id: string) => [within(id, "input"), within(id, "span")];
    expect(
      await expectAligned(baseline("aligned-baseline-good"), {
        edge: "baseline",
      }),
    ).toBe(3);
    await expect(
      expectAligned(baseline("aligned-baseline-bad"), { edge: "baseline" }),
    ).rejects.toThrow(/aligned-baseline-off.*baseline at/);

    // Under `dir="rtl"` the inline start is the right edge.
    expect(
      await expectAligned(within("aligned-start-good", ".bar"), {
        edge: "inline-start",
      }),
    ).toBe(2);
    await expect(
      expectAligned(within("aligned-start-bad", ".bar"), {
        edge: "inline-start",
      }),
    ).rejects.toThrow(/aligned-start-off.*inline-start at .*, -2px from/);

    // Inline edges of an element with its own text measure the text, so
    // a padded heading and an indented one line up. Their boxes do not.
    const headings = within("aligned-ink-good", "h3");
    expect(await expectAligned(headings, { edge: "inline-start" })).toBe(2);
    await expect(
      expectAligned(headings, { edge: "inline-start", ink: false }),
    ).rejects.toThrow(/h3\.indented.*inline-start at .*, 16px from/);
    // `ink: true` measures an icon by its svg box.
    expect(
      await expectAligned([headings, within("aligned-ink-good", ".ink-icon")], {
        edge: "inline-start",
        ink: true,
      }),
    ).toBe(3);
    await expect(
      expectAligned(within("aligned-ink-bad", "h3"), { edge: "inline-start" }),
    ).rejects.toThrow(/aligned-ink-off.*inline-start at .*, 2px from/);
  });

  await test.step("expectOnePitch", async () => {
    expect(await expectOnePitch(within("pitch-good", "li"))).toBe(2);
    await expect(expectOnePitch(within("pitch-bad", "li"))).rejects.toThrow(
      /pitch-off.*: next row 40px below, the first pitch is 32px/,
    );
    await expect(
      expectOnePitch(within("pitch-off-grid", "li")),
    ).rejects.toThrow(/pitch-off-grid.*pitch 31px is not a multiple of 4px/);

    // The frozen header, the spacer and the selection overlay are left
    // out; `skip` leaves out the group row. Rows 4 to 6 remain.
    const grid = within("pitch-grid", ".vrow");
    expect(await expectOnePitch(grid, { skip: ".group" })).toBe(2);
    await expect(expectOnePitch(grid)).rejects.toThrow(
      /pitch-grid.*vrow:nth-of-type\(4\): next row 32px below, the first pitch is 48px/,
    );
    await expect(
      expectOnePitch(within("pitch-grid-bad", ".vrow")),
    ).rejects.toThrow(
      /pitch-grid-off.*: next row 40px below, the first pitch is 32px/,
    );
  });

  await test.step("expectTextFits", async () => {
    expect(await expectTextFits(page.getByTestId("fits-good"))).toBe(2);
    await expect(
      expectTextFits(page.getByTestId("fits-overflow")),
    ).rejects.toThrow(/fits-spill.*: text overflows its box by \d/);
    await expect(
      expectTextFits(page.getByTestId("fits-no-title")),
    ).rejects.toThrow(/fits-untitled.*: truncated .* with no title/);
    await expect(
      expectTextFits(page.getByTestId("fits-cut-number")),
    ).rejects.toThrow(/fits-cut.*: cuts a number: shows "\d+", hides "\d+"/);

    // A `title` set on hover and a tooltip anchored from a portal both
    // count, once the pointer is over the text. Each must hold the full
    // text.
    expect(await expectTextFits(page.getByTestId("fits-hover-good"))).toBe(2);
    await expect(
      expectTextFits(page.getByTestId("fits-hover-title-bad")),
    ).rejects.toThrow(/fits-short-title.*: truncated .* with no title/);
    await expect(
      expectTextFits(page.getByTestId("fits-hover-tooltip-bad")),
    ).rejects.toThrow(/fits-wrong-tip.*: truncated .* with no title/);

    // Labels hidden on purpose are skipped, so only "Short" is checked.
    // A label partly in view is still cut.
    expect(await expectTextFits(page.getByTestId("fits-hidden-good"))).toBe(1);
    await expect(
      expectTextFits(page.getByTestId("fits-hidden-bad")),
    ).rejects.toThrow(/fits-partly.*: text is cut by .*clip-box by \d/);
  });

  await test.step("expectNoNestedBorders", async () => {
    expect(await expectNoNestedBorders(page.getByTestId("borders-good"))).toBe(
      2,
    );
    await expect(
      expectNoNestedBorders(page.getByTestId("borders-bad")),
    ).rejects.toThrow(
      /borders-inner.*: bordered box inside bordered .*borders-bad/,
    );

    // Outlines and box-shadow rings are edges too. An elevation shadow, a
    // one-sided inset line, a transparent outline and the focused
    // element's focus ring are not.
    await page.getByTestId("rings-focus").focus();
    expect(await expectNoNestedBorders(page.getByTestId("rings-good"))).toBe(2);
    const bad = expectNoNestedBorders(page.getByTestId("rings-bad"));
    await expect(bad).rejects.toThrow(
      /rings-outline.*: 2px outline inside bordered box .*rings-bad/,
    );
    await expect(bad).rejects.toThrow(
      /rings-inset.*: 1px inset box-shadow ring inside bordered box/,
    );
    await expect(bad).rejects.toThrow(
      /rings-spread.*: 1px box-shadow ring inside bordered box/,
    );

    // A focused listbox keeps focus and rings the option its
    // `aria-activedescendant` names, or its `aria-selected` option. That
    // ring is the focus ring. A ring on another option, or on the named
    // option of a listbox without focus, still counts.
    const active = page.getByTestId("rings-active");
    await page.getByTestId("rings-active-listbox").focus();
    expect(await expectNoNestedBorders(active)).toBe(1);
    await page.getByTestId("rings-selected-listbox").focus();
    expect(
      await expectNoNestedBorders(page.getByTestId("rings-selected")),
    ).toBe(1);
    await expect(expectNoNestedBorders(active)).rejects.toThrow(
      /#rings-active-2: 2px outline inside bordered box .*rings-active/,
    );
    await page.getByTestId("rings-active-bad-listbox").focus();
    await expect(
      expectNoNestedBorders(page.getByTestId("rings-active-bad")),
    ).rejects.toThrow(/#rings-other-2: 2px outline inside bordered box/);
  });

  await test.step("a helper with nothing to measure fails", async () => {
    await expect(
      expectAligned(page.locator(".missing"), { edge: "top" }),
    ).rejects.toThrow(/found 0 .* needs 2/);
    await expect(
      expectTextFits(page.getByTestId("aligned-top-good")),
    ).rejects.toThrow(/found 0 text elements/);
  });
});

test("expectNoPageOverflow names what widens the page", async ({ page }) => {
  await page.goto("/layout-checks.html");
  expect(await expectNoPageOverflow(page)).toBeGreaterThan(0);

  await page.goto("/layout-checks.html?wide");
  await expect(page.getByTestId("overflow-wide")).toBeAttached();
  await expect(expectNoPageOverflow(page)).rejects.toThrow(
    /page scrolls sideways: scrollWidth \d+px, clientWidth \d+px\n.*overflow-wide.*: spans 0px to \d/,
  );
});

test("expectSingleRing allows one ring under forced colors", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "WebKit does not force colors");
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/layout-checks.html");

  // 1px boxes are resting edges; a 2px outline on every cell is not.
  expect(await expectSingleRing(page.getByTestId("ring-good"))).toBe(4);
  await expect(expectSingleRing(page.getByTestId("ring-bad"))).rejects.toThrow(
    /3 rings, at most 1 allowed\n.*ring-bad.*span.cell-ring.outlined:nth-of-type\(1\): outline 2px/,
  );

  // Each icon Button's tooltip is hidden with `clip`. The focused one
  // shows its tooltip, whose 1px box is a resting edge.
  const toolbar = page.getByTestId("ring-toolbar");
  expect(await expectSingleRing(toolbar)).toBeGreaterThan(6);
  await toolbar.getByRole("button", { name: "Copy" }).focus();
  expect(await expectSingleRing(toolbar)).toBeGreaterThan(6);

  // A field's resting box is structural; its focus ring counts. A ring a
  // child component draws counts too, unless `skip` leaves it out.
  const children = page.getByTestId("ring-children");
  expect(await expectSingleRing(children)).toBeGreaterThan(4);
  await children.getByRole("textbox", { name: "Name" }).focus();
  await expect(expectSingleRing(children)).rejects.toThrow(
    /2 rings, at most 1 allowed\n.*span.cell-ring.selected: border .*\n.*input\.bx--text-input: outline 4px/,
  );
  await children.getByRole("switch", { name: "Notify" }).focus();
  await expect(expectSingleRing(children)).rejects.toThrow(
    /2 rings, .*\n.*\n.*bx--toggle__switch.*: ::before outline 2px/,
  );
  expect(
    await expectSingleRing(children, { skip: ".bx--toggle-input__label" }),
  ).toBeGreaterThan(4);

  // An element and its `::before` draw one ring. One selection in two
  // panes is one ring in each pane.
  const panes = page.getByTestId("ring-panes");
  await expect(expectSingleRing(panes)).rejects.toThrow(
    /2 rings, at most 1 allowed\n.*li\.item\.picked.*: outline 2px .*, ::before border .*\n.*div\.item\.picked/,
  );
  expect(await expectSingleRing(panes.locator(".pane"))).toBe(6);
  await expect(
    expectSingleRing(page.getByTestId("ring-panes-bad").locator(".pane")),
  ).rejects.toThrow(/2 rings in .*ring-pane-off.*, at most 1 allowed/);
});

test("expectNoNestedBorders counts a transparent outline under forced colors", async ({
  page,
  browserName,
}) => {
  test.skip(browserName === "webkit", "WebKit does not force colors");
  await page.goto("/layout-checks.html");
  const forced = page.getByTestId("rings-forced");
  expect(await expectNoNestedBorders(forced)).toBe(1);

  // Forced colors repaint the transparent outline, as on a resting
  // OverflowMenu trigger.
  await page.emulateMedia({ forcedColors: "active" });
  await expect(expectNoNestedBorders(forced)).rejects.toThrow(
    /rings-transparent.*: 2px outline inside bordered box .*rings-forced/,
  );
});
