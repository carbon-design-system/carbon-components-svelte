<script>
  /** Specify the current page index. */
  export let page = 1;

  /** Specify the total number of items */
  export let totalItems = 0;

  /** Specify the number of items to display in a page */
  export let pageSize = 10;

  /**
   * Set to `true` when paired with a `Pagination` (or other control) whose
   * `pagesUnknown` is also `true` — switches from `itemRangeText` (which
   * needs a total) to `itemText` (which doesn't).
   */
  export let pagesUnknown = false;

  /**
   * Override the item text. Used only when `pagesUnknown` is `true`.
   * Matches `Pagination`'s own `itemText` default.
   * @type {(min: number, max: number) => string}
   */
  export let itemText = function itemText(min, max) {
    return `${min.toLocaleString()}–${max.toLocaleString()} item${max === 1 ? "" : "s"}`;
  };

  /**
   * Override the item range text.
   * If overridden, the custom function must handle `total <= 0` itself.
   * Matches `Pagination`'s own `itemRangeText` default.
   * @type {(min: number, max: number, total: number) => string}
   */
  export let itemRangeText = function itemRangeText(min, max, total) {
    if (total <= 0) return "0 items";
    return `${min.toLocaleString()}–${max.toLocaleString()} of ${total.toLocaleString()} item${max === 1 ? "" : "s"}`;
  };

  $: itemsCountText = pagesUnknown
    ? itemText(pageSize * (page - 1) + 1, page * pageSize)
    : itemRangeText(
        Math.min(pageSize * (page - 1) + 1, totalItems),
        Math.min(page * pageSize, totalItems),
        totalItems,
      );
</script>

<span
  class:bx--pagination__text={true}
  class:bx--pagination__items-count={true}
  {...$$restProps}
  aria-live="polite"
  aria-atomic="true"
  >{itemsCountText}</span
>
