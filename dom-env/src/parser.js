// HTML fragment/document parsing and serialization.
//
// The tree builder is a simplified version of the HTML spec's: a stack of
// open elements with implied end tags for the common cases (p, li, dt/dd,
// option, table rows/cells, headings), foreign content (SVG/MathML) with
// the spec's case-fixing tables, raw text and RCDATA elements, and
// <template> contents. It skips table foster parenting and the adoption
// agency algorithm, which well-formed component markup never needs.

import { decodeEntities } from "./entities.js";
import { appendRaw, Comment, DocumentType, Text } from "./node.js";
import {
  HTML_NS,
  INTERNAL,
  MATHML_NS,
  SVG_NS,
  XLINK_NS,
  XML_NS,
  XMLNS_NS,
} from "./shared.js";

export const VOID = new Set([
  "area",
  "base",
  "basefont",
  "bgsound",
  "br",
  "col",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const RAW_TEXT = new Set([
  "script",
  "style",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "noscript",
]);
const RCDATA = new Set(["textarea", "title"]);

const CLOSES_P = new Set(
  "address article aside blockquote center details dialog dir div dl fieldset figcaption figure footer header hgroup main menu nav ol p search section summary ul h1 h2 h3 h4 h5 h6 pre listing form table hr xmp plaintext".split(
    " ",
  ),
);
const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

// Start tags in foreign content that break back out to HTML.
const BREAKOUT = new Set(
  "b big blockquote body br center code dd div dl dt em embed h1 h2 h3 h4 h5 h6 head hr i img li listing menu meta nobr ol p pre ruby s small span strong strike sub sup table tt u ul var".split(
    " ",
  ),
);

const SVG_TAGS = {};
for (const name of "altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath".split(
  " ",
)) {
  SVG_TAGS[name.toLowerCase()] = name;
}

const SVG_ATTRS = {};
for (const name of "attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits diffuseConstant edgeMode filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan".split(
  " ",
)) {
  SVG_ATTRS[name.toLowerCase()] = name;
}

const FOREIGN_ATTRS = {
  "xlink:actuate": [XLINK_NS, "xlink", "actuate"],
  "xlink:arcrole": [XLINK_NS, "xlink", "arcrole"],
  "xlink:href": [XLINK_NS, "xlink", "href"],
  "xlink:role": [XLINK_NS, "xlink", "role"],
  "xlink:show": [XLINK_NS, "xlink", "show"],
  "xlink:title": [XLINK_NS, "xlink", "title"],
  "xlink:type": [XLINK_NS, "xlink", "type"],
  "xml:lang": [XML_NS, "xml", "lang"],
  "xml:space": [XML_NS, "xml", "space"],
  xmlns: [XMLNS_NS, null, "xmlns"],
  "xmlns:xlink": [XMLNS_NS, "xmlns", "xlink"],
};

function isHtmlIntegrationPoint(el) {
  if (el._ns === SVG_NS) {
    const n = el._localName;
    return n === "foreignObject" || n === "desc" || n === "title";
  }
  if (el._ns === MATHML_NS && el._localName === "annotation-xml") {
    const enc = el.getAttribute("encoding")?.toLowerCase();
    return enc === "text/html" || enc === "application/xhtml+xml";
  }
  return false;
}

function isMathTextIntegrationPoint(el) {
  return (
    el._ns === MATHML_NS &&
    ["mi", "mo", "mn", "ms", "mtext"].includes(el._localName)
  );
}

// --- Tokenizer ------------------------------------------------------------------

const TAG_NAME_END = /[\t\n\f\r />]/;
const ATTR_RE =
  /[\t\n\f\r /]*([^\t\n\f\r />][^\t\n\f\r /=>]*)(?:[\t\n\f\r ]*=[\t\n\f\r ]*(?:"([^"]*)"?|'([^']*)'?|([^\t\n\f\r >]*)))?/y;

class Builder {
  constructor(doc, root, contextNs) {
    this.doc = doc;
    this.root = root;
    this.stack = [root];
    this.contextNs = contextNs;
    this.pendingText = "";
    this.skipNewline = false;
  }

  get current() {
    return this.stack[this.stack.length - 1];
  }

  /** Parent that new nodes go into (template contents for <template>). */
  get insertionParent() {
    const cur = this.current;
    return cur._content ?? cur;
  }

  currentNs() {
    const cur = this.current;
    if (cur === this.root) return this.contextNs;
    return cur._ns;
  }

  inForeign() {
    const cur = this.current;
    if (cur === this.root)
      return this.contextNs !== HTML_NS && this.contextNs !== null;
    if (cur._ns === HTML_NS) return false;
    return !isHtmlIntegrationPoint(cur) && !isMathTextIntegrationPoint(cur);
  }

  flushText() {
    if (this.pendingText === "") return;
    const text = this.pendingText;
    this.pendingText = "";
    const parent = this.insertionParent;
    const last = parent._last;
    if (last && last.nodeType === 3) {
      last._data += text;
      parent._childrenChanged();
    } else {
      appendRaw(parent, new Text(INTERNAL, this.doc, text));
    }
  }

  text(s) {
    if (this.skipNewline) {
      this.skipNewline = false;
      if (s[0] === "\n") s = s.slice(1);
    }
    this.pendingText += s;
  }

  insert(node) {
    this.flushText();
    appendRaw(this.insertionParent, node);
  }

  createElement(ns, name, attrs) {
    let localName = name;
    if (ns === SVG_NS) localName = SVG_TAGS[name] ?? name;
    const el = this.doc._createElementNS(ns, localName, null);
    for (const [rawName, value] of attrs) {
      if (ns === SVG_NS || ns === MATHML_NS) {
        const foreign = FOREIGN_ATTRS[rawName];
        if (foreign) {
          el._appendAttrRaw(foreign[0], foreign[1], foreign[2], value);
          continue;
        }
        let local = rawName;
        if (ns === SVG_NS) local = SVG_ATTRS[rawName] ?? rawName;
        else if (rawName === "definitionurl") local = "definitionURL";
        el._appendAttrRaw(null, null, local, value);
      } else {
        el._appendAttrRaw(null, null, rawName, value);
      }
    }
    return el;
  }

  popUntil(pred) {
    for (let i = this.stack.length - 1; i > 0; i--) {
      if (pred(this.stack[i])) {
        this.flushText();
        this.stack.length = i;
        return true;
      }
    }
    return false;
  }

  /** Index of the nearest open HTML element named `name`, stopping at `stop` names. */
  findOpen(name, stop) {
    for (let i = this.stack.length - 1; i > 0; i--) {
      const el = this.stack[i];
      if (el._ns === HTML_NS && el._localName === name) return i;
      if (stop?.has(el._localName) || el._ns !== HTML_NS) return -1;
    }
    return -1;
  }

  closeTo(index) {
    this.flushText();
    this.stack.length = index;
  }

  startTag(name, attrs, selfClosing) {
    // Foreign content.
    if (this.inForeign()) {
      const breakout =
        BREAKOUT.has(name) ||
        (name === "font" &&
          attrs.some(([n]) => n === "color" || n === "face" || n === "size"));
      if (!breakout) {
        const ns = this.currentNs();
        const el = this.createElement(ns, name, attrs);
        this.insert(el);
        if (!selfClosing) this.stack.push(el);
        return null;
      }
      while (this.stack.length > 1 && this.inForeign()) this.stack.pop();
    }

    if (name === "svg" || name === "math") {
      const el = this.createElement(
        name === "svg" ? SVG_NS : MATHML_NS,
        name,
        attrs,
      );
      this.insert(el);
      if (!selfClosing) this.stack.push(el);
      return null;
    }

    // Implied end tags.
    const cur = this.current;
    if (CLOSES_P.has(name)) {
      const i = this.findOpen("p", BUTTON_SCOPE);
      if (i !== -1) this.closeTo(i);
      if (
        HEADINGS.has(name) &&
        HEADINGS.has(this.current._localName) &&
        this.current !== this.root
      ) {
        this.closeTo(this.stack.length - 1);
      }
    } else if (name === "li") {
      const i = this.findOpen("li", LIST_SCOPE);
      if (i !== -1) this.closeTo(i);
    } else if (name === "dt" || name === "dd") {
      const i = Math.max(
        this.findOpen("dt", DL_SCOPE),
        this.findOpen("dd", DL_SCOPE),
      );
      if (i !== -1) this.closeTo(i);
    } else if (name === "option") {
      if (cur._localName === "option" && cur !== this.root)
        this.closeTo(this.stack.length - 1);
    } else if (name === "optgroup") {
      if (this.current._localName === "option" && this.current !== this.root)
        this.closeTo(this.stack.length - 1);
      if (
        this.current._localName === "optgroup" &&
        this.current !== this.root
      ) {
        this.closeTo(this.stack.length - 1);
      }
    } else if (name === "tr") {
      const i = this.findOpen("tr", TABLE_SCOPE);
      if (i !== -1) this.closeTo(i);
      if (this.current._localName === "table" && this.current !== this.root) {
        this.openImplied("tbody");
      }
    } else if (name === "td" || name === "th") {
      const i = Math.max(
        this.findOpen("td", TABLE_SCOPE),
        this.findOpen("th", TABLE_SCOPE),
      );
      if (i !== -1) this.closeTo(i);
      const c = this.current._localName;
      if (
        this.current !== this.root &&
        (c === "table" || c === "tbody" || c === "thead" || c === "tfoot")
      ) {
        if (c === "table") this.openImplied("tbody");
        this.openImplied("tr");
      }
    } else if (name === "thead" || name === "tbody" || name === "tfoot") {
      for (const n of ["tbody", "thead", "tfoot"]) {
        const i = this.findOpen(n, TABLE_SCOPE);
        if (i !== -1) this.closeTo(i);
      }
    } else if (name === "a") {
      const i = this.findOpen("a", null);
      if (i !== -1) this.closeTo(i);
    } else if (name === "button") {
      const i = this.findOpen("button", null);
      if (i !== -1) this.closeTo(i);
    } else if (name === "select") {
      const i = this.findOpen("select", null);
      if (i !== -1) this.closeTo(i);
    } else if (name === "form" && this.findOpen("form", null) !== -1) {
      // Nested forms are dropped.
      return null;
    }

    const el = this.createElement(HTML_NS, name, attrs);
    this.insert(el);
    if (VOID.has(name)) return null;
    this.stack.push(el);
    if (name === "pre" || name === "listing" || name === "textarea")
      this.skipNewline = true;
    if (RAW_TEXT.has(name)) return "raw";
    if (RCDATA.has(name)) return "rcdata";
    if (name === "plaintext") return "plaintext";
    return null;
  }

  openImplied(name) {
    const el = this.doc._createElementNS(HTML_NS, name, null);
    this.insert(el);
    this.stack.push(el);
  }

  endTag(name) {
    // Spec: when the current node is foreign (even an integration point like
    // svg <title>), match end tags case-insensitively up the foreign stack.
    const cur = this.current;
    if (cur !== this.root && cur._ns !== HTML_NS) {
      for (let i = this.stack.length - 1; i > 0; i--) {
        const el = this.stack[i];
        if (el._ns === HTML_NS) break;
        if (el._localName.toLowerCase() === name) {
          this.closeTo(i);
          return;
        }
      }
    }
    if (name === "br") {
      this.startTag("br", [], false);
      return;
    }
    for (let i = this.stack.length - 1; i > 0; i--) {
      const el = this.stack[i];
      if (
        el._localName === name &&
        (el._ns === HTML_NS ||
          el._localName === "svg" ||
          el._localName === "math")
      ) {
        this.closeTo(i);
        return;
      }
    }
    if (name === "p") {
      // `</p>` with no open p creates an empty one.
      const el = this.doc._createElementNS(HTML_NS, "p", null);
      this.insert(el);
    }
  }

  comment(data) {
    this.insert(new Comment(INTERNAL, this.doc, data));
  }

  finish() {
    this.flushText();
  }
}

const BUTTON_SCOPE = new Set([
  "button",
  "table",
  "template",
  "html",
  "td",
  "th",
  "caption",
  "marquee",
  "object",
  "applet",
]);
const LIST_SCOPE = new Set([
  "ol",
  "ul",
  "table",
  "template",
  "html",
  "td",
  "th",
  "caption",
]);
const DL_SCOPE = new Set([
  "dl",
  "table",
  "template",
  "html",
  "td",
  "th",
  "caption",
]);
const TABLE_SCOPE = new Set(["table", "template", "html"]);

function tokenize(html, b, initialMode) {
  const len = html.length;
  let i = 0;
  let mode = initialMode;
  let rawTag = "";

  while (i < len) {
    if (mode === "plaintext") {
      b.text(html.slice(i));
      break;
    }
    if (mode === "raw" || mode === "rcdata") {
      const lower = html.toLowerCase();
      let end = i;
      while (true) {
        end = lower.indexOf("</" + rawTag, end);
        if (end === -1) {
          end = len;
          break;
        }
        const after = lower[end + 2 + rawTag.length];
        if (after === undefined || TAG_NAME_END.test(after)) break;
        end += 2;
      }
      const content = html.slice(i, end);
      if (content)
        b.text(mode === "rcdata" ? decodeEntities(content, false) : content);
      i = end;
      mode = null;
      if (i < len) {
        const close = html.indexOf(">", i);
        i = close === -1 ? len : close + 1;
        b.endTag(rawTag);
      }
      continue;
    }

    const lt = html.indexOf("<", i);
    if (lt === -1) {
      b.text(decodeEntities(html.slice(i), false));
      break;
    }
    if (lt > i) b.text(decodeEntities(html.slice(i, lt), false));
    i = lt;
    const next = html[i + 1];

    if (next === "!") {
      if (html.startsWith("<!--", i)) {
        let end;
        if (html.startsWith("<!-->", i)) {
          b.comment("");
          i += 5;
          continue;
        }
        if (html.startsWith("<!--->", i)) {
          b.comment("");
          i += 6;
          continue;
        }
        end = html.indexOf("-->", i + 4);
        if (end === -1) {
          b.comment(html.slice(i + 4));
          i = len;
        } else {
          b.comment(html.slice(i + 4, end));
          i = end + 3;
        }
        continue;
      }
      if (html.slice(i + 2, i + 9).toUpperCase() === "DOCTYPE") {
        const end = html.indexOf(">", i);
        const body = html.slice(i + 9, end === -1 ? len : end).trim();
        b.doctype?.(body.split(/\s+/)[0]?.toLowerCase() ?? "");
        i = end === -1 ? len : end + 1;
        continue;
      }
      if (html.startsWith("<![CDATA[", i) && b.inForeign()) {
        const end = html.indexOf("]]>", i);
        b.text(html.slice(i + 9, end === -1 ? len : end));
        i = end === -1 ? len : end + 3;
        continue;
      }
      const end = html.indexOf(">", i);
      b.comment(html.slice(i + 2, end === -1 ? len : end));
      i = end === -1 ? len : end + 1;
      continue;
    }
    if (next === "?") {
      const end = html.indexOf(">", i);
      b.comment(html.slice(i + 1, end === -1 ? len : end));
      i = end === -1 ? len : end + 1;
      continue;
    }
    if (next === "/") {
      const c = html.charCodeAt(i + 2);
      if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
        let j = i + 2;
        while (j < len && !TAG_NAME_END.test(html[j])) j++;
        const name = html.slice(i + 2, j).toLowerCase();
        const end = html.indexOf(">", j);
        i = end === -1 ? len : end + 1;
        b.endTag(name);
        continue;
      }
      if (html[i + 2] === ">") {
        i += 3;
        continue;
      }
      const end = html.indexOf(">", i);
      b.comment(html.slice(i + 2, end === -1 ? len : end));
      i = end === -1 ? len : end + 1;
      continue;
    }
    const c = html.charCodeAt(i + 1);
    if (!((c >= 65 && c <= 90) || (c >= 97 && c <= 122))) {
      b.text("<");
      i++;
      continue;
    }

    // Start tag.
    let j = i + 1;
    while (j < len && !TAG_NAME_END.test(html[j])) j++;
    const name = html.slice(i + 1, j).toLowerCase();
    const attrs = [];
    const seen = new Set();
    let selfClosing = false;
    while (j < len) {
      const ch = html[j];
      if (ch === ">") {
        j++;
        break;
      }
      if (ch === "/" && html[j + 1] === ">") {
        selfClosing = true;
        j += 2;
        break;
      }
      ATTR_RE.lastIndex = j;
      const m = ATTR_RE.exec(html);
      if (!m || m[0].length === 0) {
        j++;
        continue;
      }
      j = ATTR_RE.lastIndex;
      const attrName = m[1].toLowerCase();
      if (seen.has(attrName)) continue;
      seen.add(attrName);
      const raw = m[2] ?? m[3] ?? m[4] ?? "";
      attrs.push([attrName, decodeEntities(raw, true)]);
    }
    i = j;
    const newMode = b.startTag(name, attrs, selfClosing);
    if (newMode) {
      if (selfClosing && newMode !== "plaintext") {
        // `<script/>` still opens raw text in HTML; keep parity with browsers.
      }
      mode = newMode;
      rawTag = name;
    }
  }
  b.finish();
}

/** Parses `html` as the children of `context` (an element or null), into `parent`. */
export function parseFragmentInto(parent, html, context, doc) {
  const contextName = context?._localName ?? "body";
  const contextNs = context?._ns ?? HTML_NS;
  const b = new Builder(doc, parent, contextNs);
  if (contextNs === HTML_NS) {
    if (RAW_TEXT.has(contextName)) {
      b.text(html);
      b.finish();
      return;
    }
    if (RCDATA.has(contextName)) {
      b.text(decodeEntities(html, false));
      b.finish();
      return;
    }
    if (contextName === "plaintext") {
      b.text(html);
      b.finish();
      return;
    }
  } else if (isHtmlIntegrationPoint(context)) {
    b.contextNs = HTML_NS;
  }
  tokenize(html, b, null);
}

const HEAD_ELEMENTS = new Set([
  "meta",
  "title",
  "link",
  "style",
  "script",
  "base",
  "noscript",
  "template",
]);

/** Parses a whole document into `doc` (which must be empty). */
export function parseDocumentInto(doc, html) {
  const scratch = doc._createElementNS(HTML_NS, "html", null);
  const b = new Builder(doc, scratch, HTML_NS);
  let doctype = null;
  b.doctype = (name) => {
    doctype = name;
  };
  tokenize(html, b, null);

  if (doctype !== null)
    appendRaw(doc, new DocumentType(INTERNAL, doc, doctype));

  // Lift explicit <html>/<head>/<body> if present, else synthesize them.
  let htmlEl = null;
  for (let c = scratch._first; c; c = c._next) {
    if (c.nodeType === 1 && c._localName === "html") htmlEl = c;
  }
  const source = htmlEl ?? scratch;
  const root = doc._createElementNS(HTML_NS, "html", null);
  if (htmlEl?._attrs)
    for (const a of htmlEl._attrs)
      root._appendAttrRaw(a._ns, a._prefix, a._localName, a._value);
  let head = null;
  let body = null;
  const loose = [];
  for (let c = source._first; c; ) {
    const next = c._next;
    if (c.nodeType === 1 && c._localName === "head" && !head) head = c;
    else if (c.nodeType === 1 && c._localName === "body" && !body) body = c;
    else loose.push(c);
    c = next;
  }
  head ??= doc._createElementNS(HTML_NS, "head", null);
  body ??= doc._createElementNS(HTML_NS, "body", null);
  for (const n of [head, body]) n._parent?.removeChild(n);
  let beforeBody = true;
  for (const n of loose) {
    n._parent?.removeChild(n);
    if (beforeBody && n.nodeType === 1 && HEAD_ELEMENTS.has(n._localName)) {
      appendRaw(head, n);
    } else if (beforeBody && n.nodeType === 3 && n._data.trim() === "") {
      // Inter-element whitespace before the body is dropped.
    } else {
      beforeBody = false;
      appendRaw(body, n);
    }
  }
  appendRaw(root, head);
  appendRaw(root, body);
  appendRaw(doc, root);
}

// --- Serializer -------------------------------------------------------------------

const RAW_TEXT_PARENTS = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript",
]);

function escapeText(s) {
  if (!/[&<> ]/.test(s)) return s;
  return s.replace(/[&<> ]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&nbsp;",
  );
}

function escapeAttr(s) {
  if (!/[&" ]/.test(s)) return s;
  return s.replace(/[&" ]/g, (c) =>
    c === "&" ? "&amp;" : c === '"' ? "&quot;" : "&nbsp;",
  );
}

function attrName(a) {
  if (a._ns === null) return a._localName;
  if (a._ns === XML_NS) return "xml:" + a._localName;
  if (a._ns === XMLNS_NS)
    return a._localName === "xmlns" ? "xmlns" : "xmlns:" + a._localName;
  if (a._ns === XLINK_NS) return "xlink:" + a._localName;
  return a._name;
}

export function serializeChildren(node) {
  let out = "";
  const parent = node._content ?? node;
  for (let c = parent._first; c; c = c._next) out += serializeNode(c, parent);
  return out;
}

export function serializeNode(node, parent = node._parent) {
  switch (node.nodeType) {
    case 1: {
      const tagName =
        node._ns === HTML_NS || node._ns === SVG_NS || node._ns === MATHML_NS
          ? node._localName
          : node._qname;
      let out = "<" + tagName;
      if (node._attrs)
        for (const a of node._attrs)
          out += " " + attrName(a) + '="' + escapeAttr(a._value) + '"';
      out += ">";
      if (node._ns === HTML_NS && VOID.has(node._localName)) return out;
      return out + serializeChildren(node) + "</" + tagName + ">";
    }
    case 3:
    case 4: {
      if (
        parent &&
        parent.nodeType === 1 &&
        parent._ns === HTML_NS &&
        RAW_TEXT_PARENTS.has(parent._localName)
      ) {
        return node._data;
      }
      return escapeText(node._data);
    }
    case 8:
      return "<!--" + node._data + "-->";
    case 7:
      return "<?" + node._target + " " + node._data + ">";
    case 10:
      return "<!DOCTYPE " + node._name + ">";
    case 9:
    case 11:
      return serializeChildren(node);
  }
  return "";
}
