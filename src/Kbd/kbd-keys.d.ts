import type { KbdTranslationId } from "./Kbd.svelte";

/** The English key names, by translation id. */
export const KBD_TRANSLATIONS: Record<KbdTranslationId, string>;

/** A Carbon icon a key shows in place of text. */
export type KbdIcon =
  | "command"
  | "option"
  | "shift"
  | "control"
  | "return"
  | "tab"
  | "arrowUp"
  | "arrowDown"
  | "arrowLeft"
  | "arrowRight";

/**
 * The keys of a shortcut as a `Kbd` shows them: the text or the icon on
 * each key, and the name a screen reader hears for it. A key with an icon
 * has an empty `label`. Empty when the shortcut doesn't parse.
 */
export function kbdKeys(
  shortcut: string,
  apple: boolean,
  translate: (id: KbdTranslationId) => string,
): Array<{ label: string; name: string; icon?: KbdIcon }>;
