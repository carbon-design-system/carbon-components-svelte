export type MarkTag = "strong" | "em" | "u" | "s" | "code";

/** A selection as tick offsets: a tick is a character, a `<br>`, or the start of a text block. */
export interface SavedSelection {
  anchor: number;
  focus: number;
}

export function isTextBlock(node: Node | null): node is Element;

export function closestTextBlock(
  node: Node | null,
  root: Element,
): Element | null;

/** The selection's range, when it lies inside `root`. */
export function getRange(root: Element): Range | null;

export function saveSelection(root: Element): SavedSelection | null;

export function restoreSelection(
  root: Element,
  saved: SavedSelection | null,
): void;

export function htmlToFragment(doc: Document, html: string): DocumentFragment;

/** Text blocks the range touches. */
export function textBlocksInRange(root: Element, range: Range): Element[];

export interface Editing {
  toggleMark(tag: MarkTag): boolean;
  setBlock(tag: "p" | "h2" | "h3"): boolean;
  toggleList(type: "ul" | "ol"): boolean;
  indent(): boolean;
  outdent(): boolean;
  toggleBlockquote(): boolean;
  getLink(): HTMLAnchorElement | null;
  setLink(href: string, text?: string): boolean;
  removeLink(): boolean;
  clearFormatting(): boolean;
  insertHtml(html: string): boolean;
  deleteSelection(): boolean;
  enter(): boolean;
  backspace(): boolean;
  normalize(dirty?: Element | null): boolean;
  flushPending(): void;
  queryState(): Set<string>;
  isEmpty(): boolean;
}

/** Create the editing commands for a `contenteditable` host. */
export function createEditing(root: HTMLElement): Editing;
