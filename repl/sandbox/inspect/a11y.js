// Rule-based accessibility audit of the preview, phrased in terms of
// carbon-components-svelte props (labelText/hideLabel, iconDescription).
// Zero dependencies; cheap enough to rerun after each paint and DOM change.

import { blend, contrastRatio, isLargeText, parseColor } from "./tokens.js";

const FORM_FIELDS =
  "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea";
const MAX_FINDINGS = 50;
const WHITESPACE = /\s+/;

function visible(el) {
  if (!el.isConnected) return false;
  const style = el.ownerDocument.defaultView.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** Accessible name per the common cases (not the full accname algorithm). */
export function accessibleName(el) {
  const doc = el.ownerDocument;
  const labelledby = el.getAttribute("aria-labelledby");
  if (labelledby) {
    const text = labelledby
      .split(WHITESPACE)
      .map((id) => doc.getElementById(id)?.textContent?.trim() ?? "")
      .join(" ")
      .trim();
    if (text) return text;
  }
  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria;
  if (el.labels?.length) {
    const text = [...el.labels]
      .map((l) => l.textContent.trim())
      .join(" ")
      .trim();
    if (text) return text;
  }
  if (el.tagName === "IMG" || (el.tagName === "INPUT" && el.type === "image")) {
    return el.getAttribute("alt")?.trim() ?? "";
  }
  if (
    el.tagName === "BUTTON" ||
    el.tagName === "A" ||
    el.getAttribute("role") === "button"
  ) {
    const text = el.textContent.trim();
    if (text) return text;
    const svgTitle = el.querySelector("svg title")?.textContent?.trim();
    if (svgTitle) return svgTitle;
  }
  return el.getAttribute("title")?.trim() ?? "";
}

/** Nearest opaque background behind `el`, composited up the tree. */
function backgroundOf(el) {
  const layers = [];
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = node.ownerDocument.defaultView.getComputedStyle(node);
    if (style.backgroundImage && style.backgroundImage !== "none") return null; // can't judge images/gradients
    const c = parseColor(style.backgroundColor);
    if (c && c[3] > 0) {
      layers.push(c);
      if (c[3] >= 1) break;
    }
  }
  let result = [255, 255, 255, 1];
  for (const layer of layers.reverse())
    result = layer[3] >= 1 ? layer : blend(layer, result);
  return result;
}

/**
 * @param {Document} doc
 * @param {{ tokens?: { tokensFor: (el: Element) => Record<string, { token: string }> } }} [options]
 * @returns {{ rule: string; severity: "error" | "warning"; message: string; element: Element }[]}
 */
export function audit(doc, { tokens } = {}) {
  const findings = [];
  const add = (rule, severity, message, element) => {
    if (findings.length < MAX_FINDINGS)
      findings.push({ rule, severity, message, element });
  };
  const body = doc.body;

  for (const field of body.querySelectorAll(FORM_FIELDS)) {
    if (!visible(field) || field.closest("[aria-hidden=true]")) continue;
    if (!accessibleName(field)) {
      add(
        "label",
        "error",
        "Form field has no accessible name. Set `labelText` (add `hideLabel` to hide it visually) or `aria-label`.",
        field,
      );
    }
  }

  for (const button of body.querySelectorAll(
    "button, [role=button], a[href]",
  )) {
    if (!visible(button) || button.closest("[aria-hidden=true]")) continue;
    if (!accessibleName(button)) {
      const iconOnly =
        !!button.querySelector("svg") && !button.textContent.trim();
      add(
        "name",
        "error",
        iconOnly
          ? "Icon-only button has no accessible name. Set `iconDescription` on the Button."
          : `${button.tagName === "A" ? "Link" : "Button"} has no accessible name.`,
        button,
      );
    }
  }

  for (const img of body.querySelectorAll("img")) {
    if (!img.hasAttribute("alt") && !img.closest("[aria-hidden=true]")) {
      add(
        "alt",
        "error",
        'Image has no `alt`. Describe it, or use alt="" if it is decorative.',
        img,
      );
    }
  }

  const seen = new Map();
  for (const el of body.querySelectorAll("[id]")) {
    const first = seen.get(el.id);
    if (first)
      add(
        "duplicate-id",
        "warning",
        `Duplicate id "${el.id}" breaks label and aria references.`,
        el,
      );
    else seen.set(el.id, el);
  }

  for (const el of body.querySelectorAll(
    "[aria-labelledby], [aria-describedby], [aria-controls]",
  )) {
    for (const attr of [
      "aria-labelledby",
      "aria-describedby",
      "aria-controls",
    ]) {
      for (const id of (el.getAttribute(attr) ?? "")
        .split(WHITESPACE)
        .filter(Boolean)) {
        if (!doc.getElementById(id)) {
          add(
            "aria-reference",
            "warning",
            `${attr} points to "${id}", which doesn't exist.`,
            el,
          );
        }
      }
    }
  }

  // Contrast for elements that own text.
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const checked = new Set();
  while (walker.nextNode() && findings.length < MAX_FINDINGS) {
    const text = /** @type {Text} */ (walker.currentNode);
    const el = text.parentElement;
    if (!el || checked.has(el) || !text.data.trim()) continue;
    checked.add(el);
    if (
      !visible(el) ||
      el.closest("[aria-hidden=true], :disabled, [aria-disabled=true]")
    )
      continue;
    const style = doc.defaultView.getComputedStyle(el);
    const fg = parseColor(style.color);
    const bg = backgroundOf(el);
    if (!fg || !bg || fg[3] === 0) continue;
    const ratio = contrastRatio(fg[3] < 1 ? blend(fg, bg) : fg, bg);
    const needed = isLargeText(
      Number.parseFloat(style.fontSize),
      style.fontWeight,
    )
      ? 3
      : 4.5;
    if (ratio < needed) {
      const t = tokens?.tokensFor(el) ?? {};
      const names = [t.color?.token, t.background?.token].filter(Boolean);
      add(
        "contrast",
        "warning",
        `Text contrast ${ratio.toFixed(2)}:1 is below ${needed}:1${names.length ? ` (${names.join(" on ")})` : ""}.`,
        el,
      );
    }
  }

  return findings;
}
