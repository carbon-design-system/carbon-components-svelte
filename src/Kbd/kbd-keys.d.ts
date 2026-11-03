import type { KbdTranslationId } from "./Kbd.svelte";

/** The English key names, by translation id. */
export const KBD_TRANSLATIONS: Record<KbdTranslationId, string>;

/**
 * The keys of a shortcut as a `Kbd` shows them: the text on each key, and
 * the name a screen reader hears for it. Empty when the shortcut doesn't
 * parse.
 */
export function kbdKeys(
  shortcut: string,
  apple: boolean,
  translate: (id: KbdTranslationId) => string,
): Array<{ label: string; name: string }>;
