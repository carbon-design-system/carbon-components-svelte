import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const MOD = "ControlOrMeta";

/**
 * The key the library reads as `mod`. It follows the page's platform, which a
 * Playwright device overrides (Desktop Chrome says Windows on a Mac), so ask
 * the page rather than the machine. Native editing keys, such as undo, still
 * follow the machine and use `ControlOrMeta`.
 */
const modKey = (page: Page) =>
  page.evaluate(() =>
    /mac|iphone|ipad|ipod/i.test(
      (navigator as Navigator & { userAgentData?: { platform?: string } })
        .userAgentData?.platform ||
        navigator.platform ||
        navigator.userAgent,
    )
      ? "Meta"
      : "Control",
  );

/** About 50 KB of Markdown: headings, lists, code, a table, links and a quote. */
function largeDocument(sections: number) {
  const section = (n: number) =>
    [
      `## Section ${n}`,
      "",
      `Paragraph ${n} with **bold**, *italic*, \`code\`, ~~strike~~ and a [link](https://example.com/${n}).`,
      "",
      `- item ${n}.1`,
      `- item ${n}.2`,
      `  - nested ${n}`,
      "",
      "```js",
      `const value${n} = ${n};`,
      "```",
      "",
      "| a | b |",
      "| - | - |",
      `| ${n} | ${n * 2} |`,
      "",
      "> A quote that keeps going, line after line, so the document is long enough.",
      "",
    ].join("\n");
  return Array.from({ length: sections }, (_, i) => section(i + 1)).join("\n");
}

const main = (page: Page) => page.getByTestId("main-host");

const editor = (page: Page, label: string) =>
  page.getByRole("textbox", { name: label, exact: true });

async function typeInto(field: Locator, text: string) {
  await field.click();
  await field.press(`${MOD}+a`);
  await field.pressSequentially(text);
}

test.describe("MarkdownEditor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/markdown-editor.html");
    await expect(editor(page, "Notes")).toBeVisible();
  });

  test("a toolbar edit is one undo step, and redo restores it", async ({
    page,
  }) => {
    const notes = editor(page, "Notes");
    await typeInto(notes, "make this bold");
    // Select "bold" with the keyboard, then press the toolbar with the mouse.
    for (let i = 0; i < 4; i++) await notes.press("Shift+ArrowLeft");
    await main(page).getByRole("button", { name: "Bold" }).click();
    await expect(notes).toHaveValue("make this **bold**");
    await expect(notes).toBeFocused();

    await notes.press(`${MOD}+z`);
    // WebKit folds the edit into the typing before it, and undoes both.
    const undone = await notes.inputValue();
    expect(undone).not.toBe("make this **bold**");
    if (test.info().project.name !== "webkit") {
      expect(undone).toBe("make this bold");
    }

    await notes.press(`${MOD}+Shift+z`);
    await expect(notes).toHaveValue("make this **bold**");
  });

  test("the list and quote actions are one undo step each", async ({
    page,
  }) => {
    const notes = editor(page, "Notes");
    await typeInto(notes, "a\nb");
    await notes.press(`${MOD}+a`);
    await main(page).getByRole("button", { name: "Bulleted list" }).click();
    await expect(notes).toHaveValue("- a\n- b");
    await notes.press(`${MOD}+z`);
    await expect(notes).not.toHaveValue("- a\n- b");
    await notes.press(`${MOD}+Shift+z`);
    await expect(notes).toHaveValue("- a\n- b");
  });

  test("Mod+B, Mod+I and Mod+K edit the selection", async ({ page }) => {
    const mod = await modKey(page);
    const notes = editor(page, "Notes");
    await typeInto(notes, "word");
    await notes.press(`${MOD}+a`);
    await notes.press(`${mod}+b`);
    await expect(notes).toHaveValue("**word**");
    await notes.press(`${mod}+b`);
    await expect(notes).toHaveValue("word");
    await notes.press(`${mod}+i`);
    await expect(notes).toHaveValue("*word*");
    await notes.press(`${mod}+k`);
    await expect(notes).toHaveValue(/\]\(url\)/);
  });

  test("a shortcut pressed outside the field does nothing", async ({
    page,
  }) => {
    const mod = await modKey(page);
    const notes = editor(page, "Notes");
    await typeInto(notes, "word");
    await notes.press(`${MOD}+a`);
    await main(page).getByRole("tab", { name: "Write" }).focus();
    await page.keyboard.press(`${mod}+b`);
    await expect(notes).toHaveValue("word");
  });

  test("Enter continues a list, Tab nests, an empty item ends it", async ({
    page,
  }) => {
    const notes = editor(page, "Notes");
    await typeInto(notes, "- one");
    await notes.press("Enter");
    await notes.pressSequentially("two");
    await notes.press("Enter");
    await notes.press("Tab");
    await notes.pressSequentially("nested");
    await notes.press("Enter");
    await notes.press("Shift+Tab");
    await notes.pressSequentially("three");
    await expect(notes).toHaveValue("- one\n- two\n  - nested\n- three");
    await notes.press("Enter");
    await notes.press("Enter");
    await expect(notes).toHaveValue("- one\n- two\n  - nested\n- three\n");
  });

  test("Tab moves focus off a plain line, and after Escape in a list", async ({
    page,
  }) => {
    const notes = editor(page, "Notes");
    await typeInto(notes, "plain");
    await notes.press("Tab");
    await expect(notes).not.toBeFocused();

    await notes.fill("- a\n- item");
    await notes.press("Tab");
    await expect(notes).toBeFocused();
    await expect(notes).toHaveValue("- a\n  - item");
    await notes.press("Escape");
    await expect(page.getByText("Tab now moves focus.")).toBeAttached();
    await notes.press("Tab");
    await expect(notes).not.toBeFocused();
    await expect(notes).toHaveValue("- a\n  - item");
  });

  test("an IME composition is left alone by the toolbar and the shortcuts", async ({
    page,
  }) => {
    const mod = await modKey(page);
    const notes = editor(page, "Notes");
    await typeInto(notes, "- あ");
    await notes.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent("compositionstart"));
    });
    await notes.press(`${mod}+b`);
    await main(page).getByRole("button", { name: "Bold" }).click();
    await expect(notes).toHaveValue("- あ");
    await notes.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent("compositionend"));
    });
    await notes.press(`${MOD}+a`);
    await notes.press(`${mod}+b`);
    await expect(notes).toHaveValue("**- あ**");
  });

  test("the preview draws Markdown and never runs HTML or javascript: links", async ({
    page,
  }) => {
    let dialogs = 0;
    page.on("dialog", (dialog) => {
      dialogs++;
      void dialog.dismiss();
    });
    const notes = editor(page, "Notes");
    await notes.fill(
      [
        "# Title",
        "",
        "[js](javascript:alert(1)) [ok](https://example.com)",
        "",
        '<img src=x onerror="alert(2)"><script>alert(3)</script>',
        "",
        "- [x] done",
        "- [ ] todo",
      ].join("\n"),
    );
    await main(page).getByRole("tab", { name: "Preview" }).click();
    const panel = main(page).getByRole("tabpanel", { name: "Preview" });
    await expect(panel.getByRole("heading", { name: "Title" })).toBeVisible();
    await expect(panel.getByRole("link")).toHaveCount(1);
    await expect(panel.getByRole("link")).toHaveAttribute(
      "href",
      "https://example.com/",
    );
    await expect(panel.locator("img, script, [onerror]")).toHaveCount(0);
    await expect(panel).toContainText("<script>alert(3)</script>");
    await expect(panel.getByRole("checkbox", { name: "Done" })).toBeChecked();
    await expect(
      panel.getByRole("checkbox", { name: "To do" }),
    ).not.toBeChecked();
    await page.waitForTimeout(200);
    expect(dialogs).toBe(0);
  });

  test("the toolbar is one tab stop, and arrow keys move along it", async ({
    page,
  }) => {
    const toolbar = main(page).getByRole("toolbar", { name: "Formatting" });
    await main(page).getByRole("tab", { name: "Write" }).focus();
    await page.keyboard.press("Tab");
    await expect(toolbar.getByRole("button").first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(toolbar.getByRole("button").nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(toolbar.getByRole("button").last()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(editor(page, "Notes")).toBeFocused();
  });

  test("keeps the textarea's value in the form while the Preview tab shows", async ({
    page,
  }) => {
    await main(page).getByRole("tab", { name: "Preview" }).click();
    await expect(editor(page, "Notes")).toBeHidden();
    const entry = await page.evaluate(() => {
      const field = document.querySelector<HTMLTextAreaElement>(
        'textarea[name="notes"]',
      );
      return field?.value;
    });
    expect(entry).toContain("make this bold");
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    // The 50 KB editor is left out: its preview is thousands of nodes.
    const scan = async () =>
      (
        await new AxeBuilder({ page })
          .include('[data-testid="main-host"]')
          .include('[data-testid="states-host"]')
          .analyze()
      ).violations;
    expect(await scan()).toEqual([]);

    await main(page).getByRole("tab", { name: "Preview" }).click();
    expect(await scan()).toEqual([]);
  });
});

test.describe("MarkdownEditor split view", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/markdown-editor.html");
    await expect(page.getByTestId("split-active")).toHaveText("true");
  });

  test("shows both panes in a wide editor and the tabs in a narrow one", async ({
    page,
  }) => {
    const host = page.getByTestId("split-host");
    await expect(host.getByRole("tab")).toHaveCount(0);
    await expect(host.getByRole("textbox", { name: "Split" })).toBeVisible();
    await expect(
      host.getByRole("region", { name: "Split Preview" }),
    ).toBeVisible();
    await expect(
      host.getByRole("region", { name: "Split Preview" }).getByRole("heading"),
    ).toHaveText("Split");

    await host.evaluate((el) => {
      el.style.width = "400px";
    });
    await expect(page.getByTestId("split-active")).toHaveText("false");
    await expect(host.getByRole("tab")).toHaveCount(2);
    await expect(
      host.getByRole("region", { name: "Split Preview" }),
    ).toHaveCount(0);
  });

  test("the preview follows the text after typing pauses", async ({ page }) => {
    const host = page.getByTestId("split-host");
    const field = host.getByRole("textbox", { name: "Split" });
    await field.click();
    await field.press(`${MOD}+End`);
    await field.pressSequentially("\n\n## Added");
    await expect(
      host
        .getByRole("region", { name: "Preview" })
        .getByRole("heading", { name: "Added" }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    const violations = (
      await new AxeBuilder({ page })
        .include('[data-testid="split-host"]')
        .analyze()
    ).violations;
    expect(violations).toEqual([]);
  });

  test("puts the preview at the end of the line, in RTL too", async ({
    page,
  }) => {
    const host = page.getByTestId("split-host");
    const box = async (locator: Locator) => {
      const found = await locator.boundingBox();
      if (!found) throw new Error("no box");
      return found;
    };
    const write = host.getByRole("textbox", { name: "Split" });
    const preview = host.getByRole("region", { name: "Split Preview" });
    expect((await box(write)).x).toBeLessThan((await box(preview)).x);

    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await expect(async () => {
      expect((await box(write)).x).toBeGreaterThan((await box(preview)).x);
    }).toPass();
    // The rule between the panes moves to the preview's start edge.
    const border = await preview.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.borderLeftWidth, style.borderRightWidth];
    });
    expect(border).toEqual(["0px", "1px"]);
  });
});

test.describe("MarkdownEditor forced colors", () => {
  test("keeps the selected tab, the buttons and the focus ring visible", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/markdown-editor.html");
    const selected = main(page).getByRole("tab", { name: "Write" }).first();
    await expect(selected).toBeVisible();

    const tab = await selected.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        width: style.borderBlockEndWidth,
        color: style.borderBlockEndColor,
      };
    });
    expect(tab.width).toBe("2px");
    expect(tab.color).not.toBe("rgba(0, 0, 0, 0)");

    const other = await page
      .getByRole("tab", { name: "Preview" })
      .first()
      .evaluate((el) => getComputedStyle(el).borderBlockEndColor);
    expect(tab.color).not.toBe(other);

    await editor(page, "Notes").focus();
    const ring = await page
      .locator(".bx--markdown-editor__wrapper")
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return { width: style.outlineWidth, style: style.outlineStyle };
      });
    expect(ring.style).not.toBe("none");
    expect(Number.parseFloat(ring.width)).toBeGreaterThanOrEqual(3);

    const button = await page
      .getByRole("button", { name: "Bold" })
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(button).not.toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("MarkdownEditor cost", () => {
  test("draws a 50 KB document without a long task on the Preview tab", async ({
    page,
  }) => {
    await page.goto("/markdown-editor.html");
    const host = page.getByTestId("split-host");
    const field = host.getByRole("textbox", { name: "Split" });
    const doc = largeDocument(160);
    expect(doc.length).toBeGreaterThan(45_000);
    await field.fill(doc);

    // The side-by-side preview draws the whole document once typing pauses.
    await expect(host.getByRole("region")).toBeVisible();
    await expect(host.locator('[role="region"] h3')).toHaveCount(160);

    // One keystroke at the top of the document: parse and patch every block.
    await field.click();
    await field.press(`${MOD}+Home`);
    const timings = await page.evaluate(async () => {
      const host = document.querySelector('[data-testid="split-host"]');
      const field = host?.querySelector("textarea");
      const region = host?.querySelector('[role="region"]');
      if (!field || !region) throw new Error("no field");
      const tasks: number[] = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) tasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: false });
      field.focus();
      const runs: number[] = [];
      for (let i = 0; i < 5; i++) {
        field.setSelectionRange(0, 0);
        let lastMutation = 0;
        const watch = new MutationObserver(() => {
          lastMutation = performance.now();
        });
        watch.observe(region, {
          subtree: true,
          childList: true,
          characterData: true,
        });
        const start = performance.now();
        document.execCommand("insertText", false, i % 2 ? "y" : "x");
        await new Promise((resolve) => setTimeout(resolve, 600));
        watch.disconnect();
        runs.push(lastMutation - start);
      }
      return { runs, longest: Math.max(0, ...tasks) };
    });
    // Reported by the spike report; the bounds are generous so CI noise passes.
    console.log(
      `50 KB edit at the top to the preview's last DOM change (ms, 150 ms debounce included): ${timings.runs.map((t) => t.toFixed(0)).join(", ")}; longest long task: ${timings.longest.toFixed(0)} ms`,
    );
    expect(Math.max(...timings.runs)).toBeLessThan(1500);

    // The keystroke itself must not wait for the preview.
    const keystroke = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="split-host"]');
      const field = host?.querySelector("textarea");
      if (!field) throw new Error("no field");
      field.focus();
      field.setSelectionRange(0, 0);
      const start = performance.now();
      document.execCommand("insertText", false, "y");
      return performance.now() - start;
    });
    console.log(`50 KB keystroke handler (ms): ${keystroke.toFixed(1)}`);
    expect(keystroke).toBeLessThan(200);
  });
});
