import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// `data-testid` is a rest prop, so it lands on the textarea.
const editor = (page: Page, id: string) => page.getByTestId(id);
const root = (page: Page, id: string) =>
  page.locator(".bx--code-editor").filter({ has: editor(page, id) });

/** Put the caret at `offset` (or select `[offset, end]`) in the textarea. */
async function select(field: Locator, offset: number, end = offset) {
  await field.focus();
  await field.evaluate(
    (el, [from, to]) => (el as HTMLTextAreaElement).setSelectionRange(from, to),
    [offset, end],
  );
}

test.describe("CodeEditor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/code-editor.html");
    await expect(page.getByTestId("code-editor-js")).toBeVisible();
  });

  test("paints the lines as tokens over a transparent textarea", async ({
    page,
  }) => {
    const layer = root(page, "code-editor-js");
    const lines = layer.locator(".bx--code-editor__line");
    await expect(
      lines.first().locator(".tok-module-keyword").first(),
    ).toHaveText("import");
    const color = await editor(page, "code-editor-js").evaluate(
      (el) => getComputedStyle(el).color,
    );
    expect(color).toBe("rgba(0, 0, 0, 0)");
    await expect(lines).toHaveCount(11);
  });

  test("typing recolors the line and keeps value bound", async ({ page }) => {
    const field = editor(page, "code-editor-js");
    await select(field, 0);
    await page.keyboard.type("const a = 1;\n");
    await expect(page.getByTestId("code-editor-js-value")).toContainText(
      "const a = 1;\nimport",
    );
    await expect(
      page.locator(".bx--code-editor__line .tok-definition-keyword").first(),
    ).toHaveText("const");
  });

  test("Tab indents, Shift+Tab outdents, in one undo step", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-comment");
    await select(field, 0, 0);
    await page.keyboard.press("Tab");
    await expect(field).toHaveValue("  /* one\ntwo */ const x = 1;");
    await select(field, 0, 100);
    await page.keyboard.press("Tab");
    await expect(field).toHaveValue("    /* one\n  two */ const x = 1;");
    await page.keyboard.press("Shift+Tab");
    await expect(field).toHaveValue("  /* one\ntwo */ const x = 1;");
    // Undo walks back through the edits to the start, each one native. WebKit
    // merges consecutive scripted insertions into one step, so count three
    // undos rather than asserting each state on the way.
    for (let step = 0; step < 3; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: keys are ordered
      await page.keyboard.press("ControlOrMeta+z");
    }
    await expect(field).toHaveValue("/* one\ntwo */ const x = 1;");
  });

  test("undo walks back through every kind of edit to the original", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-pairs");
    await field.focus();
    const keys = [
      "f",
      "(",
      "Enter",
      "Tab",
      "x",
      "Enter",
      "{",
      "Enter",
      "Shift+Tab",
      "Backspace",
      "}",
    ];
    for (const key of keys) {
      // biome-ignore lint/performance/noAwaitInLoops: keys are ordered
      await page.keyboard.press(key);
    }
    expect(await field.inputValue()).not.toBe("");
    for (let step = 0; step < keys.length * 2; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: keys are ordered
      await page.keyboard.press("ControlOrMeta+z");
    }
    await expect(field).toHaveValue("");
    await expect(
      root(page, "code-editor-pairs").locator(".bx--code-editor__line"),
    ).toHaveCount(1);
    for (let step = 0; step < keys.length * 2; step++) {
      // biome-ignore lint/performance/noAwaitInLoops: keys are ordered
      await page.keyboard.press("ControlOrMeta+Shift+z");
    }
    expect(await field.inputValue()).toContain("f(");
  });

  test("Tab inserts a tab character in tabs mode", async ({ page }) => {
    const field = editor(page, "code-editor-tabs");
    await field.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.type("x");
    await expect(field).toHaveValue("\tx");
  });

  test("Enter keeps the indent and opens a block between brackets", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-tabs");
    await field.focus();
    await page.keyboard.type("if (a) {");
    await page.keyboard.press("Enter");
    await page.keyboard.type("b();");
    await page.keyboard.press("Enter");
    await expect(field).toHaveValue("if (a) {\n\tb();\n\t");
  });

  test("Escape lets the next Tab leave, and typing takes it back", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-js");
    await select(field, 0);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("status").first()).toHaveText(
      "Tab now moves focus.",
    );
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("after-js")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(field).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(/^ {2}import/);
  });

  test("Tab moves focus when indentWithTab is off", async ({ page }) => {
    await editor(page, "code-editor-no-tab").focus();
    await page.keyboard.press("Tab");
    await expect(editor(page, "code-editor-no-tab")).not.toBeFocused();
    await expect(editor(page, "code-editor-no-tab")).toHaveValue("");
  });

  test("autoClose pairs, steps over, wraps and removes", async ({ page }) => {
    const field = editor(page, "code-editor-pairs");
    await field.focus();
    await page.keyboard.type("f(");
    await expect(field).toHaveValue("f()");
    await page.keyboard.type("[1]");
    await expect(field).toHaveValue("f([1])");
    await page.keyboard.type(")");
    await expect(field).toHaveValue("f([1])");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("(");
    await expect(field).toHaveValue("()");
    await page.keyboard.press("Backspace");
    await expect(field).toHaveValue("");
  });

  test("a read-only editor keeps Tab for focus and ignores typing", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-json");
    await field.focus();
    await page.keyboard.type("x");
    await expect(field).toHaveValue(/^\{\n {2}"name"/);
    await page.keyboard.press("Tab");
    await expect(field).not.toBeFocused();
  });

  test("submits its name and follows a form reset", async ({ page }) => {
    const field = editor(page, "code-editor-form");
    await field.focus();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("2");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("form-value")).toHaveText(
      "config=key%3A+value2",
    );
    await page.getByRole("button", { name: "Reset" }).click();
    // A value set from script is not the field's default, so reset clears it.
    await expect(field).toHaveValue("");
    await expect(page.getByTestId("form-bound")).toHaveText("");
    await expect(
      root(page, "code-editor-form").locator(".bx--code-editor__line"),
    ).toHaveCount(1);
  });

  test("the layer follows a programmatic value", async ({ page }) => {
    const layer = root(page, "code-editor-js");
    await editor(page, "code-editor-js").evaluate((el) => {
      const field = el as HTMLTextAreaElement;
      field.value = "let z;";
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(layer.locator(".bx--code-editor__line")).toHaveCount(1);
    await expect(layer.locator(".tok-definition-keyword")).toHaveText("let");
  });

  test("labels the textarea and describes how to leave", async ({ page }) => {
    const field = page.getByRole("textbox", { name: "Script", exact: true });
    await expect(field).toHaveAccessibleDescription(
      /Plain JavaScript Press Escape, then Tab, to move focus out\./,
    );
    await expect(
      page.getByRole("textbox", { name: "Invalid" }),
    ).toHaveAttribute("aria-invalid", "true");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test.describe("a 5,000-line editor", () => {
    test("paints only the lines near the view, and follows scrolling", async ({
      page,
    }) => {
      const layer = root(page, "code-editor-large");
      const lines = layer.locator(".bx--code-editor__line");
      expect(await lines.count()).toBeLessThan(120);
      await expect(lines.first()).toHaveText("const line1 = 1;");

      await layer
        .locator(".bx--code-editor__scroller")
        .evaluate((el) => el.scrollTo(0, el.scrollHeight));
      await expect(lines.last()).toHaveText("const line5000 = 5000;");
      expect(await lines.count()).toBeLessThan(120);
    });

    test("typing at the end repaints it and never scrolls the textarea itself", async ({
      page,
    }) => {
      const field = editor(page, "code-editor-large");
      const layer = root(page, "code-editor-large");
      await field.focus();
      await page.keyboard.press("ControlOrMeta+End");
      await page.keyboard.type("x");
      await expect(layer.locator(".bx--code-editor__line").last()).toHaveText(
        "const line5000 = 5000;x",
      );
      expect(
        await field.evaluate((el) => [el.scrollTop, el.scrollLeft]),
      ).toEqual([0, 0]);
    });

    test("keeps the line numbers aligned with the text", async ({ page }) => {
      const layer = root(page, "code-editor-large");
      await layer
        .locator(".bx--code-editor__scroller")
        .evaluate((el) => el.scrollTo(0, 20 * 2999));
      const highlight = layer.locator(".bx--code-editor__highlight");
      const first = layer.locator(".bx--code-editor__line").first();
      // The counter starts at the first painted line, so a number is the
      // line's place in the text, not among the nodes.
      await expect(first).not.toHaveText("const line1 = 1;");
      const reset = await highlight.evaluate((el) => el.style.counterReset);
      const painted = (await first.textContent())?.match(/line(\d+)/)?.[1];
      expect(reset).toBe(`ccs-code-line ${Number(painted) - 1}`);
    });
  });

  test("starts the textarea's text where the layer's starts", async ({
    page,
  }) => {
    const field = editor(page, "code-editor-js");
    const [text, layer] = await field.evaluate((el) => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const code = el.parentElement?.querySelector(".bx--code-editor__code");
      const range = document.createRange();
      range.selectNodeContents(code as Node);
      const line = (code as Element).parentElement?.getBoundingClientRect();
      return [
        [
          box.left + el.clientLeft + Number.parseFloat(style.paddingLeft),
          box.top + el.clientTop + Number.parseFloat(style.paddingTop),
        ],
        [range.getBoundingClientRect().left, line?.top ?? 0],
      ];
    });
    expect(Math.abs(text[0] - layer[0])).toBeLessThanOrEqual(0.5);
    expect(Math.abs(text[1] - layer[1])).toBeLessThanOrEqual(0.5);
  });

  test("shows composition text in the layer and leaves Escape to the IME", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives the IME through CDP");
    const cdp = await page.context().newCDPSession(page);
    const field = editor(page, "code-editor-comment");
    await select(field, 100, 100);

    await cdp.send("Input.imeSetComposition", {
      text: "にほん",
      selectionStart: 3,
      selectionEnd: 3,
    });
    const last = root(page, "code-editor-comment")
      .locator(".bx--code-editor__line")
      .last();
    await expect(last).toContainText("にほん");

    await page.keyboard.press("Escape");
    await expect(page.getByRole("status").nth(1)).toHaveText("");

    await cdp.send("Input.insertText", { text: "日本" });
    await expect(field).toHaveValue(/日本$/);
    await expect(last).toContainText("日本");
  });

  test("keeps code left to right under dir=rtl", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const layer = root(page, "code-editor-js");
    const scroller = layer.locator(".bx--code-editor__scroller");
    expect(
      await scroller.evaluate((el) => getComputedStyle(el).direction),
    ).toBe("ltr");
    const box = await scroller.boundingBox();
    const number = await layer
      .locator(".bx--code-editor__highlight")
      .boundingBox();
    const code = await layer
      .locator(".bx--code-editor__line .tok-module-keyword")
      .first()
      .boundingBox();
    expect(number?.x).toBeCloseTo(box?.x ?? 0, 0);
    // The code starts after the gutter, on the left.
    expect((code?.x ?? 0) - (box?.x ?? 0)).toBeLessThan(120);
    expect(
      await layer
        .locator("textarea")
        .evaluate((el) => getComputedStyle(el).direction),
    ).toBe("ltr");
  });

  test.describe("forced colors", () => {
    test.beforeEach(async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "only Chromium emulates it");
      await page.emulateMedia({ forcedColors: "active" });
    });

    test("shows the textarea's text and selection, not the layer's", async ({
      page,
    }) => {
      const field = editor(page, "code-editor-js");
      expect(await field.evaluate((el) => getComputedStyle(el).color)).not.toBe(
        "rgba(0, 0, 0, 0)",
      );
      expect(
        await root(page, "code-editor-js")
          .locator(".bx--code-editor__code")
          .first()
          .evaluate((el) => getComputedStyle(el).visibility),
      ).toBe("hidden");
    });

    // The textarea keeps a transparent color in forced colors, and its text
    // sat under the layer, so the computed color alone proved nothing.
    test("paints the code", async ({ page }) => {
      const wrapper = root(page, "code-editor-js").locator(
        ".bx--code-editor__wrapper",
      );
      const box = await wrapper.boundingBox();
      if (!box) throw new Error("no box");
      // Right of the gutter, where only the code is.
      const clip = { x: box.x + 90, y: box.y + 8, width: 280, height: 60 };
      const withCode = await page.screenshot({ clip });
      await editor(page, "code-editor-js").evaluate((el) => {
        const field = el as HTMLTextAreaElement;
        field.value = "";
        field.dispatchEvent(new Event("input", { bubbles: true }));
      });
      const without = await page.screenshot({ clip });
      expect(withCode.equals(without)).toBe(false);
    });

    test("draws a 4px focus ring", async ({ page }) => {
      await editor(page, "code-editor-js").focus();
      const outline = await page
        .locator(".bx--code-editor__wrapper")
        .first()
        .evaluate((el) => getComputedStyle(el).outlineWidth);
      expect(outline).toBe("4px");
    });
  });
});
