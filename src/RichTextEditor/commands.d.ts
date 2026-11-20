export type RichTextCommand =
  | "undo"
  | "redo"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "code"
  | "ul"
  | "ol"
  | "outdent"
  | "indent"
  | "blockquote"
  | "link"
  | "clear";

export interface CommandSpec {
  /** Default accessible name. */
  label: string;
  /** Icon component. Without one, `glyph` is drawn. */
  icon?: import("../utils/icon-component.js").IconComponent;
  glyph?: string;
  /** Whether the item has a pressed state. */
  toggle: boolean;
  /** Whether the icon points back or forward, and mirrors in RTL. */
  mirror?: boolean;
  /** Key in the editor's format state that marks it pressed. */
  state?: string;
  shortcuts?: {
    key?: string;
    code?: string;
    shift?: boolean;
    alt?: boolean;
    mac?: boolean;
  }[];
}

export const COMMANDS: Record<RichTextCommand, CommandSpec>;

export const DEFAULT_TOOLBAR: readonly (RichTextCommand | "|")[];

/** The command a keydown triggers. */
export function commandForKey(
  event: KeyboardEvent,
  mac: boolean,
): RichTextCommand | undefined;

/** A command's shortcut as shown to people, for example `Ctrl+Shift+X` or `⌘⇧X`. */
export function shortcutLabel(
  command: RichTextCommand,
  mac: boolean,
): string | undefined;

/** The value of `aria-keyshortcuts` for a command. */
export function ariaShortcut(
  command: RichTextCommand,
  mac: boolean,
): string | undefined;
