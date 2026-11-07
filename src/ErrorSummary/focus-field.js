// @ts-check

const WHITESPACE = /\s+/;

// A control the user can type into or press. A group's wrapper has an id but
// is not itself focusable, so the first of these inside it stands in.
const CONTROL =
  'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [role="slider"]:not([aria-disabled="true"]), [tabindex="0"]';

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isShown(element) {
  // Safari before 17.4 has no `checkVisibility`; treat the element as shown.
  return typeof element.checkVisibility === "function"
    ? element.checkVisibility()
    : true;
}

/**
 * The control a field id stands for: the element itself when it is a
 * control, else the first shown control inside it (the checked radio of a
 * radio group, if any).
 * @param {HTMLElement} target
 * @returns {HTMLElement | null}
 */
export function resolveControl(target) {
  if (target.matches(CONTROL)) return target;
  const checked = target.querySelector('input[type="radio"]:checked');
  if (checked && isShown(checked)) return /** @type {HTMLElement} */ (checked);
  for (const control of target.querySelectorAll(CONTROL)) {
    if (isShown(control)) return /** @type {HTMLElement} */ (control);
  }
  return null;
}

/**
 * Whether a label can be seen: a visually hidden one is clipped to a pixel
 * and sits nowhere useful to scroll to.
 * @param {Element | null | undefined} label
 * @returns {label is HTMLElement}
 */
function isSeen(label) {
  if (!label) return false;
  const box = label.getBoundingClientRect();
  return box.width > 1 && box.height > 1;
}

/**
 * The text of the form item an element sits in, found by climbing until an
 * ancestor holds a label or legend that is not inside another control.
 * @param {HTMLElement} control
 * @returns {HTMLElement | null}
 */
function itemLabel(control) {
  /** @type {HTMLElement | null} */
  let node = control.parentElement;
  for (
    let depth = 0;
    node && depth < 6;
    depth += 1, node = node.parentElement
  ) {
    if (node.tagName === "FORM") return null;
    for (const child of node.children) {
      if (child.matches("label, legend, .bx--label")) {
        return /** @type {HTMLElement} */ (child);
      }
    }
  }
  return null;
}

/**
 * The label that names a control, for the user to read after the jump.
 *
 * Like GOV.UK: the legend of the control's fieldset when the control is a
 * radio or checkbox, or when the legend is close enough to show with the
 * control (within half the viewport); otherwise the control's own label.
 * @param {HTMLElement} control
 * @returns {HTMLElement | null}
 */
export function labelFor(control) {
  const doc = control.ownerDocument;
  const fieldset = control.closest("fieldset");
  const legend = fieldset?.querySelector("legend") ?? null;

  if (isSeen(legend)) {
    const type = /** @type {HTMLInputElement} */ (control).type;
    if (
      control.tagName === "INPUT" &&
      (type === "radio" || type === "checkbox")
    )
      return legend;
    const viewport = doc.defaultView?.innerHeight ?? 0;
    const box = control.getBoundingClientRect();
    if (
      box.height &&
      viewport &&
      box.top + box.height - legend.getBoundingClientRect().top < viewport / 2
    ) {
      return legend;
    }
  }

  /** @type {Array<Element | null | undefined>} */
  const candidates = [
    /** @type {HTMLInputElement} */ (control).labels?.[0],
    control.id
      ? [...doc.querySelectorAll("label[for]")].find(
          (label) => label.getAttribute("for") === control.id,
        )
      : null,
    control.closest("label"),
    doc.getElementById(
      control.getAttribute("aria-labelledby")?.split(WHITESPACE)[0] ?? "",
    ),
    itemLabel(control),
    legend,
  ];
  return /** @type {HTMLElement | null} */ (candidates.find(isSeen) ?? null);
}

/**
 * Move focus to a field and scroll it into view with its label, so the
 * user sees what the field is for. Returns `false` when nothing in the
 * page matches, so a caller can let the link navigate instead.
 *
 * @param {string} fieldId - The id of a control, or of an element that holds one.
 * @param {{ scrollMargin?: number; root?: Document | ShadowRoot }} [options]
 * @returns {HTMLElement | false} The control that took focus.
 */
export function focusField(fieldId, options = {}) {
  const root =
    options.root ?? (typeof document === "undefined" ? undefined : document);
  const target = root?.getElementById(fieldId);
  if (!target) return false;
  const control = resolveControl(target);
  if (!control) return false;

  // A field with no visible label (a search box) scrolls by itself.
  const label = labelFor(control);
  const scrolled = label ?? control;
  const margin = options.scrollMargin ?? 0;
  const previous = scrolled.style.scrollMarginBlockStart;
  if (margin) scrolled.style.scrollMarginBlockStart = `${margin}px`;
  scrolled.scrollIntoView?.({ block: label ? "start" : "center" });
  if (margin) scrolled.style.scrollMarginBlockStart = previous;

  // The scroll above already showed the label with the field below it.
  control.focus({ preventScroll: true });
  return control;
}
