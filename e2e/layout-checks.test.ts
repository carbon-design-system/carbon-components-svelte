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
  });

  await test.step("expectOnePitch", async () => {
    expect(await expectOnePitch(within("pitch-good", "li"))).toBe(2);
    await expect(expectOnePitch(within("pitch-bad", "li"))).rejects.toThrow(
      /pitch-off.*: next row 40px below, the first pitch is 32px/,
    );
    await expect(
      expectOnePitch(within("pitch-off-grid", "li")),
    ).rejects.toThrow(/pitch-off-grid.*pitch 31px is not a multiple of 4px/);
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

  expect(await expectSingleRing(page.getByTestId("ring-good"))).toBe(4);
  await expect(expectSingleRing(page.getByTestId("ring-bad"))).rejects.toThrow(
    /3 rings, at most 1 allowed\n.*ring-bad.*span.cell-ring.outlined:nth-of-type\(1\): outline 1px/,
  );
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
