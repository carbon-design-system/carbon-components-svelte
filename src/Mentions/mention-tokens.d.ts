export type Mention = {
  /** The trigger character that started it. */
  trigger: string;
  id: string | number;
  /** The item's text, without the trigger. */
  text: string;
  /** Index of the trigger in the value. */
  start: number;
  /** Index after the last character of the mention. */
  end: number;
};

export type Splice = {
  start: number;
  /** Characters removed at `start`. */
  removed: number;
  /** Characters inserted at `start`. */
  inserted: number;
};

export type MentionFormat = "text" | "token" | "plain";

export type Insertion = {
  /** The text that replaces `[start, end)`. */
  insert: string;
  /** The record to keep, or `null` for `"plain"`. */
  mention: Mention | null;
  /** Where the caret goes, in the new value. */
  caret: number;
};

/** `@[Alice Smith](u_42)`, with `\`, `]` and `)` escaped. */
export function formatMentionToken(
  char: string,
  text: string,
  id: string | number,
): string;

/** The tokens in `value`, in order, for the listed trigger characters. */
export function parseMentionTokens(
  value: string,
  chars: ReadonlyArray<string>,
): Mention[];

/** Each token becomes its trigger and text (`@[Alice](u1)` to `@Alice`). */
export function mentionsToPlainText(
  value: string,
  chars: ReadonlyArray<string>,
): string;

/** What changed between two values, as one splice. */
export function spliceFromValues(
  previous: string,
  next: string,
  caret?: number,
): Splice;

/** Keep a mention list true to the text after an edit. */
export function reconcileMentions(
  mentions: ReadonlyArray<Mention>,
  splice: Splice,
): Mention[];

export function buildInsertion(options: {
  char: string;
  format: MentionFormat;
  item: { id: string | number; text: string; insertText?: string };
  start: number;
  suffix?: string;
  following?: string;
}): Insertion;
