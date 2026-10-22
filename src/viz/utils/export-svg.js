// @ts-check
// Turn a chart's live SVG into a standalone image. The chart is styled by
// external CSS with custom properties, none of which survives outside the
// page, so the computed values are written onto a clone.

const SVG_NS = "http://www.w3.org/2000/svg";

/** Presentation properties that decide how a mark looks. */
const PROPERTIES = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "letter-spacing",
  "text-anchor",
  "shape-rendering",
];

/** An `rgba()` color with zero alpha. */
const CLEAR = /,\s*0\)$/;

const TITLE_HEIGHT = 32;
const LEGEND_HEIGHT = 28;
const PADDING = 16;
/** Average glyph width of 12px IBM Plex Sans. */
const GLYPH = 6.6;

/** @param {string} text */
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Serialize `svg` as a standalone document: computed styles inlined, on an
 * opaque background, with an optional title above and legend below.
 *
 * @param {SVGSVGElement} svg
 * @param {import("./export-svg.d.ts").ExportSvgOptions} [options]
 * @returns {{ markup: string; width: number; height: number }}
 */
export function serializeSvg(svg, options = {}) {
  const {
    title = "",
    legend = [],
    background = "#ffffff",
    color = "#161616",
    underlay,
  } = options;
  const box = svg.viewBox.baseVal;
  const innerWidth = box?.width || svg.clientWidth || 640;
  const innerHeight = box?.height || svg.clientHeight || 288;

  const clone = /** @type {SVGSVGElement} */ (svg.cloneNode(true));
  const live = [svg, ...svg.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  for (let i = 0; i < live.length; i++) {
    const computed = getComputedStyle(live[i]);
    const copy = /** @type {SVGElement} */ (copies[i]);
    copy.removeAttribute("class");
    copy.removeAttribute("style");
    for (const property of PROPERTIES) {
      const value = computed.getPropertyValue(property);
      if (value) copy.style.setProperty(property, value);
    }
  }
  for (const name of [
    "role",
    "tabindex",
    "aria-label",
    "aria-roledescription",
  ]) {
    clone.removeAttribute(name);
  }

  const top = PADDING + (title ? TITLE_HEIGHT : 0);
  const width = innerWidth + PADDING * 2;
  const height =
    top + innerHeight + (legend.length ? LEGEND_HEIGHT : 0) + PADDING;
  clone.setAttribute("x", String(PADDING));
  clone.setAttribute("y", String(top));
  clone.setAttribute("width", String(innerWidth));
  clone.setAttribute("height", String(innerHeight));
  clone.setAttribute("overflow", "visible");
  // Pixels painted behind the SVG go in first, so the elements stay on top.
  if (underlay) {
    const image = clone.ownerDocument.createElementNS(SVG_NS, "image");
    image.setAttribute("href", underlay);
    image.setAttribute("x", "0");
    image.setAttribute("y", "0");
    image.setAttribute("width", String(innerWidth));
    image.setAttribute("height", String(innerHeight));
    clone.insertBefore(image, clone.firstChild);
  }

  const font =
    getComputedStyle(svg).getPropertyValue("font-family") || "sans-serif";
  let x = PADDING;
  const entries = legend
    .map((entry) => {
      const at = x;
      x += 12 + 6 + entry.label.length * GLYPH + 16;
      const y = top + innerHeight + LEGEND_HEIGHT / 2 + 4;
      return (
        `<rect x="${at}" y="${y - 6}" width="12" height="12" fill="${escapeXml(entry.color)}"/>` +
        `<text x="${at + 18}" y="${y + 4}" font-size="12" fill="${escapeXml(color)}">${escapeXml(entry.label)}</text>`
      );
    })
    .join("");

  const markup =
    `<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${escapeXml(font)}">` +
    `<rect width="100%" height="100%" fill="${escapeXml(background)}"/>` +
    (title
      ? `<text x="${PADDING}" y="${PADDING + 16}" font-size="14" font-weight="600" fill="${escapeXml(color)}">${escapeXml(title)}</text>`
      : "") +
    new XMLSerializer().serializeToString(clone) +
    entries +
    "</svg>";
  return { markup, width, height };
}

/**
 * Draw serialized SVG `markup` onto a canvas and encode it as a PNG.
 *
 * @param {string} markup
 * @param {number} width
 * @param {number} height
 * @param {number} [scale] Pixel density of the image.
 * @returns {Promise<Blob>}
 */
export function rasterizeSvg(markup, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(
      new Blob([markup], { type: "image/svg+xml;charset=utf-8" }),
    );
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(url);
      if (!context) return reject(new Error("Canvas is not available"));
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not encode the image")),
        "image/png",
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load the chart as an image"));
    };
    image.src = url;
  });
}

/**
 * The first opaque background behind `node`, for an image that matches the
 * page it was taken from.
 *
 * @param {Element} node
 * @returns {string}
 */
export function backgroundBehind(node) {
  /** @type {Element | null} */
  let current = node;
  while (current) {
    const color = getComputedStyle(current).backgroundColor;
    if (color && color !== "transparent" && !CLEAR.test(color)) return color;
    current = current.parentElement;
  }
  return "#ffffff";
}
