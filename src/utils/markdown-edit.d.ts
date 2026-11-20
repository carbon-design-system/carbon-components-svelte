/**
 * One replacement: swap `text.slice(from, to)` for `insert`, then select
 * `start` to `end` in the new text.
 */
export type MarkdownEdit = {
  from: number;
  to: number;
  insert: string;
  start: number;
  end: number;
};

export type MarkdownAction =
  | "heading"
  | "bold"
  | "italic"
  | "strikethrough"
  | "quote"
  | "code"
  | "link"
  | "ul"
  | "ol"
  | "task";

/** The toolbar actions the editor knows. */
export const MARKDOWN_ACTIONS: ReadonlyArray<MarkdownAction>;

export type ListPrefix = {
  indent: number;
  kind: "ul" | "ol" | "task";
  number: number;
  marker: string;
  gap: number;
  box: string;
  prefix: number;
  column: number;
};

/** The offset where the line holding `pos` starts. */
export function lineStart(text: string, pos: number): number;

/** The offset where the line holding `pos` ends, before its newline. */
export function lineEnd(text: string, pos: number): number;

/**
 * Whether `pos` is inside a fenced code block, where Enter, Tab and the line
 * toolbar actions must leave lines alone.
 */
export function isInsideFence(text: string, pos: number): boolean;

/**
 * Wrap the selection in `marker`, or take the marker off when it is already
 * there, around the selection or inside it. A caret in a word wraps the word.
 * Spaces at the selection's ends stay outside the markers.
 */
export function toggleInline(
  text: string,
  start: number,
  end: number,
  marker: string,
): MarkdownEdit;

/**
 * Turn the selection into inline code, or a fenced block when it spans
 * lines. Wrapping again takes the code back off.
 */
export function toggleCode(
  text: string,
  start: number,
  end: number,
): MarkdownEdit;

/**
 * Turn the selection into a link and select the address to type over. A
 * selected address becomes the link's target with the caret in its text. A
 * selected link turns back into its text.
 */
export function insertLink(
  text: string,
  start: number,
  end: number,
): MarkdownEdit;

/** Read the list marker that opens a line. */
export function listPrefix(line: string): ListPrefix | null;

/** Add a prefix to every selected line, or take it off when every one has it. */
export function toggleLines(
  text: string,
  start: number,
  end: number,
  kind: "quote" | "ul" | "ol" | "task",
): MarkdownEdit;

/**
 * Make the line a heading of `level`, or plain when it is one already. A
 * heading of another level changes level.
 */
export function toggleHeading(
  text: string,
  start: number,
  end: number,
  level?: number,
): MarkdownEdit;

/**
 * The edit for a toolbar action or shortcut. `null` for an action it does
 * not know, or a line action inside a fenced code block.
 */
export function markdownEdit(
  action: MarkdownAction,
  text: string,
  start: number,
  end: number,
  options?: { headingLevel?: number },
): MarkdownEdit | null;

/**
 * The edit for Enter at a list item or quote line: start the next item with
 * the same marker, or end the list when the item is empty. `null` for
 * anything else, so Enter breaks the line as usual.
 */
export function continueList(
  text: string,
  start: number,
  end: number,
): MarkdownEdit | null;

/**
 * The edit for Tab (`outdent` false) or Shift+Tab at a list item. `null`
 * when the first selected line is not a list item, so Tab moves focus; an
 * item that cannot move any further yields an edit that changes nothing.
 */
export function indentList(
  text: string,
  start: number,
  end: number,
  outdent?: boolean,
): MarkdownEdit | null;
