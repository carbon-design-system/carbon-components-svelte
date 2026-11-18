// Shared constants and helpers. Everything in `src/` is bundled into one
// script and evaluated inside the test's global context, so the classes it
// defines use that context's own intrinsics (Array, Object, Error, ...).

export const HTML_NS = "http://www.w3.org/1999/xhtml";
export const SVG_NS = "http://www.w3.org/2000/svg";
export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
export const XLINK_NS = "http://www.w3.org/1999/xlink";
export const XML_NS = "http://www.w3.org/XML/1998/namespace";
export const XMLNS_NS = "http://www.w3.org/2000/xmlns/";

export const ELEMENT_NODE = 1;
export const ATTRIBUTE_NODE = 2;
export const TEXT_NODE = 3;
export const CDATA_SECTION_NODE = 4;
export const PROCESSING_INSTRUCTION_NODE = 7;
export const COMMENT_NODE = 8;
export const DOCUMENT_NODE = 9;
export const DOCUMENT_TYPE_NODE = 10;
export const DOCUMENT_FRAGMENT_NODE = 11;

/** Passed to interface constructors that scripts may not call directly. */
export const INTERNAL = Symbol("dom-env internal");

export function illegalConstructor() {
  throw new TypeError("Illegal constructor");
}

export function domException(message, name) {
  return new DOMException(message, name);
}

/** Defines constants on both a constructor and its prototype. */
export function defineConstants(ctor, constants) {
  for (const key of Object.keys(constants)) {
    const desc = { value: constants[key], enumerable: true };
    Object.defineProperty(ctor, key, desc);
    Object.defineProperty(ctor.prototype, key, desc);
  }
}

/** Copies accessors and methods from `source` classes' prototypes. */
export function mixin(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source.prototype)) {
      if (key === "constructor") continue;
      Object.defineProperty(
        target.prototype,
        key,
        Object.getOwnPropertyDescriptor(source.prototype, key),
      );
    }
  }
}

/** Sets `Symbol.toStringTag` so `Object.prototype.toString` reads like a browser. */
export function tag(ctor, name = ctor.name) {
  Object.defineProperty(ctor.prototype, Symbol.toStringTag, {
    value: name,
    configurable: true,
  });
}

const ASCII_UPPER = /[A-Z]/;
export function asciiLowercase(s) {
  return ASCII_UPPER.test(s) ? s.toLowerCase() : s;
}

const ASCII_WS = /[\t\n\f\r ]+/;
export function splitTokens(s) {
  const out = [];
  for (const t of s.split(ASCII_WS)) if (t) out.push(t);
  return out;
}

export function isAsciiWhitespace(c) {
  return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
}

/** WebIDL `DOMString` conversion. */
export function str(v) {
  return typeof v === "string" ? v : String(v);
}

/** WebIDL `[LegacyNullToEmptyString] DOMString`. */
export function strOrEmpty(v) {
  return v === null ? "" : str(v);
}
