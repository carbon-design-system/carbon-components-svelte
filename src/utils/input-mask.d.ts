/** A pattern, or a function from the raw characters so far to a pattern. */
export type MaskPattern = string | ((raw: string) => string);

export interface MaskOptions {
  pattern: MaskPattern;
  /** Write the literals up to the next slot as soon as one is filled. */
  eager?: boolean;
}

export interface MaskResult {
  /** The text as the field shows it. */
  value: string;
  /** The characters that fill the slots, without the literals. */
  rawValue: string;
  /** True when every slot of the pattern is filled. */
  complete: boolean;
  /** The pattern that was used. */
  pattern: string;
}

export interface MaskState {
  value: string;
  /** Selection start, as a text index. */
  start: number;
  /** Selection end, as a text index. */
  end: number;
}

export type MaskChange =
  | { type: "insert"; text: string }
  | {
      type: "delete";
      direction: "backward" | "forward";
      unit: "char" | "word" | "line";
    };

export interface MaskEditResult extends MaskResult {
  /** Where the caret goes, as a text index. */
  caret: number;
  /** False when the edit was refused or changed nothing. */
  changed: boolean;
}

/** Apply one edit to the text and selection, then re-mask. */
export function applyMaskEdit(
  options: MaskPattern | MaskOptions,
  state: MaskState,
  change: MaskChange,
): MaskEditResult;

/** Re-mask text the browser edited, keeping the caret among the characters. */
export function conformMaskText(
  options: MaskPattern | MaskOptions,
  text: string,
  caret: number,
): MaskResult & { caret: number };

/** A mask built from a pattern. Pure and SSR-safe. */
export function createMask(options: MaskPattern | MaskOptions): {
  options: MaskOptions;
  /** Format any text, such as an initial value. */
  format(text: string): MaskResult;
  /** The characters that fill the slots, without the literals. */
  unmask(text: string): string;
  /** The empty pattern with `char` in every slot, for `placeholder`. */
  placeholder(char?: string): string;
  /** True when every slot of the pattern for `text` is filled. */
  isComplete(text: string): boolean;
  /** True when every slot of the empty pattern takes a digit. */
  isNumeric(): boolean;
};
