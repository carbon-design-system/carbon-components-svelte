<script>
  /**
   * @template {keyof HTMLElementTagNameMap} [Tag="div"]
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * LocaleProvider sets the locale, time zone and formatting defaults for
   * every component below it, in one place. A component that formats a
   * value uses its own `locale` prop first, then the provider's, then its
   * own default. With no provider, nothing changes.
   *
   * Providers nest: an inner one overrides the fields it sets and keeps the
   * rest. Set `dir` to also set the writing direction for the subtree.
   *
   * @example
   * ```svelte
   * <LocaleProvider locale="de-CH" timeZone="Europe/Zurich" dir="auto">
   *   <NumberInput value={1234.5} />
   * </LocaleProvider>
   * ```
   */

  /**
   * Specify a BCP 47 language tag, such as `"de-CH"`. A component with no
   * `locale` prop of its own, or with it unset, formats with this one. Set
   * it on the server and the browser alike: it is never read from the
   * browser.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify the writing direction of the content. `"auto"` reads it from
   * `locale`: right to left for `"ar"` and `"he"`, left to right for the
   * rest. The content then renders in an element with that `dir` and a
   * `lang`, and components inside read the direction as they do in a
   * `LayoutDirection`. Unset, no element renders and the direction is not
   * changed. To set the direction of the whole page, write `dir` on
   * `<html>` instead, with `getLocaleDirection`.
   * @type {"ltr" | "rtl" | "auto" | undefined}
   */
  export let dir = undefined;

  /**
   * Specify an IANA time zone, such as `"Europe/Zurich"`, for components
   * that print a time. Set it on the server and the browser alike, or a
   * time prints differently in each.
   * @type {string | undefined}
   */
  export let timeZone = undefined;

  /**
   * Specify the hour cycle: `"h23"` for a 24-hour clock, `"h12"` for a
   * 12-hour clock. Written into the locale tag. It needs a `locale`.
   * @type {"h11" | "h12" | "h23" | "h24" | undefined}
   */
  export let hourCycle = undefined;

  /**
   * Specify the first day of the week, from 0 (Sunday) to 6 (Saturday).
   * The locale's own first day is used when unset.
   * @type {0 | 1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let weekStart = undefined;

  /**
   * Specify the numbering system, such as `"latn"` for Western digits in an
   * Arabic locale or `"arab"` for Arabic-Indic ones. Written into the
   * locale tag. It needs a `locale`.
   * @type {string | undefined}
   */
  export let numberingSystem = undefined;

  /**
   * Specify the calendar for dates that are printed, such as `"gregory"` or
   * `"buddhist"`. Written into the locale tag. It needs a `locale`.
   * @type {string | undefined}
   */
  export let calendar = undefined;

  /**
   * Translate the built-in strings of every component below that takes a
   * `translateWithId` prop. Receives an id; return `undefined` to keep the
   * English text. A nested provider's function runs first, then this one.
   * Uses the same context as `setTranslateContext`. A component reads the
   * function as it renders, so a language switch at runtime reaches the
   * components that render again: wrap the content in `{#key locale}` to
   * render all of it.
   * @type {((id: string) => string | undefined) | undefined}
   */
  export let translate = undefined;

  /**
   * Specify the tag name of the element `dir` renders.
   * @type {Tag}
   */
  export let tag = /** @type {Tag} */ ("div");

  /**
   * Obtain a reference to the element that `dir` renders.
   * @type {null | HTMLElementTagNameMap[Tag]}
   * @bindable readonly
   */
  export let ref = null;

  import { writable } from "svelte/store";
  import LayoutDirection from "../LayoutDirection/LayoutDirection.svelte";
  import {
    provideTranslate,
    setLocaleContext,
  } from "../utils/locale-context.js";
  import { getLocaleDirection } from "../utils/locale-direction.js";

  const settings = writable({});

  $: settings.set({
    locale,
    timeZone,
    hourCycle,
    weekStart,
    numberingSystem,
    calendar,
  });

  const context = setLocaleContext(settings);

  // A function that reads the current prop, so a new `translate` reaches a
  // component the next time it calls it.
  provideTranslate(() => translate);

  $: direction = dir === "auto" ? getLocaleDirection($context.baseLocale) : dir;
</script>

{#if direction}
  <LayoutDirection
    dir={direction}
    {tag}
    lang={locale}
    bind:ref
    {...$$restProps}
  >
    <slot />
  </LayoutDirection>
{:else}
  <slot />
{/if}
