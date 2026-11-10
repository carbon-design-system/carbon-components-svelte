<script>
  /**
   * @typedef {import("./format-list-parts.d.ts").TruncatedListItem} TruncatedListItem
   * @typedef {"more.zero" | "more.one" | "more.two" | "more.few" | "more.many" | "more.other" | "less"} TruncatedListTranslationId
   */

  /**
   * Join a list of names or tags into a locale-correct sentence, such as "Ada
   * Lovelace, Grace Hopper, and 3 more". The words and punctuation come from
   * `Intl.ListFormat`, so the same list reads "Ada Lovelace, Grace Hopper und
   * 3 weitere" in German and "Ada Lovelace、Grace Hopper、他3件" in Japanese.
   * The list shows `max` items, or as many as fit on one line with
   * `fit="width"`, and "3 more" reveals the rest in a toggletip, in place, or
   * in a `title`.
   * @restProps {span}
   * @slot {{ item: TruncatedListItem; label: string; index: number }} item - Render one item, such as a highlighted name or a link of your own. Defaults to the label, or a link when the item has an `href`. Also renders the items in the toggletip.
   */

  /**
   * Specify the items. A string is the label; an object adds an `href`
   * that makes the label a link.
   * @type {ReadonlyArray<TruncatedListItem>}
   */
  export let items = [];

  /**
   * Specify how many items to show before "3 more". Set to `Infinity` to
   * show every item. With `fit="width"`, this is also the most that shows,
   * and what the server renders.
   * @type {number}
   */
  export let max = 3;

  /**
   * Specify how the list decides how many items to show. `"count"` shows
   * `max`. `"width"` shows as many as fit on one line, up to `max`, and
   * follows the width of the container: it fills the line, clips a first
   * item that does not fit, and needs a width of its own in a flex row
   * (`min-inline-size: 0`).
   * @type {"count" | "width"}
   */
  export let fit = "count";

  /**
   * Specify the locale, as a BCP 47 language tag, for the conjunction, the
   * separators and the digits. It is never read from the browser, so the
   * server and the client agree. An invalid tag falls back to `"en"`.
   */
  export let locale = "en";

  /**
   * Specify how the items join, as `Intl.ListFormat`'s `type`:
   * `"conjunction"` is "A, B, and C", `"disjunction"` is "A, B, or C", and
   * `"unit"` is "A, B, C".
   * @type {"conjunction" | "disjunction" | "unit"}
   */
  export let type = "conjunction";

  /**
   * Specify how long the joining words are, as `Intl.ListFormat`'s `style`:
   * `"long"` is "A, B, and C", `"short"` is "A, B, & C" in English, and
   * `"narrow"` drops the word. Named `listStyle` so `style` stays the
   * element's own attribute.
   * @type {"long" | "short" | "narrow"}
   */
  export let listStyle = "long";

  /**
   * Specify how "3 more" reveals the rest. `"popover"` makes it a button
   * that opens a toggletip of the hidden items. `"expand"` makes it a button
   * that shows every item in place, with a button to collapse them again.
   * `"title"` shows the hidden items in the browser's tooltip; touch and
   * keyboard users cannot reach it. `"none"` only counts them. Screen
   * readers read the hidden items in every mode.
   * @type {"popover" | "expand" | "title" | "none"}
   */
  export let overflow = "popover";

  /**
   * Set to `true` to show every item in place.
   * Only applies when `overflow` is `"expand"`.
   * @bindable writable
   */
  export let expanded = false;

  /**
   * Set to `true` to open the toggletip.
   * Only applies when `overflow` is `"popover"`.
   * @bindable writable
   */
  export let open = false;

  /**
   * Override the default translation ids. "3 more" is `"more.other"`, a
   * template with `{count}` for the number in the locale's digits.
   * Languages with other plural forms add `"more.one"`, `"more.few"` and so
   * on; an id left out, or `undefined`, falls back to `"more.other"`.
   * @type {(id: TruncatedListTranslationId) => string | undefined}
   */
  export let translateWithId = function translateWithId(id) {
    return DEFAULT_TRANSLATIONS[id];
  };

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  /** Set an id for the top-level element. */
  export let id = uniqueId();

  import { onMount, tick } from "svelte";
  import Link from "../Link/Link.svelte";
  import Toggletip from "../Toggletip/Toggletip.svelte";
  import {
    getNumberFormatter,
    getPluralRules,
  } from "../utils/intl-formatter-cache.js";
  import { localeDirection } from "../utils/locale-direction.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { fitCount } from "./fit-count.js";
  import {
    formatListParts,
    itemLabel,
    listPartsText,
  } from "./format-list-parts.js";

  /** @type {Record<TruncatedListTranslationId, string | undefined>} */
  const DEFAULT_TRANSLATIONS = {
    "more.zero": undefined,
    "more.one": undefined,
    "more.two": undefined,
    "more.few": undefined,
    "more.many": undefined,
    "more.other": "{count} more",
    less: "Show less",
  };

  /**
   * A tag `Intl` accepts, else `"en"`.
   * @param {string} tag
   */
  function validLocale(tag) {
    try {
      return Intl.getCanonicalLocales(tag)[0] ?? "en";
    } catch {
      return "en";
    }
  }

  /** @type {null | HTMLSpanElement} */
  let measurer = null;
  /** @type {null | HTMLButtonElement} */
  let moreButton = null;
  /** @type {null | HTMLButtonElement} */
  let lessButton = null;
  let mounted = false;

  // The count that fits the line. `null` until measured: the server and the
  // first client render show `max`, so they agree.
  /** @type {null | number} */
  let fitted = null;
  // The first item alone is wider than the line, so the line shows an
  // ellipsis: the full sentence goes in a `title`.
  let clipped = false;

  $: tag = validLocale(locale);
  $: cap = Number.isFinite(max) && max >= 0 ? Math.floor(max) : Infinity;
  $: isExpanded = overflow === "expand" && expanded;
  $: byWidth = fit === "width" && !isExpanded;
  $: shown = isExpanded
    ? Infinity
    : byWidth && fitted !== null
      ? Math.min(cap, fitted)
      : cap;

  /**
   * The text of the "more" element, from the translation for the count's
   * plural category.
   * @param {(id: TruncatedListTranslationId) => string | undefined} translate
   * @returns {(count: number, resolved: string) => string}
   */
  function createFormatMore(translate) {
    return (count, resolved) => {
      const category = getPluralRules(resolved).select(count);
      const template =
        translate?.(
          /** @type {TruncatedListTranslationId} */ (`more.${category}`),
        ) ??
        translate?.("more.other") ??
        DEFAULT_TRANSLATIONS["more.other"] ??
        "";
      return template.replace(
        "{count}",
        getNumberFormatter(resolved).format(count),
      );
    };
  }

  $: formatMore = createFormatMore(translateWithId);
  $: parts = formatListParts(items, {
    max: shown,
    locale: tag,
    type,
    style: listStyle,
    formatMore,
  });
  $: hiddenItems = items.slice(Math.min(items.length, shown));
  $: hiddenText =
    hiddenItems.length > 0
      ? listPartsText(
          formatListParts(hiddenItems, {
            locale: tag,
            type,
            style: listStyle,
          }),
        )
      : "";
  $: fullText =
    byWidth && clipped
      ? listPartsText(
          formatListParts(items, { locale: tag, type, style: listStyle }),
        )
      : "";
  $: dir = localeDirection(tag);
  // A label needs a role to name: a bare `span` takes none.
  $: named = !!($$restProps["aria-label"] || $$restProps["aria-labelledby"]);
  $: rootClass = [
    "bx--truncated-list",
    byWidth && "bx--truncated-list--fit",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");

  // The toggletip builds its list the first time it opens, then keeps it.
  let openedOnce = false;
  $: if (open) openedOnce = true;

  // Fits in an offscreen copy of the line, so reading a width does not wait
  // on the visible one: write the sentence for a count, read its width,
  // for each probe. The measurer is `contain: layout`, so a probe lays out
  // one line, and the visible list is left alone. `null` when there is
  // nothing to measure, such as a list in a `display: none` box.
  /**
   * @param {null | HTMLElement} root
   * @param {null | HTMLElement} measure
   * @param {ReadonlyArray<TruncatedListItem>} list
   * @param {string} resolved
   * @param {"conjunction" | "disjunction" | "unit"} joinType
   * @param {"long" | "short" | "narrow"} joinStyle
   * @param {number} limit
   * @param {(count: number, locale: string) => string} more
   * @returns {null | { count: number; clipped: boolean }}
   */
  function measureFit(
    root,
    measure,
    list,
    resolved,
    joinType,
    joinStyle,
    limit,
    more,
  ) {
    if (!root || !measure) return null;
    const available = root.getBoundingClientRect().width;
    if (!(available > 0)) return null;
    /** @param {number} candidate */
    const widthOf = (candidate) => {
      measure.textContent = listPartsText(
        formatListParts(list, {
          max: candidate,
          locale: resolved,
          type: joinType,
          style: joinStyle,
          formatMore: more,
        }),
      );
      return measure.getBoundingClientRect().width;
    };
    const count = fitCount(
      Math.min(limit, list.length),
      (candidate) => widthOf(candidate) <= available,
    );
    // The first item is kept whether it fits or not, so only a list of one
    // count can be cut short; `fitCount` never measured that one.
    const clipped = count <= 1 && widthOf(count) > available;
    measure.textContent = "";
    return { count, clipped };
  }

  // Counts what resizes the line without a prop change: the container, or
  // a font that loads late.
  let resizes = 0;

  // Refit when anything the text depends on changes. Each is an argument,
  // so the statement reruns for it and runs before `shown` is read.
  $: measured =
    mounted && byWidth
      ? (void resizes,
        measureFit(ref, measurer, items, tag, type, listStyle, cap, formatMore))
      : null;
  $: if (measured !== null) {
    fitted = measured.count;
    clipped = measured.clipped;
  }

  function refit() {
    resizes += 1;
  }

  onMount(() => {
    mounted = true;
    const stop = ref ? observeResize(ref, refit) : () => {};
    // Late fonts change the text's width, not the container's.
    const { fonts } = document;
    fonts?.addEventListener?.("loadingdone", refit);
    return () => {
      stop();
      fonts?.removeEventListener?.("loadingdone", refit);
    };
  });

  // The button that took focus is gone once the list changes, so hand focus
  // to the one that replaces it.
  async function expand() {
    expanded = true;
    await tick();
    lessButton?.focus();
  }

  async function collapse() {
    expanded = false;
    await tick();
    moreButton?.focus();
  }

  // A scrolling list needs a tab stop, or a keyboard cannot reach what is
  // below the fold.
  /** @param {HTMLElement} node */
  function focusableWhenScrolling(node) {
    if (node.scrollHeight > node.clientHeight) node.tabIndex = 0;
  }
</script>

<span
  bind:this={ref}
  {id}
  {dir}
  role={named ? "group" : undefined}
  title={fullText || undefined}
  {...$$restProps}
  class={rootClass}
>
  {#each parts as part, partIndex (partIndex)}
    {#if part.type === "literal"}
      {part.value}
    {:else if part.type === "item"}
      <bdi>
        <slot
          name="item"
          item={part.item}
          label={itemLabel(part.item)}
          index={part.index}
        >
          {#if typeof part.item !== "string" && part.item.href}
            <Link href={part.item.href} inline>{part.value}</Link>
          {:else}
            {part.value}
          {/if}
        </slot>
      </bdi>
    {:else if overflow === "popover"}
      <Toggletip
        bind:open
        iconDescription=""
        align="start"
        portalTooltip={byWidth ? true : undefined}
        popoverClass="bx--truncated-list__popover"
      >
        <svelte:fragment slot="icon"><bdi>{part.value}</bdi></svelte:fragment>
        {#if openedOnce}
          <ul class:bx--truncated-list__list={true} use:focusableWhenScrolling>
            {#each hiddenItems as item, position (position)}
              <li>
                <bdi>
                  <slot
                    name="item"
                    {item}
                    label={itemLabel(item)}
                    index={shown + position}
                  >
                    {#if typeof item !== "string" && item.href}
                      <Link href={item.href} inline>{itemLabel(item)}</Link>
                    {:else}
                      {itemLabel(item)}
                    {/if}
                  </slot>
                </bdi>
              </li>
            {/each}
          </ul>
        {/if}
      </Toggletip>
    {:else if overflow === "expand"}
      <button
        bind:this={moreButton}
        type="button"
        class:bx--truncated-list__button={true}
        aria-expanded="false"
        on:click={expand}><bdi>{part.value}</bdi></button
      >
    {:else}
      <span
        class:bx--truncated-list__more={true}
        title={overflow === "title" ? hiddenText : undefined}
        ><bdi>{part.value}</bdi></span
      >
    {/if}
  {/each}
  {#if isExpanded}
    {" "}
    <button
      bind:this={lessButton}
      type="button"
      class:bx--truncated-list__button={true}
      aria-expanded="true"
      on:click={collapse}
      >{translateWithId?.("less") ?? DEFAULT_TRANSLATIONS.less}</button
    >
  {/if}
  {#if hiddenItems.length > 0}
    <span class:bx--visually-hidden={true}>{hiddenText}</span>
  {/if}
  {#if fit === "width"}
    <span
      bind:this={measurer}
      class:bx--truncated-list__measure={true}
      aria-hidden="true"
    ></span>
  {/if}
</span>
