import type { Readable } from "svelte/store";

export interface LocaleSettings {
  /** BCP 47 language tag, such as `"de-CH"`. */
  locale?: string;
  /** IANA time zone, such as `"Europe/Zurich"`. */
  timeZone?: string;
  hourCycle?: "h11" | "h12" | "h23" | "h24";
  /** First day of the week, 0 (Sunday) to 6 (Saturday). */
  weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Such as `"latn"` or `"arab"`. */
  numberingSystem?: string;
  /** Such as `"gregory"` or `"buddhist"`. */
  calendar?: string;
}

/**
 * The settings of the nearest `LocaleProvider`, merged over the providers
 * above it.
 *
 * `locale` is the tag every `Intl` constructor should receive. It carries
 * `hourCycle`, `numberingSystem` and `calendar` as Unicode extension keys
 * (`de-CH-u-ca-buddhist-hc-h12-nu-arab`), so `Intl.NumberFormat`,
 * `Intl.DateTimeFormat` and the rest honor them with no further option.
 * `baseLocale` is the tag as it was given.
 */
export interface LocaleContext extends LocaleSettings {
  baseLocale?: string;
}

/**
 * `baseLocale` with the Unicode extension keys applied. An invalid tag comes
 * back unchanged.
 */
export function applyLocaleExtensions(
  baseLocale: string | undefined,
  settings: LocaleSettings,
): string | undefined;

/**
 * Lay a provider's settings over its parent's. A field the child leaves
 * unset keeps the parent's.
 */
export function mergeLocaleContext(
  parent: LocaleContext,
  own: LocaleSettings,
): LocaleContext;

/**
 * The locale, time zone and formatting defaults of the nearest
 * `LocaleProvider`, as a store. The store holds an empty object outside one,
 * so `$context.locale` is `undefined` there. Resolve a value as the prop,
 * then the context, then the component's own default.
 *
 * Call during component initialization.
 */
export function getLocaleContext(): Readable<LocaleContext>;

/**
 * Set the context for this component and below. Returns the merged store.
 * Call during component initialization.
 */
export function setLocaleContext(
  settings: Readable<LocaleSettings>,
): Readable<LocaleContext>;

/**
 * Add a translate function to the translate context for this component and
 * below. `read` is called on every translation, so it can return a new
 * function over time. Call during component initialization.
 */
export function provideTranslate(
  read: () => ((id: string) => string | undefined) | undefined,
): void;
