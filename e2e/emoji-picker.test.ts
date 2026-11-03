import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";
import { expectSingleRing } from "./helpers/layout";

// The field comes first in the DOM, ahead of the search field inside its popover.
const field = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("combobox").first();
const button = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("button").first();
const panel = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("dialog");
const search = (page: Page, testId: string) =>
  panel(page, testId).getByRole("combobox");
const options = (page: Page, testId: string) =>
  page.getByTestId(testId).getByRole("listbox").getByRole("option");
const tones = (page: Page, testId: string) =>
  panel(page, testId).getByRole("radiogroup", { name: "Skin tone" });

/** Type a query and wait for the cursor to reach its first result. */
const find = async (page: Page, testId: string, query: string) => {
  await search(page, testId).fill(query);
  await expect(search(page, testId)).toHaveAttribute(
    "aria-activedescendant",
    /-option-0$/,
  );
};

/** How many times a picker has asked for the emoji data. */
const loads = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __emojiLoads?: number }).__emojiLoads ?? 0,
  );

test.describe("EmojiPicker", () => {
  test("shows the chosen emoji and its name, and renders no grid until it opens", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await expect(field(page, "field")).toHaveAccessibleName(/Status emoji/);
    await expect(field(page, "field")).toContainText("grinning face");
    await expect(field(page, "field")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(page.getByTestId("field").getByRole("dialog")).toHaveCount(0);
  });

  test("a button loads the emoji data when it first opens, not before", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await expect(button(page, "reactions")).toBeVisible();
    // The fields with a chosen emoji ask for the data at once: they show it.
    const before = await loads(page);
    await button(page, "reactions").click();
    await expect(options(page, "reactions").first()).toBeVisible();
    expect(await loads(page)).toBeGreaterThan(before);
    // The full set, windowed: a screenful of cells, not 1,900.
    expect(await options(page, "reactions").count()).toBeLessThan(150);
  });

  test("opens from the keyboard, searches, chooses with Enter and returns focus", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").focus();
    await page.keyboard.press("ArrowDown");
    await expect(search(page, "field")).toBeFocused();
    await page.keyboard.type("party popper");
    await expect(options(page, "field").first()).toHaveAccessibleName(
      "party popper",
    );
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(field(page, "field")).toBeFocused();
    await expect(field(page, "field")).toContainText("party popper");
    await expect(
      page.getByTestId("field").locator("input[name=status-emoji]"),
    ).toHaveValue("\u{1F389}");
    await expect(panel(page, "field")).toBeHidden();
    await expect(page.getByTestId("value")).toHaveText("party_popper");
  });

  test("searches by a CLDR keyword and by a shortcode", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    await search(page, "field").fill("lol");
    await expect(
      options(page, "field").filter({ hasText: "\u{1F602}" }),
    ).toHaveCount(1);
    await search(page, "field").fill("thumbs_up");
    await expect(options(page, "field").first()).toHaveAccessibleName(
      "thumbs up",
    );
  });

  test("names every emoji by its CLDR name and hides the glyph", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    const names = await options(page, "field").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("aria-label")),
    );
    expect(names).toContain("grinning face");
    expect(names.every((name) => name && name.length > 1)).toBe(true);
    expect(
      await options(page, "field")
        .first()
        .evaluate((node) =>
          node
            .querySelector(".bx--emoji-picker__glyph")
            ?.getAttribute("aria-hidden"),
        ),
    ).toBe("true");
  });

  test("Escape clears the search, then closes and returns focus", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    await page.keyboard.type("heart");
    await page.keyboard.press("Escape");
    await expect(search(page, "field")).toHaveValue("");
    await expect(panel(page, "field")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel(page, "field")).toBeHidden();
    await expect(field(page, "field")).toBeFocused();
  });

  test("closes on an outside click and when focus leaves", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    await expect(panel(page, "field")).toBeVisible();
    // The outside-click listener arrives a frame after the popover opens.
    await expect(async () => {
      await page.mouse.click(1100, 40);
      await expect(panel(page, "field")).toBeHidden({ timeout: 250 });
    }).toPass();
  });

  test.describe("skin tones", () => {
    test("one choice recolors every emoji with variants, and the choice is a radio group", async ({
      page,
    }) => {
      await page.goto("/emoji-picker.html");
      await field(page, "field").click();
      const group = tones(page, "field");
      await expect(group.getByRole("radio")).toHaveCount(6);
      await expect(
        group.getByRole("radio", { name: "Default skin tone", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await group
        .getByRole("radio", { name: "Dark skin tone", exact: true })
        .click();
      await expect(
        group.getByRole("radio", { name: "Dark skin tone", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(page.getByTestId("skin-tone")).toHaveText("5");
      await search(page, "field").fill("thumbs up");
      await expect(options(page, "field").first()).toContainText(
        "\u{1F44D}\u{1F3FF}",
      );
      // An emoji with no variants has no modifier.
      await search(page, "field").fill("grinning face");
      await expect(options(page, "field").first()).toHaveText("\u{1F600}");
      // The chosen emoji, and the form value, take the tone.
      await find(page, "field", "waving hand");
      await page.keyboard.press("Enter");
      await expect(
        page.getByTestId("field").locator("input[name=status-emoji]"),
      ).toHaveValue("\u{1F44B}\u{1F3FF}");
      await expect(page.getByTestId("changes")).toContainText(
        "waving_hand:\u{1F44B}\u{1F3FF}",
      );
    });

    test("is one tab stop, and the arrows move and choose", async ({
      page,
    }) => {
      await page.goto("/emoji-picker.html");
      await field(page, "field").click();
      const group = tones(page, "field");
      const stops = await group
        .getByRole("radio")
        .evaluateAll(
          (nodes) => nodes.filter((node) => node.tabIndex === 0).length,
        );
      expect(stops).toBe(1);
      await group
        .getByRole("radio", { name: "Default skin tone", exact: true })
        .focus();
      await page.keyboard.press("ArrowRight");
      await expect(
        group.getByRole("radio", { name: "Light skin tone", exact: true }),
      ).toBeFocused();
      await expect(page.getByTestId("skin-tone")).toHaveText("1");
      await page.keyboard.press("End");
      await expect(page.getByTestId("skin-tone")).toHaveText("5");
    });
  });

  test("lists the emoji just chosen under Frequently used, most used first", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    const choose = async (query: string) => {
      await field(page, "field").click();
      await find(page, "field", query);
      await page.keyboard.press("Enter");
    };
    await choose("tada");
    await choose("tada");
    await choose("rocket");
    await expect(page.getByTestId("usage")).toHaveText(
      /"party_popper":2,"rocket":1|"rocket":1,"party_popper":2/,
    );
    await field(page, "field").click();
    const frequent = panel(page, "field").getByRole("group", {
      name: "Frequently used",
    });
    await expect(frequent.getByRole("option").first()).toHaveAccessibleName(
      "party popper",
    );
    await expect(frequent.getByRole("option").nth(1)).toHaveAccessibleName(
      "rocket",
    );
  });

  test("persists the tone, and the recent and frequent emoji, across a reload", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await field(page, "persist").click();
    await tones(page, "persist")
      .getByRole("radio", { name: "Medium skin tone", exact: true })
      .click();
    await find(page, "persist", "clapping");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("prefs")).toContainText('"skinTone":3');
    await expect(page.getByTestId("prefs")).toContainText("clapping_hands");

    await page.reload();
    await field(page, "persist").click();
    await expect(
      tones(page, "persist").getByRole("radio", {
        name: "Medium skin tone",
        exact: true,
      }),
    ).toHaveAttribute("aria-checked", "true");
    const frequent = panel(page, "persist").getByRole("group", {
      name: "Frequently used",
    });
    await expect(frequent.getByRole("option").first()).toContainText(
      "\u{1F44F}\u{1F3FD}",
    );
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("a reactions picker", () => {
    test("toggles several emoji from an icon button and stays open", async ({
      page,
    }) => {
      await page.goto("/emoji-picker.html");
      const trigger = button(page, "reactions");
      await expect(trigger).toHaveAccessibleName("Add reaction");
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
      await trigger.click();
      await expect(search(page, "reactions")).toBeFocused();
      await expect(
        options(page, "reactions").filter({ hasText: "\u{1F44D}" }).first(),
      ).toHaveAttribute("aria-selected", "true");
      await find(page, "reactions", "fire");
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("reactions-value")).toHaveText(
        "thumbs_up,fire",
      );
      await page.keyboard.press("Enter");
      await expect(page.getByTestId("reactions-value")).toHaveText("thumbs_up");
      await expect(page.getByTestId("reaction-log")).toHaveText(
        "fire:on,fire:off",
      );
      await expect(panel(page, "reactions")).toBeVisible();
      // The first Escape clears the search, the second closes.
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await expect(panel(page, "reactions")).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test("marks the chosen emoji with a check mark, not only a fill", async ({
      page,
    }) => {
      await page.goto("/emoji-picker.html");
      await button(page, "reactions").click();
      await expect(
        options(page, "reactions")
          .filter({ hasText: "\u{1F44D}" })
          .first()
          .locator(".bx--picker-grid__check svg"),
      ).toBeVisible();
    });
  });

  test("inserts the chosen emoji at the caret of a text area", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    const text = page.getByTestId("insert").getByRole("textbox");
    await text.click();
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await button(page, "insert").click();
    await find(page, "insert", "rocket");
    await page.keyboard.press("Enter");
    await expect(panel(page, "insert")).toBeHidden();
    await expect(page.getByTestId("message")).toHaveText("Sh\u{1F680}ip it ");
    // A button reports a choice and holds none.
    await button(page, "insert").click();
    await expect(
      options(page, "insert").filter({ hasText: "\u{1F680}" }).first(),
    ).toHaveAttribute("aria-selected", "false");
  });

  test("the inline variant is the grid with no trigger", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    const inline = page.getByTestId("inline");
    await expect(inline.getByRole("listbox")).toBeVisible();
    await expect(inline.getByRole("dialog")).toHaveCount(0);
    await inline.getByRole("option", { name: "grinning face" }).first().click();
    await expect(
      inline
        .getByRole("option", { name: "grinning face", selected: true })
        .first(),
    ).toBeVisible();
  });

  test("a disabled field does not open", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    await expect(field(page, "disabled")).toBeDisabled();
  });

  test("tests the browser's emoji font on the first open, and keeps what it draws", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "detect").click();
    // The oldest emoji draw everywhere.
    await search(page, "detect").fill("grinning face");
    await expect(options(page, "detect").first()).toHaveAccessibleName(
      "grinning face",
    );
    // A font that draws a version draws the ones before it, so nothing the
    // picker keeps is a box. The cells hold glyphs, not blank cells.
    const empty = await options(page, "detect").evaluateAll(
      (nodes) =>
        nodes.filter(
          (node) =>
            !node.querySelector(".bx--emoji-picker__glyph")?.textContent,
        ).length,
    );
    expect(empty).toBe(0);
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    await expect(field(page, "field")).toBeVisible();
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await field(page, "field").click();
    await expect(options(page, "field").first()).toBeVisible();
    const open = await new AxeBuilder({ page }).include("#app").analyze();
    expect(open.violations).toEqual([]);

    await page.keyboard.type("zzzzzzzz");
    await expect(
      panel(page, "field").getByText("No emoji match your search"),
    ).toBeVisible();
    const empty = await new AxeBuilder({ page }).include("#app").analyze();
    expect(empty.violations).toEqual([]);
  });

  test("has no detectable accessibility violations for the button and the invalid field", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await button(page, "reactions").click();
    await expect(options(page, "reactions").first()).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("EmojiPicker in a Modal", () => {
  test("opens above the modal, Escape closes the popover first, then the modal", async ({
    page,
  }) => {
    await page.goto("/emoji-picker-modal.html");
    const modal = page.getByTestId("modal");
    await expect(modal).toBeVisible();
    const trigger = modal.getByRole("button", { name: "Add reaction" });
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "Add reaction" }).getByRole("combobox"),
    ).toBeFocused();
    const portalled = await page
      .locator(".bx--popover--portal [role=dialog]")
      .count();
    expect(portalled).toBe(1);
    const topmost = await page
      .getByRole("option", { name: "grinning face" })
      .first()
      .evaluate((node) => {
        const box = node.getBoundingClientRect();
        const hit = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return !!hit && node.contains(hit);
      });
    expect(topmost).toBe(true);

    await page.keyboard.press("Escape");
    await expect(
      page.locator(".bx--popover--portal [role=dialog]"),
    ).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByTestId("modal-open")).toHaveText("true");

    // Escape first hides the button's tooltip, which stays under the focus.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("modal-open")).toHaveText("false");
  });

  test("reacts without closing the modal, and has no accessibility violations", async ({
    page,
  }) => {
    await page.goto("/emoji-picker-modal.html");
    const trigger = page
      .getByTestId("modal")
      .getByRole("button", { name: "Add reaction" });
    await trigger.click();
    // The popover is in a portal, outside the modal's box.
    const portalSearch = page
      .getByRole("dialog", { name: "Add reaction" })
      .getByRole("combobox");
    await expect(portalSearch).toBeFocused();
    await portalSearch.fill("tada");
    await expect(portalSearch).toHaveAttribute(
      "aria-activedescendant",
      /-option-0$/,
    );
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("values")).toHaveText("party_popper");
    await expect(page.getByTestId("modal-open")).toHaveText("true");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("EmojiPicker right to left", () => {
  test("mirrors the grid, swaps the arrow keys, and mirrors the skin tones", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await field(page, "field").click();
    const cells = options(page, "field");
    const [first, second] = await Promise.all([
      cells.nth(1).boundingBox(),
      cells.nth(2).boundingBox(),
    ]);
    // The first emoji sits at the right edge, and the second to its left.
    expect(first && second && first.x > second.x).toBe(true);
    const label = async () => {
      const id = await search(page, "field").getAttribute(
        "aria-activedescendant",
      );
      return page.locator(`[id="${id}"]`).getAttribute("aria-label");
    };
    // The cursor starts on the chosen emoji. Left goes forward in RTL.
    const start = await label();
    await page.keyboard.press("ArrowLeft");
    expect(await label()).not.toBe(start);
    await page.keyboard.press("ArrowRight");
    expect(await label()).toBe(start);

    const group = tones(page, "field");
    const [lightest, darkest] = await Promise.all([
      group.getByRole("radio").first().boundingBox(),
      group.getByRole("radio").last().boundingBox(),
    ]);
    expect(lightest && darkest && lightest.x > darkest.x).toBe(true);
    await group
      .getByRole("radio", { name: "Default skin tone", exact: true })
      .focus();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByTestId("skin-tone")).toHaveText("1");
  });

  test("the popover aligns to the inline start", async ({ page }) => {
    await page.goto("/emoji-picker.html");
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await field(page, "field").click();
    const [trigger, panelBox] = await Promise.all([
      field(page, "field").boundingBox(),
      panel(page, "field").boundingBox(),
    ]);
    expect(
      trigger &&
        panelBox &&
        Math.abs(trigger.x + trigger.width - (panelBox.x + panelBox.width)) < 2,
    ).toBe(true);
  });
});

test.describe("EmojiPicker themes and media", () => {
  test("has no accessibility violations on Gray 100, with the popover open", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await page.evaluate(() =>
      document.documentElement.classList.add("bx--g100"),
    );
    await field(page, "field").click();
    await options(page, "field").first().hover();
    await page.keyboard.press("ArrowDown");
    await expect(options(page, "field").first()).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
    await page.evaluate(() =>
      document.documentElement.classList.remove("bx--g100"),
    );
  });

  test("keeps the chosen and the highlighted cells, and the chosen tone, apart without color", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    const list = panel(page, "field").getByRole("listbox");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    const probe = (selector: string) =>
      list
        .locator(selector)
        .first()
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            outline: `${style.outlineStyle} ${style.outlineWidth}`,
            check: !!node.querySelector(".bx--picker-grid__check svg"),
          };
        });
    const chosen = await probe(".bx--picker-grid__cell--selected");
    const cursor = await probe(
      ".bx--picker-grid__cell--highlighted:not(.bx--picker-grid__cell--selected)",
    );
    // Chosen: a check mark and no ring. The cursor: a 2px ring and no check.
    expect(chosen.check).toBe(true);
    expect(cursor.check).toBe(false);
    expect(cursor.outline).toBe("solid 2px");
    await expectSingleRing(list);

    // The glyph keeps its own colors: forced colors leave an emoji font alone.
    const glyphColor = await list
      .locator(".bx--emoji-picker__glyph")
      .first()
      .evaluate((node) => getComputedStyle(node).forcedColorAdjust);
    expect(glyphColor).not.toBe("none");

    // The chosen tone has a border under it, which forced colors keep.
    const selectedTone = await tones(page, "field")
      .getByRole("radio", { checked: true })
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          width: style.borderBlockEndWidth,
          style: style.borderBlockEndStyle,
        };
      });
    expect(selectedTone).toEqual({ width: "2px", style: "solid" });
    await page.emulateMedia({ forcedColors: "none" });
  });

  test("starts no animation when the user prefers reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    await expect(options(page, "field").first()).toBeVisible();
    await page.keyboard.press("PageDown");
    const animations = await page.evaluate(
      () =>
        document.getAnimations().filter((animation) => {
          const target = (animation.effect as KeyframeEffect | null)?.target;
          return target?.closest(
            ".bx--picker-grid, .bx--popover, .bx--emoji-picker__tones",
          );
        }).length,
    );
    expect(animations).toBe(0);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("exposes each emoji by name in the accessibility tree", async ({
    page,
  }) => {
    await page.goto("/emoji-picker.html");
    await field(page, "field").click();
    const tree = await panel(page, "field").ariaSnapshot();
    expect(tree).toContain('combobox "Search emoji"');
    expect(tree).toContain('toolbar "Categories"');
    expect(tree).toContain('listbox "Emoji"');
    expect(tree).toContain('group "Smileys & Emotion"');
    expect(tree).toContain('option "grinning face"');
    expect(tree).toContain('radiogroup "Skin tone"');
    expect(tree).toContain('radio "Dark skin tone"');
    // The glyphs add nothing: no unnamed images between the names.
    expect(tree).not.toMatch(/\bimg\b/);
  });
});
