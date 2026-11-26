import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

// Highlight wraps a match in `mark`, and `highlightText` paints it with the CSS
// Custom Highlight API. Both must keep the text, its direction and its colors
// readable in every theme.

const marksIn = (page: Page, testId: string) =>
  page
    .getByTestId(testId)
    .locator("mark")
    .evaluateAll((els) => els.map((el) => el.textContent));

function systemColor(page: Page, name: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = name;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, name);
}

test.describe("Highlight", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/highlight.html");
    await expect(page.getByTestId("list")).toBeVisible();
  });

  test("marks the matches and leaves each item's text whole", async ({
    page,
  }) => {
    const items = page.getByTestId("list").locator("li");
    await expect(items).toHaveText([
      "Café au lait",
      "Crème brûlée and cafe noir",
      "Straße with cafe\u0301 decomposed",
      "İstanbul Cafe",
      "No match in this one",
    ]);
    const marks = await items.evaluateAll((lis) =>
      lis.map((li) =>
        [...li.querySelectorAll("mark")].map((mark) => mark.textContent),
      ),
    );
    expect(marks).toEqual([["Café"], ["cafe"], ["cafe\u0301"], ["Cafe"], []]);
  });

  test("follows the query as it is typed", async ({ page }) => {
    await page.getByTestId("query").fill("ist");
    expect(await marksIn(page, "list")).toEqual(["İst"]);
    await page.getByTestId("query").fill("straße");
    expect(await marksIn(page, "list")).toEqual(["Straße"]);
    await page.getByTestId("query").fill("");
    expect(await marksIn(page, "list")).toEqual([]);
  });

  test("keeps the full text as the accessible name", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Café au lait" }),
    ).toBeVisible();
  });

  test("has no detectable accessibility violations", async ({ page }) => {
    // A theme change fades the field's fill; axe would read it half-way.
    await page.addStyleTag({ content: "* { transition: none !important; }" });
    for (const theme of ["white", "g100"]) {
      await page.evaluate(
        (theme) => document.documentElement.setAttribute("theme", theme),
        theme,
      );
      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations, theme).toEqual([]);
    }
  });

  test("has no violations in right-to-left", async ({ page }) => {
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("a decorative match is a span the accessibility tree skips", async ({
    page,
  }) => {
    const decorative = page.getByTestId("decorative");
    expect(await decorative.locator("mark").count()).toBe(0);
    expect(await decorative.locator("span.bx--highlight__mark").count()).toBe(
      1,
    );
    await expect(page.getByTestId("bold").locator("mark")).toHaveCount(1);
  });

  test("fills a match with the highlight token, and the bold variant with none", async ({
    page,
  }) => {
    const fill = (testId: string) =>
      page
        .getByTestId(testId)
        .locator("mark")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    // `highlight` in the white and Gray 100 themes.
    expect(await fill("list")).toBe("rgb(208, 226, 255)");
    expect(await fill("bold")).toBe("rgba(0, 0, 0, 0)");
    await page.evaluate(() =>
      document.documentElement.setAttribute("theme", "g100"),
    );
    expect(await fill("list")).toBe("rgb(0, 29, 108)");
  });

  test("uses the Mark system colors under forced colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const mark = page.getByTestId("list").locator("mark").first();
    const styles = await mark.evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, color: s.color };
    });
    expect(styles.background).toBe(await systemColor(page, "Mark"));
    expect(styles.color).toBe(
      await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.color = "MarkText";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    );
    // Text and its fill differ, so the match stays readable.
    expect(styles.background).not.toBe(styles.color);
  });

  test("a snippet fits its length and still marks the match", async ({
    page,
  }) => {
    const snippet = page.getByTestId("snippet");
    const text = (await snippet.textContent()) ?? "";
    expect(text.length).toBeLessThanOrEqual(90);
    expect(text).toContain("…");
    expect(await marksIn(page, "snippet")).toEqual(["cafe"]);
  });
});

test.describe("Highlight in right-to-left text", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/highlight.html");
    await expect(page.getByTestId("arabic")).toBeVisible();
  });

  function lineBox(page: Page, testId: string) {
    return page.getByTestId(testId).evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const { left, right, width } = range.getBoundingClientRect();
      return { left, right, width };
    });
  }

  for (const [highlighted, plain, lang] of [
    ["arabic", "arabic-plain", "Arabic"],
    ["hebrew", "hebrew-plain", "Hebrew"],
  ]) {
    test(`a Latin term in ${lang} does not move any text`, async ({ page }) => {
      expect(await marksIn(page, highlighted)).toEqual(["hello"]);
      const marked = await lineBox(page, highlighted);
      const unmarked = await lineBox(page, plain);
      expect(marked.width).toBeCloseTo(unmarked.width, 0);
      expect(marked.left).toBeCloseTo(unmarked.left, 0);
      expect(marked.right).toBeCloseTo(unmarked.right, 0);
    });

    test(`the ${lang} match sits where the same word does unmarked`, async ({
      page,
    }) => {
      const where = (testId: string) =>
        page.getByTestId(testId).evaluate((el) => {
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const at = (n.textContent ?? "").indexOf("hello");
            if (at !== -1) {
              const range = document.createRange();
              range.setStart(n, at);
              range.setEnd(n, at + 5);
              const { left, width } = range.getBoundingClientRect();
              return { left, width };
            }
          }
          return null;
        });
      const marked = await page
        .getByTestId(highlighted)
        .locator("mark")
        .evaluate((mark) => {
          const { left, width } = mark.getBoundingClientRect();
          return { left, width };
        });
      const unmarked = await where(plain);
      expect(unmarked).not.toBeNull();
      expect(marked.left).toBeCloseTo(unmarked?.left ?? Number.NaN, 0);
      expect(marked.width).toBeCloseTo(unmarked?.width ?? Number.NaN, 0);
    });
  }

  test("a match inside an Arabic word keeps its letters joined", async ({
    page,
  }) => {
    // Cursive letters join across the mark, so the run is as wide as unmarked.
    const marked = await lineBox(page, "arabic-partial");
    await page.getByTestId("arabic-partial").evaluate((el) => {
      el.replaceChildren(document.createTextNode(el.textContent ?? ""));
    });
    const unmarked = await lineBox(page, "arabic-partial");
    expect(marked.width).toBeCloseTo(unmarked.width, 0);
  });

  test("the mark adds no isolate or embedding", async ({ page }) => {
    const style = await page
      .getByTestId("arabic")
      .locator("mark")
      .evaluate((el) => {
        const s = getComputedStyle(el);
        return { bidi: s.unicodeBidi, direction: s.direction };
      });
    expect(style).toEqual({ bidi: "normal", direction: "rtl" });
  });
});

test.describe("highlightText", () => {
  test.beforeEach(async ({ page, browserName }) => {
    await page.goto("/highlight.html");
    await expect(page.getByTestId("api")).toBeVisible();
    const supported = await page.evaluate(
      () => "highlights" in CSS && typeof Highlight === "function",
    );
    test.skip(!supported, `${browserName} has no CSS Custom Highlight API`);
  });

  const painted = (page: Page) =>
    page.evaluate(() =>
      [...(CSS.highlights.get("ccs-text-highlight") ?? [])]
        .map((range) => (range as Range).toString())
        .filter((text) => text),
    );

  test("paints each match and leaves the DOM alone", async ({ page }) => {
    expect(await painted(page)).toEqual(["Café", "cafe"]);
    expect(await page.getByTestId("api").locator("mark").count()).toBe(0);
  });

  test("repaints as the query changes", async ({ page }) => {
    await page.getByTestId("query").fill("second");
    await expect.poll(() => painted(page)).toEqual(["second"]);
    await page.getByTestId("query").fill("");
    await expect.poll(() => painted(page)).toEqual([]);
  });

  test("fills the matched text with the highlight token", async ({ page }) => {
    const rect = await page.getByTestId("api").evaluate((el) => {
      const range = [
        ...(CSS.highlights.get("ccs-text-highlight") ?? []),
      ][0] as Range;
      el.scrollIntoView({ block: "center" });
      const { x, y, width, height } = range.getBoundingClientRect();
      return { x, y, width, height };
    });
    const png = (await page.screenshot({ clip: rect })).toString("base64");
    const hasFill = await page.evaluate(async (png) => {
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
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === 208 && data[i + 1] === 226 && data[i + 2] === 255) {
          return true;
        }
      }
      return false;
    }, png);
    expect(hasFill).toBe(true);
  });
});
