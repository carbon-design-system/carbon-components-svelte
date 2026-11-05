// @ts-check
import { getContext, setContext } from "svelte";
import { derived, readable } from "svelte/store";
import { LOCALE_CONTEXT_KEY } from "../constants/context-keys.js";

/**
 * What a `LocaleProvider` sets. Every field is optional: a field a provider
 * leaves unset comes from the provider above it, and from the component's
 * own default when there is none.
 *
 * @typedef {object} LocaleSettings
 * @property {string} [locale] BCP 47 language tag, such as `"de-CH"`.
 * @property {string} [timeZone] IANA time zone, such as `"Europe/Zurich"`.
 * @property {"h11" | "h12" | "h23" | "h24"} [hourCycle]
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6} [weekStart] First day of the week,
 *   0 (Sunday) to 6 (Saturday).
 * @property {string} [numberingSystem] Such as `"latn"` or `"arab"`.
 * @property {string} [calendar] Such as `"gregory"` or `"buddhist"`.
 */

/**
 * What `getLocaleContext` holds: the settings of the nearest provider,
 * merged over the providers above it.
 *
 * `locale` is the tag every `Intl` constructor should receive. It carries
 * `hourCycle`, `numberingSystem` and `calendar` as Unicode extension keys
 * (`de-CH-u-ca-buddhist-hc-h12-nu-arab`), so `Intl.NumberFormat`,
 * `Intl.DateTimeFormat` and the rest honor them with no further option.
 * `baseLocale` is the tag as it was given.
 *
 * @typedef {LocaleSettings & { baseLocale?: string }} LocaleContext
 */

/** @type {LocaleContext} */
const EMPTY = Object.freeze({});

/** @type {import("svelte/store").Readable<LocaleContext>} */
const outside = readable(EMPTY);

/**
 * `baseLocale` with the Unicode extension keys applied. An invalid tag comes
 * back unchanged, so the component that formats with it fails as it does for
 * a bad `locale` prop, and a provider with a bad tag does not throw first.
 *
 * @param {string | undefined} baseLocale
 * @param {LocaleSettings} settings
 * @returns {string | undefined}
 */
export function applyLocaleExtensions(baseLocale, settings) {
  if (!baseLocale) return undefined;
  const { numberingSystem, calendar, hourCycle } = settings;
  if (!numberingSystem && !calendar && !hourCycle) return baseLocale;
  try {
    return new Intl.Locale(baseLocale, {
      numberingSystem,
      calendar,
      hourCycle,
    }).toString();
  } catch {
    return baseLocale;
  }
}

/**
 * Lay a provider's settings over its parent's. A field the child leaves
 * unset keeps the parent's, and the tag is rebuilt, so a child that only
 * sets `locale` keeps the parent's `numberingSystem`.
 *
 * @param {LocaleContext} parent
 * @param {LocaleSettings} own
 * @returns {LocaleContext}
 */
export function mergeLocaleContext(parent, own) {
  const merged = {
    timeZone: own.timeZone ?? parent.timeZone,
    hourCycle: own.hourCycle ?? parent.hourCycle,
    weekStart: own.weekStart ?? parent.weekStart,
    numberingSystem: own.numberingSystem ?? parent.numberingSystem,
    calendar: own.calendar ?? parent.calendar,
  };
  const baseLocale = own.locale ?? parent.baseLocale;
  return {
    ...merged,
    baseLocale,
    locale: applyLocaleExtensions(baseLocale, merged),
  };
}

/**
 * The locale, time zone and formatting defaults of the nearest
 * `LocaleProvider`, as a store. The store holds an empty object outside one,
 * so `$context.locale` is `undefined` there. Resolve a value as the prop,
 * then the context, then the component's own default.
 *
 * Call during component initialization.
 *
 * @returns {import("svelte/store").Readable<LocaleContext>}
 */
export function getLocaleContext() {
  return getContext(LOCALE_CONTEXT_KEY) ?? outside;
}

/**
 * Set the context for this component and below. `settings` is a store, so a
 * provider's props can change at runtime. Returns the merged store.
 *
 * Call during component initialization.
 *
 * @param {import("svelte/store").Readable<LocaleSettings>} settings
 * @returns {import("svelte/store").Readable<LocaleContext>}
 */
export function setLocaleContext(settings) {
  const merged = derived([getLocaleContext(), settings], ([parent, own]) =>
    mergeLocaleContext(parent, own),
  );
  setContext(LOCALE_CONTEXT_KEY, merged);
  return merged;
}

// The key `setTranslateContext` sets in the translate context PR. Copied here
// so a provider composes with it without importing a file that is not in this
// branch. Swap this for that module's key, and `provideTranslate` for a call
// to its `setTranslateContext`, when it lands.
const TRANSLATE_CONTEXT_KEY = "carbon:translate";

/**
 * Add a translate function to the translate context for this component and
 * below. `read` is called on every translation, so it can return a new
 * function over time. The function it returns is asked first, then the one
 * set above, and a function that returns `undefined` leaves the id to the
 * component's English text.
 *
 * Call during component initialization.
 *
 * @param {() => ((id: string) => string | undefined) | undefined} read
 */
export function provideTranslate(read) {
  /** @type {undefined | ((id: string) => string | undefined)} */
  const parent = getContext(TRANSLATE_CONTEXT_KEY);
  setContext(
    TRANSLATE_CONTEXT_KEY,
    /** @param {string} id */
    (id) => read()?.(id) ?? parent?.(id),
  );
}
