// Form controls: input, textarea, select/option, button, form, fieldset,
// label, output, progress, meter. Also FormData, ValidityState, and click
// activation behavior (checkbox/radio toggling, submit/reset, labels).

import {
  HTMLCollection,
  HTMLFormControlsCollection,
  HTMLOptionsCollection,
  liveHTMLCollection,
  staticNodeList,
} from "./collections.js";
import {
  DOMTokenList,
  HTML_CLASSES,
  HTMLElement,
  isFocusable,
  reflectBool,
  reflectEnum,
  reflectInt,
  reflectString,
  reflectURL,
} from "./element.js";
import {
  dispatch,
  Event,
  fire,
  hooks,
  InputEvent,
  MouseEvent,
  SubmitEvent,
} from "./events.js";
import { descendantText, nextInTree, setTextContent } from "./node.js";
import {
  domException,
  ELEMENT_NODE,
  HTML_NS,
  INTERNAL,
  illegalConstructor,
  str,
  tag,
} from "./shared.js";

// --- Shared helpers ------------------------------------------------------------------

function isHTML(el, name) {
  return (
    el !== null &&
    el.nodeType === ELEMENT_NODE &&
    el._ns === HTML_NS &&
    el._localName === name
  );
}

function rootOf(node) {
  let n = node;
  while (n._parent) n = n._parent;
  return n;
}

/** The form an element is associated with (form attribute, else nearest ancestor). */
export function formOwner(el) {
  const formId = el._getAttrRaw("form");
  if (formId !== null) {
    const root = rootOf(el);
    for (let n = root._first; n; n = nextInTree(n, root)) {
      if (n.nodeType === ELEMENT_NODE && n._id === formId)
        return isHTML(n, "form") ? n : null;
    }
    return null;
  }
  for (let p = el._parent; p; p = p._parent) if (isHTML(p, "form")) return p;
  return null;
}

/** Disabled per the "actually disabled" rules, including fieldset inheritance. */
function disabledByFieldset(el) {
  for (let p = el._parent; p; p = p._parent) {
    if (isHTML(p, "fieldset") && p._getAttrRaw("disabled") !== null) {
      let legend = null;
      for (let c = p._first; c; c = c._next) {
        if (isHTML(c, "legend")) {
          legend = c;
          break;
        }
      }
      if (legend?.contains(el)) continue;
      return true;
    }
  }
  return false;
}

function controlDisabled(el) {
  return el._getAttrRaw("disabled") !== null || disabledByFieldset(el);
}

function labelsFor(el) {
  const root = rootOf(el);
  const out = [];
  for (let n = root._first; n; n = nextInTree(n, root)) {
    if (isHTML(n, "label") && n.control === el) out.push(n);
  }
  return staticNodeList(out);
}

const LISTED = new Set([
  "button",
  "fieldset",
  "input",
  "object",
  "output",
  "select",
  "textarea",
]);
const LABELABLE = new Set([
  "button",
  "input",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
]);

function isLabelable(el) {
  if (el._ns !== HTML_NS || !LABELABLE.has(el._localName)) return false;
  return !(el._localName === "input" && el.type === "hidden");
}

// --- Validity -----------------------------------------------------------------------

export class ValidityState {
  constructor(token, el) {
    if (token !== INTERNAL) illegalConstructor();
    this._el = el;
  }
  get valueMissing() {
    return this._el._valueMissing?.() ?? false;
  }
  get typeMismatch() {
    return this._el._typeMismatch?.() ?? false;
  }
  get patternMismatch() {
    return this._el._patternMismatch?.() ?? false;
  }
  get tooLong() {
    return false;
  }
  get tooShort() {
    return false;
  }
  get rangeUnderflow() {
    return this._el._rangeUnderflow?.() ?? false;
  }
  get rangeOverflow() {
    return this._el._rangeOverflow?.() ?? false;
  }
  get stepMismatch() {
    return this._el._stepMismatch?.() ?? false;
  }
  get badInput() {
    return false;
  }
  get customError() {
    return this._el._customValidity !== "";
  }
  get valid() {
    return !(
      this.valueMissing ||
      this.typeMismatch ||
      this.patternMismatch ||
      this.rangeUnderflow ||
      this.rangeOverflow ||
      this.stepMismatch ||
      this.customError
    );
  }
}
tag(ValidityState);

/** Constraint validation API shared by listed elements. */
class ConstraintValidation {
  get validity() {
    return (this._validity ??= new ValidityState(INTERNAL, this));
  }
  get willValidate() {
    return this._willValidate();
  }
  get validationMessage() {
    if (!this._willValidate() || this.validity.valid) return "";
    if (this._customValidity) return this._customValidity;
    if (this.validity.valueMissing) return "Constraints not satisfied";
    return "Constraints not satisfied";
  }
  setCustomValidity(message) {
    this._customValidity = str(message);
  }
  checkValidity() {
    if (!this._willValidate() || this.validity.valid) return true;
    fire(this, "invalid", { cancelable: true });
    return false;
  }
  reportValidity() {
    return this.checkValidity();
  }
}

function applyValidation(Ctor) {
  for (const key of Reflect.ownKeys(ConstraintValidation.prototype)) {
    if (key === "constructor") continue;
    Object.defineProperty(
      Ctor.prototype,
      key,
      Object.getOwnPropertyDescriptor(ConstraintValidation.prototype, key),
    );
  }
}

// --- Number helpers ------------------------------------------------------------------

const FLOAT_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
function parseFloatStrict(s) {
  if (!FLOAT_RE.test(s) || s.endsWith(".")) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function formatNumber(n) {
  return String(n);
}

// --- HTMLInputElement -----------------------------------------------------------------

const INPUT_TYPES = new Set([
  "hidden",
  "text",
  "search",
  "tel",
  "url",
  "email",
  "password",
  "date",
  "month",
  "week",
  "time",
  "datetime-local",
  "number",
  "range",
  "color",
  "checkbox",
  "radio",
  "file",
  "submit",
  "image",
  "reset",
  "button",
]);
const MODE_DEFAULT = new Set(["hidden", "submit", "image", "reset", "button"]);
const MODE_DEFAULT_ON = new Set(["checkbox", "radio"]);
const SELECTION_TYPES = new Set(["text", "search", "url", "tel", "password"]);

function valueMode(type) {
  if (MODE_DEFAULT.has(type)) return "default";
  if (MODE_DEFAULT_ON.has(type)) return "default/on";
  if (type === "file") return "filename";
  return "value";
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export class FileList {
  constructor(token, files = []) {
    if (token !== INTERNAL) illegalConstructor();
    this._files = files;
    files.forEach((f, i) => {
      this[i] = f;
    });
  }
  get length() {
    return this._files.length;
  }
  item(i) {
    return this._files[i] ?? null;
  }
  [Symbol.iterator]() {
    return this._files[Symbol.iterator]();
  }
}
tag(FileList);

export class HTMLInputElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._value = "";
    this._dirtyValue = false;
    this._checked = false;
    this._dirtyChecked = false;
    this._indeterminate = false;
    this._selStart = 0;
    this._selEnd = 0;
    this._selDir = "none";
    this._customValidity = "";
    this._validity = null;
    this._files = null;
    this._type = "text";
  }

  _attrHook(name, ns, _old, value) {
    if (ns !== null) return;
    switch (name) {
      case "type": {
        const oldType = this._type;
        const l = value?.toLowerCase();
        this._type = l && INPUT_TYPES.has(l) ? l : "text";
        if (oldType !== this._type) {
          if (
            valueMode(oldType) === "value" &&
            valueMode(this._type) !== "value" &&
            this._value !== ""
          ) {
            // Spec: carry the value over to the content attribute.
            this._setAttrRaw("value", this._value);
          } else if (
            valueMode(oldType) !== "value" &&
            valueMode(this._type) === "value"
          ) {
            this._value = this._sanitize(this._getAttrRaw("value") ?? "");
            this._dirtyValue = false;
          } else {
            this._value = this._sanitize(this._value);
          }
          if (this._type === "radio" && this._checked) this._uncheckGroup();
        }
        break;
      }
      case "value":
        if (!this._dirtyValue) this._value = this._sanitize(value ?? "");
        break;
      case "checked":
        if (!this._dirtyChecked) {
          this._checked = value !== null;
          if (this._checked && this._type === "radio") this._uncheckGroup();
        }
        break;
      case "min":
      case "max":
      case "step":
        if (this._type === "range") this._value = this._sanitize(this._value);
        break;
      case "name":
        if (this._type === "radio" && this._checked) this._uncheckGroup();
        break;
    }
  }

  _cloneState(copy) {
    copy._value = this._value;
    copy._dirtyValue = this._dirtyValue;
    copy._checked = this._checked;
    copy._dirtyChecked = this._dirtyChecked;
    copy._indeterminate = this._indeterminate;
  }

  _sanitize(v) {
    switch (this._type) {
      case "text":
      case "search":
      case "tel":
      case "password":
        return v.replace(/[\r\n]/g, "");
      case "url":
        return v.replace(/[\r\n]/g, "").trim();
      case "email":
        if (this._getAttrRaw("multiple") !== null) {
          return v
            .split(",")
            .map((s) => s.trim())
            .join(",");
        }
        return v.replace(/[\r\n]/g, "").trim();
      case "number":
        return parseFloatStrict(v) === null ? "" : v;
      case "range": {
        const min = parseFloatStrict(this._getAttrRaw("min") ?? "") ?? 0;
        let max = parseFloatStrict(this._getAttrRaw("max") ?? "") ?? 100;
        if (max < min) max = min;
        let n = parseFloatStrict(v);
        if (n === null) n = max < min ? min : min + (max - min) / 2;
        n = Math.min(Math.max(n, min), max);
        const stepAttr = this._getAttrRaw("step");
        if (stepAttr?.toLowerCase() !== "any") {
          const step = parseFloatStrict(stepAttr ?? "") ?? 1;
          if (step > 0) {
            const k = Math.round((n - min) / step);
            n = min + k * step;
            if (n > max) n -= step;
            n = Math.round(n * 1e10) / 1e10;
          }
        }
        return formatNumber(n);
      }
      case "color":
        return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : "#000000";
      case "date":
        return /^\d{4,}-\d{2}-\d{2}$/.test(v) ? v : "";
      case "month":
        return /^\d{4,}-\d{2}$/.test(v) ? v : "";
      case "week":
        return /^\d{4,}-W\d{2}$/.test(v) ? v : "";
      case "time":
        return /^\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v) ? v : "";
      case "datetime-local":
        return /^\d{4,}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)
          ? v.replace(" ", "T")
          : "";
    }
    return v;
  }

  get type() {
    return this._type;
  }
  set type(v) {
    this._setAttrRaw("type", str(v));
  }

  get value() {
    switch (valueMode(this._type)) {
      case "value":
        return this._value;
      case "default":
        return this._getAttrRaw("value") ?? "";
      case "default/on":
        return this._getAttrRaw("value") ?? "on";
      default:
        return this._files?.length
          ? "C:\\fakepath\\" + this._files[0].name
          : "";
    }
  }
  set value(v) {
    const value = v === null ? "" : str(v);
    switch (valueMode(this._type)) {
      case "value": {
        const old = this._value;
        this._value = this._sanitize(value);
        this._dirtyValue = true;
        if (old !== this._value) {
          this._selStart = this._selEnd = this._value.length;
          this._selDir = "none";
        }
        break;
      }
      case "default":
      case "default/on":
        this._setAttrRaw("value", value);
        break;
      default:
        if (value === "") this._files = null;
        else
          throw domException(
            "This input element accepts a filename, which may only be programmatically set to the empty string.",
            "InvalidStateError",
          );
    }
  }
  get defaultValue() {
    return this._getAttrRaw("value") ?? "";
  }
  set defaultValue(v) {
    this._setAttrRaw("value", str(v));
  }
  get checked() {
    return this._checked;
  }
  set checked(v) {
    this._dirtyChecked = true;
    this._setChecked(!!v);
  }
  _setChecked(v) {
    this._checked = v;
    if (v && this._type === "radio") this._uncheckGroup();
    this._doc._version++;
  }
  _radioGroup() {
    const name = this._getAttrRaw("name");
    if (!name) return [];
    const form = formOwner(this);
    const root = rootOf(this);
    const out = [];
    for (let n = root._first ?? root; n; n = nextInTree(n, root)) {
      if (
        n !== this &&
        isHTML(n, "input") &&
        n._type === "radio" &&
        n._getAttrRaw("name") === name &&
        formOwner(n) === form
      ) {
        out.push(n);
      }
    }
    return out;
  }
  _uncheckGroup() {
    for (const r of this._radioGroup()) r._checked = false;
  }
  get defaultChecked() {
    return this._getAttrRaw("checked") !== null;
  }
  set defaultChecked(v) {
    if (v) this._setAttrRaw("checked", "");
    else this._removeAttrRaw("checked");
  }
  get indeterminate() {
    return this._indeterminate;
  }
  set indeterminate(v) {
    this._indeterminate = !!v;
  }
  get files() {
    if (this._type !== "file") return null;
    return (this._filesList ??= new FileList(INTERNAL, this._files ?? []));
  }
  set files(v) {
    if (this._type !== "file" || v == null) return;
    this._files = Array.from(v);
    this._filesList = null;
  }
  get form() {
    return formOwner(this);
  }
  get labels() {
    return this._type === "hidden" ? null : labelsFor(this);
  }
  get list() {
    const id = this._getAttrRaw("list");
    if (!id) return null;
    const el = this._doc.getElementById(id);
    return isHTML(el, "datalist") ? el : null;
  }

  // Selection API (text-like types only, as in browsers).
  _supportsSelection() {
    return SELECTION_TYPES.has(this._type);
  }
  get selectionStart() {
    return this._supportsSelection() ? this._selStart : null;
  }
  set selectionStart(v) {
    this._requireSelection();
    this.setSelectionRange(
      v,
      Math.max(Number(v) || 0, this._selEnd),
      this._selDir,
    );
  }
  get selectionEnd() {
    return this._supportsSelection() ? this._selEnd : null;
  }
  set selectionEnd(v) {
    this._requireSelection();
    this.setSelectionRange(this._selStart, v, this._selDir);
  }
  get selectionDirection() {
    return this._supportsSelection() ? this._selDir : null;
  }
  set selectionDirection(v) {
    this._requireSelection();
    this.setSelectionRange(this._selStart, this._selEnd, v);
  }
  _requireSelection() {
    if (!this._supportsSelection()) {
      throw domException(
        `The input element's type ('${this._type}') does not support selection.`,
        "InvalidStateError",
      );
    }
  }
  setSelectionRange(start, end, direction = "none") {
    this._requireSelection();
    setSelection(this, this._value.length, start, end, direction);
  }
  setRangeText(
    replacement,
    start = this._selStart,
    end = this._selEnd,
    mode = "preserve",
  ) {
    this._requireSelection();
    rangeText(this, str(replacement), start, end, mode);
  }
  select() {
    if (this._supportsSelection())
      setSelection(this, this._value.length, 0, this._value.length, "none");
  }

  get valueAsNumber() {
    if (this._type === "number" || this._type === "range")
      return parseFloatStrict(this._value) ?? Number.NaN;
    if (this._type === "date" && this._value)
      return Date.parse(this._value + "T00:00:00Z");
    return Number.NaN;
  }
  set valueAsNumber(n) {
    if (this._type === "number" || this._type === "range")
      this.value = Number.isNaN(n) ? "" : formatNumber(n);
    else
      throw domException(
        "This input element does not support Number values.",
        "InvalidStateError",
      );
  }
  get valueAsDate() {
    if (this._type !== "date" || !this._value) return null;
    return new Date(this._value + "T00:00:00Z");
  }
  set valueAsDate(d) {
    if (this._type !== "date")
      throw domException(
        "This input element does not support Date values.",
        "InvalidStateError",
      );
    this.value = d ? d.toISOString().slice(0, 10) : "";
  }
  stepUp(n = 1) {
    this._step(n);
  }
  stepDown(n = 1) {
    this._step(-n);
  }
  _step(n) {
    if (this._type !== "number" && this._type !== "range") {
      throw domException(
        "This form element is not steppable.",
        "InvalidStateError",
      );
    }
    const step = parseFloatStrict(this._getAttrRaw("step") ?? "") ?? 1;
    const current = parseFloatStrict(this._value) ?? 0;
    let next = current + step * n;
    const min = parseFloatStrict(this._getAttrRaw("min") ?? "");
    const max = parseFloatStrict(this._getAttrRaw("max") ?? "");
    if (min !== null) next = Math.max(next, min);
    if (max !== null) next = Math.min(next, max);
    this.value = formatNumber(Math.round(next * 1e10) / 1e10);
  }
  showPicker() {}

  _disabledState() {
    return controlDisabled(this);
  }
  _willValidate() {
    return (
      !controlDisabled(this) &&
      !MODE_DEFAULT.has(this._type) &&
      !(
        this._getAttrRaw("readonly") !== null &&
        valueMode(this._type) === "value"
      ) &&
      !this.closest("datalist")
    );
  }
  _valueMissing() {
    if (this._getAttrRaw("required") === null) return false;
    switch (this._type) {
      case "checkbox":
        return !this._checked;
      case "radio":
        return !this._checked && !this._radioGroup().some((r) => r._checked);
      case "file":
        return !this._files?.length;
    }
    if (valueMode(this._type) !== "value") return false;
    return this._value === "";
  }
  _typeMismatch() {
    if (this._value === "") return false;
    if (this._type === "email") {
      const parts =
        this._getAttrRaw("multiple") === null
          ? [this._value]
          : this._value.split(",");
      return parts.some((p) => !EMAIL_RE.test(p));
    }
    if (this._type === "url") {
      try {
        new URL(this._value);
        return false;
      } catch {
        return true;
      }
    }
    return false;
  }
  _patternMismatch() {
    const pattern = this._getAttrRaw("pattern");
    if (
      pattern === null ||
      this._value === "" ||
      valueMode(this._type) !== "value"
    )
      return false;
    let re;
    try {
      re = new RegExp(`^(?:${pattern})$`, "v");
    } catch {
      try {
        re = new RegExp(`^(?:${pattern})$`, "u");
      } catch {
        return false;
      }
    }
    return !re.test(this._value);
  }
  _numeric() {
    return this._type === "number" || this._type === "range";
  }
  _rangeUnderflow() {
    if (!this._numeric()) return false;
    const min = parseFloatStrict(this._getAttrRaw("min") ?? "");
    const v = parseFloatStrict(this._value);
    return min !== null && v !== null && v < min;
  }
  _rangeOverflow() {
    if (!this._numeric()) return false;
    const max = parseFloatStrict(this._getAttrRaw("max") ?? "");
    const v = parseFloatStrict(this._value);
    return max !== null && v !== null && v > max;
  }
  _stepMismatch() {
    if (this._type !== "number") return false;
    const stepAttr = this._getAttrRaw("step");
    if (stepAttr?.toLowerCase() === "any") return false;
    const step = parseFloatStrict(stepAttr ?? "") ?? 1;
    if (step <= 0) return false;
    const v = parseFloatStrict(this._value);
    if (v === null) return false;
    const base = parseFloatStrict(this._getAttrRaw("min") ?? "") ?? 0;
    const q = (v - base) / step;
    return Math.abs(q - Math.round(q)) > 1e-9;
  }
}
applyValidation(HTMLInputElement);
for (const p of [
  "accept",
  "alt",
  "autocomplete",
  "dirName",
  "name",
  "pattern",
  "placeholder",
  "max",
  "min",
  "step",
  "formTarget",
  "formEnctype",
  "formMethod",
]) {
  reflectString(
    HTMLInputElement.prototype,
    p,
    p === "dirName" ? "dirname" : p.toLowerCase(),
  );
}
reflectURL(HTMLInputElement.prototype, "src");
reflectURL(HTMLInputElement.prototype, "formAction", "formaction");
for (const p of ["disabled", "multiple", "required"])
  reflectBool(HTMLInputElement.prototype, p);
reflectBool(HTMLInputElement.prototype, "readOnly", "readonly");
reflectBool(HTMLInputElement.prototype, "formNoValidate", "formnovalidate");
reflectInt(HTMLInputElement.prototype, "maxLength", "maxlength", -1, {
  min: 0,
});
reflectInt(HTMLInputElement.prototype, "minLength", "minlength", -1, {
  min: 0,
});
reflectInt(HTMLInputElement.prototype, "size", "size", 20, { min: 1 });
reflectInt(HTMLInputElement.prototype, "width", "width", 0, {
  nonNegative: true,
});
reflectInt(HTMLInputElement.prototype, "height", "height", 0, {
  nonNegative: true,
});
tag(HTMLInputElement);
HTML_CLASSES.set("input", HTMLInputElement);

function setSelection(el, length, start, end, direction) {
  let s = Math.min(Math.max(Number(start) || 0, 0), length);
  const e = Math.min(Math.max(Number(end) || 0, 0), length);
  if (s > e) s = e;
  el._selStart = s;
  el._selEnd = e;
  const d = str(direction);
  el._selDir = d === "forward" || d === "backward" ? d : "none";
}

function rangeText(el, replacement, start, end, mode) {
  const value = el.value;
  if (start > end)
    throw domException(
      "The provided start value is larger than the end value.",
      "IndexSizeError",
    );
  const s = Math.min(start, value.length);
  const e = Math.min(end, value.length);
  el.value = value.slice(0, s) + replacement + value.slice(e);
  const newEnd = s + replacement.length;
  const oldStart = el._selStart;
  const oldEnd = el._selEnd;
  const delta = replacement.length - (e - s);
  if (mode === "select") setSelection(el, el.value.length, s, newEnd, "none");
  else if (mode === "start") setSelection(el, el.value.length, s, s, "none");
  else if (mode === "end")
    setSelection(el, el.value.length, newEnd, newEnd, "none");
  else {
    const adjust = (p) => (p > e ? p + delta : p > s ? s : p);
    setSelection(el, el.value.length, adjust(oldStart), adjust(oldEnd), "none");
  }
}

// --- HTMLTextAreaElement ---------------------------------------------------------------

export class HTMLTextAreaElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._raw = "";
    this._dirtyValue = false;
    this._selStart = 0;
    this._selEnd = 0;
    this._selDir = "none";
    this._customValidity = "";
    this._validity = null;
  }
  _childrenChanged() {
    if (!this._dirtyValue) {
      this._raw = descendantText(this);
      this._selStart = this._selEnd = Math.min(this._selEnd, this._raw.length);
    }
  }
  _cloneState(copy) {
    copy._raw = this._raw;
    copy._dirtyValue = this._dirtyValue;
  }
  get type() {
    return "textarea";
  }
  get value() {
    return this._raw.replace(/\r\n?/g, "\n");
  }
  set value(v) {
    const old = this._raw;
    this._raw = (v === null ? "" : str(v)).replace(/\r\n?/g, "\n");
    this._dirtyValue = true;
    if (old !== this._raw) {
      this._selStart = this._selEnd = this._raw.length;
      this._selDir = "none";
    }
  }
  get defaultValue() {
    return descendantText(this);
  }
  set defaultValue(v) {
    setTextContent(this, v);
  }
  get textLength() {
    return this.value.length;
  }
  get form() {
    return formOwner(this);
  }
  get labels() {
    return labelsFor(this);
  }
  get selectionStart() {
    return this._selStart;
  }
  set selectionStart(v) {
    this.setSelectionRange(
      v,
      Math.max(Number(v) || 0, this._selEnd),
      this._selDir,
    );
  }
  get selectionEnd() {
    return this._selEnd;
  }
  set selectionEnd(v) {
    this.setSelectionRange(this._selStart, v, this._selDir);
  }
  get selectionDirection() {
    return this._selDir;
  }
  set selectionDirection(v) {
    this.setSelectionRange(this._selStart, this._selEnd, v);
  }
  setSelectionRange(start, end, direction = "none") {
    setSelection(this, this.value.length, start, end, direction);
  }
  setRangeText(
    replacement,
    start = this._selStart,
    end = this._selEnd,
    mode = "preserve",
  ) {
    rangeText(this, str(replacement), start, end, mode);
  }
  select() {
    setSelection(this, this.value.length, 0, this.value.length, "none");
  }
  _disabledState() {
    return controlDisabled(this);
  }
  _willValidate() {
    return (
      !controlDisabled(this) &&
      this._getAttrRaw("readonly") === null &&
      !this.closest("datalist")
    );
  }
  _valueMissing() {
    return this._getAttrRaw("required") !== null && this.value === "";
  }
}
applyValidation(HTMLTextAreaElement);
for (const p of ["autocomplete", "name", "placeholder", "wrap", "dirName"]) {
  reflectString(HTMLTextAreaElement.prototype, p, p.toLowerCase());
}
for (const p of ["disabled", "required"])
  reflectBool(HTMLTextAreaElement.prototype, p);
reflectBool(HTMLTextAreaElement.prototype, "readOnly", "readonly");
reflectInt(HTMLTextAreaElement.prototype, "maxLength", "maxlength", -1, {
  min: 0,
});
reflectInt(HTMLTextAreaElement.prototype, "minLength", "minlength", -1, {
  min: 0,
});
reflectInt(HTMLTextAreaElement.prototype, "rows", "rows", 2, { min: 1 });
reflectInt(HTMLTextAreaElement.prototype, "cols", "cols", 20, { min: 1 });
tag(HTMLTextAreaElement);
HTML_CLASSES.set("textarea", HTMLTextAreaElement);

// --- Select / option -------------------------------------------------------------------

export class HTMLSelectElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._customValidity = "";
    this._validity = null;
    this._optionsCollection = null;
  }
  _optionList() {
    const out = [];
    for (let c = this._first; c; c = c._next) {
      if (isHTML(c, "option")) out.push(c);
      else if (isHTML(c, "optgroup")) {
        for (let o = c._first; o; o = o._next)
          if (isHTML(o, "option")) out.push(o);
      }
    }
    return out;
  }
  _displaySize() {
    const size = Number.parseInt(this._getAttrRaw("size") ?? "", 10);
    if (size > 0) return size;
    return this._getAttrRaw("multiple") === null ? 1 : 4;
  }
  /** The selectedness setting algorithm. */
  _reset() {
    if (this._getAttrRaw("multiple") !== null || this._displaySize() !== 1)
      return;
    const options = this._optionList();
    let selected = null;
    for (const o of options) {
      if (o._selected) {
        if (selected) selected._selected = false;
        selected = o;
      }
    }
    if (!selected) {
      for (const o of options) {
        if (!o._disabledState()) {
          o._selected = true;
          break;
        }
      }
    }
  }
  _childrenChanged() {
    this._reset();
  }
  _attrHook(name, ns) {
    if (ns === null && (name === "multiple" || name === "size")) this._reset();
  }
  _cloneState() {}
  get type() {
    return this._getAttrRaw("multiple") === null
      ? "select-one"
      : "select-multiple";
  }
  get options() {
    if (!this._optionsCollection) {
      this._optionsCollection = liveHTMLCollection(
        { version: () => this._doc._version, items: () => this._optionList() },
        HTMLOptionsCollection,
      );
      this._optionsCollection._select = this;
    }
    return this._optionsCollection;
  }
  get length() {
    return this._optionList().length;
  }
  set length(n) {
    this.options.length = n;
  }
  item(i) {
    return this._optionList()[i] ?? null;
  }
  namedItem(name) {
    return (
      this._optionList().find(
        (o) => o._id === name || o._getAttrRaw("name") === name,
      ) ?? null
    );
  }
  add(element, before = null) {
    let ref = null;
    if (typeof before === "number") ref = this._optionList()[before] ?? null;
    else if (before) ref = before;
    (ref ? ref._parent : this).insertBefore(element, ref);
  }
  remove(index) {
    if (arguments.length === 0) {
      super.remove();
      return;
    }
    this._optionList()[index]?.remove();
  }
  get selectedOptions() {
    return liveHTMLCollection({
      version: () => this._doc._version,
      items: () => this._optionList().filter((o) => o._selected),
    });
  }
  get selectedIndex() {
    return this._optionList().findIndex((o) => o._selected);
  }
  set selectedIndex(i) {
    const options = this._optionList();
    for (let k = 0; k < options.length; k++) {
      options[k]._selected = k === i;
      if (k === i) options[k]._dirty = true;
    }
    this._doc._version++;
  }
  get value() {
    return this._optionList().find((o) => o._selected)?.value ?? "";
  }
  set value(v) {
    const value = str(v);
    let found = false;
    for (const o of this._optionList()) {
      if (!found && o.value === value) {
        o._selected = true;
        o._dirty = true;
        found = true;
      } else {
        o._selected = false;
      }
    }
    this._doc._version++;
  }
  get form() {
    return formOwner(this);
  }
  get labels() {
    return labelsFor(this);
  }
  _disabledState() {
    return controlDisabled(this);
  }
  _willValidate() {
    return !controlDisabled(this) && !this.closest("datalist");
  }
  _valueMissing() {
    if (this._getAttrRaw("required") === null) return false;
    const options = this._optionList();
    const selected = options.filter((o) => o._selected);
    if (selected.length === 0) return true;
    // A placeholder label option (first, empty value, single select) doesn't count.
    if (this._getAttrRaw("multiple") === null && this._displaySize() === 1) {
      const first = options[0];
      if (
        first &&
        first._parent === this &&
        first.value === "" &&
        selected[0] === first
      )
        return true;
    }
    return false;
  }
  showPicker() {}
}
applyValidation(HTMLSelectElement);
reflectString(HTMLSelectElement.prototype, "name");
reflectString(HTMLSelectElement.prototype, "autocomplete");
for (const p of ["disabled", "multiple", "required"])
  reflectBool(HTMLSelectElement.prototype, p);
reflectInt(HTMLSelectElement.prototype, "size", "size", 0, {
  nonNegative: true,
});
tag(HTMLSelectElement);
HTML_CLASSES.set("select", HTMLSelectElement);

function owningSelect(option) {
  const p = option._parent;
  if (isHTML(p, "select")) return p;
  if (isHTML(p, "optgroup") && isHTML(p._parent, "select")) return p._parent;
  return null;
}

export class HTMLOptionElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._selected = false;
    this._dirty = false;
  }
  _attrHook(name, ns, _old, value) {
    if (ns !== null) return;
    if (name === "selected" && !this._dirty) {
      this._selected = value !== null;
      const select = owningSelect(this);
      if (select) {
        if (this._selected && select._getAttrRaw("multiple") === null) {
          for (const o of select._optionList())
            if (o !== this) o._selected = false;
        }
        select._reset();
      }
    } else if (name === "disabled") {
      owningSelect(this)?._reset();
    }
  }
  _cloneState(copy) {
    copy._selected = this._selected;
    copy._dirty = this._dirty;
  }
  get selected() {
    return this._selected;
  }
  set selected(v) {
    this._selected = !!v;
    this._dirty = true;
    const select = owningSelect(this);
    if (select) {
      if (this._selected && select._getAttrRaw("multiple") === null) {
        for (const o of select._optionList())
          if (o !== this) o._selected = false;
      }
      select._reset();
    }
    this._doc._version++;
  }
  get defaultSelected() {
    return this._getAttrRaw("selected") !== null;
  }
  set defaultSelected(v) {
    if (v) this._setAttrRaw("selected", "");
    else this._removeAttrRaw("selected");
  }
  get value() {
    return this._getAttrRaw("value") ?? this.text;
  }
  set value(v) {
    this._setAttrRaw("value", str(v));
  }
  get text() {
    let out = "";
    for (let n = this._first; n; n = nextInTree(n, this)) {
      if (n.nodeType === 3 || n.nodeType === 4) {
        let inScript = false;
        for (let p = n._parent; p && p !== this; p = p._parent) {
          if (
            p._localName === "script" &&
            (p._ns === HTML_NS || p._ns === "http://www.w3.org/2000/svg")
          )
            inScript = true;
        }
        if (!inScript) out += n._data;
      }
    }
    return out.replace(/[\t\n\f\r ]+/g, " ").trim();
  }
  set text(v) {
    setTextContent(this, v);
  }
  get label() {
    return this._getAttrRaw("label") ?? this.text;
  }
  set label(v) {
    this._setAttrRaw("label", str(v));
  }
  get index() {
    const select = owningSelect(this);
    return select ? select._optionList().indexOf(this) : 0;
  }
  get form() {
    const select = owningSelect(this);
    return select ? formOwner(select) : null;
  }
  _disabledState() {
    if (this._getAttrRaw("disabled") !== null) return true;
    const p = this._parent;
    return isHTML(p, "optgroup") && p._getAttrRaw("disabled") !== null;
  }
}
reflectBool(HTMLOptionElement.prototype, "disabled");
tag(HTMLOptionElement);
HTML_CLASSES.set("option", HTMLOptionElement);

export class HTMLOptGroupElement extends HTMLElement {
  _childrenChanged() {
    if (isHTML(this._parent, "select")) this._parent._reset();
  }
  _disabledState() {
    return this._getAttrRaw("disabled") !== null;
  }
}
reflectBool(HTMLOptGroupElement.prototype, "disabled");
reflectString(HTMLOptGroupElement.prototype, "label");
tag(HTMLOptGroupElement);
HTML_CLASSES.set("optgroup", HTMLOptGroupElement);

export class HTMLDataListElement extends HTMLElement {
  get options() {
    return liveHTMLCollection({
      version: () => this._doc._version,
      items: () => {
        const out = [];
        for (let n = this._first; n; n = nextInTree(n, this))
          if (isHTML(n, "option")) out.push(n);
        return out;
      },
    });
  }
}
tag(HTMLDataListElement);
HTML_CLASSES.set("datalist", HTMLDataListElement);

// --- Button ------------------------------------------------------------------------------

export class HTMLButtonElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._customValidity = "";
    this._validity = null;
  }
  get form() {
    return formOwner(this);
  }
  get labels() {
    return labelsFor(this);
  }
  _disabledState() {
    return controlDisabled(this);
  }
  _willValidate() {
    return (
      this.type === "submit" &&
      !controlDisabled(this) &&
      !this.closest("datalist")
    );
  }
}
applyValidation(HTMLButtonElement);
reflectEnum(
  HTMLButtonElement.prototype,
  "type",
  "type",
  ["submit", "reset", "button"],
  "submit",
);
reflectString(HTMLButtonElement.prototype, "name");
reflectString(HTMLButtonElement.prototype, "value");
reflectString(HTMLButtonElement.prototype, "formTarget", "formtarget");
reflectString(HTMLButtonElement.prototype, "formEnctype", "formenctype");
reflectString(HTMLButtonElement.prototype, "formMethod", "formmethod");
reflectURL(HTMLButtonElement.prototype, "formAction", "formaction");
reflectBool(HTMLButtonElement.prototype, "disabled");
reflectBool(HTMLButtonElement.prototype, "formNoValidate", "formnovalidate");
tag(HTMLButtonElement);
HTML_CLASSES.set("button", HTMLButtonElement);

// --- Form ---------------------------------------------------------------------------------

function listedElementsOf(form) {
  const root = rootOf(form);
  const out = [];
  for (let n = root._first ?? root; n; n = nextInTree(n, root)) {
    if (
      n.nodeType !== ELEMENT_NODE ||
      n._ns !== HTML_NS ||
      !LISTED.has(n._localName)
    )
      continue;
    if (n._localName === "input" && n._type === "image") continue;
    if (formOwner(n) === form) out.push(n);
  }
  return out;
}

export class HTMLFormElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._elements = null;
    this._submitting = false;
  }
  get elements() {
    return (this._elements ??= liveHTMLCollection(
      {
        version: () => this._doc._version,
        items: () => listedElementsOf(this),
      },
      HTMLFormControlsCollection,
      true,
    ));
  }
  get length() {
    return listedElementsOf(this).length;
  }
  submit() {}
  requestSubmit(submitter = null) {
    if (submitter !== null) {
      const ok =
        (isHTML(submitter, "button") && submitter.type === "submit") ||
        (isHTML(submitter, "input") &&
          (submitter._type === "submit" || submitter._type === "image"));
      if (!ok)
        throw new TypeError("The specified element is not a submit button.");
      if (formOwner(submitter) !== this) {
        throw domException(
          "The specified element is not owned by this form element.",
          "NotFoundError",
        );
      }
    }
    submitForm(this, submitter);
  }
  reset() {
    if (!fire(this, "reset", { bubbles: true, cancelable: true })) return;
    for (const el of listedElementsOf(this)) resetControl(el);
  }
  checkValidity() {
    return validateForm(this, false);
  }
  reportValidity() {
    return validateForm(this, false);
  }
  _hasInvalid() {
    return listedElementsOf(this).some(
      (el) => el._willValidate?.() && !el.validity.valid,
    );
  }
  get relList() {
    return (this._relList ??= new DOMTokenList(INTERNAL, this, "rel"));
  }
}
for (const p of ["name", "target", "autocomplete", "rel"])
  reflectString(HTMLFormElement.prototype, p);
reflectString(HTMLFormElement.prototype, "acceptCharset", "accept-charset");
reflectEnum(
  HTMLFormElement.prototype,
  "method",
  "method",
  ["get", "post", "dialog"],
  "get",
);
reflectEnum(
  HTMLFormElement.prototype,
  "enctype",
  "enctype",
  ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"],
  "application/x-www-form-urlencoded",
);
reflectBool(HTMLFormElement.prototype, "noValidate", "novalidate");
Object.defineProperty(HTMLFormElement.prototype, "action", {
  get() {
    const v = this._getAttrRaw("action");
    if (!v) return this._doc.URL;
    try {
      return new URL(v, this._doc.baseURI).href;
    } catch {
      return v;
    }
  },
  set(v) {
    this._setAttrRaw("action", str(v));
  },
  configurable: true,
});
tag(HTMLFormElement);
HTML_CLASSES.set("form", HTMLFormElement);

function validateForm(form) {
  let valid = true;
  for (const el of listedElementsOf(form)) {
    if (el._willValidate?.() && !el.validity.valid) {
      valid = false;
      fire(el, "invalid", { cancelable: true });
    }
  }
  return valid;
}

function submitForm(form, submitter) {
  if (!form.isConnected || form._submitting) return;
  const noValidate =
    form._getAttrRaw("novalidate") !== null ||
    submitter?._getAttrRaw("formnovalidate") != null;
  if (!noValidate && !validateForm(form)) return;
  form._submitting = true;
  try {
    fire(
      form,
      "submit",
      { bubbles: true, cancelable: true, submitter },
      SubmitEvent,
    );
  } finally {
    form._submitting = false;
  }
  // Navigation isn't implemented.
}

function resetControl(el) {
  switch (el._localName) {
    case "input":
      el._dirtyValue = false;
      el._dirtyChecked = false;
      el._value = el._sanitize(el._getAttrRaw("value") ?? "");
      el._checked = el._getAttrRaw("checked") !== null;
      if (el._checked && el._type === "radio") el._uncheckGroup();
      el._files = null;
      el._filesList = null;
      break;
    case "textarea":
      el._dirtyValue = false;
      el._raw = descendantText(el);
      break;
    case "select":
      for (const o of el._optionList()) {
        o._selected = o._getAttrRaw("selected") !== null;
        o._dirty = false;
      }
      el._reset();
      break;
    case "output":
      el._value = null;
      break;
  }
  el._doc._version++;
}

// --- Fieldset, legend, label, output, progress, meter -------------------------------------

export class HTMLFieldSetElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._customValidity = "";
    this._validity = null;
  }
  get type() {
    return "fieldset";
  }
  get form() {
    return formOwner(this);
  }
  get elements() {
    return liveHTMLCollection(
      {
        version: () => this._doc._version,
        items: () => {
          const out = [];
          for (let n = this._first; n; n = nextInTree(n, this)) {
            if (
              n.nodeType === ELEMENT_NODE &&
              n._ns === HTML_NS &&
              LISTED.has(n._localName)
            )
              out.push(n);
          }
          return out;
        },
      },
      HTMLFormControlsCollection,
      true,
    );
  }
  _disabledState() {
    return controlDisabled(this);
  }
  _willValidate() {
    return false;
  }
}
applyValidation(HTMLFieldSetElement);
reflectBool(HTMLFieldSetElement.prototype, "disabled");
reflectString(HTMLFieldSetElement.prototype, "name");
tag(HTMLFieldSetElement);
HTML_CLASSES.set("fieldset", HTMLFieldSetElement);

export class HTMLLegendElement extends HTMLElement {
  get form() {
    return isHTML(this._parent, "fieldset") ? formOwner(this._parent) : null;
  }
}
reflectString(HTMLLegendElement.prototype, "align");
tag(HTMLLegendElement);
HTML_CLASSES.set("legend", HTMLLegendElement);

export class HTMLLabelElement extends HTMLElement {
  get control() {
    const forId = this._getAttrRaw("for");
    if (forId !== null) {
      const root = rootOf(this);
      for (let n = root._first ?? root; n; n = nextInTree(n, root)) {
        if (n.nodeType === ELEMENT_NODE && n._id === forId)
          return isLabelable(n) ? n : null;
      }
      return null;
    }
    for (let n = this._first; n; n = nextInTree(n, this)) {
      if (n.nodeType === ELEMENT_NODE && isLabelable(n)) return n;
    }
    return null;
  }
  get form() {
    const c = this.control;
    return c ? formOwner(c) : null;
  }
}
reflectString(HTMLLabelElement.prototype, "htmlFor", "for");
tag(HTMLLabelElement);
HTML_CLASSES.set("label", HTMLLabelElement);

export class HTMLOutputElement extends HTMLElement {
  constructor(token, doc, ns, prefix, localName) {
    super(token, doc, ns, prefix, localName);
    this._value = null;
    this._customValidity = "";
    this._validity = null;
  }
  get type() {
    return "output";
  }
  get value() {
    return this.textContent;
  }
  set value(v) {
    this._value ??= this.textContent;
    this.textContent = v;
  }
  get defaultValue() {
    return this._value ?? this.textContent;
  }
  set defaultValue(v) {
    if (this._value === null) this.textContent = v;
    else this._value = str(v);
  }
  get form() {
    return formOwner(this);
  }
  get labels() {
    return labelsFor(this);
  }
  get htmlFor() {
    return (this._htmlFor ??= new DOMTokenList(INTERNAL, this, "for"));
  }
  _willValidate() {
    return false;
  }
}
applyValidation(HTMLOutputElement);
reflectString(HTMLOutputElement.prototype, "name");
tag(HTMLOutputElement);
HTML_CLASSES.set("output", HTMLOutputElement);

function reflectFloat(proto, prop, def, positive = false) {
  Object.defineProperty(proto, prop, {
    get() {
      const n = parseFloatStrict(this._getAttrRaw(prop) ?? "");
      if (n === null || (positive && n <= 0)) return def;
      return n;
    },
    set(v) {
      this._setAttrRaw(prop, String(Number(v)));
    },
    configurable: true,
  });
}

export class HTMLProgressElement extends HTMLElement {
  get value() {
    const n = parseFloatStrict(this._getAttrRaw("value") ?? "");
    if (n === null || n < 0) return 0;
    return Math.min(n, this.max);
  }
  set value(v) {
    this._setAttrRaw("value", String(Number(v)));
  }
  get position() {
    return this._getAttrRaw("value") === null ? -1 : this.value / this.max;
  }
  get labels() {
    return labelsFor(this);
  }
}
reflectFloat(HTMLProgressElement.prototype, "max", 1, true);
tag(HTMLProgressElement);
HTML_CLASSES.set("progress", HTMLProgressElement);

export class HTMLMeterElement extends HTMLElement {
  get labels() {
    return labelsFor(this);
  }
}
for (const [p, d] of [
  ["value", 0],
  ["min", 0],
  ["max", 1],
  ["low", 0],
  ["high", 1],
  ["optimum", 0.5],
]) {
  reflectFloat(HTMLMeterElement.prototype, p, d);
}
tag(HTMLMeterElement);
HTML_CLASSES.set("meter", HTMLMeterElement);

// --- Activation behavior ---------------------------------------------------------------------

function fireInputAndChange(el) {
  fire(el, "input", { bubbles: true, composed: true }, Event);
  fire(el, "change", { bubbles: true }, Event);
}

function hasActivation(el) {
  if (el.nodeType !== ELEMENT_NODE || el._ns !== HTML_NS) return false;
  switch (el._localName) {
    case "input":
    case "button":
    case "label":
      return true;
    case "a":
    case "area":
      return el._getAttrRaw("href") !== null;
    case "summary":
      return (
        isHTML(el._parent, "details") &&
        el._parent.querySelector(":scope > summary") === el
      );
  }
  return false;
}

const INTERACTIVE = new Set([
  "a",
  "button",
  "details",
  "embed",
  "iframe",
  "input",
  "label",
  "select",
  "textarea",
]);

function activationFor(path, event) {
  let target = null;
  if (hasActivation(path[0])) target = path[0];
  else if (event._bubbles) target = path.find((n) => hasActivation(n)) ?? null;
  if (!target) return null;
  const el = target;
  switch (el._localName) {
    case "input": {
      if (el._disabledState()) return null;
      if (el._type === "checkbox") {
        const old = el._checked;
        const oldIndeterminate = el._indeterminate;
        return {
          pre() {
            el._dirtyChecked = true;
            el._setChecked(!old);
            el._indeterminate = false;
          },
          cancel() {
            el._setChecked(old);
            el._indeterminate = oldIndeterminate;
          },
          run() {
            if (el.isConnected) fireInputAndChange(el);
          },
        };
      }
      if (el._type === "radio") {
        const old = el._checked;
        let previous = null;
        return {
          pre() {
            previous = el._radioGroup().find((r) => r._checked) ?? null;
            el._dirtyChecked = true;
            el._setChecked(true);
          },
          cancel() {
            if (previous?._radioGroup().includes(el))
              previous._setChecked(true);
            else el._setChecked(old);
          },
          run() {
            if (!old && el.isConnected) fireInputAndChange(el);
          },
        };
      }
      if (el._type === "submit" || el._type === "image") {
        return {
          run() {
            const form = formOwner(el);
            if (form) submitForm(form, el);
          },
        };
      }
      if (el._type === "reset") {
        return {
          run() {
            formOwner(el)?.reset();
          },
        };
      }
      return null;
    }
    case "button": {
      if (el._disabledState()) return null;
      const type = el.type;
      return {
        run() {
          const form = formOwner(el);
          if (!form) return;
          if (type === "submit") submitForm(form, el);
          else if (type === "reset") form.reset();
        },
      };
    }
    case "label": {
      return {
        run() {
          const control = el.control;
          if (!control || control._disabledState?.() === true) return;
          const t = path[0];
          if (t === control || control.contains(t)) return;
          for (const n of path) {
            if (n === el) break;
            if (
              n.nodeType === ELEMENT_NODE &&
              n._ns === HTML_NS &&
              INTERACTIVE.has(n._localName)
            )
              return;
          }
          const forwarded = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            view: el._doc._defaultView,
            detail: 1,
            clientX: event._clientX,
            clientY: event._clientY,
            ctrlKey: event._ctrlKey,
            shiftKey: event._shiftKey,
            altKey: event._altKey,
            metaKey: event._metaKey,
          });
          forwarded._trusted = true;
          dispatch(control, forwarded);
        },
      };
    }
    case "summary":
      return {
        run() {
          const details = el._parent;
          if (details._getAttrRaw("open") === null)
            details._setAttrRaw("open", "");
          else details._removeAttrRaw("open");
        },
      };
    case "a":
    case "area":
      return {
        run() {
          const href = el._getAttrRaw("href") ?? "";
          if (href.startsWith("#")) el._doc._defaultView?._navigateHash?.(href);
        },
      };
  }
  return null;
}
hooks.activation = activationFor;

// --- FormData -----------------------------------------------------------------------------------

function constructEntryList(form, submitter) {
  const entries = [];
  for (const el of listedElementsOf(form)) {
    const name = el._localName;
    if (name === "fieldset" || name === "output" || name === "object") continue;
    if (el._disabledState?.() === true || el.closest("datalist")) continue;
    if (
      (name === "button" ||
        (name === "input" &&
          (el._type === "submit" ||
            el._type === "image" ||
            el._type === "reset" ||
            el._type === "button"))) &&
      el !== submitter
    )
      continue;
    if (
      name === "input" &&
      (el._type === "checkbox" || el._type === "radio") &&
      !el._checked
    )
      continue;
    const fieldName = el._getAttrRaw("name");
    if (!fieldName) continue;
    if (name === "select") {
      for (const o of el._optionList()) {
        if (o._selected && !o._disabledState())
          entries.push([fieldName, o.value]);
      }
    } else if (name === "input" && el._type === "file") {
      const files = el.files;
      if (!files || files.length === 0)
        entries.push([
          fieldName,
          new File([], "", { type: "application/octet-stream" }),
        ]);
      else for (const f of files) entries.push([fieldName, f]);
    } else if (name === "textarea") {
      entries.push([fieldName, el.value.replace(/\r?\n|\r/g, "\r\n")]);
    } else {
      entries.push([fieldName, el.value]);
    }
  }
  return entries;
}

function toEntryValue(value, filename) {
  if (value instanceof Blob) {
    if (!(value instanceof File) || filename !== undefined) {
      return new File(
        [value],
        filename ?? (value instanceof File ? value.name : "blob"),
        { type: value.type },
      );
    }
    return value;
  }
  return str(value);
}

export class FormData {
  constructor(form, submitter = null) {
    this._entries = [];
    if (form !== undefined && form !== null) {
      if (!isHTML(form, "form"))
        throw new TypeError(
          "Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.",
        );
      this._entries = constructEntryList(form, submitter).map(([n, v]) => [
        n,
        v,
      ]);
    }
  }
  append(name, value, filename) {
    this._entries.push([str(name), toEntryValue(value, filename)]);
  }
  delete(name) {
    const n = str(name);
    this._entries = this._entries.filter(([k]) => k !== n);
  }
  get(name) {
    const n = str(name);
    return this._entries.find(([k]) => k === n)?.[1] ?? null;
  }
  getAll(name) {
    const n = str(name);
    return this._entries.filter(([k]) => k === n).map(([, v]) => v);
  }
  has(name) {
    const n = str(name);
    return this._entries.some(([k]) => k === n);
  }
  set(name, value, filename) {
    const n = str(name);
    const v = toEntryValue(value, filename);
    const i = this._entries.findIndex(([k]) => k === n);
    if (i === -1) {
      this._entries.push([n, v]);
      return;
    }
    this._entries[i] = [n, v];
    this._entries = this._entries.filter(([k], j) => k !== n || j === i);
  }
  forEach(callback, thisArg) {
    for (const [k, v] of this._entries.slice())
      callback.call(thisArg, v, k, this);
  }
  *entries() {
    for (const [k, v] of this._entries) yield [k, v];
  }
  *keys() {
    for (const [k] of this._entries) yield k;
  }
  *values() {
    for (const [, v] of this._entries) yield v;
  }
  [Symbol.iterator]() {
    return this.entries();
  }
}
tag(FormData);

export { HTMLCollection, InputEvent, isFocusable };
