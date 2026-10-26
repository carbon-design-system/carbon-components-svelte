export type BaselineLine = {
  el: Element;
  x: number;
  y: number;
  width: number;
  rtl: boolean;
  pinned: boolean;
};

/** The baseline of every line of text outside the dev tools. */
export function measureBaselines(options: {
  host: Element;
  band?: import("./page-scan.js").ScanBand | null;
}): BaselineLine[];

/** Glyph baselines of the page's text against rows every `step` pixels, as data. */
export function baselines(options?: {
  step?: number;
  offset?: number;
  scope?: string;
}): {
  step: number;
  offset: number;
  total: number;
  onRow: number;
  lines: {
    selector: string;
    text: string;
    font: string;
    type: string | null;
    x: number;
    y: number;
    width: number;
    delta: number | null;
  }[];
};
