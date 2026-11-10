export function fragmentBeforeCaret(
  value: string,
  caret: number,
  options?: { scope?: "value" | "line" | "word"; after?: string },
): string | null;
export function completeFromList(
  candidates: ReadonlyArray<string>,
  fragment: string,
  options?: { ignoreCase?: boolean; minLength?: number },
): string;
export function appendedText(prev: string, next: string): string | null;
export function typeThrough(
  suggestion: string,
  inserted: string,
  ignoreCase?: boolean,
): string | null;
export function firstWord(suggestion: string): string;
export function fitMaxLength(
  suggestion: string,
  valueLength: number,
  maxLength: number,
): string;
export function canSuggest(
  field: {
    value: string;
    selectionStart: number | null;
    selectionEnd: number | null;
    disabled?: boolean;
    readOnly?: boolean;
  },
  state?: { composing?: boolean },
): boolean;
export function keyAction(
  event: {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  },
  options?: {
    rtl?: boolean;
    acceptKeys?: ReadonlyArray<"Tab" | "ArrowRight">;
    acceptWord?: boolean;
  },
): "accept" | "word" | "dismiss" | null;
