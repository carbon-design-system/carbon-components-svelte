import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const editor = (page: Page, name = "Notes") =>
  page.getByRole("textbox", { name, exact: true });
// The shortcut modifier follows the page's platform, as the editor reads it.
let MOD = "Control";
// Only the editor's own shortcuts follow the page's platform. The browser's
// (select all, line start) follow the host's, which an emulated user agent
// does not change.
const k = (combo: string) =>
  /\+(a|End|Home)$/.test(combo) ? combo : combo.replace("ControlOrMeta", MOD);
const value = (page: Page) => page.getByTestId("value");
const button = (page: Page, name: RegExp | string) =>
  page.getByRole("button", { name });

/** Select the whole text of the first paragraph-level match. */
async function selectText(locator: Locator, text: string) {
  await locator.evaluate((root, needle) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const index = (n as Text).data.indexOf(needle);
      if (index !== -1) {
        const selection = window.getSelection();
        selection?.setBaseAndExtent(n, index, n, index + needle.length);
        return;
      }
    }
    throw new Error(`no text ${needle}`);
  }, text);
}

/** Dispatch a paste carrying `html` and/or `text`. */
async function paste(
  locator: Locator,
  { html, text }: { html?: string; text?: string },
) {
  await locator.evaluate(
    (root, data) => {
      const transfer = new DataTransfer();
      if (data.html) transfer.setData("text/html", data.html);
      if (data.text) transfer.setData("text/plain", data.text);
      const event = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
      });
      // Firefox ignores `clipboardData` in the constructor.
      Object.defineProperty(event, "clipboardData", { value: transfer });
      root.dispatchEvent(event);
    },
    { html, text },
  );
}

test.describe("RichTextEditor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/rich-text-editor.html");
    await expect(editor(page)).toHaveAttribute("contenteditable", "true");
    MOD = await page.evaluate(() =>
      /Mac|iPhone|iPad/i.test(
        (navigator as Navigator & { userAgentData?: { platform?: string } })
          .userAgentData?.platform ||
          navigator.platform ||
          navigator.userAgent,
      )
        ? "Meta"
        : "Control",
    );
  });

  test.describe("semantics", () => {
    test("is a labelled multiline textbox described by its helper text", async ({
      page,
    }) => {
      const box = editor(page);
      await expect(box).toHaveAttribute("aria-multiline", "true");
      await expect(box).toHaveAccessibleDescription("Formatting is kept");
    });

    test("has a labelled toolbar that controls the editor", async ({
      page,
    }) => {
      const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
      await expect(toolbar.first()).toHaveAttribute(
        "aria-controls",
        (await editor(page).getAttribute("id")) ?? "",
      );
    });

    test("has no detectable accessibility violations", async ({ page }) => {
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });

  test.describe("toolbar keyboard", () => {
    test("is one tab stop with roving arrow keys", async ({ page }) => {
      const toolbar = page.getByRole("toolbar", { name: "Text formatting" });
      const first = toolbar.first();
      await editor(page).click();
      await page.keyboard.press("Shift+Tab");
      // Backwards from the editor lands on the toolbar's single tab stop.
      const stop = first.locator("[tabindex='0']");
      await expect(stop).toHaveCount(1);
      await expect(stop).toBeFocused();

      // Undo and Redo have nothing to do yet, so the stop is Heading 2.
      await expect(button(page, /^Heading 2/).first()).toBeFocused();
      await page.keyboard.press("ArrowRight");
      await expect(button(page, /^Heading 3/).first()).toBeFocused();
      await page.keyboard.press("End");
      await expect(button(page, /^Clear formatting/).first()).toBeFocused();
      await page.keyboard.press("Home");
      await expect(button(page, /^Heading 2/).first()).toBeFocused();

      // Tab leaves the toolbar rather than visiting every button.
      await page.keyboard.press("Tab");
      await expect(editor(page)).toBeFocused();
      await expect(first.locator("button:focus")).toHaveCount(0);
    });

    test("a button pressed with the keyboard keeps focus and the selection", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press("Shift+Tab");
      // Walk to Bold: Undo and Redo have nothing to do, so the toolbar
      // starts on Heading 2.
      const bold = button(page, /^Bold/).first();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
      await expect(bold).toBeFocused();
      await page.keyboard.press("Space");

      await expect(bold).toBeFocused();
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      await expect(value(page)).toHaveText(
        "<p><strong>Hello</strong> <strong>world</strong></p>",
      );
    });
  });

  test.describe("inline formatting", () => {
    test("applies and removes bold from the toolbar with the mouse", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      const bold = button(page, /^Bold/).first();

      await bold.click();
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      await expect(value(page)).toHaveText(
        "<p><strong>Hello</strong> <strong>world</strong></p>",
      );
      // The editor kept focus through the click.
      await expect(box).toBeFocused();

      await bold.click();
      await expect(bold).toHaveAttribute("aria-pressed", "false");
      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world</strong></p>",
      );
    });

    test("toggles italic and underline with shortcuts", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+i"));
      await page.keyboard.press(k("ControlOrMeta+u"));

      await expect(value(page)).toHaveText(
        "<p><em><u>Hello</u></em> <strong>world</strong></p>",
      );
    });

    test("types in bold after toggling at a caret", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello ");
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press(k("ControlOrMeta+b"));
      await page.keyboard.type("more ");

      await expect(value(page)).toHaveText(
        "<p>Hello <strong>more world</strong></p>",
      );
    });

    test("types plain text after leaving bold at a caret", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+End"));
      await page.keyboard.press(k("ControlOrMeta+b"));
      await page.keyboard.type("plain");

      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world</strong>plain</p>",
      );
    });
  });

  test.describe("blocks", () => {
    test("makes a heading, and Enter at its end starts a paragraph", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+Alt+2"));
      await expect(value(page)).toContainText("<h2>");
      await page.keyboard.press(k("ControlOrMeta+End"));
      await page.keyboard.press("Enter");
      await page.keyboard.type("body");

      await expect(value(page)).toHaveText(
        "<h2>Hello <strong>world</strong></h2><p>body</p>",
      );
    });

    test("nests a list with Tab and Shift+Tab, and leaves it with Enter", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await page.keyboard.press("Delete");
      await page.keyboard.press(k("ControlOrMeta+Shift+8"));
      await page.keyboard.type("one");
      await page.keyboard.press("Enter");
      await page.keyboard.type("two");
      await page.keyboard.press("Tab");
      await expect(value(page)).toHaveText(
        "<ul><li>one<ul><li>two</li></ul></li></ul>",
      );

      await page.keyboard.press("Shift+Tab");
      await expect(value(page)).toHaveText("<ul><li>one</li><li>two</li></ul>");

      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.keyboard.type("after");
      await expect(value(page)).toHaveText(
        "<ul><li>one</li><li>two</li></ul><p>after</p>",
      );
    });

    test("Tab leaves the editor outside a list", async ({ page }) => {
      await editor(page).click();
      await page.keyboard.press("Tab");
      await expect(editor(page)).not.toBeFocused();
    });
  });

  test.describe("history", () => {
    test("undoes and redoes typing in groups, and commands as steps", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+End"));
      await page.keyboard.type(" typed");
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+b"));
      await expect(value(page)).toHaveText(
        "<p><strong>Hello</strong> <strong>world typed</strong></p>",
      );

      await page.keyboard.press(k("ControlOrMeta+z"));
      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world typed</strong></p>",
      );
      await page.keyboard.press(k("ControlOrMeta+z"));
      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world</strong></p>",
      );
      await page.keyboard.press(k("ControlOrMeta+Shift+z"));
      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world typed</strong></p>",
      );
    });

    test("enables the Undo button once there is something to undo", async ({
      page,
    }) => {
      const undo = button(page, /^Undo/).first();
      await expect(undo).toHaveAttribute("aria-disabled", "true");
      await editor(page).click();
      await page.keyboard.type("x");
      await expect(undo).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test.describe("paste", () => {
    test("strips Google Docs markup to the schema", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await paste(box, {
        html: `<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-9"><p dir="ltr" style="line-height:1.38;margin-top:0pt;"><span style="font-size:11pt;font-family:Arial;font-weight:700;">Bold</span><span style="font-size:11pt;font-family:Arial;"> plain </span><a href="https://example.com" style="text-decoration:none;"><span style="color:#1155cc;text-decoration:underline;">link</span></a></p><ul><li dir="ltr"><p dir="ltr"><span>item</span></p></li></ul></b>`,
      });

      await expect(value(page)).toHaveText(
        '<p><strong>Bold</strong> plain <a href="https://example.com">link</a></p><ul><li>item</li></ul>',
      );
    });

    test("strips Word markup, scripts and event handlers", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await paste(box, {
        html: `<!--StartFragment--><p class=MsoNormal style='margin:0in'><b><span style='font-size:12.0pt;font-family:"Calibri",sans-serif'>Title<o:p></o:p></span></b></p><p class=MsoListParagraph style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span><![endif]>First</p><p class=MsoListParagraph style='mso-list:l0 level1 lfo1'><![if !supportLists]><span style='mso-list:Ignore'>·<span>&nbsp;&nbsp;</span></span><![endif]>Second</p><img src=x onerror=alert(1)><script>alert(2)</script><a href="javascript:alert(3)">bad</a><!--EndFragment-->`,
      });

      await expect(value(page)).toHaveText(
        "<p><strong>Title</strong></p><ul><li>First</li><li>Second</li></ul><p>bad</p>",
      );
    });

    test("pastes plain text as paragraphs", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await paste(box, { text: "one\ntwo\n\nthree <b>" });

      await expect(value(page)).toHaveText(
        "<p>one<br>two</p><p>three &lt;b&gt;</p>",
      );
    });

    test("joins a pasted fragment to the text around the caret", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello ");
      await page.keyboard.press("ArrowRight");
      await paste(box, { html: "<p>big </p>" });

      await expect(value(page)).toHaveText(
        "<p>Hello big <strong>world</strong></p>",
      );
    });
  });

  test.describe("IME composition", () => {
    test("leaves the DOM to the IME and commits when it ends", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+End"));
      const before = await value(page).textContent();

      // Simulates what an IME does: composition events around text edits.
      await box.evaluate((root) => {
        const text = root.querySelector("strong")?.firstChild as Text;
        root.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
        for (const data of ["に", "にほ", "日本"]) {
          const event = new InputEvent("beforeinput", {
            inputType: "insertCompositionText",
            data,
            isComposing: true,
            bubbles: true,
            cancelable: false,
          });
          root.dispatchEvent(event);
          text.data = `world${data}`;
          root.dispatchEvent(
            new InputEvent("input", {
              inputType: "insertCompositionText",
              data,
              isComposing: true,
              bubbles: true,
            }),
          );
        }
      });
      // Nothing is committed mid-composition.
      await expect(value(page)).toHaveText(before ?? "");

      await box.evaluate((root) => {
        root.dispatchEvent(
          new CompositionEvent("compositionend", {
            data: "日本",
            bubbles: true,
          }),
        );
      });
      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world日本</strong></p>",
      );
    });

    test("holds an outside value change until the composition ends", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await box.evaluate((root) => {
        root.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
      });
      await page.getByTestId("set-external").click();
      await expect(box).toContainText("Hello world");

      await box.evaluate((root) => {
        root.dispatchEvent(
          new CompositionEvent("compositionend", { bubbles: true }),
        );
      });
      await expect(box.locator("h2")).toHaveText("External");
    });

    test("does not take Enter that confirms a composition for a list exit", async ({
      page,
    }) => {
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await page.keyboard.press("Delete");
      await page.keyboard.press(k("ControlOrMeta+Shift+8"));
      await box.evaluate((root) => {
        root.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
        root.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            isComposing: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      // An empty item exits the list on Enter; a composition's Enter doesn't.
      await expect(box.locator("ul")).toHaveCount(1);
    });
  });

  test.describe("value", () => {
    test("renders an outside change and keeps typing in sync", async ({
      page,
    }) => {
      await page.getByTestId("set-external").click();
      await expect(editor(page).locator("h2")).toHaveText("External");

      await editor(page).click();
      await page.keyboard.press(k("ControlOrMeta+End"));
      await page.keyboard.type("!");
      await expect(value(page)).toHaveText(
        "<h2>External</h2><p>set from outside!</p>",
      );
    });

    test("counts input events, and change on blur", async ({ page }) => {
      await editor(page).click();
      await page.keyboard.type("ab");
      await expect(page.getByTestId("inputs")).toHaveText("2");
      await expect(page.getByTestId("changes")).toHaveText("0");
      await page.getByTestId("set-external").focus();
      await expect(page.getByTestId("changes")).toHaveText("1");
    });

    test("shows the placeholder only while empty", async ({ page }) => {
      const box = editor(page);
      await expect(page.getByText("Write something")).toHaveCount(0);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await page.keyboard.press("Delete");
      await expect(page.getByText("Write something")).toBeVisible();
      await expect(value(page)).toHaveText("");
    });
  });

  test.describe("link dialog", () => {
    test("links the selection from the keyboard shortcut", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+k"));
      const url = page.getByRole("textbox", { name: "URL" });
      await expect(url).toBeFocused();
      await url.fill("example.com/docs");
      await page.keyboard.press("Enter");

      await expect(value(page)).toHaveText(
        '<p><a href="https://example.com/docs">Hello</a> <strong>world</strong></p>',
      );
      await expect(box).toBeFocused();
    });

    test("rejects a javascript: URL", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+k"));
      await page
        .getByRole("textbox", { name: "URL" })
        .fill("javascript:alert(1)");
      await page.keyboard.press("Enter");

      await expect(page.getByText("Enter a valid URL")).toBeVisible();
      await expect(value(page)).not.toContainText("javascript");
    });

    test("Escape closes the dialog and returns focus", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+k"));
      await expect(page.getByRole("textbox", { name: "URL" })).toBeFocused();
      await page.keyboard.press("Escape");

      await expect(page.getByRole("textbox", { name: "URL" })).toHaveCount(0);
      await expect(box).toBeFocused();
    });

    test("removes an existing link", async ({ page }) => {
      const box = editor(page);
      await box.click();
      await selectText(box, "Hello");
      await page.keyboard.press(k("ControlOrMeta+k"));
      await page.getByRole("textbox", { name: "URL" }).fill("https://a.test");
      await page.keyboard.press("Enter");
      await page.keyboard.press(k("ControlOrMeta+k"));
      await page.getByRole("button", { name: "Remove link" }).click();

      await expect(value(page)).toHaveText(
        "<p>Hello <strong>world</strong></p>",
      );
    });
  });

  test.describe("states", () => {
    test("disabled and read-only editors can't be edited", async ({ page }) => {
      const disabled = editor(page, "Disabled");
      const readonly = editor(page, "Read-only");
      await expect(disabled).not.toHaveAttribute("contenteditable", "true");
      await expect(readonly).not.toHaveAttribute("contenteditable", "true");
      await expect(readonly).toHaveAttribute("aria-readonly", "true");
      // A read-only editor has no toolbar.
      await expect(
        page.getByRole("toolbar", { name: "Text formatting" }),
      ).toHaveCount(7);
    });

    test("flags invalid and over-limit states", async ({ page }) => {
      await expect(editor(page, "Invalid")).toHaveAttribute(
        "aria-invalid",
        "true",
      );
      const message = await editor(page, "Invalid").getAttribute(
        "aria-errormessage",
      );
      await expect(page.locator(`[id="${message}"]`)).toHaveText(
        "Add a summary",
      );

      const limited = editor(page, "Limited");
      await limited.click();
      await page.keyboard.press(k("ControlOrMeta+End"));
      await page.keyboard.type(" and then some more");
      await expect(limited).toHaveAttribute("aria-invalid", "true");
    });
  });

  test.describe("form", () => {
    test("submits the HTML and blocks an empty required editor", async ({
      page,
    }) => {
      const body = editor(page, "Body");
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.getByText("Body is required")).toBeVisible();
      await expect(body).toBeFocused();
      await expect(page.getByTestId("submitted")).toHaveText("");

      await page.keyboard.type("Ready");
      await expect(page.getByText("Body is required")).toHaveCount(0);
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page.getByTestId("submitted")).toHaveText("<p>Ready</p>");
    });

    test("restores the initial value on reset", async ({ page }) => {
      const body = editor(page, "Body");
      await body.click();
      await page.keyboard.type("Draft");
      await page.getByRole("button", { name: "Reset" }).click();

      await expect(body).toHaveText("");
    });
  });

  test.describe("themes and direction", () => {
    test("stays usable in forced colors", async ({ page }) => {
      await page.emulateMedia({ forcedColors: "active" });
      const box = editor(page);
      await box.click();
      const ring = await box.evaluate((el) => {
        const field = el.closest(".bx--rich-text-editor__box") as HTMLElement;
        // The ring draws on a layer above the toolbar's buttons.
        const style = getComputedStyle(field, "::after");
        return { width: style.outlineWidth, style: style.outlineStyle };
      });
      expect(ring.style).not.toBe("none");
      expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(2);
      await selectText(box, "Hello");
      const bold = button(page, /^Bold/).first();
      await bold.click();
      await expect(bold).toHaveAttribute("aria-pressed", "true");
      // A pressed button is drawn with a system color, not just a fill.
      const pressed = await bold.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      );
      const resting = await button(page, /^Italic/)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(pressed).not.toBe(resting);

      // Resting buttons draw no box; only the pressed one has an edge.
      const edges = await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "Canvas";
        document.body.append(probe);
        const canvas = getComputedStyle(probe).color;
        probe.remove();
        const tools = [
          ...document.querySelectorAll(
            ".bx--rich-text-editor__toolbar .bx--rich-text-editor__tool",
          ),
        ].slice(0, 16);
        return tools
          .filter((tool) => tool.getAttribute("aria-pressed") !== "true")
          .filter((tool) => tool !== document.activeElement)
          .filter((tool) => getComputedStyle(tool).borderTopColor !== canvas)
          .length;
      });
      expect(edges).toBe(0);
    });

    test("toolbar buttons fill the toolbar, with the first icon on the text's edge", async ({
      page,
    }) => {
      const field = page.locator(".bx--rich-text-editor").first();
      const m = await field.evaluate((root) => {
        const toolbar = root.querySelector(
          ".bx--rich-text-editor__toolbar",
        ) as HTMLElement;
        const style = getComputedStyle(toolbar);
        const inner =
          toolbar.getBoundingClientRect().height -
          Number.parseFloat(style.borderBottomWidth);
        const buttons = [
          ...toolbar.querySelectorAll(".bx--rich-text-editor__tool"),
        ].map((b) => b.getBoundingClientRect().height);
        const icon = (
          toolbar.querySelector(".bx--rich-text-editor__tool svg") as Element
        ).getBoundingClientRect();
        const content = root.querySelector(
          ".bx--rich-text-editor__content",
        ) as HTMLElement;
        const text =
          content.getBoundingClientRect().left +
          Number.parseFloat(getComputedStyle(content).paddingLeft);
        return { inner, buttons, iconLeft: icon.left, text };
      });
      expect(m.inner).toBe(40);
      expect(new Set(m.buttons)).toEqual(new Set([40]));
      expect(Math.abs(m.iconLeft - m.text)).toBeLessThanOrEqual(0.5);
    });

    test("a long URL wraps inside the field at 320 px", async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await paste(box, {
        text: "https://example.com/a/very/long/path/that/does/not/break/easily/and/keeps/going",
      });
      await expect(value(page)).toContainText("keeps/going");

      // In a grid, the column is as wide as the field's min-content width.
      // The URL must not set it.
      const widths = await box.evaluate((el) => {
        const field = el.closest(".bx--rich-text-editor") as HTMLElement;
        const parent = field.parentElement as HTMLElement;
        for (const child of parent.children) {
          if (child !== field) (child as HTMLElement).style.display = "none";
        }
        parent.style.display = "grid";
        return {
          field: field.getBoundingClientRect().width,
          page: document.documentElement.scrollWidth,
        };
      });
      expect(widths.field).toBeLessThanOrEqual(320);
      expect(widths.page).toBeLessThanOrEqual(320);
    });

    test("flips the toolbar and placeholder in RTL", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const toolbar = page
        .getByRole("toolbar", { name: "Text formatting" })
        .first();
      const undo = button(page, /^Undo/).first();
      const clear = button(page, /^Clear formatting/).first();
      const [undoBox, clearBox] = await Promise.all([
        undo.boundingBox(),
        clear.boundingBox(),
      ]);
      expect((undoBox?.x ?? 0) > (clearBox?.x ?? 0)).toBe(true);

      // Undo, redo and the indent icons point back or forward, so they
      // mirror. Bold does not.
      const transform = (name: RegExp) =>
        button(page, name)
          .first()
          .locator("svg")
          .evaluate((el) => getComputedStyle(el).transform);
      const transforms = await Promise.all(
        [/^Undo/, /^Redo/, /^Increase indent/, /^Bold/].map(transform),
      );
      const mirror = "matrix(-1, 0, 0, 1, 0, 0)";
      expect(transforms).toEqual([mirror, mirror, mirror, "none"]);

      await toolbar.locator("[tabindex='0']").focus();
      await page.keyboard.press("ArrowLeft");
      // In RTL, ArrowLeft moves forward through the toolbar.
      await expect(button(page, /^Heading 3/).first()).toBeFocused();

      const placeholder = page
        .locator(".bx--rich-text-editor__placeholder")
        .first();
      const [pBox, fieldBox] = await Promise.all([
        placeholder.boundingBox(),
        placeholder.locator("xpath=..").boundingBox(),
      ]);
      expect((pBox?.x ?? 0) + (pBox?.width ?? 0)).toBeGreaterThan(
        (fieldBox?.x ?? 0) + (fieldBox?.width ?? 0) - 40,
      );
    });

    test("a paragraph takes the direction of its own text", async ({
      page,
    }) => {
      await page.evaluate(() =>
        document.documentElement.setAttribute("dir", "rtl"),
      );
      const box = editor(page);
      await box.click();
      await page.keyboard.press(k("ControlOrMeta+a"));
      await paste(box, { html: "<p>Done, 3 of 4.</p><p>تم، 3 من 4.</p>" });

      // In an RTL page, the English paragraph starts at the left edge and
      // the Arabic one ends at the right edge.
      const edges = await box.evaluate((root) => {
        const content = root.getBoundingClientRect();
        const style = getComputedStyle(root);
        const left = content.left + Number.parseFloat(style.paddingLeft);
        const right = content.right - Number.parseFloat(style.paddingRight);
        return [...root.querySelectorAll("p")].map((p) => {
          const range = document.createRange();
          range.selectNodeContents(p);
          const text = range.getBoundingClientRect();
          return { left: text.left - left, right: right - text.right };
        });
      });
      expect(Math.abs(edges[0].left)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(edges[1].right)).toBeLessThanOrEqual(0.5);
    });

    test("has no accessibility violations in Gray 100", async ({ page }) => {
      await page.evaluate(() =>
        document.documentElement.classList.add("bx--g100"),
      );
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
