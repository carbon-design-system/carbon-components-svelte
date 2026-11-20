import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page) =>
  page.getByRole("combobox", { name: "Search issues" });
const menu = (page: Page) => page.getByRole("listbox", { name: /.+/ });
const option = (page: Page, name: string | RegExp) =>
  page.getByRole("option", { name });
const output = (page: Page, id: string) => page.getByTestId(id);

async function control(page: Page, script: string) {
  await page.evaluate(
    `(() => { const c = window.__tokenSearch; ${script} })()`,
  );
}

async function queryOf(page: Page) {
  return JSON.parse((await output(page, "query").textContent()) ?? "{}");
}

/** Type the keys of `text` one by one. */
async function type(locator: Locator, text: string) {
  await locator.pressSequentially(text);
}

test.beforeEach(async ({ page }) => {
  // Fonts come from a CDN a test machine may not reach, and WebKit waits on
  // them to take a screenshot.
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
  await page.goto("/token-search.html");
  await field(page).waitFor();
});

test.describe("suggestions", () => {
  test("offers the keys, then the values of the key, from the keyboard", async ({
    page,
  }) => {
    const input = field(page);
    await input.click();
    await type(input, "la");
    await expect(option(page, /^\s*label/)).toBeVisible();
    // Nothing is chosen until an arrow key chooses it.
    await expect(input).not.toHaveAttribute("aria-activedescendant");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("label:");
    // Choosing a key opens its values at once.
    await expect(option(page, /good first issue/)).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("label:ui ");
    await expect(menu(page)).toHaveCount(0);
    expect((await queryOf(page)).filters).toMatchObject([
      { key: "label", values: ["ui"] },
    ]);
  });

  test("lists the keys and the recent queries in an empty field", async ({
    page,
  }) => {
    await field(page).click();
    await expect(option(page, /State/)).toBeVisible();
    await expect(option(page, "is:open label:bug")).toBeVisible();
    await option(page, "is:open label:bug").click();
    await expect(field(page)).toHaveValue("is:open label:bug");
    await expect(field(page)).toBeFocused();
    await expect(output(page, "selected")).toHaveText("is:open label:bug");
  });

  test("Enter still searches when nothing was chosen, and Escape closes before it clears", async ({
    page,
  }) => {
    const input = field(page);
    await input.click();
    await type(input, "is:op");
    await expect(menu(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);
    await expect(input).toHaveValue("is:op");
    await type(input, "e");
    // Dismissed for this word: typing on does not reopen it.
    await expect(menu(page)).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(output(page, "searches")).toHaveText('["is:ope"]');
    await page.keyboard.press("Escape");
    await expect(input).toHaveValue("");
  });

  test("offers date shortcuts for a date key and writes the one chosen", async ({
    page,
  }) => {
    const input = field(page);
    await input.click();
    await type(input, "created:");
    await option(page, "Last 7 days").click();
    await expect(input).toHaveValue("created:>=@today-7d ");
    expect((await queryOf(page)).filters[0]).toMatchObject({
      key: "created",
      op: "gte",
      values: ["2026-10-27"],
    });
  });

  test("shows a source's values after a wait, and drops an older answer that comes late", async ({
    page,
  }) => {
    await control(
      page,
      `c.ignoreAbort = true; c.delay = (q) => (q === "a" ? 600 : 50);`,
    );
    const input = field(page);
    await input.click();
    await type(input, "author:a");
    await type(input, "l");
    await expect(option(page, /Alice Example/)).toBeVisible();
    // The answer for "a" arrives later and lists everyone with an "a".
    await page.waitForTimeout(800);
    await expect(option(page, /Fatima/)).toHaveCount(0);
    await expect(option(page, /Alina Example/)).toBeVisible();
  });

  test("says so when a source fails, and recovers on the next key", async ({
    page,
  }) => {
    await control(page, `c.fail = (q) => q === "z";`);
    const input = field(page);
    await input.click();
    await type(input, "author:z");
    await expect(page.getByText("Could not load results")).toBeVisible();
    await page.keyboard.press("Backspace");
    await type(input, "b");
    await expect(option(page, /Bob Example/)).toBeVisible();
  });
});

test.describe("highlight", () => {
  test("draws each qualifier with a rule, an error with a wavy underline", async ({
    page,
  }) => {
    await type(field(page), 'is:open -label:bug nope:1 "a phrase" free');
    await expect(page.locator(".bx--token-search__content")).toHaveText(
      'is:open -label:bug nope:1 "a phrase" free',
    );
    const styles = await page.evaluate(() => {
      const read = (selector: string) => {
        const el = document.querySelector(selector) as HTMLElement;
        const style = getComputedStyle(el);
        return {
          rule: `${style.borderBottomStyle} ${style.borderBottomWidth}`,
          underline: style.textDecorationLine,
          wavy: style.textDecorationStyle,
        };
      };
      return {
        qualifier: read(
          ".bx--token-search__qualifier:not(.bx--token-search__qualifier--negated):not(.bx--token-search__qualifier--error)",
        ),
        negated: read(".bx--token-search__qualifier--negated"),
        phrase: read(".bx--token-search__phrase"),
        error: read(
          ".bx--token-search__qualifier--error .bx--token-search__error",
        ),
      };
    });
    // Each is told apart by a line style, so none rests on color.
    expect(styles.qualifier.rule).toBe("solid 1px");
    expect(styles.negated.rule).toBe("dashed 1px");
    expect(styles.phrase.rule).toBe("dotted 1px");
    expect(styles.error.underline).toBe("underline");
    expect(styles.error.wavy).toBe("wavy");
    expect(await queryOf(page)).toMatchObject({
      text: "a phrase free",
      errors: [{ code: "unknown-key" }],
    });
  });

  test("keeps the rules in forced colors and paints no text of its own", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari has no forced colors mode");
    await page.emulateMedia({ forcedColors: "active" });
    await type(field(page), "is:open nope:1");
    const read = await page.evaluate(() => {
      const layer = document.querySelector(
        ".bx--token-search__backdrop",
      ) as HTMLElement;
      const qualifier = document.querySelector(
        ".bx--token-search__qualifier",
      ) as HTMLElement;
      const error = document.querySelector(
        ".bx--token-search__error",
      ) as HTMLElement;
      return {
        // The layer's text must stay clear or it doubles the input's.
        text: getComputedStyle(layer).color,
        adjust: getComputedStyle(layer).forcedColorAdjust,
        rule: getComputedStyle(qualifier).borderBottomStyle,
        fill: getComputedStyle(qualifier).backgroundColor,
        underline: getComputedStyle(error).textDecorationStyle,
      };
    });
    expect(read.text).toBe("rgba(0, 0, 0, 0)");
    expect(read.adjust).toBe("none");
    expect(read.rule).toBe("solid");
    // A pale fill would sit under the light text of a dark palette.
    expect(read.fill).toBe("rgba(0, 0, 0, 0)");
    expect(read.underline).toBe("wavy");
  });

  test("reads a pasted complex query", async ({ page }) => {
    await field(page).click();
    await page.keyboard.insertText(
      'is:open,closed -label:"good first issue",ui author:@me created:2026-01-01..@today comments:>=3 "exact phrase" -draft ship it nope:x',
    );
    const query = await queryOf(page);
    expect(query.text).toBe("exact phrase ship it");
    expect(query.terms.map((t: { negated: boolean }) => t.negated)).toEqual([
      false,
      true,
      false,
      false,
    ]);
    expect(query.filters).toMatchObject([
      { key: "is", values: ["open", "closed"] },
      { key: "label", negated: true, values: ["good first issue", "ui"] },
      { key: "author", values: ["@me"] },
      { key: "created", op: "between", values: ["2026-01-01", "2026-11-03"] },
      { key: "comments", op: "gte", values: ["3"] },
      { key: "nope", values: ["x"] },
    ]);
    expect(query.errors.map((e: { code: string }) => e.code)).toEqual([
      "unknown-key",
    ]);
    await expect(page.locator(".bx--token-search__qualifier")).toHaveCount(6);
  });
});

/**
 * Where the ink of the input's text and the ink of the layer's text sit, as
 * the difference between their centres of mass in each third of the field,
 * in px. The input draws its text in black with the layer hidden; then the
 * layer draws its text in black and the input's is clear.
 */
async function drift(page: Page) {
  const box = page.locator(".bx--search").first();
  await page.addStyleTag({
    content: `
      .bx--token-search__qualifier, .bx--token-search__phrase { background: none !important; border-color: transparent !important; }
      .bx--token-search__error { text-decoration: none !important; }
      .bx--search-input, .bx--search-input:focus { outline: none !important; }`,
  });
  const style = await page.addStyleTag({ content: "x{}" });
  const shot = async (layer: boolean) => {
    await style.evaluate((node, layer) => {
      node.textContent = layer
        ? ".bx--token-search__backdrop{visibility:visible !important; color:#000 !important} .bx--search-input{color:transparent !important; caret-color:transparent !important}"
        : ".bx--token-search__backdrop{visibility:hidden !important} .bx--search-input{color:#000 !important; caret-color:transparent !important}";
    }, layer);
    return (await box.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
  };
  const input = await shot(false);
  const layer = await shot(true);
  return page.evaluate(
    async ([a, b]) => {
      const load = (s: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = `data:image/png;base64,${s}`;
        });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const dpr = window.devicePixelRatio || 1;
      const w = ia.width;
      const h = ia.height;
      const margin = Math.round(44 * dpr);
      const pixels = (img: HTMLImageElement) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        if (!x) throw new Error("no canvas");
        x.drawImage(img, 0, 0);
        return x.getImageData(0, 0, w, h).data;
      };
      const da = pixels(ia);
      const db = pixels(ib);
      const centroid = (d: Uint8ClampedArray, third: number) => {
        let mass = 0;
        let mx = 0;
        let my = 0;
        const from = margin + ((w - 2 * margin) * third) / 3;
        const to = margin + ((w - 2 * margin) * (third + 1)) / 3;
        for (let y = 0; y < h - 2 * dpr; y++) {
          for (let x = Math.floor(from); x < to; x++) {
            const v = 255 - d[(y * w + x) * 4];
            if (v > 0) {
              mass += v;
              mx += v * x;
              my += v * y;
            }
          }
        }
        return { mass, x: mx / mass / dpr, y: my / mass / dpr };
      };
      const out: Array<{ dx: number; dy: number } | null> = [];
      for (let third = 0; third < 3; third++) {
        const ca = centroid(da, third);
        const cb = centroid(db, third);
        // A third with no text has nothing to compare.
        out.push(
          ca.mass > 2000 && cb.mass > 2000
            ? { dx: cb.x - ca.x, dy: cb.y - ca.y }
            : null,
        );
      }
      return out;
    },
    [input, layer],
  );
}

const LONG =
  'is:open label:bug,ui author:@me -label:wontfix created:>=2026-01-01 comments:3..10 title:"a long title here" "an exact phrase" free words that go on and on and on until the field must scroll sideways is:closed label:"good first issue" more free text to push the caret past the end of the visible box ';
const HEBREW = 'שלום עולם is:open label:bug "ביטוי מדויק" שוב ';
const HEBREW_LONG = `שלום עולם is:open label:bug ${"מילים נוספות בעברית ועוד ".repeat(30)}label:"good first issue" סוף`;

test.describe("the layer stays under the text", () => {
  // The browsers lay out an input's text by their own rules, which the layer
  // copies: the field's direction aligns text that fits, the text's own
  // direction anchors text that overflows, and `scrollLeft` counts from
  // there. Each case types the text, so the caret scrolls the field.
  const cases: Array<[string, "ltr" | "rtl", string]> = [
    ["short Latin", "ltr", "is:open label:bug free"],
    ["short Hebrew first", "ltr", HEBREW],
    ["short Latin", "rtl", "is:open label:bug free"],
    ["short Hebrew", "rtl", HEBREW],
    ["long Latin, scrolled to the end", "ltr", LONG],
    ["long Hebrew, scrolled", "ltr", HEBREW_LONG],
  ];

  for (const [name, dir, text] of cases) {
    test(`${name}, ${dir}`, async ({ page }) => {
      await page.evaluate(
        (d) => document.documentElement.setAttribute("dir", d),
        dir,
      );
      await field(page).focus();
      await field(page).pressSequentially(text, { delay: 0 });
      // The caret scrolls the field as the text lands, so measure until it
      // settles.
      await expect(async () => {
        const thirds = await drift(page);
        expect(thirds.some((third) => third !== null)).toBe(true);
        for (const third of thirds) {
          if (!third) continue;
          // Browsers keep whole or fractional scroll offsets of their own;
          // the layer is within a pixel across the whole width and height.
          expect(Math.abs(third.dx)).toBeLessThan(1.25);
          expect(Math.abs(third.dy)).toBeLessThan(1);
        }
      }).toPass({ timeout: 5000 });
    });
  }

  test("follows a scroll that no event announces", async ({ page }) => {
    await field(page).focus();
    await field(page).pressSequentially(LONG, { delay: 0 });
    const read = () =>
      page.evaluate(() => {
        const input = document.querySelector(
          ".bx--search-input",
        ) as HTMLInputElement;
        const content = document.querySelector(
          ".bx--token-search__content",
        ) as HTMLElement;
        return {
          scroll: input.scrollLeft,
          shift: new DOMMatrix(getComputedStyle(content).transform).m41,
        };
      });
    await expect.poll(async () => (await read()).scroll).toBeGreaterThan(100);
    // No `scroll`, `input` or key event comes from this.
    await page.evaluate(() => {
      const input = document.querySelector(
        ".bx--search-input",
      ) as HTMLInputElement;
      input.setSelectionRange(0, 0);
      input.scrollLeft = 0;
    });
    await expect.poll(async () => (await read()).shift).toBe(0);
  });
});

test.describe("IME", () => {
  test("a composition closes the menu, keeps the layer in step and offers again when it ends", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    const input = field(page);
    await input.click();
    await type(input, "is:op");
    await expect(menu(page)).toBeVisible();

    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "日本",
      selectionStart: 2,
      selectionEnd: 2,
    });
    await expect(menu(page)).toHaveCount(0);
    // The composed text is in the field, and in the layer under it.
    await expect(input).toHaveValue("is:op日本");
    await expect(page.locator(".bx--token-search__content")).toHaveText(
      "is:op日本",
    );

    await client.send("Input.insertText", { text: "日本" });
    await expect(input).toHaveValue("is:op日本");
    await expect(page.locator(".bx--token-search__content")).toHaveText(
      "is:op日本",
    );
  });

  test("an Enter that ends a composition does not choose a row", async ({
    page,
  }) => {
    const input = field(page);
    await input.click();
    await type(input, "is:");
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toBeVisible();
    // Safari ends the composition before the keydown that commits it, so
    // only keyCode 229 gives that Enter away.
    const value = await input.evaluate((el) => {
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          keyCode: 229,
          bubbles: true,
          cancelable: true,
        }),
      );
      return (el as HTMLInputElement).value;
    });
    expect(value).toBe("is:");
  });
});

test.describe("placement", () => {
  test("hangs the menu from the word under the caret", async ({ page }) => {
    const input = field(page);
    await input.click();
    await type(input, "is:open label:b");
    const box = (await input.boundingBox()) as NonNullable<
      Awaited<ReturnType<Locator["boundingBox"]>>
    >;
    // The value being typed starts about 15 characters in, not at the start.
    await expect(async () => {
      const popup = (await menu(page).boundingBox()) as NonNullable<
        Awaited<ReturnType<Locator["boundingBox"]>>
      >;
      expect(popup.x).toBeGreaterThan(box.x + 100);
      expect(popup.y).toBeGreaterThan(box.y + box.height - 8);
    }).toPass();
  });

  test("mirrors under dir=rtl", async ({ page }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const input = field(page);
    await input.click();
    await type(input, "is:open la");
    const box = (await input.boundingBox()) as NonNullable<
      Awaited<ReturnType<Locator["boundingBox"]>>
    >;
    await expect(async () => {
      const popup = (await menu(page).boundingBox()) as NonNullable<
        Awaited<ReturnType<Locator["boundingBox"]>>
      >;
      // Text starts at the right edge, so the menu hangs off it toward the left.
      expect(popup.x + popup.width).toBeGreaterThan(box.x + box.width / 2);
      expect(popup.x + popup.width).toBeLessThanOrEqual(box.x + box.width + 1);
    }).toPass();
  });
});

test.describe("accessibility", () => {
  test("has no detectable violations, closed or open, in Gray 100 and RTL", async ({
    page,
  }) => {
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await type(field(page), 'is:open nope:1 "a phrase" la');
    await page.keyboard.press("ArrowDown");
    await expect(menu(page)).toBeVisible();
    const open = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(open.violations).toEqual([]);

    await page.evaluate(() => {
      document.documentElement.classList.add("bx--g100");
      document.documentElement.setAttribute("dir", "rtl");
    });
    const dark = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(dark.violations).toEqual([]);
  });
});
