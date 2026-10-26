// @ts-check
import { effectiveBackground, textContrast } from "./LayoutInspector/colors.js";
import { failingTargets } from "./geometry.js";
import { createLayerLookup, DEV_TOOL, inBand } from "./page-scan.js";
import { formatPx, nearestSpacing, offScale } from "./spacing.js";

/**
 * The page checks, as plain DOM code: LayoutInspector draws their
 * findings, and `audit` returns them as data for scripts and agents.
 * @typedef {"spacing" | "contrast" | "targets" | "overflow"} AuditCheck
 * @typedef {{ left: number; top: number; width: number; height: number }} Rect
 * @typedef {{ check: AuditCheck; el: Element; rect: Rect; message: string; values?: Record<string, unknown> }} Finding
 * @typedef {{ checks: AuditCheck[]; band: import("./page-scan.js").ScanBand | null; carbon: boolean; ignore: string; targetSize: number; remPx: number; layer: (el: Element) => Element | null }} CheckOptions
 */

export const AUDIT_CHECKS = /** @type {const} */ ([
  "spacing",
  "targets",
  "contrast",
  "overflow",
]);

export const INTERACTIVE = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "[role='option']",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

/**
 * Whether Carbon styles `el`, not the app. An element with a `bx--` class
 * is Carbon's. One with any other class or an inline style is the app's:
 * Svelte gives a `svelte-` class to every element its scoped styles reach.
 * A bare element, such as a `<td>` in a `DataTable` or a `<p>` in a Grid
 * column, takes its styles from the nearest element that has some, so
 * walk up to it.
 * @param {Element} el
 */
export function carbonOwned(el) {
  for (
    let node = /** @type {Element | null} */ (el);
    node && node !== document.body && node !== document.documentElement;
    node = node.parentElement
  ) {
    if (node.classList.length) {
      return [...node.classList].some((c) => c.startsWith("bx--"));
    }
    if (node.getAttribute("style")?.includes(":")) return false;
  }
  return false;
}

/**
 * Whether the background behind text belongs to Carbon or the theme: the
 * page itself, or a Carbon element.
 * @param {Element | null} source
 */
function carbonBackground(source) {
  return (
    !source ||
    source === document.body ||
    source === document.documentElement ||
    carbonOwned(source)
  );
}

// Text Carbon draws as disabled. WCAG 1.4.3 exempts it, like `disabled`.
const DISABLED = "[disabled], [aria-disabled='true'], [class*='--disabled']";

// Caps each check so a huge page cannot stall a scan.
const MAX_FINDINGS = 500;

/** @param {Element} el */
export function hasOwnText(el) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
      return true;
    }
  }
  return false;
}

/**
 * @param {Element} el
 * @param {string} selector
 */
function closestSafe(el, selector) {
  if (!selector) return false;
  try {
    return el.closest(selector) !== null;
  } catch {
    return false;
  }
}

/** @param {number} ratio */
export function formatRatio(ratio) {
  return `${Math.floor(ratio * 10) / 10}:1`;
}

/**
 * @param {{ top: number; height: number }} rect
 * @param {CheckOptions} options
 */
function near(rect, options) {
  return (
    !options.band ||
    inBand(
      { top: rect.top, bottom: rect.top + rect.height },
      options.band,
      window.scrollY,
    )
  );
}

/**
 * Whether a check skips `el`: Carbon's own elements, unless `carbon`, and
 * anything inside `ignore`.
 * @param {Element} el
 * @param {CheckOptions} options
 */
function skipped(el, options) {
  return (
    (!options.carbon && carbonOwned(el)) || closestSafe(el, options.ignore)
  );
}

/**
 * Union of an element's box and its `<label>`s, since a label click
 * activates the control too.
 * @param {Element} el
 * @returns {Rect}
 */
function targetRect(el) {
  let { left, top, right, bottom } = el.getBoundingClientRect();
  const labels = /** @type {HTMLInputElement} */ (el).labels;
  if (labels) {
    for (const label of labels) {
      const r = label.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
  }
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * Elements with off-scale margin, padding, or gap.
 * @param {CheckOptions} options
 * @returns {Finding[]}
 */
function scanSpacing(options) {
  /** @type {Finding[]} */
  const found = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (found.length >= MAX_FINDINGS) break;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;
    if (!near(r, options)) continue;
    if (el.closest(DEV_TOOL) || skipped(el, options)) {
      continue;
    }
    const style = getComputedStyle(el);
    if (style.display === "none" || style.display === "contents") continue;
    let off = offScale(style, options.remPx);
    // Carbon sizes some boxes in `%` or `calc()`, such as a modal's 20%
    // padding, which compute to fractions of a pixel. They are not a token
    // choice, so leave them out on Carbon's elements.
    if (options.carbon && carbonOwned(el)) {
      off = off.filter((entry) =>
        Number.isInteger(Number(entry.slice(entry.lastIndexOf(" ") + 1))),
      );
    }
    if (!off.length) continue;
    found.push({
      check: "spacing",
      el,
      rect: r,
      message:
        off.length > 3
          ? `${off.slice(0, 3).join(" · ")} · +${off.length - 3}`
          : off.join(" · "),
      values: {
        offScale: off.map((entry) => {
          const space = entry.lastIndexOf(" ");
          const px = Number(entry.slice(space + 1));
          return {
            prop: entry.slice(0, space),
            px,
            nearest: nearestSpacing(px, options.remPx),
          };
        }),
      },
    });
  }
  return found;
}

/**
 * Interactive elements that fail WCAG 2.5.8. Every target in range counts
 * for spacing, including skipped ones, but only the others are flagged.
 * @param {CheckOptions} options
 * @returns {Finding[]}
 */
function scanTargets(options) {
  /** @type {{ el: Element; rect: Rect; flag: boolean; layer: Element | null }[]} */
  const targets = [];
  for (const el of document.body.querySelectorAll(INTERACTIVE)) {
    // Check the range on the element's own box first: reading `labels` is
    // slow, and most targets are far from the viewport. A label sits next
    // to its control, so the control's box is close enough.
    if (!near(el.getBoundingClientRect(), options)) continue;
    if (el.closest(DEV_TOOL)) continue;
    const rect = targetRect(el);
    // Zero-size and visually hidden (1px) controls have no target of their
    // own; their label is checked instead.
    if (rect.width <= 1 || rect.height <= 1) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden") continue;
    // Targets in a sentence are exempt in WCAG 2.5.8: skip inline elements
    // whose parent also holds running text.
    if (
      style.display.startsWith("inline") &&
      el.parentElement &&
      hasOwnText(el.parentElement)
    ) {
      continue;
    }
    targets.push({
      el,
      rect,
      flag: !skipped(el, options),
      layer: options.layer(el),
    });
  }
  return failingTargets(
    targets.map((target) => target.rect),
    options.targetSize,
    targets.map((target) => target.layer),
  )
    .filter((index) => targets[index].flag)
    .slice(0, MAX_FINDINGS)
    .map((index) => {
      const { el, rect } = targets[index];
      return {
        check: /** @type {const} */ ("targets"),
        el,
        rect,
        message: `${formatPx(rect.width)} × ${formatPx(rect.height)}`,
        values: { size: options.targetSize },
      };
    });
}

/**
 * Text below WCAG AA contrast. Disabled controls are exempt in WCAG 1.4.3,
 * so text inside `disabled` or `aria-disabled` elements is skipped.
 * @param {CheckOptions} options
 * @returns {Finding[]}
 */
function scanContrast(options) {
  /** @type {Finding[]} */
  const found = [];
  /** @type {Set<Element>} */
  const seen = new Set();
  /** @type {import("./LayoutInspector/colors.js").BackgroundCache} */
  const backgrounds = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (
    let text = walker.nextNode();
    text && found.length < MAX_FINDINGS;
    text = walker.nextNode()
  ) {
    const el = text.parentElement;
    if (!el || seen.has(el) || !text.nodeValue?.trim()) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    if (!near(r, options)) continue;
    if (
      el.closest(`${DEV_TOOL}, script, style, ${DISABLED}`) ||
      closestSafe(el, options.ignore)
    ) {
      continue;
    }
    // Text is the app's when the app styles it or the background behind it.
    if (
      !options.carbon &&
      carbonOwned(el) &&
      carbonBackground(effectiveBackground(el, backgrounds).source)
    ) {
      continue;
    }
    const style = getComputedStyle(el);
    if (style.visibility === "hidden") continue;
    const result = textContrast(el, backgrounds);
    // A background image hides the real background; leave it to a person.
    if (result.approximate || result.ratio >= result.aa) continue;
    found.push({
      check: "contrast",
      el,
      rect: r,
      message: `${formatRatio(result.ratio)} · needs ${result.aa}:1`,
      values: {
        ratio: Math.floor(result.ratio * 100) / 100,
        needs: result.aa,
        large: result.large,
      },
    });
  }
  return found;
}

const CLIPS = new Set(["hidden", "clip"]);
const SCROLLS = new Set(["auto", "scroll", "hidden", "clip"]);

// Caps the descendants `clipsVisibleContent` reads per box.
const MAX_CLIP_DESCENDANTS = 300;

/**
 * Whether a clipping box hides something a person could see: its own text
 * (as with an ellipsis), or a visible descendant that reaches past its
 * edges. A collapsed menu or disclosure clips content that is hidden
 * anyway (`visibility: hidden`, `inert`, `hidden`, or `aria-hidden`), so it
 * does not count.
 * @param {Element} el
 * @param {CSSStyleDeclaration} style
 */
function clipsVisibleContent(el, style) {
  if (style.visibility === "visible" && hasOwnText(el)) return true;
  const box = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const child = /** @type {HTMLElement} */ (node);
      if (
        child.hidden ||
        child.inert ||
        child.getAttribute("aria-hidden") === "true"
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let read = 0;
  for (let next = walker.nextNode(); next; next = walker.nextNode()) {
    if (++read > MAX_CLIP_DESCENDANTS) return true;
    const node = /** @type {Element} */ (next);
    const r = node.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const outside =
      r.right > box.right + 1 ||
      r.bottom > box.bottom + 1 ||
      r.left < box.left - 1 ||
      r.top < box.top - 1;
    if (outside && getComputedStyle(node).visibility === "visible") {
      return true;
    }
  }
  return false;
}

/**
 * Two kinds of overflow:
 * - Culprits of horizontal page scroll: elements that reach past the right
 *   (or, in RTL, left) edge of the page while their parent does not, and
 *   that no ancestor clips or scrolls.
 * - Clipped content: `overflow: hidden` or `clip` boxes whose content is
 *   larger than the box, including `text-overflow: ellipsis` truncation.
 *   Scrollable boxes are left alone, and so are 1px visually hidden
 *   helpers.
 * @param {CheckOptions} options
 * @returns {Finding[]}
 */
function scanOverflow(options) {
  /** @type {Finding[]} */
  const found = [];
  const sx = window.scrollX;
  const pageWidth = document.documentElement.clientWidth;
  const pageScrolls = document.documentElement.scrollWidth > pageWidth + 1;

  for (const el of document.body.querySelectorAll("*")) {
    if (found.length >= MAX_FINDINGS) break;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    if (!near(r, options)) continue;
    if (el.closest(DEV_TOOL) || skipped(el, options)) {
      continue;
    }
    const style = getComputedStyle(el);

    if (pageScrolls && style.position !== "fixed") {
      const past = Math.max(r.right + sx - pageWidth, -(r.left + sx));
      if (past > 0.5) {
        const parent = el.parentElement?.getBoundingClientRect();
        const parentPast = parent
          ? Math.max(parent.right + sx - pageWidth, -(parent.left + sx))
          : 0;
        let contained = false;
        for (
          let ancestor = el.parentElement;
          ancestor && ancestor !== document.body;
          ancestor = ancestor.parentElement
        ) {
          if (SCROLLS.has(getComputedStyle(ancestor).overflowX)) {
            contained = true;
            break;
          }
        }
        if (parentPast <= 0.5 && !contained) {
          found.push({
            check: "overflow",
            el,
            rect: r,
            message: `${formatPx(past)}px past the page`,
            values: { kind: "page", px: Math.round(past * 10) / 10 },
          });
          continue;
        }
      }
    }

    // Visually hidden helpers, such as Carbon's assistive text, clip on
    // purpose.
    if (
      style.clip !== "auto" ||
      style.clipPath !== "none" ||
      style.opacity === "0"
    ) {
      continue;
    }
    const clipsX = CLIPS.has(style.overflowX);
    const clipsY = CLIPS.has(style.overflowY);
    if (!clipsX && !clipsY) continue;
    const overX = clipsX ? el.scrollWidth - el.clientWidth : 0;
    const overY = clipsY ? el.scrollHeight - el.clientHeight : 0;
    if (overX <= 1 && overY <= 1) continue;
    if (!clipsVisibleContent(el, style)) continue;
    const truncated = style.textOverflow === "ellipsis" && overX > 1;
    found.push({
      check: "overflow",
      el,
      rect: r,
      message: truncated
        ? `truncated · ${formatPx(overX)}px hidden`
        : [
            overX > 1 && `clips ${formatPx(overX)}px across`,
            overY > 1 && `clips ${formatPx(overY)}px down`,
          ]
            .filter(Boolean)
            .join(" · "),
      values: {
        kind: truncated ? "truncated" : "clipped",
        x: Math.max(0, overX),
        y: Math.max(0, overY),
      },
    });
  }
  return found;
}

/**
 * Runs the checks in `options.checks`, in a fixed order.
 * @param {CheckOptions} options
 * @returns {Finding[]}
 */
export function runChecks(options) {
  const on = new Set(options.checks);
  return [
    ...(on.has("spacing") ? scanSpacing(options) : []),
    ...(on.has("targets") ? scanTargets(options) : []),
    ...(on.has("contrast") ? scanContrast(options) : []),
    ...(on.has("overflow") ? scanOverflow(options) : []),
  ];
}

/**
 * A short CSS path to `el`, for a person or an agent to find it: up to four
 * steps, stopping at a stable `id` or a `data-testid`.
 * @param {Element} el
 */
export function cssPath(el) {
  /** @type {string[]} */
  const steps = [];
  for (
    let node = /** @type {Element | null} */ (el);
    node && node !== document.body && steps.length < 4;
    node = node.parentElement
  ) {
    // The library generates `ccs-` ids, alone or after a prefix, per mount, so they change on every
    // load; a path through them could not be compared across runs.
    if (node.id && !GENERATED_ID.test(node.id)) {
      steps.unshift(`#${CSS.escape(node.id)}`);
      break;
    }
    const testId = node.getAttribute("data-testid");
    if (testId) {
      steps.unshift(`[data-testid="${testId}"]`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const cls = [...node.classList].find((c) => !c.startsWith("svelte-"));
    steps.unshift(cls ? `${tag}.${CSS.escape(cls)}` : tag);
  }
  return steps.join(" > ");
}

const BEM_SEPARATOR = /__|--/;
const GENERATED_ID = /(^|-)ccs-[a-z0-9]{6,}/;

/**
 * The Carbon block `el` belongs to, such as `bx--btn` for a button's text,
 * or `null` outside Carbon's components.
 * @param {Element} el
 */
export function carbonBlock(el) {
  for (
    let node = /** @type {Element | null} */ (el);
    node;
    node = node.parentElement
  ) {
    const cls = [...node.classList].find((c) => c.startsWith("bx--"));
    if (cls) return `bx--${cls.slice(4).split(BEM_SEPARATOR)[0]}`;
  }
  return null;
}

/**
 * @typedef {{ check: AuditCheck; selector: string; carbon: string | null; rect: Rect; message: string; values?: Record<string, unknown> }} AuditFinding
 */

/**
 * Runs the page checks once over the whole page and returns the findings
 * as data, for scripts and agents. Unlike LayoutInspector, it does not
 * wait, throttle, or limit itself to the viewport, so the same page gives
 * the same result. Positions are in page coordinates.
 * @param {{ checks?: readonly AuditCheck[]; scope?: string; carbon?: boolean; ignore?: string; targetSize?: number }} [options]
 * @returns {{ findings: AuditFinding[]; ms: number }}
 */
export function audit(options = {}) {
  const start = performance.now();
  const {
    checks = AUDIT_CHECKS,
    scope = "",
    carbon = false,
    ignore = "",
    targetSize = 24,
  } = options;
  const found = runChecks({
    checks: [...checks],
    band: null,
    carbon,
    ignore,
    targetSize,
    remPx:
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16,
    layer: createLayerLookup(["fixed", "sticky"]),
  });
  const sx = window.scrollX;
  const sy = window.scrollY;
  const round = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  const findings = found
    .filter((f) => !scope || closestSafe(f.el, scope))
    .map((f) => ({
      check: f.check,
      selector: cssPath(f.el),
      carbon: carbonBlock(f.el),
      rect: {
        left: round(f.rect.left + sx),
        top: round(f.rect.top + sy),
        width: round(f.rect.width),
        height: round(f.rect.height),
      },
      message: f.message,
      values: f.values,
    }));
  return { findings, ms: Math.round((performance.now() - start) * 10) / 10 };
}
