/** A command sent from the toolbar to the active editor surface. */
export interface RichTextCommand {
  command: string;
  value?: unknown;
}

/** The contract a surface registers with `RichTextEditor`. */
export interface RichTextAdapter {
  execute: (command: RichTextCommand) => void;
  queryState: () => { active: Set<string>; disabled: Set<string> };
  focus: () => void;
}

/** Commands whose pressed state is reflected on the toolbar via `aria-pressed`. */
export declare const TOGGLE_COMMANDS: ReadonlyArray<string>;

/** The full v1 command vocabulary. */
export declare const ALL_COMMANDS: ReadonlyArray<string>;

/** Build the default `contentEditable` adapter backed by `document.execCommand`. */
export declare function createExecCommandAdapter(
  node: HTMLElement,
): RichTextAdapter;
