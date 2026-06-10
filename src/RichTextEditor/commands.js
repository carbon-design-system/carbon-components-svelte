// @ts-check

/**
 * A command sent from the toolbar to the active editor surface.
 * `command` strings mirror the native `document.execCommand` vocabulary so the
 * default adapter is a thin pass-through. Bring-your-own editors map from the
 * same names.
 *
 * @typedef {{ command: string, value?: any }} RichTextCommand
 */

/**
 * The contract a surface registers with `RichTextEditor`. The default
 * implementation is `createExecCommandAdapter`; a consumer-supplied surface
 * (ProseMirror, Tiptap) implements the same shape.
 *
 * @typedef {{
 *   execute: (command: RichTextCommand) => void,
 *   queryState: () => { active: Set<string>, disabled: Set<string> },
 *   focus: () => void,
 * }} RichTextAdapter
 */

/**
 * Commands whose pressed state is reflected on the toolbar via `aria-pressed`.
 * @type {ReadonlyArray<string>}
 */
export const TOGGLE_COMMANDS = [
  "bold",
  "italic",
  "underline",
  "insertOrderedList",
  "insertUnorderedList",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "justifyFull",
];

/**
 * The full v1 command vocabulary.
 * @type {ReadonlyArray<string>}
 */
export const ALL_COMMANDS = [
  ...TOGGLE_COMMANDS,
  "indent",
  "outdent",
  "createLink",
  "unlink",
  "undo",
  "redo",
];

/**
 * Build the default `contentEditable` adapter backed by `document.execCommand`.
 * `queryState` only reports active toggle commands; per-command disabling is
 * left to the editor's `disabled` prop to avoid `queryCommandEnabled`
 * reporting everything disabled when there is no selection.
 *
 * @param {HTMLElement} node The `contenteditable` host element.
 * @returns {RichTextAdapter}
 */
export function createExecCommandAdapter(node) {
  return {
    execute({ command, value }) {
      if (typeof document === "undefined") return;
      if (command === "createLink") {
        const href = value?.href;
        if (href) document.execCommand("createLink", false, href);
        return;
      }
      document.execCommand(command, false, value);
    },
    queryState() {
      const active = /** @type {Set<string>} */ (new Set());
      const disabled = /** @type {Set<string>} */ (new Set());
      if (typeof document === "undefined") return { active, disabled };
      for (const command of TOGGLE_COMMANDS) {
        try {
          if (document.queryCommandState(command)) active.add(command);
        } catch {
          // queryCommandState throws for unsupported commands in some engines.
        }
      }
      return { active, disabled };
    },
    focus() {
      node.focus();
    },
  };
}
