import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

const field = (page: Page) =>
  page.getByRole("textbox", { name: "Calculated price" });
const layer = (page: Page) => page.locator(".bx--formula-input__layer");
const menu = (page: Page) => page.getByRole("listbox", { name: /.+/ });
const option = (page: Page, name: string | RegExp) =>
  page.getByRole("option", { name });
const output = (page: Page, id: string) => page.getByTestId(id);

declare global {
  interface Window {
    __formula: {
      setValue(value: string): void;
      setProps(props: Record<string, unknown>): void;
    };
  }
}

async function setValue(page: Page, value: string) {
  await page.evaluate((v) => window.__formula.setValue(v), value);
  await expect(output(page, "value")).toHaveText(value, {
    useInnerText: false,
  });
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
  await page.goto("/formula-input.html");
  await field(page).waitFor();
  await expect(layer(page)).toBeVisible();
});

test.describe("editing", () => {
  test("completes a function from the keyboard and puts the caret inside it", async ({
    page,
  }) => {
    const input = field(page);
    await setValue(page, "");
    await input.click();
    await type(input, "RO");
    await expect(option(page, /^ROUND/)).toBeVisible();
    await expect(input).toHaveAttribute("aria-activedescendant", /option-0$/);

    await page.keyboard.press("Tab");
    await expect(input).toHaveValue("ROUND()");
    await expect(menu(page)).toHaveCount(0);
    // The signature help shows the argument the caret is in.
    await expect(page.locator(".bx--formula-input__signature")).toContainText(
      "ROUND(number, [digits])",
    );
    await type(input, "price, 2)");
    await expect(input).toHaveValue("ROUND(price, 2)");
    await expect(output(page, "result")).toHaveText("100");
    await expect(output(page, "errors")).toHaveText("0");
  });

  test("completes a field in braces and keeps Hebrew labels", async ({
    page,
  }) => {
    const input = field(page);
    await setValue(page, "");
    await input.click();
    await type(input, "{");
    await expect(option(page, /הכנסות/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu(page)).toHaveCount(0);

    await type(input, "הכ");
    await expect(option(page, /הכנסות/)).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("{revenue}");
  });

  test("underlines an error with a message, and F8 moves to it", async ({
    page,
  }) => {
    const input = field(page);
    await setValue(page, "price + FOO(1) * (2");
    await expect(page.locator(".bx--formula-input__error")).not.toHaveCount(0);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    const message = page.locator(".bx--form-requirement").first();
    await expect(message).toContainText('Unknown function "FOO"');
    await expect(message).toContainText("1 more error");
    await expect(input).toHaveAttribute(
      "aria-errormessage",
      (await message.getAttribute("id")) ?? "",
    );

    await input.click();
    await input.evaluate((el: HTMLTextAreaElement) =>
      el.setSelectionRange(0, 0),
    );
    await page.keyboard.press("F8");
    await expect
      .poll(() =>
        input.evaluate((el: HTMLTextAreaElement) =>
          el.value.slice(el.selectionStart, el.selectionEnd),
        ),
      )
      .toBe("FOO");
  });

  test("grows with the formula, then scrolls, and keeps the caret in view", async ({
    page,
  }) => {
    const input = field(page);
    await page.evaluate(() => window.__formula.setProps({ maxRows: 3 }));
    await setValue(page, "1");
    const one = (await input.boundingBox())?.height ?? 0;

    await setValue(page, Array.from({ length: 200 }, (_, i) => i).join(" + "));
    await expect
      .poll(async () => (await input.boundingBox())?.height ?? 0)
      .toBeGreaterThan(one * 2);
    const scroller = page.locator(".bx--formula-input__scroller");
    const box = (await scroller.boundingBox()) as NonNullable<
      Awaited<ReturnType<Locator["boundingBox"]>>
    >;
    expect(box.height).toBeLessThan(one + 3 * 20 + 1);

    await input.click();
    await input.evaluate((el: HTMLTextAreaElement) =>
      el.setSelectionRange(el.value.length, el.value.length),
    );
    await type(input, " + 7");
    await expect
      .poll(() => scroller.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    const inside = await page.evaluate(() => {
      const area = document.querySelector("textarea") as HTMLTextAreaElement;
      const scrollerBox = (
        area.closest(".bx--formula-input__scroller") as HTMLElement
      ).getBoundingClientRect();
      const range = document.createRange();
      const text = document.querySelector(
        ".bx--formula-input__layer span:last-child",
      )?.firstChild as Text;
      range.setStart(text, text.length);
      range.collapse(true);
      const rect = range.getBoundingClientRect();
      return (
        rect.bottom <= scrollerBox.bottom + 1 && rect.top >= scrollerBox.top - 1
      );
    });
    expect(inside).toBe(true);
  });

  test("does not hold up the page for an adversarial formula", async ({
    page,
  }) => {
    const input = field(page);
    for (const hostile of [
      "(".repeat(10000),
      `${"(".repeat(10000)}1${")".repeat(10000)}`,
      `${"-".repeat(50000)}1`,
      "9".repeat(5000),
      "1e999 + 1e999",
      `${"1+".repeat(20000)}1`,
    ]) {
      const started = Date.now();
      await setValue(page, hostile);
      await expect(layer(page)).toHaveText(hostile, { useInnerText: false });
      expect(Date.now() - started).toBeLessThan(5000);
    }
    await setValue(page, "(".repeat(10000));
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator(".bx--form-requirement")).toContainText(
      "nested too deeply",
    );

    // Still alive: it takes typing.
    await setValue(page, "");
    await input.click();
    await type(input, "1+1");
    await expect(output(page, "result")).toHaveText("2");
  });
});

test.describe("typing latency", () => {
  test("a key in a formula of 2,000 characters reaches the screen in a few frames", async ({
    page,
    browserName,
  }) => {
    const formula = Array.from(
      { length: 90 },
      (_, i) => `IF(price > ${i}, ROUND(cost * 1.${i}, 2), qty)`,
    )
      .join(" + ")
      .slice(0, 2000);
    expect(formula.length).toBe(2000);
    await setValue(page, formula);
    const input = field(page);
    await input.click();
    await page.keyboard.press("Control+End");

    const times = await page.evaluate(async () => {
      const area = document.querySelector("textarea") as HTMLTextAreaElement;
      const out: number[] = [];
      for (let i = 0; i < 30; i++) {
        const started = performance.now();
        area.setRangeText(
          String(i % 10),
          area.value.length,
          area.value.length,
          "end",
        );
        area.dispatchEvent(
          new InputEvent("input", { bubbles: true, inputType: "insertText" }),
        );
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        out.push(performance.now() - started);
      }
      return out;
    });
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const p95 = times[Math.floor(times.length * 0.95)];
    console.log(
      `typing latency ${browserName}: median ${median.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`,
    );
    // Two frames are about 33 ms; the rest is the field's own work.
    expect(median).toBeLessThan(120);
  });
});

/**
 * Where the ink of a box sits, in thirds across it: the centre of mass of
 * the dark pixels, in CSS pixels from the box's corner.
 */
async function ink(page: Page, target: Locator) {
  const png = await target.screenshot();
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height);
    const scale = window.devicePixelRatio;
    const third = Math.floor(bitmap.width / 3);
    const result = [0, 1, 2].map(() => ({ x: 0, y: 0, mass: 0 }));
    for (let y = 0; y < bitmap.height; y++) {
      for (let x = 0; x < bitmap.width; x++) {
        const i = (y * bitmap.width + x) * 4;
        const luminance =
          0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        const weight = Math.max(0, 150 - luminance) / 150;
        if (weight === 0) continue;
        const part = result[Math.min(2, Math.floor(x / third))];
        part.x += weight * x;
        part.y += weight * y;
        part.mass += weight;
      }
    }
    return result.map((part) => ({
      x: part.mass > 0 ? part.x / part.mass / scale : Number.NaN,
      y: part.mass > 0 ? part.y / part.mass / scale : Number.NaN,
      mass: part.mass,
    }));
  }, png.toString("base64"));
}

const PLAIN_FIELD =
  ".bx--formula-input__layer{visibility:hidden!important}" +
  "textarea.bx--formula-input__input{color:#000!important;-webkit-text-fill-color:#000!important;caret-color:transparent!important}";
const PLAIN_LAYER =
  ".bx--formula-input__layer,.bx--formula-input__layer span{color:#000!important;background:none!important;text-decoration:none!important;-webkit-text-fill-color:#000!important}" +
  "textarea.bx--formula-input__input{caret-color:transparent!important}";

/** How far the layer's ink is from the field's own, per third, in pixels. */
async function drift(page: Page) {
  const target = page.locator(".bx--formula-input__scroller");
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  const style = await page.addStyleTag({ content: PLAIN_FIELD });
  const own = await ink(page, target);
  await style.evaluate((el) => el.remove());
  const second = await page.addStyleTag({ content: PLAIN_LAYER });
  const drawn = await ink(page, target);
  await second.evaluate((el) => el.remove());
  return own.map((part, i) => ({
    across: Math.abs(part.x - drawn[i].x) || 0,
    down: Math.abs(part.y - drawn[i].y) || 0,
    mass: part.mass,
  }));
}

test.describe("the layer stays under the text", () => {
  const cases: [string, string, "ltr" | "rtl"][] = [
    ["short Latin", 'IF(status = "open", price * 1.2, ROUND(price, 2))', "ltr"],
    [
      "wrapped Latin",
      Array.from(
        { length: 30 },
        (_, i) => `IF(price > ${i}, qty * ${i}, cost)`,
      ).join(" + "),
      "ltr",
    ],
    [
      "Hebrew field labels",
      '{הכנסות} - {net revenue} + "שלום עולם" * qty',
      "ltr",
    ],
    [
      "Hebrew labels, RTL page",
      '{הכנסות} - {net revenue} + "שלום עולם" * qty',
      "rtl",
    ],
    [
      "Hebrew first",
      'שלום + {הכנסות} * 2 + ROUND(price, 2) + "abc" + {net revenue} + qty + cost',
      "ltr",
    ],
  ];

  for (const [name, formula, dir] of cases) {
    test(`${name}`, async ({ page, browserName }) => {
      await page.evaluate(
        (d) => document.documentElement.setAttribute("dir", d),
        dir,
      );
      await setValue(page, formula);
      await expect(layer(page)).toHaveText(formula, { useInnerText: false });
      const parts = await drift(page);
      console.log(
        `drift ${browserName} ${name}: ${parts.map((p) => `${p.across.toFixed(2)}/${p.down.toFixed(2)}`).join(" ")}`,
      );
      expect(parts.some((part) => part.mass > 0)).toBe(true);
      for (const part of parts) {
        if (part.mass === 0) continue;
        expect(part.across).toBeLessThan(1.25);
        expect(part.down).toBeLessThan(1);
      }
    });
  }

  test("scrolled to the end of a field that scrolls", async ({
    page,
    browserName,
  }) => {
    await page.evaluate(() => window.__formula.setProps({ maxRows: 2 }));
    const formula = Array.from(
      { length: 80 },
      (_, i) => `ROUND(cost * ${i}, 2)`,
    ).join(" + ");
    await setValue(page, formula);
    await page.locator(".bx--formula-input__scroller").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const parts = await drift(page);
    console.log(
      `drift ${browserName} scrolled: ${parts.map((p) => `${p.across.toFixed(2)}/${p.down.toFixed(2)}`).join(" ")}`,
    );
    expect(parts.some((part) => part.mass > 0)).toBe(true);
    for (const part of parts) {
      if (part.mass === 0) continue;
      expect(part.across).toBeLessThan(1.25);
      expect(part.down).toBeLessThan(1);
    }
  });
});

test.describe("the formula reads left to right", () => {
  test("in an RTL page the field stays LTR and only the label and message flip", async ({
    page,
  }) => {
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    await setValue(page, "{הכנסות} * FOO(1)");
    const read = await page.evaluate(() => {
      const area = document.querySelector("textarea") as HTMLTextAreaElement;
      const label = document.querySelector("label") as HTMLElement;
      const message = document.querySelector(
        ".bx--form-requirement",
      ) as HTMLElement;
      const areaBox = area.getBoundingClientRect();
      const labelBox = label.getBoundingClientRect();
      const range = document.createRange();
      const text = document.querySelector(".bx--formula-input__layer")
        ?.firstChild as Text;
      range.setStart(text, 0);
      range.setEnd(text, 1);
      return {
        direction: getComputedStyle(area).direction,
        align: getComputedStyle(area).textAlign,
        firstGlyphFromLeft: range.getBoundingClientRect().left - areaBox.left,
        labelFromRight: areaBox.right - labelBox.right,
        messageDirection: getComputedStyle(message).direction,
      };
    });
    expect(read.direction).toBe("ltr");
    expect(read.align).toBe("left");
    // The formula starts at the left edge (inside its padding).
    expect(read.firstGlyphFromLeft).toBeLessThan(24);
    // The label follows the page and sits at the right.
    expect(read.labelFromRight).toBeLessThan(2);
    expect(read.messageDirection).toBe("rtl");
  });
});

test.describe("forced colors", () => {
  test("draws the error as a wavy rule in a system color, with the text shown by the field", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari has no forced colors mode");
    await page.emulateMedia({ forcedColors: "active" });
    await setValue(page, "price + FOO(1) + {revenue}");
    const read = await page.evaluate(() => {
      const area = getComputedStyle(
        document.querySelector("textarea") as HTMLTextAreaElement,
      );
      const error = getComputedStyle(
        document.querySelector(".bx--formula-input__error") as HTMLElement,
      );
      const fieldRef = getComputedStyle(
        document.querySelector(
          ".bx--formula-input__field:not(.bx--formula-input__error)",
        ) as HTMLElement,
      );
      const layer = getComputedStyle(
        document.querySelector(".bx--formula-input__layer") as HTMLElement,
      );
      const probe = document.createElement("span");
      probe.style.color = "CanvasText";
      document.body.append(probe);
      const canvasText = getComputedStyle(probe).color;
      probe.remove();
      return {
        areaColor: area.color,
        errorStyle: error.textDecorationStyle,
        errorColor: error.textDecorationColor,
        errorText: error.color,
        refStyle: fieldRef.textDecorationStyle,
        adjust: layer.forcedColorAdjust,
        canvasText,
      };
    });
    // The text is the field's, in the system text color: not transparent.
    expect(read.areaColor).toBe(read.canvasText);
    expect(read.errorStyle).toBe("wavy");
    expect(read.errorColor).toBe(read.canvasText);
    expect(read.refStyle).toBe("dotted");
    expect(read.adjust).toBe("none");
    // The layer paints no text of its own.
    expect(read.errorText).toBe("rgba(0, 0, 0, 0)");
  });
});

test.describe("IME", () => {
  test("a composition closes the list, keeps the layer in step and offers again when it ends", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "drives Chromium's IME through CDP");
    const input = field(page);
    await setValue(page, "");
    await input.click();
    await type(input, "RO");
    await expect(menu(page)).toBeVisible();

    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "日本",
      selectionStart: 2,
      selectionEnd: 2,
    });
    await expect(menu(page)).toHaveCount(0);
    await expect(input).toHaveValue("RO日本");
    await expect(layer(page)).toHaveText("RO日本", { useInnerText: false });

    await client.send("Input.insertText", { text: "日本" });
    await expect(input).toHaveValue("RO日本");
    await expect(layer(page)).toHaveText("RO日本", { useInnerText: false });
  });

  test("an Enter that ends a composition does not accept a row", async ({
    page,
  }) => {
    const input = field(page);
    await setValue(page, "");
    await input.click();
    await type(input, "RO");
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
      return (el as HTMLTextAreaElement).value;
    });
    expect(value).toBe("RO");
  });
});

test.describe("placement", () => {
  test("hangs the list from the word under the caret", async ({ page }) => {
    const input = field(page);
    await setValue(page, "");
    await input.click();
    await type(input, "price * 1.2 + sta");
    const box = (await input.boundingBox()) as NonNullable<
      Awaited<ReturnType<Locator["boundingBox"]>>
    >;
    await expect(async () => {
      const popup = (await menu(page).boundingBox()) as NonNullable<
        Awaited<ReturnType<Locator["boundingBox"]>>
      >;
      // About 14 characters in, not at the start of the field.
      expect(popup.x).toBeGreaterThan(box.x + 100);
      expect(popup.y).toBeGreaterThan(box.y + 24);
    }).toPass();
  });
});

test.describe("accessibility", () => {
  test("has no detectable violations, closed or open, in Gray 100 and RTL", async ({
    page,
  }) => {
    const closed = await new AxeBuilder({ page }).include("#app").analyze();
    expect(closed.violations).toEqual([]);

    await setValue(page, "");
    const input = field(page);
    await input.click();
    await type(input, "FOO(ROUND(pr");
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
    // The fill fades with the theme.
    await page.waitForTimeout(400);
    const dark = await new AxeBuilder({ page })
      .include("#app")
      .include("[data-floating-portal]")
      .analyze();
    expect(dark.violations).toEqual([]);
  });

  test("describes the field by its hint, the result and the signature", async ({
    page,
  }) => {
    const input = field(page);
    await input.click();
    const described = await input.getAttribute("aria-describedby");
    expect(described?.split(" ").length).toBeGreaterThanOrEqual(3);
    for (const id of described?.split(" ") ?? []) {
      await expect(page.locator(`[id="${id}"]`)).toHaveCount(1);
    }
    await expect(input).not.toHaveAttribute("role");
    await expect(input).not.toHaveAttribute("aria-expanded");
  });
});
