/** Values a template can use. */
export type DndTextValues = Record<string, string | number | boolean>;

/**
 * Return the string for `id`, or `undefined` to keep the English default.
 * Values are passed so a translation can place them: `{label}`, `{position}`,
 * `{count}`, `{name}`, and the adapter's own.
 */
export type DndTranslate = (
  id: string,
  values: DndTextValues,
) => string | undefined;

export function formatText(template: string, values: DndTextValues): string;

export function createTexts(
  defaults: Record<string, string>,
  getTranslate: () => DndTranslate | undefined,
): (id: string, values?: DndTextValues) => string;

export const DND_DEFAULT_TEXTS: Record<string, string>;

export function acquireRegion(host: Element): {
  say(message: string): void;
  release(): void;
};

export function hostOf(node: Element): Element;
