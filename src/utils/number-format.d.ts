export interface NumberFormatOptions {
  /**
   * A BCP 47 locale. Uses the runtime's locale when unset, which differs
   * between a server and a browser: set it when the text is server-rendered.
   */
  locale?: string;
  /** Defaults to `"currency"` with a `currency`, `"unit"` with a `unit`. */
  style?: "decimal" | "currency" | "unit";
  /** An ISO 4217 code such as `"EUR"`. */
  currency?: string;
  /** @default "symbol" */
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
  /** `"accounting"` writes a negative amount in brackets in some locales. */
  currencySign?: "standard" | "accounting";
  /**
   * An `Intl` unit (`"kilogram"`, `"kilometer-per-hour"`) or one of the
   * symbols `kg`, `g`, `mg`, `lb`, `oz`, `km`, `m`, `cm`, `mm`, `mi`, `ft`,
   * `in`, `l`, `ml`, `ms`, `s`, `min`, `h`, `d`, `B`, `KB`, `MB`, `GB`,
   * `TB`, `%`, `°C`, `°F`.
   */
  unit?: string;
  /** @default "short" */
  unitDisplay?: "short" | "narrow" | "long";
  /** Defaults to the currency's digits (JPY 0, USD 2, BHD 3), or 0. */
  minimumFractionDigits?: number;
  /** Defaults to the currency's digits, or 3. */
  maximumFractionDigits?: number;
  useGrouping?: boolean | "always" | "auto" | "min2";
  /** Accept a minus key and a negative paste. @default false */
  allowNegative?: boolean;
  /** Integer digits a field takes. @default 15 */
  maxIntegerDigits?: number;
}

export type NumberChange =
  | { type: "insert"; text: string }
  | {
      type: "delete";
      direction: "backward" | "forward";
      unit: "char" | "word" | "line";
    };

export interface NumberEditResult {
  /** The text as the field shows it. */
  value: string;
  /** `-`, digits and one `.`: the number as it is entered. */
  raw: string;
  /** Where the caret goes, as a text index. */
  caret: number;
  /** False when the text did not change (the caret may still move). */
  changed: boolean;
}

export interface NumberFormat {
  locale: string;
  style: "decimal" | "currency" | "unit";
  currency: string | undefined;
  unit: string | undefined;
  /** This locale's decimal mark for this style. */
  decimal: string;
  /** This locale's grouping mark, or `""`. */
  group: string;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  allowNegative: boolean;
  /** True when a negative amount is written in brackets. */
  accounting: boolean;
  /** The direction the locale's text reads in. */
  direction: "ltr" | "rtl";
  /** Read the field's own text into the raw string. */
  scan(text: string): { raw: string; map: number[] };
  /** Strip a raw string to what a field can hold. */
  normalize(raw: string): string;
  /** The raw string as it is when the field is left. */
  finalize(raw: string): string;
  /**
   * Read text a person typed or pasted: this locale's marks, other
   * locales' marks, any digits, a minus sign in front or behind, brackets,
   * and the currency or unit. `null` when it is not a number. `ambiguous`
   * is true when a lone `.` or `,` followed by three digits could be
   * either a group or a decimal mark.
   */
  parse(text: string): { value: string; ambiguous: boolean } | null;
  /** A raw string as the decimal string a field reports. */
  toValue(raw: string): string;
  /** A bound string or number as a raw string, rounded to the digits. */
  fromValue(value: unknown): string;
  /** A bound string or number as the text the field shows when left. */
  format(value: unknown): string;
  /** A raw string as text, as the field shows it while typing. */
  render(raw: string): string;
  /** Apply a `beforeinput` edit to the field's text and selection. */
  applyEdit(
    state: { value: string; start: number; end: number },
    change: NumberChange,
  ): NumberEditResult;
  /**
   * Re-read text the browser edited, and write it in the format. With
   * `final`, also pad the fraction digits, as when the field is left.
   */
  conform(
    text: string,
    caret: number,
    final?: boolean,
  ): { value: string; raw: string; caret: number };
  /** The currency or unit in words, for `aria-describedby`; `""` if none. */
  name(): string;
}

/** A number format for a locale and options. Pure and SSR-safe. */
export function createNumberFormat(options?: NumberFormatOptions): NumberFormat;

/** A finite number as a decimal string with no exponent. */
export function numberToDecimal(n: number): string;
/** Round a decimal string, halves away from zero. */
export function roundDecimal(value: string, digits: number): string;
/** Compare decimal strings without floating point. */
export function compareDecimal(a: string, b: string): -1 | 0 | 1;
/** Whether a decimal string is a whole multiple of a step. */
export function isMultipleOf(value: string, step: string): boolean;
/**
 * A decimal string as an integer count of minor units (cents). `null` past
 * `Number.MAX_SAFE_INTEGER`.
 */
export function toMinorUnits(
  value: string | number,
  fractionDigits: number,
): number | null;
/** A count of minor units as a decimal string. */
export function fromMinorUnits(minor: number, fractionDigits: number): string;
/** The fraction digits a currency uses (JPY 0, USD 2, BHD 3). */
export function currencyFractionDigits(
  currency: string,
  locale?: string,
): number;
