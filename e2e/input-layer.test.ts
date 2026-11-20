import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { settleFontsReady } from "./helpers/fonts";
import { expect, test } from "./helpers/host";
import {
  drift,
  DRIFT_ACROSS,
  DRIFT_DOWN,
  frames,
  routeFontsAway,
  worst,
} from "./helpers/input-layer";

type Layer = {
  caretRect: (index: number) => Box | null;
  rangeRects: (start: number, end: number) => Box[];
  update: () => void;
  destroy: () => void;
  element: HTMLElement;
  content: HTMLElement;
};
type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

declare global {
  interface Window {
    __inputLayer: {
      createInputLayer: (field: HTMLElement, options: object) => Layer;
      caretRect: (field: HTMLElement, index: number) => Box | null;
      rangeRects: (field: HTMLElement, a: number, b: number) => Box[];
      qualifiers: (value: string) => object[];
      formula: (value: string) => object[];
    };
    __layers: Record<string, Layer>;
  }
}

interface Spec {
  id: string;
  kind: "input" | "textarea";
  mode: "behind" | "above" | "ink" | "none";
  dir?: "ltr" | "rtl" | "auto";
  width?: number;
  rows?: number;
  grow?: boolean;
  value?: string;
  segments?: "qualifiers" | "formula" | "plain";
}

/** Add a field with a layer to the page, built with Carbon's own markup. */
async function mountField(page: Page, spec: Spec) {
  await page.evaluate((spec) => {
    const lab = document.getElementById("lab");
    if (!lab) throw new Error("no lab");
    const holder = document.createElement("div");
    holder.id = spec.id;
    holder.style.width = `${spec.width ?? 360}px`;
    holder.style.setProperty("--ccs-input-layer-fill", "#fff");
    if (spec.dir) holder.dir = spec.dir;
    holder.innerHTML =
      spec.kind === "input"
        ? `<div class="bx--form-item"><div class="bx--text-input__field-outer-wrapper"><div class="bx--text-input__field-wrapper"><input class="bx--text-input bx--text-input--md" type="text" aria-label="${spec.id}" /></div></div></div>`
        : `<div class="bx--form-item"><div class="bx--text-area__wrapper"><textarea class="bx--text-area" aria-label="${spec.id}" rows="${spec.rows ?? 3}" style="resize: none"></textarea></div></div>`;
    lab.appendChild(holder);
    const field = holder.querySelector(spec.kind) as
      HTMLInputElement | HTMLTextAreaElement;
    if (spec.grow) {
      field.style.overflow = "hidden";
      const fit = () => {
        field.style.height = "auto";
        field.style.height = `${field.scrollHeight}px`;
      };
      field.addEventListener("input", fit);
      (field as unknown as { fit: () => void }).fit = fit;
    }
    field.value = spec.value ?? "";
    (field as unknown as { fit?: () => void }).fit?.();
    const api = window.__inputLayer;
    const segments =
      spec.segments === "qualifiers"
        ? api.qualifiers
        : spec.segments === "formula"
          ? api.formula
          : undefined;
    window.__layers ??= {};
    if (spec.mode === "none") return;
    window.__layers[spec.id] = api.createInputLayer(field, {
      position: spec.mode === "behind" ? "behind" : "above",
      ink: spec.mode === "ink" ? "layer" : "field",
      segments,
    });
  }, spec);
  return page.locator(`#${spec.id} ${spec.kind}`);
}

const LATIN = "is:open label:bug author:ada free words here";
const HEBREW = "שלום עולם is:open label:bug תוויות";
const ARABIC = "مرحبا بالعالم is:open label:bug";
const LONG =
  "is:open label:bug,ui author:ada -label:wontfix created:>=2026-01-01 comments:3..10 title:long free words that go on and on until the field must scroll sideways label:done more text ";
const HEBREW_LONG = `שלום עולם is:open label:bug ${"מילים נוספות בעברית ועוד ".repeat(14)}סוף`;
const MIXED_LONG = `is:open שלום label:bug ${"words מילים עוד text ".repeat(18)}end`;
const WRAPPED =
  "ROUND(price * 1.2, 2) + tax and a long tail of words that wrap onto several lines in this narrow field so the layer must wrap the same way";
const WRAPPED_HEBREW =
  "שלום עולם ROUND(price) מילים נוספות בעברית שמתארכות לכמה שורות בשדה צר כדי שהשכבה תעטוף אותן באותו אופן";

test.describe("the layer stays under the text", () => {
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  /** Type with real keys, so the field scrolls to its caret as a user's does. */
  async function typed(
    page: Page,
    id: string,
    kind: Spec["kind"],
    text: string,
  ) {
    const field = page.locator(`#${id} ${kind}`);
    await field.focus();
    await page.keyboard.type(text);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }

  const lineCases: Array<{
    name: string;
    text: string;
    dir?: "rtl";
    typed?: boolean;
    mode?: Spec["mode"];
  }> = [
    { name: "short Latin, LTR", text: LATIN },
    { name: "short Hebrew first, LTR", text: HEBREW },
    { name: "short Arabic first, LTR", text: ARABIC },
    { name: "short Latin, RTL", text: LATIN, dir: "rtl" },
    { name: "short Hebrew, RTL", text: HEBREW, dir: "rtl" },
    { name: "long Latin, typed, scrolled, LTR", text: LONG, typed: true },
    {
      name: "long Hebrew, typed, scrolled, LTR",
      text: HEBREW_LONG,
      typed: true,
    },
    {
      name: "long Latin, typed, scrolled, RTL",
      text: LONG,
      dir: "rtl",
      typed: true,
    },
    {
      name: "long Hebrew, typed, scrolled, RTL",
      text: HEBREW_LONG,
      dir: "rtl",
      typed: true,
    },
    {
      name: "long mixed, typed, scrolled, RTL",
      text: MIXED_LONG,
      dir: "rtl",
      typed: true,
    },
    { name: "long mixed, typed, scrolled, LTR", text: MIXED_LONG, typed: true },
    { name: "short Latin, above", text: LATIN, mode: "above" },
    {
      name: "long Latin, typed, above",
      text: LONG,
      typed: true,
      mode: "above",
    },
  ];

  for (const c of lineCases) {
    test(`an input: ${c.name}`, async ({ page }, info) => {
      const id = "case";
      await mountField(page, {
        id,
        kind: "input",
        mode: c.mode ?? "behind",
        dir: c.dir,
        segments: "qualifiers",
        value: c.typed ? "" : c.text,
      });
      if (c.typed) await typed(page, id, "input", c.text);
      const result = worst(await drift(page, id));
      info.annotations.push({
        type: "drift",
        description: `${c.name}: ${result.dx.toFixed(2)} across, ${result.dy.toFixed(2)} down, ${result.thirds} thirds`,
      });
      expect(result.thirds).toBeGreaterThan(0);
      expect(result.dx).toBeLessThan(DRIFT_ACROSS);
      expect(result.dy).toBeLessThan(DRIFT_DOWN);
    });
  }

  const areaCases: Array<{
    name: string;
    text: string;
    dir?: "rtl";
    typed?: boolean;
    rows?: number;
    mode?: Spec["mode"];
    grow?: boolean;
    width?: number;
  }> = [
    { name: "short Latin", text: "ROUND(price, 2) + tax" },
    { name: "wrapped Latin", text: WRAPPED, width: 260 },
    { name: "wrapped Hebrew first, LTR", text: WRAPPED_HEBREW, width: 260 },
    {
      name: "wrapped Hebrew, RTL",
      text: WRAPPED_HEBREW,
      dir: "rtl",
      width: 260,
    },
    { name: "wrapped Latin, RTL", text: WRAPPED, dir: "rtl", width: 260 },
    {
      name: "scrolled to the end",
      text: `${WRAPPED} ${WRAPPED} ${WRAPPED}`,
      typed: true,
      rows: 3,
      width: 260,
    },
    {
      name: "growing, typed",
      text: `${WRAPPED} ${WRAPPED}`,
      typed: true,
      grow: true,
      width: 260,
    },
    {
      name: "growing, lines",
      text: "one\ntwo\nthree\nfour",
      typed: true,
      grow: true,
    },
    { name: "above, wrapped", text: WRAPPED, mode: "above", width: 260 },
  ];

  for (const c of areaCases) {
    test(`a textarea: ${c.name}`, async ({ page }, info) => {
      const id = "case";
      await mountField(page, {
        id,
        kind: "textarea",
        mode: c.mode ?? "ink",
        dir: c.dir,
        segments: "formula",
        rows: c.rows,
        grow: c.grow,
        width: c.width,
        value: c.typed ? "" : c.text,
      });
      if (c.typed) await typed(page, id, "textarea", c.text);
      const result = worst(await drift(page, id));
      info.annotations.push({
        type: "drift",
        description: `${c.name}: ${result.dx.toFixed(2)} across, ${result.dy.toFixed(2)} down, ${result.thirds} thirds`,
      });
      expect(result.thirds).toBeGreaterThan(0);
      expect(result.dx).toBeLessThan(DRIFT_ACROSS);
      expect(result.dy).toBeLessThan(DRIFT_DOWN);
    });
  }

  test("a textarea keeps up while it grows and shrinks", async ({ page }) => {
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "textarea",
      mode: "ink",
      segments: "formula",
      grow: true,
      rows: 1,
      width: 260,
      value: "",
    });
    await field.focus();
    const heights: number[] = [];
    for (const line of ["alpha", "beta", "gamma", "delta"]) {
      await page.keyboard.type(`${line}\n`);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      heights.push(
        await page.evaluate(
          (id) =>
            (window.__layers[id].element as HTMLElement).getBoundingClientRect()
              .height,
          id,
        ),
      );
      const fieldHeight = await field.evaluate(
        (el) => el.getBoundingClientRect().height,
      );
      // The layer is the field's padding box: the field less its border.
      expect(Math.abs(heights[heights.length - 1] - fieldHeight)).toBeLessThan(
        2.5,
      );
    }
    expect(heights[3]).toBeGreaterThan(heights[0]);
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Backspace");
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const after = await page.evaluate(
      (id) =>
        (window.__layers[id].element as HTMLElement).getBoundingClientRect()
          .height,
      id,
    );
    expect(after).toBeLessThan(heights[3]);
  });
});

/**
 * The box the browser paints for a selection, as the field draws it: the
 * selection in a flat color, the layer hidden, and the pixels of that color
 * found in a screenshot. In viewport px.
 */
async function selectionBox(
  page: Page,
  id: string,
  start: number,
  end: number,
) {
  const field = page.locator(`#${id} input, #${id} textarea`);
  const style = await page.addStyleTag({
    content:
      "input::selection,textarea::selection{background:#f0f!important;color:#000!important;-webkit-text-fill-color:#000!important}" +
      ".bx--input-layer{visibility:hidden!important}*{transition:none!important}" +
      "input,textarea{caret-color:transparent!important;outline:none!important}",
  });
  await field.focus();
  await field.evaluate(
    (el, [a, b]) => (el as HTMLInputElement).setSelectionRange(a, b),
    [start, end],
  );
  await frames(page);
  const clip = await field.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  });
  const png = (await page.screenshot({ clip })).toString("base64");
  await style.evaluate((node) => node.remove());
  return page.evaluate(
    async ([png, clip]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const x = c.getContext("2d");
      if (!x) throw new Error("no canvas");
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const k = c.width / (clip as { width: number }).width;
      let left = Number.POSITIVE_INFINITY;
      let top = Number.POSITIVE_INFINITY;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < c.height; y++) {
        for (let xx = 0; xx < c.width; xx++) {
          const i = (y * c.width + xx) * 4;
          if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] > 200) {
            left = Math.min(left, xx);
            right = Math.max(right, xx + 1);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y + 1);
          }
        }
      }
      const origin = clip as { x: number; y: number };
      return right < 0
        ? null
        : {
            left: origin.x + left / k,
            right: origin.x + right / k,
            top: origin.y + top / k,
            bottom: origin.y + bottom / k,
          };
    },
    [png, clip] as const,
  );
}

const rects = (
  page: Page,
  id: string,
  kind: string,
  a: number,
  b: number,
  viaLayer: boolean,
) =>
  page.evaluate(
    ([id, kind, a, b, viaLayer]) => {
      const field = document.querySelector(`#${id} ${kind}`) as HTMLElement;
      return viaLayer
        ? window.__layers[id].rangeRects(a, b)
        : window.__inputLayer.rangeRects(field, a, b);
    },
    [id, kind, a, b, viaLayer] as const,
  );

test.describe("caretRect and rangeRects", () => {
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  const cases: Array<{
    name: string;
    kind: Spec["kind"];
    dir?: "rtl";
    value: string;
    range: [number, number];
    width?: number;
    typed?: boolean;
  }> = [
    {
      name: "input, Latin",
      kind: "input",
      value: "Measure these words well",
      range: [8, 17],
    },
    {
      name: "input, Latin, RTL field",
      kind: "input",
      dir: "rtl",
      value: "Measure these words well",
      range: [8, 17],
    },
    {
      name: "input, Hebrew, RTL field",
      kind: "input",
      dir: "rtl",
      value: "מדידה של המילים האלה",
      range: [6, 14],
    },
    {
      name: "input, Hebrew first, LTR field",
      kind: "input",
      value: "מדידה של המילים האלה",
      range: [6, 14],
    },
    {
      name: "input, scrolled to the end",
      kind: "input",
      value:
        "a long line of text that has to scroll the field sideways to reach its end, and here it ends",
      range: [80, 90],
      typed: true,
    },
    {
      name: "textarea, wrapped, first line",
      kind: "textarea",
      value: "Measure these words well on a line that wraps around",
      range: [8, 17],
      width: 220,
    },
    {
      name: "textarea, wrapped, second line",
      kind: "textarea",
      value: "Measure these words well on a line that wraps around the field",
      range: [30, 36],
      width: 220,
    },
    {
      name: "textarea, Hebrew, RTL",
      kind: "textarea",
      dir: "rtl",
      value: "מדידה של המילים האלה בשדה צר שמתעטף לכמה שורות",
      range: [6, 14],
      width: 220,
    },
  ];

  for (const c of cases) {
    for (const viaLayer of [true, false]) {
      test(`${c.name}, ${viaLayer ? "on the layer" : "on a hidden copy"}`, async ({
        page,
      }, info) => {
        const id = "case";
        await mountField(page, {
          id,
          kind: c.kind,
          mode: viaLayer ? "behind" : "none",
          dir: c.dir,
          width: c.width,
          value: c.typed ? "" : c.value,
        });
        if (c.typed) {
          await page.locator(`#${id} ${c.kind}`).focus();
          await page.keyboard.type(c.value);
        }
        await frames(page);
        const truth = await selectionBox(page, id, c.range[0], c.range[1]);
        const found = await rects(
          page,
          id,
          c.kind,
          c.range[0],
          c.range[1],
          viaLayer,
        );
        expect(truth).not.toBeNull();
        expect(found.length).toBeGreaterThan(0);
        const box = {
          left: Math.min(...found.map((r) => r.left)),
          right: Math.max(...found.map((r) => r.right)),
          mid:
            (Math.min(...found.map((r) => r.top)) +
              Math.max(...found.map((r) => r.bottom))) /
            2,
        };
        const t = truth as NonNullable<typeof truth>;
        const off = {
          left: Math.abs(box.left - t.left),
          right: Math.abs(box.right - t.right),
          mid: Math.abs(box.mid - (t.top + t.bottom) / 2),
        };
        info.annotations.push({
          type: "drift",
          description: `${c.name}, ${viaLayer ? "layer" : "copy"}: left ${off.left.toFixed(2)}, right ${off.right.toFixed(2)}, middle ${off.mid.toFixed(2)}`,
        });
        // A selection fills the line box and a range the font box, so the
        // middles may differ by a pixel.
        expect(off.left).toBeLessThan(1.5);
        expect(off.right).toBeLessThan(1.5);
        expect(off.mid).toBeLessThan(1.5);
      });
    }
  }

  test("the caret is the leading edge of the character, and of the end of the text", async ({
    page,
  }) => {
    const id = "case";
    await mountField(page, {
      id,
      kind: "input",
      mode: "none",
      value: "abc def",
    });
    await frames(page);
    const r = await page.evaluate(() => {
      const field = document.querySelector("#case input") as HTMLInputElement;
      const a = window.__inputLayer.rangeRects(field, 4, 5)[0];
      const at = window.__inputLayer.caretRect(field, 4);
      const end = window.__inputLayer.caretRect(field, 7);
      const last = window.__inputLayer.rangeRects(field, 6, 7)[0];
      const none = window.__inputLayer.caretRect(field, 99);
      return { a, at, end, last, none };
    });
    expect(r.at?.width).toBe(0);
    expect(Math.abs((r.at?.left ?? 0) - (r.a?.left ?? 99))).toBeLessThan(0.5);
    expect(Math.abs((r.end?.left ?? 0) - (r.last?.right ?? 99))).toBeLessThan(
      0.5,
    );
    // Past the end is the end.
    expect(r.none?.left).toBe(r.end?.left);
  });

  test("an empty field has a caret, and a hidden copy goes away", async ({
    page,
  }) => {
    const id = "case";
    await mountField(page, { id, kind: "textarea", mode: "none", value: "" });
    const before = await page.evaluate(
      () => document.querySelectorAll("#case .bx--input-layer").length,
    );
    const caret = await page.evaluate(() => {
      const field = document.querySelector(
        "#case textarea",
      ) as HTMLTextAreaElement;
      const r = window.__inputLayer.caretRect(field, 0);
      const box = field.getBoundingClientRect();
      return { r, box: { left: box.left, top: box.top } };
    });
    expect(caret.r).not.toBeNull();
    // At the start of the first line: inside the padding.
    expect(caret.r?.left).toBeGreaterThan(caret.box.left);
    expect(caret.r?.top).toBeGreaterThan(caret.box.top);
    expect(before).toBe(0);
    await frames(page);
    await frames(page);
    await expect(page.locator("#case .bx--input-layer")).toHaveCount(0);
  });

  test("a caret after a trailing newline is on the empty line", async ({
    page,
  }) => {
    const id = "case";
    await mountField(page, {
      id,
      kind: "textarea",
      mode: "ink",
      value: "one\n",
    });
    await frames(page);
    const r = await page.evaluate(() => {
      const field = document.querySelector(
        "#case textarea",
      ) as HTMLTextAreaElement;
      return {
        first: window.__inputLayer.caretRect(field, 0),
        end: window.__inputLayer.caretRect(field, 4),
      };
    });
    // One line height lower, back at the start of the line.
    expect((r.end?.top ?? 0) - (r.first?.top ?? 0)).toBeGreaterThan(15);
    expect(Math.abs((r.end?.left ?? 0) - (r.first?.left ?? 99))).toBeLessThan(
      1.5,
    );
  });
});

/** The offset of the layer's line from the left of its box, in px. */
const lineOffset = (page: Page, id: string) =>
  page.evaluate((id) => {
    const layer = window.__layers[id];
    const box = layer.element.firstElementChild as HTMLElement;
    return (
      layer.content.getBoundingClientRect().left -
      box.getBoundingClientRect().left
    );
  }, id);

test.describe("a ghost after the value", () => {
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  /** Put a ghost after the value of a field, and ask whether it moves it. */
  async function shifts(
    page: Page,
    spec: Pick<Spec, "kind" | "dir" | "width" | "value">,
    ghost: string,
    fillFirstLine = false,
  ) {
    const id = "case";
    await page.evaluate(() => document.getElementById("case")?.remove());
    await mountField(page, { id, mode: "none", ...spec });
    return page.evaluate(
      ([id, kind, ghost, fillFirstLine]) => {
        const field = document.querySelector(
          `#${id} ${kind}`,
        ) as HTMLInputElement;
        if (fillFirstLine) {
          // Words until the line is full, then the start of one more that
          // just fits: a ghost that continues it has to wrap the whole word.
          const probe = window.__inputLayer.createInputLayer(field, {
            position: "above",
          });
          const lines = (text: string) => {
            field.value = text;
            probe.update();
            probe.sync();
            return probe.rangeRects(0, text.length).length;
          };
          let line = "alpha";
          for (const word of [
            "beta",
            "gamma",
            "delta",
            "epsilon",
            "zeta",
            "eta",
            "theta",
          ]) {
            if (lines(`${line} ${word}`) > 1) break;
            line = `${line} ${word}`;
          }
          let partial = "x";
          while (lines(`${line} ${partial}x`) === 1) partial += "x";
          field.value = `${line} ${partial}`;
          probe.destroy();
        }
        const layer = window.__inputLayer.createInputLayer(field, {
          position: "above",
          segments: (value: string) => [
            { text: value },
            { text: ghost, className: "lab-ghost", ghost: true },
          ],
        });
        const result = {
          shifts: layer.ghostShifts(),
          // The ghost is not the value: it has no characters to measure.
          length: layer.rangeRects(0, 999).length,
          drawn: layer.content.textContent,
          shown: Array.from(layer.content.querySelectorAll("span")).every(
            (span) => span.style.display === "",
          ),
        };
        layer.destroy();
        return result;
      },
      [id, spec.kind, ghost, fillFirstLine] as const,
    );
  }

  test("an input that grows to the right does not shift", async ({ page }) => {
    const r = await shifts(page, { kind: "input", value: "ada@gm" }, "ail.com");
    expect(r.shifts).toBe(false);
    expect(r.length).toBe(1);
    expect(r.drawn).toBe("ada@gmail.com");
    expect(r.shown).toBe(true);
  });

  test("Latin text in an RTL input sits against the edge the ghost grows towards", async ({
    page,
  }) => {
    const r = await shifts(
      page,
      { kind: "input", dir: "rtl", value: "ada@gm" },
      "ail.com",
    );
    expect(r.shifts).toBe(true);
    expect(r.shown).toBe(true);
  });

  test("Hebrew in an RTL input grows to the left, as the field does", async ({
    page,
  }) => {
    const r = await shifts(
      page,
      { kind: "input", dir: "rtl", value: "שלום ע" },
      "ולם",
    );
    expect(r.shifts).toBe(false);
  });

  test("a word that no longer fits wraps, and a textarea shifts", async ({
    page,
  }) => {
    const wraps = await shifts(
      page,
      { kind: "textarea", width: 200, value: "" },
      "yyyyyy",
      true,
    );
    expect(wraps.shifts).toBe(true);
    const fits = await shifts(
      page,
      { kind: "textarea", width: 360, value: "short " },
      "words",
    );
    expect(fits.shifts).toBe(false);
  });
});

test.describe("the layer follows the field", () => {
  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  test("it follows a scroll that no event announces", async ({
    page,
    browserName,
  }) => {
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      segments: "qualifiers",
      value: LONG,
    });
    await field.focus();
    // Touched just now, so the layer is reading the scroll.
    await page.keyboard.press("ArrowLeft");
    await field.evaluate((el) => {
      (el as HTMLInputElement).scrollLeft = 120;
    });
    await frames(page);
    const scrolled = await field.evaluate((el) => el.scrollLeft);
    test.skip(
      browserName === "firefox" && scrolled === 0,
      "Firefox scrolls the caret back into view",
    );
    expect(scrolled).toBeGreaterThan(0);
    expect(Math.abs((await lineOffset(page, id)) + scrolled)).toBeLessThan(
      0.75,
    );
  });

  test("it stops reading the scroll when the field has been left alone", async ({
    page,
  }) => {
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      value: LONG,
    });
    await field.focus();
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(1300);
    const count = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let n = 0;
          const raf = window.requestAnimationFrame.bind(window);
          window.requestAnimationFrame = (cb) => {
            n++;
            return raf(cb);
          };
          setTimeout(() => {
            window.requestAnimationFrame = raf;
            resolve(n);
          }, 600);
        }),
    );
    // Not one request a frame: that would be about 36.
    expect(count).toBeLessThan(4);
    // A script that moves the scroll asks for a placement.
    await field.evaluate((el) => {
      (el as HTMLInputElement).scrollLeft = 40;
    });
    await page.evaluate((id) => window.__layers[id].update(), id);
    await frames(page);
    const scrolled = await field.evaluate((el) => el.scrollLeft);
    expect(Math.abs((await lineOffset(page, id)) + scrolled)).toBeLessThan(
      0.75,
    );
  });

  test("it draws the field's value after rapid typing", async ({ page }) => {
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      segments: "qualifiers",
    });
    await field.focus();
    const text = `${LONG}${LONG}`;
    await page.keyboard.type(text, { delay: 0 });
    await frames(page);
    const drawn = await page.evaluate(
      (id) => window.__layers[id].content.textContent,
      id,
    );
    expect(drawn).toBe(text);
    const scrolled = await field.evaluate((el) => el.scrollLeft);
    expect(Math.abs((await lineOffset(page, id)) + scrolled)).toBeLessThan(
      0.75,
    );
    const result = worst(await drift(page, id));
    expect(result.dx).toBeLessThan(DRIFT_ACROSS);
    expect(result.dy).toBeLessThan(DRIFT_DOWN);
  });

  test("it draws a value that is set from code, once it is asked to", async ({
    page,
  }) => {
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "textarea",
      mode: "ink",
      segments: "formula",
    });
    await field.evaluate((el) => {
      (el as HTMLTextAreaElement).value = "SUM(a, b)";
    });
    await page.evaluate((id) => window.__layers[id].update(), id);
    await expect(page.locator(`#${id} .bx--input-layer__content`)).toHaveText(
      "SUM(a, b)",
      {
        useInnerText: false,
      },
    );
    // A form reset puts the default back, with no event: the layer asks.
    await page.evaluate((id) => {
      const form = document.createElement("form");
      const field = document.querySelector(
        `#${id} textarea`,
      ) as HTMLTextAreaElement;
      field.parentElement?.appendChild(form);
      form.appendChild(field);
      field.defaultValue = "default";
      field.value = "changed";
      form.reset();
    }, id);
    expect(await field.inputValue()).toBe("default");
  });

  test("it runs the segments through text nodes, never markup", async ({
    page,
  }) => {
    const id = "case";
    const hostile = '<img src=x onerror="window.__pwned = 1"> "quoted" &amp;';
    await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      value: hostile,
    });
    const content = page.locator(`#${id} .bx--input-layer__content`);
    await expect(content).toHaveText(hostile, { useInnerText: false });
    expect(await page.locator(`#${id} .bx--input-layer img`).count()).toBe(0);
    expect(
      await page.evaluate(
        () => (window as unknown as { __pwned?: number }).__pwned,
      ),
    ).toBeUndefined();
  });

  test("destroy gives the field back", async ({ page }) => {
    const id = "case";
    await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      value: "is:open",
    });
    const before = await page.evaluate(() => {
      const field = document.querySelector("#case input") as HTMLElement;
      return {
        attr: field.getAttribute("data-ccs-input-layer"),
        host: field.parentElement?.classList.contains("bx--input-layer-host"),
      };
    });
    expect(before).toEqual({ attr: "behind", host: true });
    await page.evaluate((id) => window.__layers[id].destroy(), id);
    // The field fades its fill back in.
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => {
      const field = document.querySelector("#case input") as HTMLElement;
      return {
        attr: field.getAttribute("data-ccs-input-layer"),
        host: field.parentElement?.classList.contains("bx--input-layer-host"),
        layers: document.querySelectorAll("#case .bx--input-layer").length,
        background: getComputedStyle(field).backgroundColor,
      };
    });
    expect(after.attr).toBeNull();
    expect(after.host).toBe(false);
    expect(after.layers).toBe(0);
    expect(after.background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("a value of 10,000 characters is drawn at once and typed into", async ({
    page,
    browserName,
  }, info) => {
    const id = "case";
    const keys = ["is", "label", "author", "type"];
    const filler = " and some free words in between the qualifiers, ";
    const value = Array.from(
      { length: 200 },
      (_, i) => `${keys[i % 4]}:v${i % 7}${filler}`,
    ).join("");
    expect(value.length).toBeGreaterThan(9000);
    const field = await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      segments: "qualifiers",
    });
    const draw = await page.evaluate(
      ([id, value]) => {
        const field = document.querySelector(
          `#${id} input`,
        ) as HTMLInputElement;
        field.value = value;
        const t = performance.now();
        window.__layers[id].update();
        window.__layers[id].sync();
        return {
          ms: performance.now() - t,
          spans: window.__layers[id].content.childElementCount,
        };
      },
      [id, value] as const,
    );
    await field.focus();
    await page.keyboard.press("End");
    const typing = await page.evaluate(
      (id) =>
        new Promise<number>((resolve) => {
          const field = document.querySelector(
            `#${id} input`,
          ) as HTMLInputElement;
          const t = performance.now();
          field.setRangeText(
            "x",
            field.value.length,
            field.value.length,
            "end",
          );
          field.dispatchEvent(new InputEvent("input", { bubbles: true }));
          requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve(performance.now() - t)),
          );
        }),
      id,
    );
    info.annotations.push({
      type: "drift",
      description: `10k characters in ${browserName}: ${draw.spans} spans drawn in ${draw.ms.toFixed(0)} ms, a key to its second frame in ${typing.toFixed(0)} ms`,
    });
    expect(draw.spans).toBeGreaterThan(300);
    const drawn = await page.evaluate(
      (id) => window.__layers[id].content.textContent?.length,
      id,
    );
    expect(drawn).toBe(value.length + 1);
    // Frames are about 17 ms; a very slow runner gets room.
    expect(typing).toBeLessThan(400);
    const result = worst(await drift(page, id));
    expect(result.dx).toBeLessThan(DRIFT_ACROSS);
    expect(result.dy).toBeLessThan(DRIFT_DOWN);
  });

  test("an IME composition is drawn as it is composed", async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== "chromium",
      "Only Chromium can drive an IME from a test",
    );
    const id = "case";
    const field = await mountField(page, {
      id,
      kind: "input",
      mode: "behind",
      segments: "qualifiers",
      value: "is:open ",
    });
    await field.focus();
    await field.evaluate((el) =>
      (el as HTMLInputElement).setSelectionRange(8, 8),
    );
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.imeSetComposition", {
      text: "にほ",
      selectionStart: 2,
      selectionEnd: 2,
    });
    await frames(page);
    expect(await field.inputValue()).toBe("is:open にほ");
    expect(
      await page.evaluate((id) => window.__layers[id].content.textContent, id),
    ).toBe("is:open にほ");
    await cdp.send("Input.imeSetComposition", {
      text: "日本",
      selectionStart: 2,
      selectionEnd: 2,
    });
    await frames(page);
    expect(
      await page.evaluate((id) => window.__layers[id].content.textContent, id),
    ).toBe("is:open 日本");
    await cdp.send("Input.insertText", { text: "日本" });
    await frames(page);
    expect(await field.inputValue()).toBe("is:open 日本");
    expect(
      await page.evaluate((id) => window.__layers[id].content.textContent, id),
    ).toBe("is:open 日本");
    const result = worst(await drift(page, id));
    expect(result.dx).toBeLessThan(DRIFT_ACROSS);
  });
});

test.describe("zoom, themes, forced colors", () => {
  test("at 200% zoom the layer is as close as at 100%", async ({
    browser,
    browserName,
  }, info) => {
    // 200% zoom is a half size window at twice the device pixels.
    const context = await browser.newContext({
      viewport: { width: 640, height: 360 },
      deviceScaleFactor: 2,
    });
    await settleFontsReady(context);
    if (browserName === "webkit") {
      await context.route(
        (url) => url.hostname !== "localhost",
        (route) => route.abort(),
      );
    }
    const page = await context.newPage();
    try {
      await page.goto("/input-layer.html");
      await page.locator("#lab").waitFor();
      await page.evaluate(() => document.fonts.ready);
      await mountField(page, {
        id: "zin",
        kind: "input",
        mode: "behind",
        segments: "qualifiers",
        value: "",
      });
      await page.locator("#zin input").focus();
      await page.keyboard.type(LONG);
      await mountField(page, {
        id: "zarea",
        kind: "textarea",
        mode: "ink",
        segments: "formula",
        width: 240,
        value: WRAPPED,
      });
      await frames(page);
      const input = worst(await drift(page, "zin"));
      const area = worst(await drift(page, "zarea"));
      info.annotations.push({
        type: "drift",
        description: `200% zoom, ${browserName}: input ${input.dx.toFixed(2)} across ${input.dy.toFixed(2)} down; textarea ${area.dx.toFixed(2)} across ${area.dy.toFixed(2)} down`,
      });
      expect(input.dx).toBeLessThan(DRIFT_ACROSS);
      expect(input.dy).toBeLessThan(DRIFT_DOWN);
      expect(area.dx).toBeLessThan(DRIFT_ACROSS);
      expect(area.dy).toBeLessThan(DRIFT_DOWN);
    } finally {
      await context.close();
    }
  });

  test.beforeEach(async ({ page, browserName }) => {
    if (browserName === "webkit") await routeFontsAway(page);
  });

  test("forced colors give the glyphs to the field and keep the rules", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Safari has no forced colors mode");
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    await page.emulateMedia({ forcedColors: "active" });
    await frames(page);
    const read = await page.evaluate(() => {
      const css = (el: Element, name: string) =>
        (getComputedStyle(el) as unknown as Record<string, string>)[name];
      const formula = document.querySelector(
        "[data-testid=lab-formula]",
      ) as HTMLElement;
      const layer = formula.parentElement?.querySelector(
        ".bx--input-layer",
      ) as HTMLElement;
      const content = layer.querySelector(
        ".bx--input-layer__content",
      ) as HTMLElement;
      const run = content.querySelector("span") as HTMLElement;
      const query = document.querySelector(
        "[data-testid=lab-query]",
      ) as HTMLElement;
      const behind = query.parentElement?.querySelector(
        ".bx--input-layer",
      ) as HTMLElement;
      const qualifier = behind.querySelector(".lab-qualifier") as HTMLElement;
      return {
        fieldColor: css(formula, "color"),
        fieldCaret: css(formula, "caretColor"),
        fill: css(content, "webkitTextFillColor"),
        runFill: css(run, "webkitTextFillColor"),
        adjust: css(layer, "forcedColorAdjust"),
        behindBackground: css(behind, "backgroundColor"),
        rule: css(qualifier, "borderBlockEndStyle"),
        ruleWidth: css(qualifier, "borderBlockEndWidth"),
      };
    });
    // The field's own glyphs: not transparent.
    expect(read.fieldColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(read.fieldCaret).not.toBe("rgba(0, 0, 0, 0)");
    // The layer paints none, and keeps its own colors for its rules.
    expect(read.runFill).toBe("rgba(0, 0, 0, 0)");
    expect(read.adjust).toBe("none");
    expect(read.behindBackground).toBe("rgba(0, 0, 0, 0)");
    expect(read.rule).toBe("solid");
    expect(read.ruleWidth).toBe("2px");
  });

  test("Gray 100, RTL and axe", async ({ page }) => {
    await page.goto("/input-layer.html");
    await page.locator("#lab").waitFor();
    for (const theme of ["white", "g100"] as const) {
      for (const dir of ["ltr", "rtl"] as const) {
        await page.evaluate(
          ([theme, dir]) => {
            document.documentElement.classList.toggle(
              "bx--g100",
              theme === "g100",
            );
            document.documentElement.dir = dir;
          },
          [theme, dir] as const,
        );
        await frames(page);
        // The fills settle: Carbon's fields fade theirs.
        await page.waitForTimeout(250);
        const results = await new AxeBuilder({ page })
          .include("#app")
          .analyze();
        expect(results.violations, `${theme} ${dir}`).toEqual([]);
      }
    }
    await page.evaluate(() => {
      document.documentElement.classList.remove("bx--g100");
      document.documentElement.dir = "ltr";
    });
  });
});
