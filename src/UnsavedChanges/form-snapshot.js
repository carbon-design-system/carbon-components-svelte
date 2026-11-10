// @ts-check

/** @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} Control */

const IGNORED_INPUT_TYPES = new Set(["button", "submit", "reset", "image"]);

/**
 * @param {unknown} node
 * @returns {node is Control}
 */
export function isControl(node) {
  if (!node || typeof node !== "object" || !("tagName" in node)) return false;
  const { tagName } = /** @type {Element} */ (node);
  if (tagName === "SELECT" || tagName === "TEXTAREA") return true;
  return (
    tagName === "INPUT" &&
    !IGNORED_INPUT_TYPES.has(/** @type {HTMLInputElement} */ (node).type)
  );
}

/** @param {Control} control */
function isHidden(control) {
  return control.type === "hidden";
}

/**
 * What the user would submit for one control, as a comparable string.
 * Files compare by name, size and modified time, since their contents are
 * never read.
 *
 * @param {Control} control
 * @returns {string}
 */
export function controlValue(control) {
  if (control instanceof HTMLSelectElement) {
    return Array.from(control.selectedOptions, (option) => option.value).join(
      "\u0000",
    );
  }
  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox" || control.type === "radio") {
      return control.checked ? "1" : "0";
    }
    if (control.type === "file") {
      return Array.from(
        control.files ?? [],
        (file) => `${file.name}:${file.size}:${file.lastModified}`,
      ).join("\u0000");
    }
  }
  return control.value;
}

/**
 * The value a control had in the markup, for a control that fires an event
 * before it has a baseline.
 *
 * @param {Control} control
 * @returns {string}
 */
function markupValue(control) {
  if (control instanceof HTMLSelectElement) {
    const options = Array.from(control.options);
    const selected = options.filter((option) => option.defaultSelected);
    if (selected.length === 0 && !control.multiple && options[0]) {
      selected.push(options[0]);
    }
    return selected.map((option) => option.value).join("\u0000");
  }
  if (control instanceof HTMLInputElement) {
    if (control.type === "checkbox" || control.type === "radio") {
      return control.defaultChecked ? "1" : "0";
    }
    if (control.type === "file") return "";
  }
  return control.defaultValue;
}

/**
 * Per-element dirty bookkeeping for a form (or any container).
 *
 * `FormData` is no use here: it skips every control without a `name`, and
 * `bind:value` code often leaves `name` off. Each control is compared to its
 * own baseline instead, and only the control that changed is re-read, so the
 * cost of a keystroke does not grow with the field count.
 *
 * `hidden` inputs are compared as one set (name and value pairs). Components
 * such as `MultiSelect` and `Dropdown` mirror their selection into hidden
 * inputs and add, remove or rewrite them without firing any event.
 *
 * @param {HTMLElement} root
 */
export function createFormSnapshot(root) {
  /** @type {WeakMap<Control, string>} */
  const baselines = new WeakMap();
  /** @type {Set<Control>} */
  const changed = new Set();
  let hiddenBaseline = "";
  let hiddenChanged = false;

  /** @returns {Control[]} */
  function controls() {
    const found =
      root instanceof HTMLFormElement
        ? Array.from(root.elements)
        : Array.from(root.querySelectorAll("input, select, textarea"));
    return found.filter(isControl);
  }

  function hiddenSignature() {
    return controls()
      .filter(isHidden)
      .map((control) => `${control.name}\u0001${control.value}`)
      .sort()
      .join("\u0002");
  }

  /** Retake every baseline; the form reads clean. */
  function capture() {
    changed.clear();
    for (const control of controls()) {
      if (!isHidden(control)) baselines.set(control, controlValue(control));
    }
    hiddenBaseline = hiddenSignature();
    hiddenChanged = false;
  }

  /** @param {Control} control */
  function check(control) {
    if (isHidden(control)) {
      hiddenChanged = hiddenSignature() !== hiddenBaseline;
      return;
    }
    let baseline = baselines.get(control);
    if (baseline === undefined) {
      baseline = markupValue(control);
      baselines.set(control, baseline);
    }
    if (controlValue(control) === baseline) changed.delete(control);
    else changed.add(control);
  }

  /**
   * Re-read every control. Covers changes that fire no `input`/`change`
   * event, and controls that appeared since the last read. A new control
   * takes its current value as its baseline, so a field array row that
   * appears empty is not a change.
   */
  function checkAll() {
    for (const control of changed) {
      if (!control.isConnected) changed.delete(control);
    }
    for (const control of controls()) {
      if (!isHidden(control) && !baselines.has(control)) {
        baselines.set(control, controlValue(control));
      } else {
        check(control);
      }
    }
    hiddenChanged = hiddenSignature() !== hiddenBaseline;
  }

  /** A radio's siblings change without an event of their own. */
  function checkRadios() {
    for (const control of controls()) {
      if (control.type === "radio") check(control);
    }
  }

  return {
    capture,
    check,
    checkAll,
    checkRadios,
    isDirty: () => changed.size > 0 || hiddenChanged,
  };
}
