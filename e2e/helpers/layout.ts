// biome-ignore-all lint/performance/useTopLevelRegex: `measure` runs in the page, where module constants do not reach.
import type { Locator, Page } from "@playwright/test";

/**
 * Assertions for the layout rules in COMPONENT_GUIDELINES.md (Spacing,
 * Alignment, UI text, Design checks). Each helper measures in one
 * `evaluate`, after `document.fonts.ready`, and throws an error that names
 * each offending element by a short CSS path with the numbers it measured.
 * Each also throws when it finds nothing to check, so a helper that matched
 * no elements cannot pass by accident.
 *
 * A helper reads the page once. `expectTextFits` also hovers cut-off text
 * whose full value is missing at rest. After an action that lays out in the
 * next frame, wrap the call in `expect(...).toPass()`.
 */

export type Edge =
  | "inline-start"
  | "inline-end"
  | "top"
  | "bottom"
  | "center-x"
  | "center-y"
  | "baseline";

type Scope = Page | Locator;

export type Check =
  "aligned" | "pitch" | "fits" | "borders" | "overflow" | "ring";

/**
 * One problem a check found. `kind` and `path` name it the same way on
 * every run and machine; `message` adds what was measured.
 */
export interface LayoutFinding {
  check: Check;
  kind: string;
  path: string;
  message: string;
}

type Problem = Omit<LayoutFinding, "check">;

interface Request {
  check: Check;
  tolerance: number;
  edge?: Edge;
  /** Measure the text and icons instead of the box; unset means auto. */
  ink?: boolean;
  grid?: number;
  vertical?: boolean;
  /** Elements to leave out: rows for `pitch`, child components for `ring`. */
  skip?: string;
}

interface Result {
  checked: number;
  problems: Problem[];
  summary: string;
  /**
   * Truncated text with no full text at rest, each marked with
   * `data-layout-hover="<id>"`. `run` hovers each one, since a `title` set
   * on `mouseenter` or a tooltip anchored from a portal only appears then,
   * and reports `problem` if the full text is still missing.
   */
  hover?: { id: string; full: string; problem: Problem }[];
}

const TOLERANCE = 0.5;

/**
 * Runs in the page. Holds every check, so each helper is one `evaluate` and
 * the shared code (paths, text boxes, baselines) is written once.
 */
async function measure(roots: Element[], request: Request): Promise<Result> {
  await document.fonts.ready;
  const { tolerance } = request;
  // How far a line box may seem to cross its box's top or bottom edge.
  const LINE_SLACK = 1;
  const px = (n: number) => `${Math.round(n * 100) / 100}px`;

  // A short CSS path: up to four steps, ending early at an id or test id.
  // Ids from `uniqueId` (src/utils/unique-id.js), and ids built from them
  // such as `menu-ccs-…`, change on every mount, so the path steps past them.
  const generated = /(^|-)(ccs|ctag|cua|structured-list)-/;
  const path = (el: Element) => {
    const steps: string[] = [];
    let node: Element | null = el;
    while (node && node !== document.documentElement && steps.length < 4) {
      const tag = node.tagName.toLowerCase();
      const testId = node.getAttribute("data-testid");
      if (node.id && !generated.test(node.id)) {
        steps.unshift(`${tag}#${CSS.escape(node.id)}`);
        break;
      }
      if (testId) {
        steps.unshift(`${tag}[data-testid="${testId}"]`);
        break;
      }
      const classes = [...node.classList]
        .filter((c) => !c.startsWith("svelte-"))
        .slice(0, 2);
      let step = tag + classes.map((c) => `.${CSS.escape(c)}`).join("");
      const parent: Element | null = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter(
          (child) => child.tagName === node?.tagName,
        );
        if (same.length > 1) step += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      steps.unshift(step);
      node = parent;
    }
    return steps.join(" > ");
  };

  const style = (el: Element, pseudo?: string) => getComputedStyle(el, pseudo);
  const visible = (el: Element) =>
    el.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  const alpha = (color: string) => {
    if (color === "transparent") return 0;
    const match = /rgba?\(([^)]+)\)/.exec(color);
    if (!match) return 1;
    const parts = match[1].split(/[\s,/]+/).filter(Boolean);
    return parts.length > 3 ? Number.parseFloat(parts[3]) : 1;
  };
  const all = (root: Element) => [root, ...root.querySelectorAll("*")];
  const rtl = (el: Element) => style(el).direction === "rtl";

  // The font's ascent and descent, as the layout uses them.
  const metrics = (el: Element) => {
    const s = style(el);
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const m = ctx.measureText("Hg");
    return {
      ascent: m.fontBoundingBoxAscent,
      descent: m.fontBoundingBoxDescent,
      ellipsis: ctx.measureText("…").width,
    };
  };

  const firstText = (el: Element) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.textContent?.trim() &&
        node.parentElement &&
        visible(node.parentElement)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    });
    return walker.nextNode() as Text | null;
  };

  // The baseline of the first line of text. A form control centers its one
  // line in its content box; other text sits `ascent` below its first line
  // box's top.
  const baseline = (el: Element) => {
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
      const s = style(el);
      const box = el.getBoundingClientRect();
      const top =
        box.top +
        Number.parseFloat(s.borderTopWidth) +
        Number.parseFloat(s.paddingTop);
      const bottom =
        box.bottom -
        Number.parseFloat(s.borderBottomWidth) -
        Number.parseFloat(s.paddingBottom);
      const { ascent, descent } = metrics(el);
      return (top + bottom) / 2 + (ascent - descent) / 2;
    }
    const text = firstText(el);
    if (!text?.parentElement) return null;
    const range = document.createRange();
    range.selectNodeContents(text);
    const line = range.getClientRects()[0];
    if (!line) return null;
    return line.top + metrics(text.parentElement).ascent;
  };

  const clipped = (value: string) => value === "hidden" || value === "clip";

  // Visually hidden text (`clip`, `clip-path`) is meant to be cut.
  const hiddenOnPurpose = (el: Element) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const s = style(node);
      if (s.clip !== "auto" || s.clipPath !== "none") return true;
    }
    return false;
  };

  // The library's classes for content hidden on purpose: screen reader
  // text, and an icon's tooltip while it is closed.
  const LIBRARY_HIDDEN =
    ".bx--visually-hidden, .bx--tooltip--hidden .bx--assistive-text";

  type Box = { left: number; right: number; top: number; bottom: number };

  // How much of `rect` the boxes that clip it leave in view, from `from`
  // up to the first fixed element.
  const inView = (rect: Box, from: Element | null) => {
    let { left, right, top, bottom } = rect;
    for (
      let node = from;
      node && node !== document.documentElement;
      node = node.parentElement
    ) {
      const ns = style(node);
      const clipX = clipped(ns.overflowX);
      const clipY = clipped(ns.overflowY);
      if (clipX || clipY) {
        const box = paddingBox(node);
        if (clipX) {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (clipY) {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      if (ns.position === "fixed") break;
    }
    return { width: right - left, height: bottom - top };
  };
  // More than a pixel each way: a 1px box is the screen reader pattern.
  const hasArea = ({ width, height }: { width: number; height: number }) =>
    width > 1 && height > 1;

  // Shown to the eye: visible, not hidden on purpose, and with some of its
  // box in view.
  const shown = (el: Element) =>
    visible(el) &&
    !el.closest(LIBRARY_HIDDEN) &&
    !hiddenOnPurpose(el) &&
    hasArea(inView(el.getBoundingClientRect(), el.parentElement));

  // Text that is the element's own: in a text node inside it, or inside
  // its inline children. A heading or a button has it; a table, a toolbar
  // or a card holds its text in blocks.
  const hasOwnText = (el: Element): boolean =>
    [...el.childNodes].some((node) =>
      node.nodeType === Node.TEXT_NODE
        ? !!node.textContent?.trim()
        : node instanceof Element &&
          style(node).display === "inline" &&
          hasOwnText(node),
    );

  // The ink box: the union of the element's visible text, by its Range
  // rects, and its icons, by their svg boxes. Null when it has neither.
  const ink = (el: Element) => {
    const rects: Box[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      const parent = node.parentElement;
      if (
        !text.trim() ||
        !parent ||
        !visible(parent) ||
        hiddenOnPurpose(parent)
      )
        continue;
      const range = document.createRange();
      range.setStart(node, text.length - text.trimStart().length);
      range.setEnd(node, text.trimEnd().length);
      for (const rect of range.getClientRects())
        if (rect.width && rect.height) rects.push(rect);
    }
    const icons = [
      ...(el instanceof SVGSVGElement ? [el] : []),
      ...el.querySelectorAll("svg"),
    ].filter(
      (svg) =>
        !svg.parentElement?.closest("svg") &&
        visible(svg) &&
        !hiddenOnPurpose(svg),
    );
    for (const svg of icons) {
      const rect = svg.getBoundingClientRect();
      if (rect.width && rect.height) rects.push(rect);
    }
    if (!rects.length) return null;
    return {
      left: Math.min(...rects.map((r) => r.left)),
      right: Math.max(...rects.map((r) => r.right)),
      top: Math.min(...rects.map((r) => r.top)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
    };
  };

  // Inline edges measure the ink of an element with its own text, so two
  // headings whose text lines up align whatever their padding.
  const usesInk = (el: Element, edge: Edge) =>
    request.ink ??
    ((edge === "inline-start" || edge === "inline-end") && hasOwnText(el));

  const edgeOf = (el: Element, edge: Edge) => {
    if (edge === "baseline") return baseline(el);
    const box = usesInk(el, edge) ? ink(el) : el.getBoundingClientRect();
    if (!box) return null;
    switch (edge) {
      case "inline-start":
        return rtl(el) ? box.right : box.left;
      case "inline-end":
        return rtl(el) ? box.left : box.right;
      case "top":
        return box.top;
      case "bottom":
        return box.bottom;
      case "center-x":
        return (box.left + box.right) / 2;
      case "center-y":
        return (box.top + box.bottom) / 2;
    }
  };

  // The padding box, where content may paint without overflowing.
  const paddingBox = (el: Element) => {
    const box = el.getBoundingClientRect();
    const s = style(el);
    return {
      left: box.left + Number.parseFloat(s.borderLeftWidth),
      right: box.right - Number.parseFloat(s.borderRightWidth),
      top: box.top + Number.parseFloat(s.borderTopWidth),
      bottom: box.bottom - Number.parseFloat(s.borderBottomWidth),
    };
  };

  // Each line of an element's own text, as line boxes: a line-height
  // smaller than the font's content area is not overflow. The line box is
  // centered on the text's rect, which the browser snaps to whole pixels,
  // so its block edges are good to about 1px.
  const ownLines = (el: Element) => {
    const lineHeight = Number.parseFloat(style(el).lineHeight);
    const lines: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }[] = [];
    for (const node of el.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim())
        continue;
      const text = node.textContent;
      const range = document.createRange();
      range.setStart(node, text.length - text.trimStart().length);
      range.setEnd(node, text.trimEnd().length);
      for (const rect of range.getClientRects()) {
        if (!rect.width) continue;
        const half =
          lineHeight && lineHeight < rect.height
            ? lineHeight / 2
            : rect.height / 2;
        const middle = rect.top + rect.height / 2;
        lines.push({
          left: rect.left,
          right: rect.right,
          top: middle - half,
          bottom: middle + half,
        });
      }
    }
    return lines;
  };

  // The text a truncated element shows, and the text it hides.
  const splitAtCut = (el: Element) => {
    const s = style(el);
    const padding = paddingBox(el);
    const box = {
      left: padding.left + Number.parseFloat(s.paddingLeft),
      right: padding.right - Number.parseFloat(s.paddingRight),
    };
    const right = rtl(el);
    const room = metrics(el).ellipsis;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    let shown = "";
    let hidden = "";
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent ?? "";
      for (let i = 0; i < text.length; i++) {
        if (hidden) {
          hidden += text[i];
          continue;
        }
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        const fits = right
          ? rect.left >= box.left + room - tolerance
          : rect.right <= box.right - room + tolerance;
        if (fits || !rect.width) shown += text[i];
        else hidden += text[i];
      }
    }
    return { shown, hidden };
  };

  // The full text is in a title, an aria-label, or text the element or an
  // ancestor points to (a tooltip through aria-describedby). A tooltip
  // trigger or a focusable Truncate opens its tooltip on hover or focus.
  const fullTextAvailable = (el: Element, full: string) => {
    if (el.closest(".bx--tooltip__trigger, .bx--text-truncate--focusable"))
      return true;
    for (let node: Element | null = el; node; node = node.parentElement) {
      for (const name of ["title", "aria-label"]) {
        if (node.getAttribute(name)?.includes(full)) return true;
      }
      for (const name of ["aria-describedby", "aria-labelledby"]) {
        for (const id of node.getAttribute(name)?.split(/\s+/) ?? []) {
          if (id && document.getElementById(id)?.textContent?.includes(full))
            return true;
        }
      }
    }
    return false;
  };

  const elements = () => roots.flatMap((root) => all(root));
  const problems: Problem[] = [];
  // `at` is the element's path or, for the page as a whole, a fixed label.
  const problem = (at: string, kind: string, message: string): Problem => ({
    kind,
    path: at,
    message,
  });
  const hover: NonNullable<Result["hover"]> = [];

  switch (request.check) {
    case "aligned": {
      const edge = request.edge as Edge;
      const values = roots.map((el) => ({ el, value: edgeOf(el, edge) }));
      for (const { el, value } of values) {
        if (value === null)
          problems.push(
            problem(
              path(el),
              "no text",
              `${path(el)}: ${edge === "baseline" ? "no text for a baseline" : "no text or icon to measure"}`,
            ),
          );
      }
      const measured = values.filter(
        (v): v is { el: Element; value: number } => v.value !== null,
      );
      // The reference is the value most others share.
      const near = (a: number, b: number) => Math.abs(a - b) <= tolerance;
      const reference = measured
        .map((v) => ({
          ...v,
          shared: measured.filter((w) => near(v.value, w.value)).length,
        }))
        .sort((a, b) => b.shared - a.shared)[0];
      if (reference) {
        for (const { el, value } of measured) {
          if (near(value, reference.value)) continue;
          problems.push(
            problem(
              path(el),
              `off ${edge}`,
              `${path(el)}: ${edge} at ${px(value)}, ${px(value - reference.value)} from ${path(reference.el)} at ${px(reference.value)}`,
            ),
          );
        }
      }
      return {
        checked: measured.length,
        problems,
        summary: `elements with a ${edge} edge`,
      };
    }

    case "pitch": {
      const grid = request.grid ?? 4;
      // Only rows in the flow of the list: frozen rows stick in place, and
      // a spacer row, a virtual list's padding or a selection overlay
      // shows no content of its own.
      const content = "svg, img, canvas, input, select, textarea, button";
      const rows = roots.filter(
        (el) =>
          !(request.skip && el.matches(request.skip)) &&
          !/sticky|fixed/.test(style(el).position) &&
          !el.closest("[aria-hidden=true]") &&
          visible(el) &&
          (!!el.textContent?.trim() || !!el.querySelector(content)),
      );
      const tops = rows.map((el) => ({
        el,
        top: el.getBoundingClientRect().top,
      }));
      // Each pitch is named by its upper row.
      const pitches = tops.slice(1).map((row, i) => ({
        el: tops[i].el,
        pitch: row.top - tops[i].top,
      }));
      const first = pitches[0]?.pitch ?? 0;
      for (const { el, pitch } of pitches) {
        if (Math.abs(pitch - first) > tolerance)
          problems.push(
            problem(
              path(el),
              "uneven pitch",
              `${path(el)}: next row ${px(pitch)} below, the first pitch is ${px(first)}`,
            ),
          );
      }
      const offGrid = Math.abs(first - Math.round(first / grid) * grid);
      if (pitches.length && offGrid > tolerance)
        problems.unshift(
          problem(
            path(rows[0]),
            "off grid",
            `${path(rows[0])}: pitch ${px(first)} is not a multiple of ${grid}px`,
          ),
        );
      return {
        checked: pitches.length,
        problems,
        summary: `pitches in ${rows.length} rows (${roots.length - rows.length} skipped)`,
      };
    }

    case "fits": {
      let checked = 0;
      for (const el of elements()) {
        if (
          el.closest("script, style, template, noscript, option, svg") ||
          !visible(el) ||
          el.closest(LIBRARY_HIDDEN) ||
          hiddenOnPurpose(el)
        )
          continue;
        const lines = ownLines(el);
        if (!lines.length) continue;
        const text = {
          left: Math.min(...lines.map((l) => l.left)),
          right: Math.max(...lines.map((l) => l.right)),
          top: Math.min(...lines.map((l) => l.top)),
          bottom: Math.max(...lines.map((l) => l.bottom)),
        };
        // Text that shows nothing, in a 1px box or placed wholly outside a
        // box that clips it, is hidden on purpose. Its box and its text
        // both count, so text that spills from an empty box still shows.
        const box = el.getBoundingClientRect();
        const extent = {
          left: Math.min(box.left, text.left),
          right: Math.max(box.right, text.right),
          top: Math.min(box.top, text.top),
          bottom: Math.max(box.bottom, text.bottom),
        };
        if (!hasArea(inView(extent, el))) continue;
        checked++;
        const spill = (
          box: ReturnType<typeof paddingBox>,
          x = true,
          y = true,
        ) =>
          Math.max(
            x ? box.left - text.left : 0,
            x ? text.right - box.right : 0,
            y ? box.top - text.top - LINE_SLACK : 0,
            y ? text.bottom - box.bottom - LINE_SLACK : 0,
          );

        // An ellipsis on the element or the block that holds it truncates
        // the text on purpose.
        let truncator: Element | null = null;
        for (let node: Element | null = el; node; node = node.parentElement) {
          const ns = style(node);
          if (ns.textOverflow === "ellipsis" && ns.overflowX !== "visible") {
            truncator = node;
            break;
          }
          if (ns.display !== "inline") break;
        }
        if (truncator) {
          // A box with no width shows no text at all, which is hiding it.
          if (
            truncator.scrollWidth - truncator.clientWidth <= tolerance ||
            truncator.clientWidth < 1
          )
            continue;
          const full = (truncator.textContent ?? "")
            .replace(/\s+/g, " ")
            .trim();
          if (
            !fullTextAvailable(truncator, full) &&
            !truncator.hasAttribute("data-layout-hover")
          ) {
            const id = String(hover.length);
            truncator.setAttribute("data-layout-hover", id);
            hover.push({
              id,
              full,
              problem: problem(
                path(truncator),
                "no full text",
                `${path(truncator)}: truncated "${full}" (${truncator.scrollWidth}px in ${truncator.clientWidth}px) with no title, aria-label or tooltip holding it, at rest or on hover`,
              ),
            });
          }
          const { shown, hidden } = splitAtCut(truncator);
          if (/\d[:./,-]?$/.test(shown) && /^[:./,-]?\d/.test(hidden))
            problems.push(
              problem(
                path(truncator),
                "cuts a number",
                `${path(truncator)}: cuts a number: shows "${shown}", hides "${hidden}"`,
              ),
            );
          continue;
        }

        // Its own box, or for inline text the box that holds it, unless
        // that box scrolls on the axis. Preformatted lines (code) that a
        // scrolling ancestor holds are meant to scroll.
        let holder: Element | null = el;
        while (holder && /^(inline|contents)$/.test(style(holder).display))
          holder = holder.parentElement;
        if (holder) {
          const hs = style(holder);
          const code =
            /^pre/.test(hs.whiteSpace) &&
            !!holder.parentElement &&
            /auto|scroll/.test(style(holder.parentElement).overflowX);
          const over = spill(
            paddingBox(holder),
            !code && !/auto|scroll/.test(hs.overflowX),
            !/auto|scroll/.test(hs.overflowY),
          );
          if (over > tolerance) {
            problems.push(
              problem(
                path(el),
                "overflows box",
                `${path(el)}: text overflows ${holder === el ? "its box" : path(holder)} by ${px(over)} (text ${px(text.right - text.left)} x ${px(text.bottom - text.top)})`,
              ),
            );
            continue;
          }
        }

        // The nearest ancestor that clips it, on each axis. Text inside a
        // scroll container is reachable, so the walk stops there.
        let x = true;
        let y = true;
        for (
          let node = el.parentElement;
          node && node !== document.documentElement && (x || y);
          node = node.parentElement
        ) {
          const ns = style(node);
          if (ns.position === "fixed") break;
          const clipX = x && clipped(ns.overflowX);
          const clipY = y && clipped(ns.overflowY);
          if (clipX || clipY) {
            const over = spill(paddingBox(node), clipX, clipY);
            if (over > tolerance) {
              problems.push(
                problem(
                  path(el),
                  "cut by ancestor",
                  `${path(el)}: text is cut by ${path(node)} by ${px(over)}`,
                ),
              );
              break;
            }
          }
          if (ns.overflowX !== "visible") x = false;
          if (ns.overflowY !== "visible") y = false;
        }
      }
      return { checked, problems, summary: "text elements", hover };
    }

    case "borders": {
      const controls = "input, select, textarea, button";
      const sides = ["Top", "Right", "Bottom", "Left"] as const;
      // What draws a box around the element: a border on all four sides
      // (form controls are skipped), an outline, or a box-shadow with no
      // offset or blur and a spread. Forced colors repaint a transparent
      // outline, so a resting `outline: 2px solid transparent` counts
      // there. The focused element's outline is its focus ring, which may
      // sit inside a structural edge. So is the outline of the option a
      // focused element names in `aria-activedescendant`, and of an
      // `aria-selected` option in a focused composite: focus stays on the
      // composite or its input, and the ring marks the current option.
      const focused = document.activeElement;
      const activeId = focused?.getAttribute("aria-activedescendant");
      const composite =
        "[role=listbox], [role=grid], [role=treegrid], [role=tree], [role=tablist], [role=menu], [role=menubar], [role=radiogroup]";
      const focusRing = (el: Element) =>
        el.matches(":focus") ||
        (!!activeId && el.id === activeId) ||
        (el.getAttribute("aria-selected") === "true" &&
          !!focused &&
          el.parentElement?.closest(composite) === focused);
      const edge = (el: Element) => {
        const s = style(el);
        if (
          !el.matches(controls) &&
          sides.every(
            (side) =>
              Number.parseFloat(s[`border${side}Width`]) > 0 &&
              !/none|hidden/.test(s[`border${side}Style`]) &&
              alpha(s[`border${side}Color`]) > 0,
          )
        )
          return "bordered box";
        if (
          !focusRing(el) &&
          s.outlineStyle !== "none" &&
          Number.parseFloat(s.outlineWidth) > 0 &&
          alpha(s.outlineColor) > 0
        )
          return `${s.outlineWidth} outline`;
        if (s.boxShadow === "none") return null;
        for (const shadow of s.boxShadow.split(/,(?![^(]*\))/)) {
          const color = /rgba?\([^)]*\)/.exec(shadow)?.[0] ?? "transparent";
          const [x, y, blur, spread = 0] = [
            ...shadow.replace(color, "").matchAll(/-?[\d.]+px/g),
          ].map((match) => Number.parseFloat(match[0]));
          if (x === 0 && y === 0 && blur === 0 && spread > 0 && alpha(color))
            return `${px(spread)} ${/\binset\b/.test(shadow) ? "inset " : ""}box-shadow ring`;
        }
        return null;
      };
      const background = (el: Element) => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          const color = style(node).backgroundColor;
          if (alpha(color) > 0) return color;
        }
        return "transparent";
      };
      const inScope = (el: Element) => roots.some((root) => root.contains(el));
      let checked = 0;
      for (const el of elements()) {
        const kind = visible(el) && edge(el);
        if (!kind) continue;
        checked++;
        let outer = el.parentElement;
        while (outer && inScope(outer) && !edge(outer))
          outer = outer.parentElement;
        if (!outer || !inScope(outer)) continue;
        const inner = background(el);
        const around = background(outer);
        if (inner === around)
          problems.push(
            problem(
              path(el),
              "nested edge",
              `${path(el)}: ${kind} inside ${edge(outer)} ${path(outer)}, both on ${inner}`,
            ),
          );
      }
      return { checked, problems, summary: "boxes with an edge" };
    }

    case "overflow": {
      const doc = document.documentElement;
      const wide = doc.scrollWidth - doc.clientWidth;
      const tall = doc.scrollHeight - doc.clientHeight;
      const rtlPage = rtl(doc);
      const sticksOut = (el: Element) => {
        const box = el.getBoundingClientRect();
        return rtlPage
          ? box.left < -tolerance
          : box.right > doc.clientWidth + tolerance;
      };
      const inClip = (el: Element) => {
        for (let node = el.parentElement; node; node = node.parentElement) {
          if (node === doc || node === document.body) return false;
          if (!/visible/.test(style(node).overflowX)) return true;
        }
        return false;
      };
      if (wide > tolerance) {
        // Name where the overflow starts: elements past the edge whose
        // parent is not.
        const culprits = [...document.body.querySelectorAll("*")].filter(
          (el) =>
            sticksOut(el) &&
            !(el.parentElement && sticksOut(el.parentElement)) &&
            !inClip(el),
        );
        problems.push(
          problem(
            "page",
            "scrolls sideways",
            `page scrolls sideways: scrollWidth ${doc.scrollWidth}px, clientWidth ${doc.clientWidth}px`,
          ),
          ...culprits.slice(0, 5).map((el) => {
            const box = el.getBoundingClientRect();
            return problem(
              path(el),
              "widens page",
              `${path(el)}: spans ${px(box.left)} to ${px(box.right)}`,
            );
          }),
        );
      }
      if (request.vertical && tall > tolerance)
        problems.push(
          problem(
            "page",
            "scrolls down",
            `page scrolls down: scrollHeight ${doc.scrollHeight}px, clientHeight ${doc.clientHeight}px`,
          ),
        );
      return {
        checked: document.body.querySelectorAll("*").length,
        problems,
        summary: "elements on the page",
      };
    }

    case "ring": {
      const probe = document.createElement("div");
      probe.style.color = "Highlight";
      document.body.append(probe);
      const highlight = style(probe).color;
      probe.remove();
      // A field keeps a 2px resting box (forced colors repaint its
      // transparent outline); its focus ring is wider. Other resting
      // edges, a card's border or a button's box, are 1px.
      const fields =
        "input, textarea, select, [contenteditable=true], [role=combobox], [role=textbox], [role=searchbox], [role=spinbutton]";
      let checked = 0;
      // Each element in scope is one group, such as one pane of a split
      // view, with at most one ring of its own.
      for (const root of roots) {
        const rings: Problem[] = [];
        for (const el of all(root)) {
          const owner = request.skip ? el.closest(request.skip) : null;
          if ((owner && owner !== root && root.contains(owner)) || !shown(el))
            continue;
          checked++;
          const resting = el.matches(fields) && !el.matches(":focus") ? 2 : 1;
          // An element and its pseudo-elements draw one ring together.
          const parts: string[] = [];
          for (const pseudo of [undefined, "::before", "::after"]) {
            const s = style(el, pseudo);
            if (pseudo && s.content === "none") continue;
            const on = pseudo ? `${pseudo} ` : "";
            const width = Number.parseFloat(s.outlineWidth);
            if (
              s.outlineStyle !== "none" &&
              alpha(s.outlineColor) > 0 &&
              (width > resting || (width > 0 && s.outlineColor === highlight))
            )
              parts.push(`${on}outline ${s.outlineWidth} ${s.outlineColor}`);
            else if (
              (["Top", "Right", "Bottom", "Left"] as const).some(
                (side) =>
                  Number.parseFloat(s[`border${side}Width`]) > 0 &&
                  !/none|hidden/.test(s[`border${side}Style`]) &&
                  s[`border${side}Color`] === highlight,
              )
            )
              parts.push(`${on}border ${highlight}`);
          }
          if (parts.length)
            rings.push(
              problem(path(el), "ring", `${path(el)}: ${parts.join(", ")}`),
            );
        }
        if (rings.length > 1)
          problems.push(
            problem(
              root === document.documentElement ? "page" : path(root),
              "rings",
              `${rings.length} rings${roots.length > 1 ? ` in ${path(root)}` : ""}, at most 1 allowed`,
            ),
            ...rings,
          );
      }
      return { checked, problems, summary: "elements" };
    }
  }
}

/**
 * Hovers the element `measure` marked with `id` and waits up to `timeout`
 * for its full text to show up: in a `title` or an `aria-label` on it or an
 * ancestor (set by a `mouseenter` handler such as `titleWhenTruncated`), or
 * in a tooltip that opens, which may sit in a portal (`AnchoredTooltip`).
 * A tooltip already open belongs to an earlier element and does not count.
 * The pointer goes back to the bottom-right corner, where the host parks it.
 */
async function fullTextOnHover(
  page: Page,
  id: string,
  full: string,
  timeout = 1500,
) {
  const target = page.locator(`[data-layout-hover="${id}"]`);
  const tooltips = '[role="tooltip"], .bx--tooltip-portal__content';
  await page.evaluate((selector) => {
    for (const tip of document.querySelectorAll(selector))
      tip.setAttribute("data-layout-stale", "");
  }, tooltips);
  // `force`: an overlay that ignores the pointer may cover the text, and the
  // element under the pointer still passes the hover to its ancestors.
  const hovered = await target
    .hover({ force: true, timeout })
    .then(() => true)
    .catch(() => false);
  let found = false;
  const until = Date.now() + timeout;
  while (hovered && !found) {
    // biome-ignore lint/performance/noAwaitInLoops: polls until it appears
    found = await target.evaluate(
      (el, [text, selector]) => {
        for (let node: Element | null = el; node; node = node.parentElement) {
          for (const name of ["title", "aria-label"]) {
            if (node.getAttribute(name)?.includes(text)) return true;
          }
        }
        return [...document.querySelectorAll(selector)].some(
          (tip) =>
            !tip.hasAttribute("data-layout-stale") &&
            tip.checkVisibility({ visibilityProperty: true }) &&
            tip.textContent?.replace(/\s+/g, " ").includes(text),
        );
      },
      [full, tooltips] as const,
    );
    if (found || Date.now() > until) break;
    await page.waitForTimeout(50);
  }
  const viewport = page.viewportSize();
  if (viewport) await page.mouse.move(viewport.width - 1, viewport.height - 1);
  await page.evaluate(() => {
    for (const tip of document.querySelectorAll("[data-layout-stale]"))
      tip.removeAttribute("data-layout-stale");
  });
  return found;
}

const NAMES: Record<Check, string> = {
  aligned: "expectAligned",
  pitch: "expectOnePitch",
  fits: "expectTextFits",
  borders: "expectNoNestedBorders",
  overflow: "expectNoPageOverflow",
  ring: "expectSingleRing",
};

/** Runs one check and returns what it found, without throwing. */
async function collect(scope: Scope | Locator[], request: Request) {
  if (Array.isArray(scope) && !scope.length)
    throw new Error(`${NAMES[request.check]}: no locators to check`);
  const locator = Array.isArray(scope)
    ? scope.reduce((a, b) => a.or(b))
    : "evaluateAll" in scope
      ? scope
      : scope.locator(":root");
  const result = await locator.evaluateAll(measure, request);
  if (result.hover?.length) {
    const page = locator.page();
    try {
      for (const { id, full, problem } of result.hover) {
        // biome-ignore lint/performance/noAwaitInLoops: one pointer, one element at a time
        if (!(await fullTextOnHover(page, id, full)))
          result.problems.push(problem);
      }
    } finally {
      await page.evaluate(() => {
        for (const el of document.querySelectorAll("[data-layout-hover]"))
          el.removeAttribute("data-layout-hover");
      });
    }
  }
  const seen = new Set<string>();
  const findings: LayoutFinding[] = [];
  for (const problem of result.problems) {
    if (seen.has(problem.message)) continue;
    seen.add(problem.message);
    findings.push({ check: request.check, ...problem });
  }
  return { checked: result.checked, summary: result.summary, findings };
}

async function run(scope: Scope | Locator[], request: Request) {
  const name = NAMES[request.check];
  const result = await collect(scope, request);
  const problems = result.findings.map((finding) => finding.message);
  if (problems.length) throw new Error(`${name}:\n  ${problems.join("\n  ")}`);
  const least = request.check === "aligned" ? 2 : 1;
  if (result.checked < least)
    throw new Error(
      `${name}: found ${result.checked} ${result.summary} to check, needs ${least}`,
    );
  return result.checked;
}

/**
 * The elements share one edge, within `tolerance` (0.5px). Inline edges
 * follow each element's direction. `baseline` is the first line's text
 * baseline; on an input or select, the baseline of its value.
 *
 * `ink: true` measures the ink box: the element's visible text, by its
 * Range rects, and its icons, by their svg boxes. `ink: false` measures
 * the border box. Left unset, inline edges measure the ink of an element
 * with its own text (a heading, a label, a button) and the box of any
 * other, so padding does not hide text that lines up.
 */
export function expectAligned(
  locators: Locator | Locator[],
  {
    edge,
    ink,
    tolerance = TOLERANCE,
  }: { edge: Edge; ink?: boolean; tolerance?: number },
) {
  return run(locators, { check: "aligned", edge, ink, tolerance });
}

/**
 * Consecutive rows share one top-to-top pitch, a multiple of `grid` (4px).
 * Only rows in the list's flow count: rows that match `skip`, frozen rows
 * (`position: sticky` or `fixed`), rows under `aria-hidden`, and rows with
 * no text, icon or control (a virtual list's spacer, a selection overlay)
 * are left out.
 */
export function expectOnePitch(
  rows: Locator | Locator[],
  {
    grid = 4,
    skip,
    tolerance = TOLERANCE,
  }: { grid?: number; skip?: string; tolerance?: number } = {},
) {
  return run(rows, { check: "pitch", grid, skip, tolerance });
}

/**
 * No text overflows its box or its nearest clipping ancestor. Text that an
 * ellipsis truncates keeps its full value in a `title`, an `aria-label` or
 * a tooltip, and does not stop inside a number, date or time. Truncated
 * text with no full value at rest is hovered, so a `title` set on hover
 * and a tooltip in a portal count. The pointer ends in the bottom-right
 * corner. Text hidden on purpose is skipped: under `clip` or `clip-path`,
 * under `.bx--visually-hidden` or a closed icon tooltip, or in a box with
 * no area in view (1px, or wholly outside a box that clips it).
 */
export function expectTextFits(
  scope: Scope,
  { tolerance = TOLERANCE }: { tolerance?: number } = {},
) {
  return run(scope, { check: "fits", tolerance });
}

/**
 * No box with an edge sits inside another one, unless their backgrounds
 * differ (a layer change). An edge is a border on all four sides (form
 * controls are skipped), an outline, or a box-shadow ring: no offset, no
 * blur and a spread, inset or not. The focused element's outline is its
 * focus ring and does not count, nor is the outline of the option named by
 * a focused element's `aria-activedescendant`, or of an `aria-selected`
 * option in a focused composite. Run it under forced colors too, where a
 * transparent outline is repainted.
 */
export function expectNoNestedBorders(scope: Scope) {
  return run(scope, { check: "borders", tolerance: TOLERANCE });
}

/** The page does not scroll sideways, nor down with `vertical`. */
export function expectNoPageOverflow(
  page: Page,
  {
    vertical = false,
    tolerance = TOLERANCE,
  }: { vertical?: boolean; tolerance?: number } = {},
) {
  return run(page, { check: "overflow", vertical, tolerance });
}

/**
 * For forced-colors pages: each element the scope matches holds at most one
 * focus or selection ring. Call it with one item focused or selected at
 * most. A ring is an outline wider than the element's resting edge, or an
 * outline or border in `Highlight`. Resting edges stay: 1px on most
 * elements (a card's border, a button's box), 2px on an unfocused field,
 * whose transparent outline forced colors repaint. An element and its
 * `::before` and `::after` count as one ring. Elements with no area in
 * view, or hidden with `clip`, `clip-path` or the library's hidden classes
 * (a closed tooltip), are skipped, and so are elements inside `skip`, for
 * child components the scope does not own. To check one selection shown
 * in two panes, pass both panes: each is counted on its own.
 */
export function expectSingleRing(
  scope: Scope | Locator[],
  { skip }: { skip?: string } = {},
) {
  return run(scope, { check: "ring", skip, tolerance: TOLERANCE });
}

/**
 * Runs one of the page-wide checks and returns its findings instead of
 * throwing, so a sweep can report every finding in one run. It applies the
 * same rules as `expectTextFits`, `expectNoNestedBorders`,
 * `expectNoPageOverflow` and `expectSingleRing`, with their defaults, and
 * does not fail when it finds nothing to check.
 */
export async function findLayoutProblems(
  scope: Scope,
  check: "fits" | "borders" | "overflow" | "ring",
) {
  const { findings } = await collect(scope, { check, tolerance: TOLERANCE });
  return findings;
}
