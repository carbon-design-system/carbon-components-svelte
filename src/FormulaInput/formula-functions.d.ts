export type FormulaValue = number | string | boolean | null;

export type FormulaType = "number" | "string" | "boolean" | "any";

export type FormulaParam = {
  name: string;
  /** Default `"any"`. */
  type?: FormulaType;
  /** May be left out. Only trailing parameters. */
  optional?: boolean;
  /** Takes any number of arguments, at least one. Only the last parameter. */
  rest?: boolean;
  description?: string;
};

export type FormulaCallContext = {
  /** Stop the evaluation with an error. */
  fail: (message: string, code?: string) => never;
  /** Count `units` steps of work, so a costly function stays inside the step limit. */
  charge: (units: number) => void;
  /** The longest text a function may build. */
  maxStringLength: number;
};

export type FormulaFunction = {
  /** Matched without regard to case. */
  name: string;
  params: FormulaParam[];
  /** Default `"any"`. */
  returns?: FormulaType;
  /** Shown instead of the one built from `params`. */
  signature?: string;
  description?: string;
  /** Gets the value of every argument. Without this or `evaluateLazy`, the formula has no preview. */
  evaluate?: (
    args: FormulaValue[],
    context: FormulaCallContext,
  ) => FormulaValue;
  /** Gets a function per argument, and calls only the ones it needs. Wins over `evaluate`. */
  evaluateLazy?: (
    args: Array<() => FormulaValue>,
    context: FormulaCallContext,
  ) => FormulaValue;
};

export class FormulaError extends Error {
  constructor(message: string, code?: string, start?: number, end?: number);
  code: string;
  start: number;
  end: number;
}

export type FormulaSignature = {
  /** `ROUND(number, [digits])`. */
  text: string;
  /** Where each parameter is in `text`. */
  params: { start: number; end: number }[];
};

/** The built-in functions. */
export const defaultFunctions: FormulaFunction[];

/**
 * Index a list of functions by upper-cased name. A later function replaces an
 * earlier one of the same name.
 */
export function createFunctionMap(
  functions: ReadonlyArray<FormulaFunction>,
): Map<string, FormulaFunction>;

/** The smallest and largest number of arguments `fn` takes. */
export function arity(fn: FormulaFunction): { min: number; max: number };

/**
 * The parameter an argument at `index` fills. Past the end it is the rest
 * parameter, if there is one; otherwise `-1`.
 */
export function paramIndexAt(fn: FormulaFunction, index: number): number;

/** The signature of `fn` as text, with the range of each parameter in it. */
export function formatSignature(fn: FormulaFunction): FormulaSignature;

export function toBoolean(value: FormulaValue): boolean;

/** Text as a formula shows it: a number to 15 significant digits. */
export function toText(value: FormulaValue): string;
