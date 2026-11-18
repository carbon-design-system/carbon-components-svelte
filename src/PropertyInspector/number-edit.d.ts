export interface NumberEdit {
  /**
   * `"set"` writes `n`; `"add"` adds `n` to each object's own value;
   * `"multiply"` scales it.
   */
  kind: "set" | "add" | "multiply";
  n: number;
}

export interface NumberLimits {
  min?: number;
  max?: number;
}

/** Read what a person typed into a number field. `null` when it is not an edit. */
export function parseNumberEdit(text: string, unit?: string): NumberEdit | null;

export function applyNumberEdit(
  edit: NumberEdit,
  from: number,
  limits?: NumberLimits & { step?: number },
): number;

/** The change an arrow or page key makes. `0` for any other key. */
export function keyDelta(
  key: string,
  options: { step: number; shiftKey?: boolean; altKey?: boolean },
): number;

export function createScrub(options: {
  step: number;
  pixelsPerStep?: number;
  /** `-1` where the inline end is on the left. */
  sign?: 1 | -1;
}): {
  /** Returns the total so far. */
  move(
    dx: number,
    modifiers?: { shiftKey?: boolean; altKey?: boolean },
  ): number;
};

export function scaleLinked(
  primaryFrom: number,
  primaryTo: number,
  linkedFrom: number,
): number;
