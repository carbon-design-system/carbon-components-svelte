<script context="module">
  /**
   * Add `query` to `queries`, newest first: moves an existing match to the
   * front instead of leaving a duplicate, and drops the oldest entries
   * beyond `max`. Returns `queries` unchanged for a falsy `query`.
   * @type {(queries: ReadonlyArray<string>, query: string, options?: { max?: number }) => string[]}
   * @example
   * ```svelte
   * import { addRecentQuery } from 'carbon-components-svelte/Search/SearchRecent.svelte';
   * queries = addRecentQuery(queries, query, { max: 5 });
   * ```
   */
  export function addRecentQuery(queries, query, { max } = {}) {
    if (!query) return /** @type {string[]} */ (queries);

    const next = [query, ...queries.filter((existing) => existing !== query)];

    return max === undefined ? next : next.slice(0, Math.max(max, 0));
  }
</script>

<script>
  /**
   * @event {{ query: string }} select - Fires when a recent query is selected.
   * @event {{ query: string }} remove - Fires when a recent query's remove button is clicked. Only dispatched when `removable` is `true`.
   * @slot {{}} action - Render a header action, for example a "Clear all" control. The parent owns `queries`, so clearing is just resetting that array.
   */

  /**
   * Recent query strings, newest first. The parent owns the array.
   * @type {ReadonlyArray<string>}
   */
  export let queries = [];

  /** Specify the label text shown above the list. */
  export let labelText = "Recent searches";

  /** Set to `true` to hide the label visually. The label remains available to screen readers. */
  export let hideLabel = false;

  /** Set to `true` to render a remove button on each row. */
  export let removable = false;

  /**
   * Specify the layout of the list. `"inline"` wraps queries as compact
   * chips; `"list"` stacks them as full-width rows.
   * @type {"inline" | "list"}
   */
  export let variant = "inline";

  /**
   * Specify an icon to render before each query. Choose something distinct
   * from the paired Search input's own icon, such as a clock or history
   * icon, to signal that the row is a past search rather than a live result.
   * @type {any}
   */
  export let icon = undefined;

  import { createEventDispatcher } from "svelte";
  import Close from "../icons/Close.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const labelId = uniqueId();

  function handleSelect(query) {
    dispatch("select", { query });
  }

  function handleRemove(query) {
    dispatch("remove", { query });
  }
</script>

{#if queries.length > 0}
  <div class:bx--search-recent={true}>
    {#if labelText && hideLabel}
      <span id={labelId} class:bx--visually-hidden={true}>{labelText}</span>
    {/if}
    {#if (labelText && !hideLabel) || $$slots.action}
      <div
        class:bx--search-recent__header={true}
        class:bx--search-recent__header--action-only={hideLabel ||
          !labelText}
      >
        {#if labelText && !hideLabel}
          <span id={labelId} class:bx--search-recent__label={true}>
            {labelText}
          </span>
        {/if}
        {#if $$slots.action}
          <span class:bx--search-recent__action={true}>
            <slot name="action" />
          </span>
        {/if}
      </div>
    {/if}
    <ul
      class:bx--search-recent__list={true}
      class:bx--search-recent__list--inline={variant === "inline"}
      aria-labelledby={labelText ? labelId : undefined}
    >
      {#each queries as query, index (index)}
        <li
          class:bx--search-recent__item={true}
          class:bx--search-recent__item--inline={variant === "inline"}
        >
          <button
            type="button"
            class:bx--search-recent__item-label={true}
            class:bx--search-recent__item-label--inline={variant ===
              "inline"}
            on:click={() => handleSelect(query)}
          >
            {#if icon}
              <span class:bx--search-recent__item-icon={true}>
                <svelte:component this={icon} />
              </span>
            {/if}
            <span class:bx--search-recent__item-label-text={true}>
              {query}
            </span>
          </button>
          {#if removable}
            <button
              type="button"
              class:bx--search-recent__remove={true}
              class:bx--search-recent__remove--inline={variant === "inline"}
              aria-label="Remove {query}"
              on:click={() => handleRemove(query)}
            >
              <Close />
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}
