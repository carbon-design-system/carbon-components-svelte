import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./helpers/host";

declare global {
  interface Window {
    __latency?: (value: string) => number;
    __ignoreAbort?: boolean;
  }
}

const field = (page: Page, name: string) =>
  page.getByRole("textbox", { name, exact: true });
/** The ghost text that is showing, if any, read from the focused field's layer. */
const ghostText = (page: Page) =>
  page.evaluate(() => {
    const frame = [...document.querySelectorAll(".bx--inline-suggest")].find(
      (node) => !(node as HTMLElement).hidden,
    );
    return (
      frame?.querySelector(".bx--inline-suggest__ghost")?.textContent ?? ""
    );
  });

// WebKit holds a screenshot until the page's web fonts load. They come from
// a CDN, so the layer-drift screenshots would wait on the network.
const EXTERNAL = /^https?:\/\/(?!localhost|127\.0\.0\.1)/;

test.beforeEach(async ({ page }) => {
  await page.unroute(EXTERNAL);
  await page.route(EXTERNAL, (route) => route.abort());
  await page.goto("/inline-suggest.html");
  await expect(field(page, "Email")).toBeVisible();
});

test.describe("accepting", () => {
  test("Tab accepts at the end, and the next Tab moves focus on", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gm");
    await expect.poll(() => ghostText(page)).toBe("ail.com");

    await page.keyboard.press("Tab");
    await expect(email).toHaveValue("ada@gmail.com");
    await expect(email).toBeFocused();
    expect(await ghostText(page)).toBe("");

    await page.keyboard.press("Tab");
    await expect(field(page, "Message")).toBeFocused();
  });

  test("the arrow along the line accepts, and Ctrl+arrow takes a word", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gi");
    await expect.poll(() => ghostText(page)).toBe("thub.com");
    await page.keyboard.press("ArrowRight");
    await expect(email).toHaveValue("ada@github.com");

    const message = field(page, "Message");
    await message.click();
    await message.pressSequentially("Thanks for");
    await expect
      .poll(() => ghostText(page))
      .toBe(" reaching out. We will get back to you within two business days.");
    await page.keyboard.press("Control+ArrowRight");
    await expect(message).toHaveValue("Thanks for reaching");
    expect(await ghostText(page)).toBe(
      " out. We will get back to you within two business days.",
    );
  });

  test("a tap on the accept button accepts and keeps the focus in the field", async ({
    page,
  }) => {
    const search = field(page, "Search");
    await search.click();
    await search.pressSequentially("Quarterly rev");
    await expect.poll(() => ghostText(page)).toBe("iew notes");
    await page.getByRole("button", { name: "Accept: iew notes" }).click();
    await expect(search).toHaveValue("Quarterly review notes");
    await expect(search).toBeFocused();
  });

  test("shows the accept button only when asked for or on a coarse pointer", async ({
    page,
  }) => {
    const message = field(page, "Message");
    await message.click();
    await message.pressSequentially("Thanks for");
    await expect.poll(() => ghostText(page)).not.toBe("");
    await expect(
      page.locator(".bx--inline-suggest__accept:visible"),
    ).toHaveCount(0);
  });

  test("Escape dismisses without leaving the field, and typing brings it back", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@g");
    await expect.poll(() => ghostText(page)).toBe("mail.com");
    await page.keyboard.press("Escape");
    await expect.poll(() => ghostText(page)).toBe("");
    await expect(email).toHaveValue("ada@g");
    await expect(email).toBeFocused();
    await page.keyboard.press("m");
    await expect.poll(() => ghostText(page)).toBe("ail.com");
  });

  test("an accepted suggestion is one undo step", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName === "webkit",
      "WebKit joins the undo with the typing",
    );
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gm");
    await page.keyboard.press("Tab");
    await expect(email).toHaveValue("ada@gmail.com");
    await page.keyboard.press("ControlOrMeta+z");
    await expect(email).toHaveValue("ada@gm");
  });
});

test.describe("typing", () => {
  test("typing through the suggestion keeps it, and a mismatch replaces it", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@g");
    await expect.poll(() => ghostText(page)).toBe("mail.com");
    await page.keyboard.type("ma");
    await expect.poll(() => ghostText(page)).toBe("il.com");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("i");
    await expect.poll(() => ghostText(page)).toBe("thub.com");
  });

  test("the caret off the end hides the suggestion, and the end brings it back", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gm");
    await expect.poll(() => ghostText(page)).toBe("ail.com");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => ghostText(page)).toBe("");
    await page.keyboard.press("Tab");
    // Tab was not taken: with no suggestion it moves on.
    await expect(field(page, "Message")).toBeFocused();
  });

  test("an answer to older text is dropped, even when its request ignores the abort", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__ignoreAbort = true;
      window.__latency = (value) => (value.length < 10 ? 900 : 30);
    });
    const message = field(page, "Message");
    await message.click();
    await message.pressSequentially("Thanks");
    // Past the debounce, so the slow request for "Thanks" is in flight.
    await page.waitForTimeout(250);
    await message.pressSequentially(" for reach");
    await expect
      .poll(() => ghostText(page))
      .toBe("ing out. We will get back to you within two business days.");
    // The slow answer lands now. It is for "Thanks", so it begins with a space.
    await page.waitForTimeout(1000);
    expect(await ghostText(page)).toBe(
      "ing out. We will get back to you within two business days.",
    );
  });
});

test.describe("placeholder", () => {
  test("hides the placeholder under a suggestion in an empty field", async ({
    page,
  }) => {
    const search = field(page, "Search");
    await expect(search).toHaveAttribute("placeholder", "Recent searches");
    await search.focus();
    await expect.poll(() => ghostText(page)).toBe("Quarterly report");
    const placeholder = await search.evaluate((el) => {
      const style = getComputedStyle(el, "::placeholder");
      return { color: style.color, opacity: style.opacity };
    });
    expect(placeholder).toEqual({ color: "rgba(0, 0, 0, 0)", opacity: "0" });
    await search.pressSequentially("Q");
    await expect(search).not.toHaveAttribute("data-ccs-inline-suggest", "");
  });
});

/**
 * How far the layer's ghost text sits from where the field itself draws the
 * same characters, as the difference between the centres of mass of the ink
 * in each third of the field, in px. The field draws `typed + ghost` in black
 * with the layer hidden; then the layer draws it in black over the field with
 * `typed` in it, whose own ink is clear.
 */
async function drift(
  page: Page,
  input: Locator,
  part: "all" | "typed" = "all",
) {
  const wrapper = input.locator("xpath=..");
  const style = await page.addStyleTag({ content: "x{}" });
  const state = await input.evaluate((el) => {
    const e = el as HTMLInputElement | HTMLTextAreaElement;
    const frame = [
      ...e.parentElement!.querySelectorAll(".bx--inline-suggest"),
    ].find((node) => !(node as HTMLElement).hidden);
    return {
      typed: e.value,
      ghost:
        frame?.querySelector(".bx--inline-suggest__ghost")?.textContent ?? "",
      left: e.scrollLeft,
      top: e.scrollTop,
      scrollbar: e.offsetWidth - e.clientWidth - 0 > 2,
    };
  });
  expect(state.ghost).not.toBe("");
  const base = `.bx--text-input,.bx--text-area{background:#fff !important;outline:none !important;caret-color:transparent !important;border:0 !important}.bx--inline-suggest__accept{display:none !important}`;
  const shot = async (layer: boolean) => {
    await input.evaluate(
      (el, [layer, state, part]) => {
        const e = el as HTMLInputElement | HTMLTextAreaElement;
        const frame = e.parentElement!.querySelector(
          ".bx--inline-suggest",
        ) as HTMLElement;
        if (layer) {
          e.value = state.typed;
          frame.style.display = "";
          e.style.overflowY = "";
        } else {
          frame.style.display = "none";
          e.value = part === "typed" ? state.typed : state.typed + state.ghost;
          if (e.localName === "textarea") {
            e.style.overflowY = state.scrollbar ? "scroll" : "hidden";
          }
          e.scrollLeft = state.left;
          e.scrollTop = state.top;
        }
      },
      [layer, state, part] as const,
    );
    await style.evaluate(
      (node, css) => {
        node.textContent = css;
      },
      layer
        ? `${base}.bx--text-input,.bx--text-area{color:transparent !important}.bx--inline-suggest__typed{color:#000 !important}.bx--inline-suggest__ghost{color:${part === "typed" ? "transparent" : "#000"} !important}`
        : `${base}.bx--text-input,.bx--text-area{color:#000 !important}`,
    );
    return (await wrapper.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
  };
  const fieldShot = await shot(false);
  const layerShot = await shot(true);
  // Put the field back as it was.
  await input.evaluate((el, typed) => {
    (el as HTMLInputElement).value = typed;
  }, state.typed);
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
      const margin = Math.round(20 * dpr);
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
        for (let y = Math.round(2 * dpr); y < h - 2 * dpr; y++) {
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
        out.push(
          ca.mass > 1500 && cb.mass > 1500
            ? { dx: cb.x - ca.x, dy: cb.y - ca.y }
            : null,
        );
      }
      return out;
    },
    [fieldShot, layerShot],
  );
}

const SENTENCE = "the quick brown fox jumps over the lazy dog and then ";

test.describe("the layer lines up with the field's own text", () => {
  const cases: Array<[string, "ltr" | "rtl", string, string]> = [
    ["a short line", "ltr", "Subject", "Hello world"],
    ["a line that scrolls", "ltr", "Subject", SENTENCE.repeat(3)],
    ["a short wrapped text", "ltr", "Notes", "Hello there"],
    ["a long text that scrolls", "ltr", "Notes", SENTENCE.repeat(9)],
    ["Arabic wrapped in a text area", "rtl", "Notes", "مرحبا بالعالم"],
    ["Hebrew in a right to left field", "rtl", "Search", "שלו"],
    ["Arabic in a right to left field", "rtl", "Search", "مرح"],
  ];

  for (const [name, dir, label, text] of cases) {
    test(`${name}, ${dir}`, async ({ page }) => {
      await page.evaluate(
        (d) => document.documentElement.setAttribute("dir", d),
        dir,
      );
      const input = field(page, label);
      await input.click();
      await input.pressSequentially(text, { delay: 0 });
      await expect.poll(() => ghostText(page)).not.toBe("");
      // The caret scrolls the field as the text lands, so measure until it
      // settles.
      await expect(async () => {
        const thirds = [
          ...(await drift(page, input)),
          ...(await drift(page, input, "typed")),
        ];
        expect(thirds.some((third) => third !== null)).toBe(true);
        for (const third of thirds) {
          if (!third) continue;
          expect(Math.abs(third.dx)).toBeLessThan(1.5);
          expect(Math.abs(third.dy)).toBeLessThan(1.25);
        }
      }).toPass({ timeout: 8000 });
    });
  }

  // Text that sits against the edge the suggestion grows towards: English in
  // a right to left field, and Hebrew in a left to right one. Text added
  // after it would push it away, while the field's own text stays put.
  for (const [name, dir, label, text] of [
    ["English in a right to left text area", "rtl", "Notes", "Hello there"],
    ["Hebrew in a left to right field", "ltr", "Search", "שלו"],
  ] as const) {
    test(`offers nothing where it would move the typed text: ${name}`, async ({
      page,
    }) => {
      await page.evaluate(
        (d) => document.documentElement.setAttribute("dir", d),
        dir,
      );
      const input = field(page, label);
      await input.click();
      await input.pressSequentially(text, { delay: 0 });
      await page.waitForTimeout(300);
      expect(await ghostText(page)).toBe("");
      // With none showing, Tab is not taken.
      await page.keyboard.press("Tab");
      await expect(input).toHaveValue(text);
      await expect(input).not.toBeFocused();
    });
  }

  test("follows a scroll that no event announces", async ({
    page,
    browserName,
  }) => {
    const subject = field(page, "Subject");
    await subject.click();
    await subject.pressSequentially(SENTENCE.repeat(3), { delay: 0 });
    const read = () =>
      subject.evaluate((el) => {
        const layer = el.parentElement?.querySelector(
          ".bx--inline-suggest__layer",
        ) as HTMLElement;
        return {
          field: (el as HTMLInputElement).scrollLeft,
          layer: layer.scrollLeft,
        };
      });
    await expect.poll(async () => (await read()).field).toBeGreaterThan(50);
    // No `scroll`, `input` or key event comes from this. Firefox scrolls the
    // caret back into view, so the layer is compared with the field, and
    // the field is only expected to take the offset in Chromium.
    await subject.evaluate((el) => {
      (el as HTMLInputElement).scrollLeft = 10;
    });
    await expect
      .poll(async () => {
        const { field, layer } = await read();
        return field === layer;
      })
      .toBe(true);
    if (browserName === "chromium") expect((await read()).layer).toBe(10);
  });
});

test.describe("composition", () => {
  test("shows nothing while an IME composes, and the suggestion returns on commit", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium can drive an IME from a test",
    );
    const search = field(page, "Search");
    await search.focus();
    const client = await page.context().newCDPSession(page);
    await client.send("Input.imeSetComposition", {
      text: "Quar",
      selectionStart: 4,
      selectionEnd: 4,
    });
    await expect(search).toHaveValue("Quar");
    expect(await ghostText(page)).toBe("");
    await client.send("Input.insertText", { text: "Quar" });
    await expect(search).toHaveValue("Quar");
    await expect.poll(() => ghostText(page)).toBe("terly report");
  });

  test("keyCode 229 keys are left to the IME", async ({ page }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gm");
    await expect.poll(() => ghostText(page)).toBe("ail.com");
    await email.evaluate((el) => {
      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          keyCode: 229,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    await expect(email).toHaveValue("ada@gm");
    expect(await ghostText(page)).toBe("ail.com");
  });
});

test.describe("forced colors", () => {
  test("the suggestion reads GrayText, and the typed copy stays clear", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari has no forced colors mode");
    await page.emulateMedia({ forcedColors: "active" });
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@gm");
    await expect.poll(() => ghostText(page)).toBe("ail.com");
    const colors = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "GrayText";
      document.body.append(probe);
      const grayText = getComputedStyle(probe).color;
      probe.remove();
      const layer = document.querySelector(
        ".bx--inline-suggest:not([hidden])",
      ) as HTMLElement;
      return {
        grayText,
        ghost: getComputedStyle(
          layer.querySelector(".bx--inline-suggest__ghost") as Element,
        ).color,
        typed: getComputedStyle(
          layer.querySelector(".bx--inline-suggest__typed") as Element,
        ).color,
        adjust: getComputedStyle(
          layer.querySelector(".bx--inline-suggest__layer") as Element,
        ).forcedColorAdjust,
        fieldText: getComputedStyle(document.activeElement as Element).color,
      };
    });
    expect(colors.ghost).toBe(colors.grayText);
    expect(colors.typed).toBe("rgba(0, 0, 0, 0)");
    expect(colors.adjust).toBe("none");
    expect(colors.ghost).not.toBe(colors.fieldText);
  });
});

test.describe("a11y", () => {
  for (const [name, setup, typed, tail] of [
    ["white", async () => {}, "Quar", "terly report"],
    [
      "gray 100",
      async (page: Page) => {
        await page.evaluate(() =>
          document.documentElement.classList.add("bx--g100"),
        );
        // Carbon's fields fade their fill, and axe reads it mid-fade.
        await expect
          .poll(() =>
            field(page, "Search").evaluate(
              (el) => getComputedStyle(el).backgroundColor,
            ),
          )
          .toBe("rgb(38, 38, 38)");
      },
      "Quar",
      "terly report",
    ],
    [
      "right to left",
      (page: Page) =>
        page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        ),
      "שלו",
      "ם עולם",
    ],
  ] as const) {
    test(`has no detectable violations with a suggestion showing, ${name}`, async ({
      page,
    }) => {
      await setup(page);
      const search = field(page, "Search");
      await search.click();
      await search.pressSequentially(typed);
      await expect.poll(() => ghostText(page)).toBe(tail);
      await expect(
        page.getByRole("button", { name: `Accept: ${tail}` }),
      ).toBeVisible();

      const results = await new AxeBuilder({ page }).include("#app").analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test("a suggestion showing at load has no detectable violations", async ({
    page,
  }) => {
    await page.goto("/inline-suggest-open.html");
    await expect.poll(() => ghostText(page)).toBe("ail.com");
    await expect(
      page.getByRole("button", { name: "Accept: ail.com" }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).include("#app").analyze();
    expect(results.violations).toEqual([]);
  });

  test("announces the suggestion once it settles, not on every key", async ({
    page,
  }) => {
    const email = field(page, "Email");
    await email.click();
    await email.pressSequentially("ada@g");
    const region = page.locator("[aria-live=polite]").filter({
      hasText: "Suggestion:",
    });
    await expect(region).toHaveText("Suggestion: mail.com");
    // Typing through it says nothing new.
    await page.keyboard.type("m");
    await page.waitForTimeout(600);
    await expect(region).toHaveText("Suggestion: mail.com");
    await page.keyboard.press("Tab");
    await expect(
      page.locator("[aria-live=polite]").filter({ hasText: "accepted" }),
    ).toHaveText("Suggestion accepted");
  });
});
