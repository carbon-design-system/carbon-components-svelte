import type { KbdTranslationId } from "./Kbd.svelte";

/**
 * Translate the key names of every `Kbd` in this component and below it,
 * including the keys a Button, Search, HeaderSearch or menu item shows for
 * its `shortcut`. Pass the translations by id, or a function; a key left
 * out, or `undefined` from the function, keeps its English name. A `Kbd`'s
 * own `translateWithId` takes precedence. Call during component
 * initialization.
 */
export function setKbdTranslations(
  translations:
    | Partial<Record<KbdTranslationId, string>>
    | ((id: KbdTranslationId) => string | undefined),
): void;

/** The translations set by the nearest `setKbdTranslations`, if any. */
export function getKbdTranslations():
  undefined | ((id: KbdTranslationId) => string | undefined);
