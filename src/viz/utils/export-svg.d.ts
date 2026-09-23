export type ExportSvgOptions = {
  /** Written above the plot. */
  title?: string;
  /** Written below the plot, as a swatch and a label for each entry. */
  legend?: ReadonlyArray<{ label: string; color: string }>;
  /** @default "#ffffff" */
  background?: string;
  /** Color of the title and the legend labels. @default "#161616" */
  color?: string;
  /** A PNG data URL painted behind the elements, sized to the plot. */
  underlay?: string;
};

/**
 * Serialize `svg` as a standalone document: computed styles inlined, on an
 * opaque background, with an optional title above and legend below. The
 * chart is styled by external CSS with custom properties, none of which
 * survives outside the page.
 */
export function serializeSvg(
  svg: SVGSVGElement,
  options?: ExportSvgOptions,
): { markup: string; width: number; height: number };

/** Draw serialized SVG `markup` onto a canvas and encode it as a PNG. */
export function rasterizeSvg(
  markup: string,
  width: number,
  height: number,
  scale?: number,
): Promise<Blob>;

/** The first opaque background behind `node`. */
export function backgroundBehind(node: Element): string;
