export type ColorRow = {
  key: "text" | "bg" | "border";
  label: string;
  hex: string;
  swatch: string;
  tokens: string[];
  inherited?: boolean;
  note?: boolean;
};

export type Contrast = {
  ratio: number;
  aa: number;
  aaa: number;
  large: boolean;
  approximate: boolean;
};

export type ColorInfo = {
  rows: ColorRow[];
  contrast: Contrast | null;
  tokens: boolean;
};

export type ElementInfo = {
  name: string;
  size: string;
  margin: number[];
  padding: number[];
  border: number[];
  carbon: boolean;
  gap: { row: number; column: number } | null;
  type: string[] | null;
  typeSpec: string;
  colors: ColorInfo | null;
};

/** Measure the type tokens again, for example after a resize. */
export function resetTypeTable(): void;

/** Type tokens whose metrics all match `style`. */
export function typeTokens(style: CSSStyleDeclaration): string[];

/** Margin, padding, or border widths: top, right, bottom, left. */
export function sides(
  style: CSSStyleDeclaration,
  prop: "margin" | "padding" | "border",
): [number, number, number, number];

/** Everything LayoutInspector's card shows about `el`. */
export function inspectElement(
  el: Element,
  options?: { checkCarbon?: boolean; typography?: boolean; colors?: boolean },
): { rect: DOMRect; style: CSSStyleDeclaration; info: ElementInfo };

type SpacingLine = { px: number; token: string | null };

/**
 * The card's data for one element, as JSON: spacing with token names, the
 * type token, colors with token names, and text contrast.
 */
export function inspect(
  target: Element | string,
  options?: { remPx?: number },
): {
  selector: string;
  carbon: string | null;
  owner: "carbon" | "app";
  rect: { left: number; top: number; width: number; height: number };
  margin: { sides: number[]; tokens: SpacingLine[] };
  padding: {
    sides: number[];
    tokens: (SpacingLine & { withBorder: number })[];
  };
  border: number[];
  gap: { row: number; column: number } | null;
  typography: {
    tokens: string[];
    size: number;
    lineHeight: number | null;
    weight: string;
    family: string;
  } | null;
  colors: {
    role: "text" | "background" | "border";
    hex: string | null;
    /** The best-fitting token names, up to three. */
    tokens: string[];
    moreTokens: number;
    inherited: boolean;
    image: boolean;
  }[];
  contrast: {
    ratio: number;
    aa: number;
    aaa: number;
    large: boolean;
    passes: boolean;
    approximate: boolean;
  } | null;
} | null;
